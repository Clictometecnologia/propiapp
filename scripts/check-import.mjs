import pg from 'pg';
import { readFileSync } from 'fs';

const envRaw = readFileSync('.env.local', 'utf-8');
const envVars = Object.fromEntries(
  envRaw.split('\n').filter(l => l.trim() && !l.startsWith('#')).map(l => {
    const eq = l.indexOf('=');
    return [l.slice(0, eq).trim(), l.slice(eq + 1).trim()];
  })
);

const pool = new pg.Pool({
  connectionString: envVars.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const { rows } = await pool.query('SELECT id, name, slug, comuna, precio_desde_uf, dormitorios, banos, published FROM properties ORDER BY created_at');
console.table(rows);
await pool.end();
