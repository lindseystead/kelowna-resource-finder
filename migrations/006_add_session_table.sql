-- Session table for express-session with connect-pg-simple
-- Run this migration: psql $DATABASE_URL -f migrations/006_add_session_table.sql
-- This must be run BEFORE deploying to production

-- Session table for PostgreSQL session store
-- Matches connect-pg-simple's expected schema
CREATE TABLE IF NOT EXISTS user_sessions (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

-- Index for efficient session expiration cleanup
CREATE INDEX IF NOT EXISTS idx_user_sessions_expire ON user_sessions(expire);

-- Optional: Add comment for documentation
COMMENT ON TABLE user_sessions IS 'Express session store for user authentication and CSRF tokens';

