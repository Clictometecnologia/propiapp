import { createClient } from '@supabase/supabase-js';
import { readFileSync, appendFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Manual .env.local parser (no dotenv dependency)
const envRaw = readFileSync(resolve(__dirname, '../.env.local'), 'utf-8');
for (const line of envRaw.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#') || !t.includes('=')) continue;
  const idx = t.indexOf('=');
  const k = t.slice(0, idx).trim();
  let v = t.slice(idx + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[k] = v;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const IMGBB_KEY = 'eeda531d3ed24d55ae860c573e79df61';
const LOG_FILE = resolve(__dirname, 'migration-log.txt');

function log(msg) {
  console.log(msg);
  appendFileSync(LOG_FILE, msg + '\n');
}

async function uploadToImgbb(imageUrl, id) {
  try {
    const resp = await fetch(imageUrl);
    if (!resp.ok) {
      log(`  [SALTAR] ID ${id}: no se pudo descargar (status ${resp.status})`);
      return null;
    }
    const buffer = Buffer.from(await resp.arrayBuffer());
    const base64 = buffer.toString('base64');

    const form = new URLSearchParams();
    form.set('key', IMGBB_KEY);
    form.set('image', base64);

    const result = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });
    const json = await result.json();

    if (json.success) {
      log(`  [OK] ID ${id}: ${json.data.url}`);
      return json.data.url;
    } else {
      log(`  [ERROR] ID ${id}: ${json.error?.message || 'desconocido'}`);
      return null;
    }
  } catch (err) {
    log(`  [ERROR] ID ${id}: ${err.message}`);
    return null;
  }
}

async function main() {
  log('=== Iniciando migración de imágenes a imgbb ===\n');

  const { data: images, error } = await supabase
    .from('property_images')
    .select('id, image_url, property_id');

  if (error) {
    log(`Error al leer imágenes: ${error.message}`);
    return;
  }

  const supabaseImages = images.filter(img =>
    img.image_url?.includes('supabase.co')
  );

  log(`Total imágenes: ${images.length}`);
  log(`Imágenes en Supabase Storage: ${supabaseImages.length}\n`);

  let migrated = 0;
  let failed = 0;

  for (const img of supabaseImages) {
    log(`Procesando ID ${img.id}...`);
    const newUrl = await uploadToImgbb(img.image_url, img.id);
    if (newUrl) {
      const { error: updateErr } = await supabase
        .from('property_images')
        .update({ image_url: newUrl })
        .eq('id', img.id);
      if (updateErr) {
        log(`  [ERROR ACTUALIZAR] ID ${img.id}: ${updateErr.message}`);
        failed++;
      } else {
        migrated++;
      }
    } else {
      failed++;
    }
  }

  log(`\n=== Migración completada ===`);
  log(`Migradas: ${migrated}`);
  log(`Fallidas: ${failed}`);
}

main().catch(console.error);
