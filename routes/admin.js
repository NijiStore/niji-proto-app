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
  const result = await pool.query(`
    SELECT u.id, u.username, u.role_id, r.name AS role
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
  `);
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

router.patch('/users/:id/password', auth, requirePermission('admin:access'), async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash(password, 10);

  await pool.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2',
    [hash, req.params.id]
  );

  res.json({ success: true });
});

router.patch('/users/:id/role', auth, requirePermission('admin:access'), async (req, res) => {
  const { roleId } = req.body;

  if (!roleId) {
    return res.status(400).json({ error: 'roleId required' });
  }

  await pool.query(
    'UPDATE users SET role_id = $1 WHERE id = $2',
    [roleId, req.params.id]
  );

  res.json({ success: true });
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

router.delete('/users/:id', async (req, res) => {
  if (req.user.id === req.params.id) {
    return res.status(400).json({ error: "You can't delete yourself" });
  }

  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;