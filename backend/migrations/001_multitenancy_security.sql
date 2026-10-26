
-- ComplyTrack migration 001
-- Adds organizations, memberships, authentication, compliance rules,
-- document lifecycle tracking, alerts, settings, and audit protections.
--
-- IMPORTANT:
-- 1. Test against a restored Neon test branch first.
-- 2. This file is executed inside a transaction by migrate.js.
-- 3. Do not add BEGIN or COMMIT here.
-- 4. This migration is intended for the original base schema.
--    Do not run it against a database where it was partially applied.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- 1. ORGANIZATIONS AND USER AUTHENTICATION FIELDS
-- =========================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(180) NOT NULL,
    registration_no VARCHAR(80),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(40),
    timezone VARCHAR(80) NOT NULL DEFAULT 'Africa/Johannesburg',
    date_format VARCHAR(20) NOT NULL DEFAULT 'DD/MM/YYYY',
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'archived', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS mfa_secret_encrypted TEXT,
    ADD COLUMN IF NOT EXISTS mfa_pending_secret_encrypted TEXT,
    ADD COLUMN IF NOT EXISTS recovery_codes_hashes TEXT[]
        NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Create a legacy organization only if one does not already exist.
INSERT INTO organizations (name, contact_email)
SELECT
    'ComplyTrack Legacy Organisation',
    (SELECT email FROM users ORDER BY created_at, id LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM organizations);

CREATE TABLE IF NOT EXISTS organization_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(40) NOT NULL
        CHECK (role IN (
            'Administrator',
            'Compliance Officer',
            'Read-only Auditor'
        )),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'deactivated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, user_id)
);

-- =========================================================
-- 2. TENANT OWNERSHIP FOR EXISTING BUSINESS RECORDS
-- =========================================================

ALTER TABLE contractors
    ADD COLUMN IF NOT EXISTS organization_id UUID
        REFERENCES organizations(id);

UPDATE contractors
SET organization_id = (
    SELECT id FROM organizations ORDER BY created_at, id LIMIT 1
)
WHERE organization_id IS NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM contractors WHERE organization_id IS NULL
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: contractors could not be assigned to an organization.';
    END IF;
END $$;

ALTER TABLE contractors
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE contractors
    DROP CONSTRAINT IF EXISTS contractors_registration_no_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_contractors_org_registration
    ON contractors (organization_id, registration_no);

CREATE INDEX IF NOT EXISTS idx_contractors_org
    ON contractors (organization_id);

-- Existing free-form user roles are mapped to the supported role set.
INSERT INTO organization_memberships (
    organization_id,
    user_id,
    role
)
SELECT
    o.id,
    u.id,
    CASE
        WHEN LOWER(COALESCE(u.role, '')) IN ('administrator', 'admin')
            THEN 'Administrator'
        WHEN LOWER(COALESCE(u.role, '')) IN (
            'read-only auditor', 'auditor', 'reviewer'
        )
            THEN 'Read-only Auditor'
        ELSE 'Compliance Officer'
    END
FROM users u
CROSS JOIN (
    SELECT id
    FROM organizations
    ORDER BY created_at, id
    LIMIT 1
) o
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- =========================================================
-- 3. SESSIONS, AUTH TOKENS, AND INVITATIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    token_hash TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT
);

-- Preserve existing session records, assigning an organization only
-- where the user has exactly one membership.
UPDATE auth_sessions s
SET organization_id = m.organization_id
FROM organization_memberships m
WHERE m.user_id = s.user_id
  AND s.organization_id IS NULL
  AND (
      SELECT COUNT(*)
      FROM organization_memberships m2
      WHERE m2.user_id = s.user_id
  ) = 1;

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_active
    ON auth_sessions (user_id, organization_id, expires_at)
    WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS auth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    purpose VARCHAR(30) NOT NULL
        CHECK (purpose IN (
            'verify_email', 'reset_password', 'mfa_recovery'
        )),
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_purpose
    ON auth_tokens (user_id, purpose, expires_at);

