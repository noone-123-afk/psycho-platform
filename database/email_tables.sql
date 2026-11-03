-- Store delivery metadata only; email content and attachments are not retained.
-- Define and enforce an appropriate retention period before production use.
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed')),
    error_code VARCHAR(100),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE email_logs
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE email_logs
    ALTER COLUMN subject TYPE VARCHAR(500);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    welcome_email BOOLEAN NOT NULL DEFAULT TRUE,
    book_ready_email BOOLEAN NOT NULL DEFAULT TRUE,
    follow_up_emails BOOLEAN NOT NULL DEFAULT TRUE,
    marketing_emails BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at
    ON email_logs(sent_at);

CREATE INDEX IF NOT EXISTS idx_email_logs_status
    ON email_logs(status);

CREATE INDEX IF NOT EXISTS idx_email_logs_user
    ON email_logs(user_id);
