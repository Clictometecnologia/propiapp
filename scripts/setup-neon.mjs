import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pool = new pg.Pool({
  connectionString: 'postgresql://neondb_owner:npg_HFzAQs6xKWO7@ep-wandering-bar-aiq77zch.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false },
});

const sql = readFileSync(resolve(__dirname, 'neon-schema.sql'), 'utf-8');

try {
  await pool.query(sql);
  console.log('✅ Schema creado exitosamente en Neon');
} catch (err) {
  console.error('❌ Error al crear schema:', err.message);
} finally {
  await pool.end();
}
