-- Minimal audit metadata for automated language signals.
-- Do not store submitted narrative text, matched phrases, or a clinical risk score.
-- Access controls and a retention/deletion policy must be configured before production use.
CREATE TABLE IF NOT EXISTS crisis_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    detector_version VARCHAR(30) NOT NULL,
    signal_categories TEXT[] NOT NULL DEFAULT '{}',
    analyzed_field VARCHAR(50),
    action_taken VARCHAR(50) NOT NULL,
    support_directory_shown BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_crisis_incidents_user
    ON crisis_incidents(user_id);

CREATE INDEX IF NOT EXISTS idx_crisis_incidents_session
    ON crisis_incidents(session_id);

CREATE INDEX IF NOT EXISTS idx_crisis_incidents_detected_at
    ON crisis_incidents(detected_at);
