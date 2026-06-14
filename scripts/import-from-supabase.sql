-- ==========================================
-- Importar datos de Supabase a Neon
-- Ejecutar en orden: 1 → 2 → 3
-- ==========================================

-- 1. PROPERTIES
-- Reemplaza con los VALUES de tu CSV
INSERT INTO properties (id, name, slug, comuna, tipologia, precio_desde_uf, dormitorios, banos, bono_pie, entrega_inmediata, descripcion, amenidades, ejecutivo_nombre, ejecutivo_cargo, ejecutivo_whatsapp, ejecutivo_email, brochure_url, lat, lng, featured, published, created_at, updated_at)
VALUES
-- Ejemplo (borrar y pegar datos reales):
('uuid-1', 'Proyecto Ejemplo', 'proyecto-ejemplo', 'Las Condes', 'Departamento', 4500, 3, 2, 0, true, 'Descripción', ARRAY['Piscina','Gimnasio'], 'Juan Pérez', 'Ejecutivo', '+56912345678', 'juan@mail.com', '', -33.4083, -70.5675, false, true, now(), now());

-- 2. PROPERTY IMAGES
INSERT INTO property_images (id, property_id, image_url, is_primary, sort_order)
VALUES
-- ('uuid-img-1', 'uuid-1', 'https://i.ibb.co/xxx/image.jpg', true, 0);

-- 3. LEADS
INSERT INTO leads (id, property_id, nombre, email, telefono, mensaje, estado, observacion, created_at)
VALUES
-- ('uuid-lead-1', 'uuid-1', 'Cliente', 'cliente@mail.com', '+56912345678', 'Quiero info', 'Pendiente', '', now());
