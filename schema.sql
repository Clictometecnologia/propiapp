-- SQL Database Schema for PROPIAPP.CL
-- Execute this script in the Supabase SQL Editor.

-- Enable UUID generation extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------
-- 1. Table: properties
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    comuna TEXT NOT NULL,
    tipologia TEXT NOT NULL,
    precio_desde_uf NUMERIC NOT NULL,
    dormitorios INTEGER NOT NULL,
    bono_pie BOOLEAN DEFAULT false,
    entrega_inmediata BOOLEAN DEFAULT false,
    descripcion TEXT,
    amenidades TEXT[] DEFAULT '{}',
    ejecutivo_nombre TEXT,
    ejecutivo_cargo TEXT,
    ejecutivo_whatsapp TEXT,
    ejecutivo_email TEXT,
    brochure_url TEXT,
    featured BOOLEAN DEFAULT false,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------
-- 2. Table: property_images
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for property_images
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------
-- 3. Table: leads
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL,
    email TEXT NOT NULL,
    mensaje TEXT,
    estado TEXT DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Contactado', 'Cerrado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------
-- 4. Table: brochure_downloads
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.brochure_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for brochure_downloads
ALTER TABLE public.brochure_downloads ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------
-- 5. Table: whatsapp_clicks
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for whatsapp_clicks
ALTER TABLE public.whatsapp_clicks ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------
-- 6. Table: property_views
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for property_views
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;


-- --------------------------------------------------
-- 7. Table: rate_limits
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 1,
    reset_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Allow all operations for rate_limits (no public access needed, only server-side)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow server-side access on rate_limits"
    ON public.rate_limits FOR ALL
    USING (true)
    WITH CHECK (true);


-- --------------------------------------------------
-- 8. Policies (RLS Rules)
-- --------------------------------------------------

-- Properties: Anyone can read published properties; authenticated users can do everything.
CREATE POLICY "Allow public read access for published properties"
    ON public.properties FOR SELECT
    USING (published = true);

CREATE POLICY "Allow full access for authenticated users on properties"
    ON public.properties FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Property Images: Anyone can read; authenticated users can write.
CREATE POLICY "Allow public read access on property images"
    ON public.property_images FOR SELECT
    USING (true);

CREATE POLICY "Allow full access for authenticated users on property images"
    ON public.property_images FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Leads: Anyone can insert leads; authenticated users can read/write them.
CREATE POLICY "Allow public insert leads"
    ON public.leads FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow full access for authenticated users on leads"
    ON public.leads FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Brochure downloads: Anyone can insert; authenticated users can read/write.
CREATE POLICY "Allow public insert brochure downloads"
    ON public.brochure_downloads FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow full access for authenticated users on brochure downloads"
    ON public.brochure_downloads FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- WhatsApp clicks: Anyone can insert; authenticated users can read/write.
CREATE POLICY "Allow public insert whatsapp clicks"
    ON public.whatsapp_clicks FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow full access for authenticated users on whatsapp clicks"
    ON public.whatsapp_clicks FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Property views: Anyone can insert; authenticated users can read/write.
CREATE POLICY "Allow public insert property views"
    ON public.property_views FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow full access for authenticated users on property views"
    ON public.property_views FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- --------------------------------------------------
-- 9. Indexes for Optimization
-- --------------------------------------------------
CREATE INDEX IF NOT EXISTS properties_published_idx ON public.properties(published);
CREATE INDEX IF NOT EXISTS properties_slug_idx ON public.properties(slug);
CREATE INDEX IF NOT EXISTS property_images_property_id_idx ON public.property_images(property_id);
CREATE INDEX IF NOT EXISTS leads_property_id_idx ON public.leads(property_id);
CREATE INDEX IF NOT EXISTS brochure_downloads_property_id_idx ON public.brochure_downloads(property_id);
CREATE INDEX IF NOT EXISTS whatsapp_clicks_property_id_idx ON public.whatsapp_clicks(property_id);
CREATE INDEX IF NOT EXISTS property_views_property_id_idx ON public.property_views(property_id);


-- --------------------------------------------------
-- 10. Trigger for updated_at
-- --------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();


-- --------------------------------------------------
-- 11. Storage Buckets (Execute in SQL if postgres has permissions, or configure in Supabase dashboard)
-- --------------------------------------------------
-- Note: Supabase standard bucket tables are in `storage.buckets` and `storage.objects`
-- Ensure you create 'property-images' and 'brochures' buckets and make them public.
