-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('reporter', 'staff', 'developer')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Bug reports table
CREATE TABLE IF NOT EXISTS bug_reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  steps_to_reproduce TEXT,
  severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'investigating', 'squashed', 'denied')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Review actions table (staff decisions on bug reports)
CREATE TABLE IF NOT EXISTS review_actions (
  id TEXT PRIMARY KEY,
  bug_report_id TEXT NOT NULL REFERENCES bug_reports(id),
  staff_id TEXT NOT NULL REFERENCES users(id),
  decision TEXT NOT NULL CHECK(decision IN ('approved', 'denied')),
  denial_reason TEXT CHECK(denial_reason IN ('not_enough_info', 'already_investigating')),
  actioned_at TEXT DEFAULT (datetime('now'))
);

-- Developer notes table
CREATE TABLE IF NOT EXISTS dev_notes (
  id TEXT PRIMARY KEY,
  bug_report_id TEXT NOT NULL REFERENCES bug_reports(id),
  author_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
