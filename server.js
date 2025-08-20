const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());
app.use(express.static('public'));

async function ensureTables() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      name TEXT DEFAULT 'Anonym',
      content TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`);
    await pool.query(`ALTER TABLE notes ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Anonym'`);
    await pool.query(`UPDATE notes SET name = 'Anonym' WHERE name IS NULL OR name = ''`);
    await pool.query(`ALTER TABLE notes ALTER COLUMN name SET DEFAULT 'Anonym'`);
  } catch (err) {
    console.error('Error ensuring notes table:', err);
  }
}
ensureTables();

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Get notes
app.get('/notes', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, content, created_at FROM notes ORDER BY created_at DESC LIMIT 50'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'database_error' });
  }
});

// Create note
app.post('/notes', async (req, res) => {
  try {
    const content = (req.body?.content || '').toString().trim();
    const name = (req.body?.name || '').toString().trim() || 'Anonym';
    if (!content) {
      return res.status(400).json({ error: 'content_required' });
    }
    const { rows } = await pool.query(
      'INSERT INTO notes (name, content) VALUES ($1, $2) RETURNING id, name, content, created_at',
      [name, content]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'database_error' });
  }
});

// Edit note
app.patch('/notes/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updates = [];
    const values = [];
    let idx = 1;
    if (req.body?.name !== undefined) {
      const nm = req.body.name.toString().trim() || 'Anonym';
      updates.push('name = $' + idx);
      values.push(nm);
      idx++;
    }
    if (req.body?.content !== undefined) {
      const cnt = req.body.content.toString().trim();
      if (!cnt) {
        return res.status(400).json({ error: 'content_required' });
      }
      updates.push('content = $' + idx);
      values.push(cnt);
      idx++;
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: 'nothing_to_update' });
    }
    values.push(id);
    const query =
      'UPDATE notes SET ' +
      updates.join(', ') +
      ' WHERE id = $' +
      idx +
      ' RETURNING id, name, content, created_at';
    const { rows } = await pool.query(query, values);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'not_found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'database_error' });
  }
});

// Delete note
app.delete('/notes/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM notes WHERE id = $1', [id]);
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'database_error' });
  }
});

app.listen(port, () => {
  console.log('Server listening on port ' + port);
});
