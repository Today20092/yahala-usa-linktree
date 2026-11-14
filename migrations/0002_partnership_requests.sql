-- Contact form submissions, kept alongside the email so a lost email never loses a request.
-- Archived rows are deleted 12 months after archived_at by the daily scheduled job.
CREATE TABLE IF NOT EXISTS partnership_requests (
  id TEXT PRIMARY KEY,
  interest TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  business TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'replied', 'archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  archived_at TEXT
);
CREATE INDEX IF NOT EXISTS partnership_requests_status ON partnership_requests(status, created_at);