CREATE TABLE IF NOT EXISTS organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    email VARCHAR(255) NOT NULL,
    role VARCHAR(40) NOT NULL
        CHECK (role IN ('Compliance Officer', 'Read-only Auditor')),
    token_hash TEXT NOT NULL UNIQUE,
    invited_by UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES users(id),
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_invites_email
    ON organization_invitations (LOWER(email), expires_at)
    WHERE accepted_at IS NULL AND revoked_at IS NULL;

-- =========================================================
-- 4. ORGANIZATION-SPECIFIC COMPLIANCE RULES
-- =========================================================

CREATE TABLE IF NOT EXISTS compliance_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    document_type_id BIGINT NOT NULL REFERENCES document_types(id),
    category VARCHAR(100) NOT NULL DEFAULT 'Other',
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    required_for_site_work BOOLEAN NOT NULL DEFAULT FALSE,
    expiry_tracked BOOLEAN NOT NULL DEFAULT TRUE,
    reminder_days INTEGER NOT NULL DEFAULT 30
        CHECK (reminder_days BETWEEN 0 AND 365),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, document_type_id)
);

CREATE INDEX IF NOT EXISTS idx_compliance_rules_org_active
    ON compliance_rules (organization_id, is_active);

-- Seed rules for the legacy organization only.
-- Existing document types retain their site-work requirements.
-- Rules are seeded as optional by default so the migration does not
-- unexpectedly declare every document mandatory.
INSERT INTO compliance_rules (
    organization_id,
    document_type_id,
    category,
    is_required,
    required_for_site_work,
    expiry_tracked,
    reminder_days
)
SELECT
    o.id,
    dt.id,
    CASE
        WHEN dt.name ILIKE '%tax%' THEN 'Tax'
        WHEN dt.name ILIKE '%COIDA%' OR dt.name ILIKE '%OHS%'
            THEN 'Health & Safety'
        WHEN dt.name ILIKE '%B-BBEE%' THEN 'Business Compliance'
        WHEN dt.name ILIKE '%insurance%' THEN 'Insurance'
        ELSE 'Other'
    END,
    FALSE,
    dt.required_for_site_work,
    dt.name NOT ILIKE '%OHS%',
    CASE WHEN dt.name ILIKE '%OHS%' THEN 0 ELSE 30 END
FROM organizations o
CROSS JOIN document_types dt
ON CONFLICT (organization_id, document_type_id) DO NOTHING;

-- =========================================================
-- 5. DOCUMENT VERSIONING AND SCAN METADATA
-- =========================================================

ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS organization_id UUID
        REFERENCES organizations(id),
    ADD COLUMN IF NOT EXISTS version_number INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS scan_status VARCHAR(20)
        NOT NULL DEFAULT 'unavailable',
    ADD COLUMN IF NOT EXISTS scanned_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
    ADD COLUMN IF NOT EXISTS checksum_sha256 CHAR(64),
    ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW();

-- Backfill document ownership from its contractor.
UPDATE documents d
SET organization_id = c.organization_id
FROM contractors c
WHERE c.id = d.contractor_id
  AND d.organization_id IS NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM documents WHERE organization_id IS NULL
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: documents could not be assigned to an organization.';
    END IF;
END $$;

ALTER TABLE documents
    ALTER COLUMN organization_id SET NOT NULL;

-- Legacy files must not be treated as clean merely because they predate
-- the scanner integration.
UPDATE documents
SET scan_status = 'unavailable',
    scanned_at = NULL;

ALTER TABLE documents
    DROP CONSTRAINT IF EXISTS documents_version_number_positive;

ALTER TABLE documents
    ADD CONSTRAINT documents_version_number_positive
    CHECK (version_number > 0);

ALTER TABLE documents
    DROP CONSTRAINT IF EXISTS documents_scan_status_valid;

ALTER TABLE documents
    ADD CONSTRAINT documents_scan_status_valid
    CHECK (scan_status IN (
        'pending', 'clean', 'infected', 'failed', 'unavailable'
    ));

