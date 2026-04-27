const pool = require('../db');

function formatRow(row) {
  return {
    id:          row.id,
    name:        row.name,
    category:    row.category,
    date:        row.date,
    model:       row.model,
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

exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM protojournal.prototypes ORDER BY created_at ASC'
    );
    res.json(result.rows.map(formatRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch prototypes' });
  }
};

exports.create = async (req, res) => {
  const p = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO protojournal.prototypes
       (id, name, category, date, model, time, difficulty, cost,
        verdict, price, verdict_note, materials, worked, didnt, created_at)
       VALUES (
        COALESCE($1, gen_random_uuid()), $2,$3,$4,$5,$6,$7,$8,
        $9,$10,$11,$12,$13,$14,$15
       )
       RETURNING *`,
      [
        p.id || null,
        p.name, p.category, p.date, p.model,
        p.time, p.difficulty, p.cost,
        p.verdict, p.price, p.verdictNote,
        JSON.stringify(p.materials || []),
        JSON.stringify(p.worked || []),
        JSON.stringify(p.didnt || []),
        p.createdAt || Date.now(),
      ]
    );

    res.json(formatRow(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create prototype' });
  }
};

exports.update = async (req, res) => {
  const p = req.body;

  try {
    const result = await pool.query(
      `UPDATE protojournal.prototypes SET
        name=$1, category=$2, date=$3, model=$4, time=$5,
        difficulty=$6, cost=$7, verdict=$8, price=$9,
        verdict_note=$10, materials=$11, worked=$12, didnt=$13
       WHERE id=$14
       RETURNING *`,
      [
        p.name, p.category, p.date, p.model, p.time,
        p.difficulty, p.cost, p.verdict, p.price, p.verdictNote,
        JSON.stringify(p.materials || []),
        JSON.stringify(p.worked || []),
        JSON.stringify(p.didnt || []),
        req.params.id,
      ]
    );

    res.json(formatRow(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update prototype' });
  }
};

exports.remove = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM protojournal.prototypes WHERE id=$1',
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete prototype' });
  }
};