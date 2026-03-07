-- NestSync users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100),
  password_hash VARCHAR(255) NOT NULL,
  profile_photo_path VARCHAR(500),
  initial_card_amount DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for login by email
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
