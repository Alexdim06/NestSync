-- Run once if users table already exists without username: node -e "require('./db').query(require('fs').readFileSync('./scripts/add-username.sql','utf8')).then(()=>process.exit(0))"
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100);
