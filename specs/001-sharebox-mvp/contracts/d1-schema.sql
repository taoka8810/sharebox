-- D1 initial schema for sharebox MVP
-- Generated as a contract artifact for /speckit.plan Phase 1.
-- The actual migration files will be produced by `drizzle-kit generate`
-- and committed under src/lib/server/db/migrations/.
-- This file documents the *target shape* the implementation must reach.

CREATE TABLE user (
  id            TEXT    PRIMARY KEY,
  google_sub    TEXT    NOT NULL UNIQUE,
  email         TEXT    NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

CREATE TABLE session (
  id          TEXT    PRIMARY KEY,
  user_id     TEXT    NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  expires_at  INTEGER NOT NULL
);
CREATE INDEX session_user_id_idx ON session(user_id);

CREATE TABLE share_entry (
  id          TEXT    PRIMARY KEY,
  user_id     TEXT    NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  kind        TEXT    NOT NULL CHECK (kind IN ('text','file','url')),
  created_at  INTEGER NOT NULL
);
CREATE INDEX share_entry_user_created_idx
  ON share_entry(user_id, created_at DESC);
CREATE INDEX share_entry_user_kind_created_idx
  ON share_entry(user_id, kind, created_at DESC);

CREATE TABLE text_post (
  entry_id     TEXT    PRIMARY KEY REFERENCES share_entry(id) ON DELETE CASCADE,
  body         TEXT    NOT NULL,
  byte_length  INTEGER NOT NULL
);

CREATE TABLE file_post (
  entry_id       TEXT    PRIMARY KEY REFERENCES share_entry(id) ON DELETE CASCADE,
  r2_key         TEXT    NOT NULL UNIQUE,
  original_name  TEXT    NOT NULL,
  mime_type      TEXT    NOT NULL,
  byte_size      INTEGER NOT NULL,
  category       TEXT    NOT NULL CHECK (category IN ('image','video','other'))
);

CREATE TABLE url_post (
  entry_id         TEXT    PRIMARY KEY REFERENCES share_entry(id) ON DELETE CASCADE,
  url              TEXT    NOT NULL,
  domain           TEXT    NOT NULL,
  ogp_status       TEXT    NOT NULL CHECK (ogp_status IN ('pending','success','failed')),
  ogp_title        TEXT,
  ogp_description  TEXT,
  ogp_image_url    TEXT,
  ogp_site_name    TEXT,
  ogp_fetched_at   INTEGER
);

CREATE TABLE login_audit (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  attempted_at  INTEGER NOT NULL,
  email         TEXT,
  result        TEXT    NOT NULL CHECK (result IN (
                  'success',
                  'denied_whitelist',
                  'denied_oauth_failed',
                  'denied_invalid_state'
                )),
  client_ip     TEXT,
  user_agent    TEXT
);
