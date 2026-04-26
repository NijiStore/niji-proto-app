require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── DATABASE ──
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ── MIDDLEWARE ──
app.use(cors({
  origin: 'https://nijistore.github.io', // GitHub Pages frontend
}));
app.use(express.json());

// ── HEALTH CHECK ──
app.get('/', (req, res) => {
  res.send('Niji API running');
});

// =============================================================================
// ROUTES
// =============================================================================

// GET all prototypes
app.get('/api/prototypes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM prototypes ORDER BY created_at ASC');
    res.json(result.rows.map(formatRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch prototypes' });
  }
});

// POST — create prototype
app.post('/api/prototypes', async (req, res) => {
  const p = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO prototypes
         (id, name, category, date, iteration, time, difficulty, cost,
          verdict, price, verdict_note, materials, worked, didnt, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        p.id, p.name, p.category, p.date, p.iteration,
        p.time, p.difficulty, p.cost, p.verdict, p.price,
        p.verdictNote,
        JSON.stringify(p.materials || []),
        JSON.stringify(p.worked   || []),
        JSON.stringify(p.didnt    || []),
        p.createdAt || Date.now(),
      ]
    );
    res.json(formatRow(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create prototype' });
  }
});

// PATCH — update prototype
app.patch('/api/prototypes/:id', async (req, res) => {
  const p = req.body;
  try {
    const result = await pool.query(
      `UPDATE prototypes SET
         name=$1, category=$2, date=$3, iteration=$4, time=$5,
         difficulty=$6, cost=$7, verdict=$8, price=$9,
         verdict_note=$10, materials=$11, worked=$12, didnt=$13
       WHERE id=$14
       RETURNING *`,
      [
        p.name, p.category, p.date, p.iteration, p.time,
        p.difficulty, p.cost, p.verdict, p.price, p.verdictNote,
        JSON.stringify(p.materials || []),
        JSON.stringify(p.worked   || []),
        JSON.stringify(p.didnt    || []),
        req.params.id,
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(formatRow(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update prototype' });
  }
});

// DELETE — remove prototype
app.delete('/api/prototypes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM prototypes WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete prototype' });
  }
});

// =============================================================================
// HELPERS
// =============================================================================

// Maps DB snake_case columns to camelCase for the frontend
function formatRow(row) {
  return {
    id:          row.id,
    name:        row.name,
    category:    row.category,
    date:        row.date,
    iteration:   row.iteration,
    time:        row.time,
    difficulty:  row.difficulty,
    cost:        row.cost,
    verdict:     row.verdict,
    price:       row.price,
    verdictNote: row.verdict_note,
    materials:   row.materials || [],
    worked:      row.worked    || [],
    didnt:       row.didnt     || [],
    createdAt:   Number(row.created_at),
  };
}

// =============================================================================
// START
// =============================================================================

app.listen(PORT, () => console.log(`Niji server running on port ${PORT}`));