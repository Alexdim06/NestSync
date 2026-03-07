const { pool, query } = require('../db');

async function run() {
  try {
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100)');
    console.log('Migration done: username column added if missing.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
