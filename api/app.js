import express from 'express';
import { Pool } from 'pg';
import serverless from 'serverless-http';

const app = express();
app.use(express.json());
app.use(express.static('public'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Ensure table and name column exist with correct defaults
await pool.query(`
  CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    name TEXT DEFAULT 'Anonym'
  );
`);
await pool.query('ALTER TABLE notes ADD COLUMN IF NOT EXISTS name TEXT;');
await pool.query("UPDATE notes SET name = 'Anonym' WHERE name IS NULL OR name = ''; ");
await pool.query("ALTER TABLE notes ALTER COLUMN name SET DEFAULT 'Anonym';");

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get latest 50 notes
app.get('/notes', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, content, created_at FROM notes ORDER BY created_at DESC LIMIT 50');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'database_error' });
  }
});

// Create a note
app.post('/notes', async (req, res) => {
  try {
    let { name, content } = req.body || {};
    content = (content || '').toString().trim();
    name = (name || '').toString().trim();
    if (!content) return res.status(400).json({ error: 'content_required' });
    if (!name) name = 'Anonym';
    const result = await pool.query(
      'INSERT INTO notes (name, content) VALUES ($1, $2) RETURNING id, name, content, created_at',
      [name, content]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'database_error' });
  }
});

// Update a note
app.patch('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let { name, content } = req.body || {};
    const fields = [];
    const values = [];
    let idx = 1;
    if (name !== undefined) {
      name = name.toString().trim();
      if (!name) name = 'Anonym';
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (content !== undefined) {
      content = content.toString().trim();
      if (!content) return res.status(400).json({ error: 'content_required' });
      fields.push(`content = $${idx++}`);
      values.push(content);
    }
    if (fields.length === 0) {
      return res.status(400).json({ error: 'no_fields' });
    }
    values.push(id);
    const sql = `UPDATE notes SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, content, created_at`;
    const result = await pool.query(sql, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'not_found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'database_error' });
  }
});

// Delete a note
app.delete('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM notes WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'not_found' });
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'database_error' });
  }
});

export default serverless(app);
