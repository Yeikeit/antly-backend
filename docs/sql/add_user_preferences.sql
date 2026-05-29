-- =========================================================
-- Migration: Add user_preferences table
-- Adds budget automation setting per user (default = true)
-- =========================================================

CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    budget_automation BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_preferences_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT uq_user_preferences_user
        UNIQUE (user_id)
);

CREATE INDEX idx_user_preferences_user_id
    ON user_preferences(user_id);

-- Seed preferences for existing users (automation enabled by default)
INSERT INTO user_preferences (user_id, budget_automation)
SELECT id, TRUE
FROM users
ON CONFLICT (user_id) DO NOTHING;
