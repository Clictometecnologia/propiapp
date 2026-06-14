import { readFileSync, writeFileSync } from 'fs';

const csv = readFileSync(process.argv[2] || 'properties.csv', 'utf-8').trim();

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

const lines = csv.split('\n');
const headers = parseCSVLine(lines[0]);

function colIdx(name) {
  return headers.findIndex(h => h.trim() === name);
}

const inserts = [];

for (let r = 1; r < lines.length; r++) {
  if (!lines[r].trim()) continue;
  const vals = parseCSVLine(lines[r]);
  const get = (name) => {
    const i = colIdx(name);
    if (i === -1) return null;
    return vals[i] || null;
  };

  function esc(v) {
    if (v === null || v === '' || v === 'null') return 'NULL';
    if (typeof v === 'string' && v.startsWith('+')) return `'${v.replace(/'/g, "''")}'`;
    const num = Number(v);
    if (!isNaN(num) && v.trim() !== '') return v.trim();
    if (v === 'true' || v === 'false') return v;
    return `'${v.replace(/'/g, "''")}'`;
  }

  function escArr(v) {
    if (!v || v === 'null') return `'{}'::text[]`;
    const inner = v.slice(1, -1);
    const parts = inner.split('","');
    const cleaned = parts.map((s, i) => {
      if (i === 0) s = s.replace(/^"/, '');
      if (i === parts.length - 1) s = s.replace(/"$/, '');
      return s;
    });
    return `ARRAY[${cleaned.map(s => `'${s.replace(/'/g, "''")}'`).join(',')}]::text[]`;
  }

  const id = esc(get('id'));
  const name = esc(get('name'));
  const slug = esc(get('slug'));
  const comuna = esc(get('comuna'));
  const tipologia = esc(get('tipologia'));
  const precio = esc(get('precio_desde_uf'));
  const dorm = esc(get('dormitorios'));
  const banos = esc(get('banos'));
  const bono = esc(get('bono_pie'));
  const entrega = esc(get('entrega_inmediata'));
  const desc = esc(get('descripcion'));
  const amen = escArr(get('amenidades'));
  const ejName = esc(get('ejecutivo_nombre'));
  const ejCargo = esc(get('ejecutivo_cargo'));
  const ejWpp = esc(get('ejecutivo_whatsapp'));
  const ejEmail = esc(get('ejecutivo_email'));
  const brochure = get('brochure_url') ? esc(get('brochure_url')) : '\'\'';
  const featured = esc(get('featured'));
  const published = esc(get('published'));
  const created = get('created_at') ? `'${get('created_at').replace(/'/g, "''")}'` : 'now()';
  const updated = get('updated_at') ? `'${get('updated_at').replace(/'/g, "''")}'` : 'now()';
  const lat = get('lat');
  const lng = get('lng');
  const latVal = lat && lat !== 'null' && lat !== '' ? lat : 'NULL';
  const lngVal = lng && lng !== 'null' && lng !== '' ? lng : 'NULL';

  const sql = `INSERT INTO properties (id, name, slug, comuna, tipologia, precio_desde_uf, dormitorios, banos, bono_pie, entrega_inmediata, descripcion, amenidades, ejecutivo_nombre, ejecutivo_cargo, ejecutivo_whatsapp, ejecutivo_email, brochure_url, lat, lng, featured, published, created_at, updated_at) VALUES (${id}, ${name}, ${slug}, ${comuna}, ${tipologia}, ${precio}, ${dorm}, ${banos}, ${bono}, ${entrega}, ${desc}, ${amen}, ${ejName}, ${ejCargo}, ${ejWpp}, ${ejEmail}, ${brochure}, ${latVal}, ${lngVal}, ${featured}, ${published}, ${created}, ${updated});`;

  inserts.push(sql);
}

writeFileSync('import-properties.sql', inserts.join('\n'));
console.log(`✅ Generadas ${inserts.length} sentencias INSERT en import-properties.sql`);
