require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// ── APP ──
const app  = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ──
app.use(cors({
  origin: ['https://nijistore.github.io'],
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

const pool = require('./db');

// ── HEALTH CHECK ──
app.get('/', (req, res) => {
  res.send('Niji API running');
});

// ── ROUTES ──
const protojournalRoutes = require('./routes/protojournal');
const authRoutes = require('./routes/auth');

// mount routes

app.post('/auth/bootstrap', async (req, res) => {
  try {
    console.log('BOOTSTRAP HIT');

    const { key, username, password } = req.body || {};

    if (!key || !username || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    if (key !== process.env.BOOTSTRAP_KEY) {
      return res.status(403).json({ error: 'Invalid bootstrap key' });
    }

    const bcrypt = require('bcrypt');

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, hash]
    );

    return res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (err) {
    console.error('BOOTSTRAP ERROR:', err);
    return res.status(500).json({
      error: 'Bootstrap failed',
      details: err.message
    });
  }
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('DB TEST ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/protojournal', protojournalRoutes);
app.use('/auth', authRoutes);

// ── START ──
app.listen(PORT, () => {
  console.log(`Niji server running on port ${PORT}`);
});