require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pool = require('./db');

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

// ── HEALTH CHECK ──
app.get('/', (req, res) => {
  res.send('Niji API running');
});

// ── ROUTES ──
const protojournalRoutes = require('./routes/protojournal');
const authRoutes = require('./routes/auth');

// mount routes
app.use('/api/protojournal', protojournalRoutes);
app.use('/auth', authRoutes);

app.post('/auth/bootstrap', async (req, res) => {
  try {
    console.log('1. START');

    const { key, username, password } = req.body;
    console.log('2. BODY OK');

    if (key !== process.env.BOOTSTRAP_KEY) {
      console.log('3. BAD KEY');
      return res.status(403).json({ error: 'Invalid bootstrap key' });
    }

    console.log('4. KEY OK');

    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash(password, 10);
    console.log('5. HASH OK');

    console.log('6. BEFORE DB');

    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, hash]
    );

    console.log('7. AFTER DB');

    res.json({ success: true, user: result.rows[0] });

  } catch (err) {
    console.error('ERROR:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
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

// ── START ──
app.listen(PORT, () => {
  console.log(`Niji server running on port ${PORT}`);
});