-- Minimal delivery metadata only; do not store email body or attachments here.
-- Define and enforce an appropriate retention period before production use.
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed')),
    error_code VARCHAR(100),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at
    ON email_logs(sent_at);

CREATE INDEX IF NOT EXISTS idx_email_logs_status
    ON email_logs(status);
