-- Migration 02: Add user kind (agent/human) and whitepaper leads tables. Run after 01_initial.sql.
-- Safe for existing DBs: uses ADD COLUMN IF NOT EXISTS and CREATE TABLE IF NOT EXISTS.

-- User kind: agent vs human (for login UI and future "human allows agent" flow)
ALTER TABLE users ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'human';
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_kind_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_kind_check CHECK (kind IN ('agent', 'human'));
  END IF;
END $$;

-- Whitepaper leads: waitlist (developer access queue) and subscribe (update emails)
CREATE TABLE IF NOT EXISTS waitlist (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS subscribe (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at);
CREATE INDEX IF NOT EXISTS idx_subscribe_created_at ON subscribe(created_at);
