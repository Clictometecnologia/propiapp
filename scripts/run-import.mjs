import { readFileSync } from 'fs';
import pg from 'pg';

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

const sql = readFileSync('import-properties.sql', 'utf-8');
const statements = sql.split(';').filter(s => s.trim());

for (const stmt of statements) {
  try {
    await pool.query(stmt + ';');
    console.log('OK: ' + stmt.slice(0, 80) + '...');
  } catch (err) {
    console.error('ERROR:', err.message);
    console.error('SQL:', stmt.slice(0, 200));
    process.exit(1);
  }
}

await pool.end();
console.log('\n✅ 4 properties imported successfully');
