CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  role VARCHAR(40) NOT NULL DEFAULT 'Compliance Officer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contractors (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  registration_no VARCHAR(80) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  contact_name VARCHAR(120) NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(40),
  works_on_site BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(30) NOT NULL DEFAULT 'Missing',
  next_expiry DATE,
  contract_start DATE,
  contract_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_types (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(150) UNIQUE NOT NULL,
  description TEXT,
  required_for_site_work BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id BIGINT NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  document_type_id BIGINT NOT NULL REFERENCES document_types(id),
  reference_no VARCHAR(120),
  issue_date DATE,
  expiry_date DATE,
  file_name VARCHAR(255),
  storage_key TEXT,
  notes TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id BIGINT NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  reminder_days INTEGER NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status VARCHAR(30) NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contractors_status ON contractors(status);
CREATE INDEX IF NOT EXISTS idx_contractors_category ON contractors(category);
CREATE INDEX IF NOT EXISTS idx_documents_contractor ON documents(contractor_id);
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

INSERT INTO document_types (name, description, required_for_site_work)
VALUES
  ('Tax Compliance Status PIN', 'Tax compliance verification record.', FALSE),
  ('COIDA Letter of Good Standing', 'Compensation Fund good standing evidence.', TRUE),
  ('B-BBEE certificate / affidavit', 'B-BBEE status evidence.', FALSE),
  ('Public liability insurance', 'Current public liability insurance evidence.', TRUE),
  ('OHS Act s37(2) agreement', 'Agreement used where applicable for site work.', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Demo seed records can be added after the team agrees on the final assignment data model.
