const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../auth/authMiddleware');
const requirePermission = require('../auth/permissionMiddleware');
const bcrypt = require('bcryptjs');

// 🔐 ALL admin routes require admin permission
router.use(auth, requirePermission('admin:access'));

// GET all users
router.get('/users', async (req, res) => {
  const result = await pool.query('SELECT id, username FROM users');
  res.json(result.rows);
});

// CREATE user
router.post('/users', async (req, res) => {
  const { username, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
    [username, hash]
  );

  res.json(result.rows[0]);
});

// DELETE user
router.delete('/users/:id', async (req, res) => {
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// GET permissions
router.get('/permissions/:userId', async (req, res) => {
  const result = await pool.query(
    'SELECT permission FROM permissions WHERE user_id = $1',
    [req.params.userId]
  );
  res.json(result.rows);
});

// ADD permission
router.post('/permissions', async (req, res) => {
  const { userId, permission } = req.body;

  await pool.query(
    'INSERT INTO permissions (user_id, permission) VALUES ($1, $2)',
    [userId, permission]
  );

  res.json({ success: true });
});

// REMOVE permission
router.delete('/permissions', async (req, res) => {
  const { userId, permission } = req.body;

  await pool.query(
    'DELETE FROM permissions WHERE user_id = $1 AND permission = $2',
    [userId, permission]
  );

  res.json({ success: true });
});

module.exports = router;