ALTER TABLE documents
    DROP CONSTRAINT IF EXISTS documents_file_size_nonnegative;

ALTER TABLE documents
    ADD CONSTRAINT documents_file_size_nonnegative
    CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0);

CREATE INDEX IF NOT EXISTS idx_documents_org_contractor
    ON documents (organization_id, contractor_id);

-- Number historical versions in creation order. For each contractor and
-- document type, the newest record becomes the current record.
WITH ranked AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY contractor_id, document_type_id
            ORDER BY created_at ASC, id ASC
        ) AS version_no,
        ROW_NUMBER() OVER (
            PARTITION BY contractor_id, document_type_id
            ORDER BY created_at DESC, id DESC
        ) AS latest_rank
    FROM documents
)
UPDATE documents d
SET version_number = ranked.version_no,
    is_current = (ranked.latest_rank = 1)
FROM ranked
WHERE ranked.id = d.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_current_type
    ON documents (contractor_id, document_type_id)
    WHERE is_current = TRUE;

-- =========================================================
-- 6. REMINDERS AND DOCUMENT SCAN HISTORY
-- =========================================================

ALTER TABLE reminders
    ADD COLUMN IF NOT EXISTS organization_id UUID
        REFERENCES organizations(id);

UPDATE reminders r
SET organization_id = c.organization_id
FROM contractors c
WHERE c.id = r.contractor_id
  AND r.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_reminders_org_status
    ON reminders (organization_id, status, scheduled_for);

CREATE TABLE IF NOT EXISTS document_scan_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    scanner VARCHAR(100) NOT NULL,
    result VARCHAR(20) NOT NULL
        CHECK (result IN ('clean', 'infected', 'failed', 'unavailable')),
    detail_code VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_scan_events_document
    ON document_scan_events (document_id, created_at DESC);

-- =========================================================
-- 7. COMPLIANCE ALERTS AND PER-USER ALERT STATE
-- =========================================================

CREATE TABLE IF NOT EXISTS compliance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    issue_signature TEXT NOT NULL,
    contractor_id BIGINT NOT NULL REFERENCES contractors(id),
    rule_id UUID NOT NULL REFERENCES compliance_rules(id),
    status VARCHAR(30) NOT NULL
        CHECK (status IN ('Missing', 'Expired', 'Expiring soon')),
    expiry_date DATE,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_compliance_alerts_active_signature
    ON compliance_alerts (organization_id, issue_signature)
    WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_compliance_alerts_active_org
    ON compliance_alerts (organization_id, opened_at DESC)
    WHERE resolved_at IS NULL;

CREATE TABLE IF NOT EXISTS user_alert_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_key TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, user_id, alert_key)
);

-- =========================================================
-- 8. AUDIT LOG TENANCY AND APPEND-ONLY PROTECTION
-- =========================================================

ALTER TABLE audit_logs
    ADD COLUMN IF NOT EXISTS organization_id UUID
        REFERENCES organizations(id),
    ADD COLUMN IF NOT EXISTS ip_address INET,
    ADD COLUMN IF NOT EXISTS user_agent TEXT;

UPDATE audit_logs
SET organization_id = (
    SELECT id FROM organizations ORDER BY created_at, id LIMIT 1
)
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created
    ON audit_logs (organization_id, created_at DESC);

CREATE OR REPLACE FUNCTION complytrack_prevent_audit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION
        'Audit history is append-only; create a correction event instead.';
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_logs_append_only ON audit_logs;

CREATE TRIGGER trg_audit_logs_append_only
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION complytrack_prevent_audit_mutation();

-- =========================================================
-- 9. ORGANIZATION SETTINGS
-- =========================================================

CREATE TABLE IF NOT EXISTS organization_settings (
    organization_id UUID PRIMARY KEY REFERENCES organizations(id),
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO organization_settings (organization_id)
SELECT id FROM organizations
ON CONFLICT (organization_id) DO NOTHING;
