// Migration runner for webpage tables
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD ?? ''),
});

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('Running migrations...');
    
    const migrationFile = path.join(__dirname, 'migrations', '001-create-webpage-tables.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    await client.query(sql);
    console.log('✓ Migrations completed successfully');
  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
