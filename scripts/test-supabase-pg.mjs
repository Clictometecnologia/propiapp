import pg from 'pg';

const hosts = [
  'db.snceuqrvypojamvivvdh.supabase.co',
  'snceuqrvypojamvivvdh.supabase.co',
];

// Use your Supabase DB password from Project Settings > Database
const password = process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.log('Set SUPABASE_DB_PASSWORD env var');
  process.exit(1);
}

for (const host of hosts) {
  const pool = new pg.Pool({
    host,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    const r = await client.query('SELECT 1 AS ok');
    console.log(`✅ ${host} conectado`);
    client.release();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.log(`❌ ${host} — ${err.message}`);
    await pool.end();
  }
}

console.log('No se pudo conectar');
