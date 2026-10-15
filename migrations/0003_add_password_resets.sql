-- Password reset tokens for transactional auth
CREATE TABLE IF NOT EXISTS password_resets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
