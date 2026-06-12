-- ============================================
-- Schema para PropiApp en Neon
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Properties (proyectos inmobiliarios)
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  comuna TEXT NOT NULL,
  tipologia TEXT NOT NULL DEFAULT 'Departamento',
  precio_desde_uf NUMERIC NOT NULL,
  dormitorios INTEGER NOT NULL DEFAULT 1,
  banos INTEGER NOT NULL DEFAULT 1,
  bono_pie NUMERIC NOT NULL DEFAULT 0,
  entrega_inmediata BOOLEAN NOT NULL DEFAULT false,
  descripcion TEXT NOT NULL DEFAULT '',
  amenidades TEXT[] NOT NULL DEFAULT '{}',
  ejecutivo_nombre TEXT NOT NULL DEFAULT '',
  ejecutivo_cargo TEXT NOT NULL DEFAULT '',
  ejecutivo_whatsapp TEXT NOT NULL DEFAULT '',
  ejecutivo_email TEXT NOT NULL DEFAULT '',
  brochure_url TEXT NOT NULL DEFAULT '',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  featured BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT false
);

-- Property images
CREATE TABLE IF NOT EXISTS property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Leads (contactos)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  telefono TEXT NOT NULL DEFAULT '',
  mensaje TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'Pendiente',
  observacion TEXT NOT NULL DEFAULT ''
);

-- Tracking: views
CREATE TABLE IF NOT EXISTS property_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE
);

-- Tracking: whatsapp clicks
CREATE TABLE IF NOT EXISTS whatsapp_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE
);

-- Tracking: brochure downloads
CREATE TABLE IF NOT EXISTS brochure_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_published ON properties(published);
CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug);
CREATE INDEX IF NOT EXISTS idx_properties_comuna ON properties(comuna);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_leads_property_id ON leads(property_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_views_property_id ON property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_clicks_property_id ON whatsapp_clicks(property_id);
CREATE INDEX IF NOT EXISTS idx_brochure_downloads_property_id ON brochure_downloads(property_id);
