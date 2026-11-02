CREATE TABLE IF NOT EXISTS mfa_login_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mfa_login_challenges_user
    ON mfa_login_challenges (user_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_mfa_login_challenges_expiry
    ON mfa_login_challenges (expires_at);
