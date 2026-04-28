const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const result = await pool.query(
    'SELECT * FROM users WHERE username = $1',
    [username]
  );

  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  res.cookie('uid', user.id, {
    httpOnly: true,
    sameSite: 'None',
    secure: true
  });

  res.json({ success: true });
});

module.exports = router;