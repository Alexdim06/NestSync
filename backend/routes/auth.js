const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const config = require('../config');
const { query } = require('../db');
const upload = require('../multer');
const { auth } = require('../middleware/auth');

const router = express.Router();

function sanitizeUser(row) {
  return {
    id: row.id,
    email: row.email,
    username: row.username || null,
    profilePhotoUrl: row.profile_photo_path ? `/uploads/${row.profile_photo_path}` : null,
    initialCardAmount: Number(row.initial_card_amount),
    createdAt: row.created_at,
  };
}

// POST /api/auth/register
router.post('/register', upload.single('profilePhoto'), async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const username = (req.body.username || '').trim() || null;
    const password = req.body.password;
    const initialCardAmount = parseFloat(req.body.initialCardAmount) || 0;
    const profilePhotoPath = req.file ? path.basename(req.file.path) : null;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (email, username, password_hash, profile_photo_path, initial_card_amount)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, username, profile_photo_path, initial_card_amount, created_at`,
      [email, username, passwordHash, profilePhotoPath, initialCardAmount]
    );
    const user = sanitizeUser(result.rows[0]);
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
    res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await query(
      `SELECT id, email, username, password_hash, profile_photo_path, initial_card_amount, created_at
       FROM users WHERE email = $1`,
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const row = result.rows[0];
    const match = await bcrypt.compare(password, row.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = sanitizeUser(row);
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
    res.json({ user, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me (requires token)
router.get('/me', auth, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, username, profile_photo_path, initial_card_amount, created_at
       FROM users WHERE id = $1`,
      [req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(sanitizeUser(result.rows[0]));
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Failed to load user' });
  }
});

module.exports = router;
