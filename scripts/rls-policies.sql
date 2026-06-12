-- ==============================================================
-- RLS Policies para PropiApp
-- Ejecutar en Supabase SQL Editor (Dashboard > SQL Editor)
-- ==============================================================

-- 1. Asegurar que RLS está activado en todas las tablas
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE brochure_downloads ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes para limpiar
DROP POLICY IF EXISTS "Public SELECT properties" ON properties;
DROP POLICY IF EXISTS "Public SELECT property_images" ON property_images;
DROP POLICY IF EXISTS "Public INSERT leads" ON leads;
DROP POLICY IF EXISTS "Public INSERT property_views" ON property_views;
DROP POLICY IF EXISTS "Public INSERT whatsapp_clicks" ON whatsapp_clicks;
DROP POLICY IF EXISTS "Public INSERT brochure_downloads" ON brochure_downloads;

-- 3. Políticas para la anon key (público)

-- properties: cualquiera puede LEER propiedades publicadas
CREATE POLICY "Public SELECT properties" ON properties
  FOR SELECT
  USING (true);

-- property_images: cualquiera puede LEER imágenes
CREATE POLICY "Public SELECT property_images" ON property_images
  FOR SELECT
  USING (true);

-- leads: cualquiera puede INSERTAR un lead (formulario de contacto)
CREATE POLICY "Public INSERT leads" ON leads
  FOR INSERT
  WITH CHECK (true);

-- property_views: cualquiera puede INSERTAR una vista (tracking)
CREATE POLICY "Public INSERT property_views" ON property_views
  FOR INSERT
  WITH CHECK (true);

-- whatsapp_clicks: cualquiera puede INSERTAR un clic (tracking)
CREATE POLICY "Public INSERT whatsapp_clicks" ON whatsapp_clicks
  FOR INSERT
  WITH CHECK (true);

-- brochure_downloads: cualquiera puede INSERTAR una descarga (tracking)
CREATE POLICY "Public INSERT brochure_downloads" ON brochure_downloads
  FOR INSERT
  WITH CHECK (true);

-- ==============================================================
-- NOTAS:
-- - La service_role key (usada en Vercel) BYPASEA todas las RLS
-- - La anon key (pública) solo puede hacer lo que estas políticas permiten
-- - Sin estas políticas, la anon key NO puede leer ni escribir NADA
-- ==============================================================
