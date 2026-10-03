-- Users and target preferences
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    target_score INTEGER DEFAULT 65,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Scored mock and drill attempts
CREATE TABLE IF NOT EXISTS attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mock_id TEXT NOT NULL,
    mock_title TEXT NOT NULL,
    mode TEXT NOT NULL,
    started_at TEXT NOT NULL,
    finished_at TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    overall_score REAL NOT NULL,
    overall_score_60 REAL NOT NULL,
    cefr TEXT NOT NULL,
    earned_points REAL NOT NULL,
    available_points REAL NOT NULL,
    skill_scores TEXT NOT NULL,
    breakdown TEXT NOT NULL,
    responses TEXT,
    synced_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_attempts_user_date ON attempts(user_id, finished_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_user_score ON attempts(user_id, overall_score);
