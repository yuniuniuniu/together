-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  nickname TEXT NOT NULL,
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0
);

-- Verification codes (email verification)
CREATE TABLE IF NOT EXISTS verification_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  used INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0
);

-- Sessions (JWT tracking)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  is_deleted INTEGER DEFAULT 0
);

-- Spaces (couple's shared space)
CREATE TABLE IF NOT EXISTS spaces (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  anniversary_date DATE NOT NULL,
  invite_code TEXT UNIQUE,
  is_deleted INTEGER DEFAULT 0
);

-- Space members (junction table)
CREATE TABLE IF NOT EXISTS space_members (
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0,
  PRIMARY KEY (space_id, user_id)
);

-- Memories
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mood TEXT,
  photos TEXT,
  location TEXT,
  voice_note TEXT,
  stickers TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL REFERENCES users(id),
  word_count INTEGER,
  is_deleted INTEGER DEFAULT 0
);

-- Milestones
CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  icon TEXT,
  photos TEXT,
  location TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL REFERENCES users(id),
  is_deleted INTEGER DEFAULT 0
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read INTEGER DEFAULT 0,
  action_url TEXT,
  is_deleted INTEGER DEFAULT 0
);

-- Reactions (likes on memories)
CREATE TABLE IF NOT EXISTS reactions (
  id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL DEFAULT 'love',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0,
  UNIQUE(memory_id, user_id)
);

-- Unbind requests (cooling-off period)
CREATE TABLE IF NOT EXISTS unbind_requests (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL REFERENCES users(id),
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'cancelled', 'completed')),
  is_deleted INTEGER DEFAULT 0
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_memories_space_id ON memories(space_id);
CREATE INDEX IF NOT EXISTS idx_milestones_space_id ON milestones(space_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_space_members_user_id ON space_members(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_reactions_memory_id ON reactions(memory_id);
CREATE INDEX IF NOT EXISTS idx_unbind_requests_space_id ON unbind_requests(space_id);
