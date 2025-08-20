const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  const createTableSql = `
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  try {
    await pool.query(createTableSql);
        await pool.query("ALTER TABLE notes ADD COLUMN IF NOT EXISTS name TEXT");
    await pool.query("UPDATE notes SET name = 'Anonym' WHERE name IS NULL OR name = ''");
    await pool.query("ALTER TABLE notes ALTER COLUMN name SET DEFAULT 'Anonym'");
    console.log('Migration completed.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
