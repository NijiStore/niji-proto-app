require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

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
const adminRoutes = require('./routes/admin');


// mount routes

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
app.use('/admin', adminRoutes);

// ── START ──
app.listen(PORT, () => {
  console.log(`Niji server running on port ${PORT}`);
});