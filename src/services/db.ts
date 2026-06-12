import { query } from '../lib/neon';
import { Property, PropertyImage, Lead } from '../types';

function rowToProperty(row: any, images?: any[]): Property {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    comuna: row.comuna,
    tipologia: row.tipologia,
    precio_desde_uf: Number(row.precio_desde_uf),
    dormitorios: row.dormitorios,
    banos: row.banos,
    bono_pie: Number(row.bono_pie),
    entrega_inmediata: row.entrega_inmediata,
    descripcion: row.descripcion,
    amenidades: row.amenidades || [],
    ejecutivo_nombre: row.ejecutivo_nombre,
    ejecutivo_cargo: row.ejecutivo_cargo,
    ejecutivo_whatsapp: row.ejecutivo_whatsapp,
    ejecutivo_email: row.ejecutivo_email,
    brochure_url: row.brochure_url,
    lat: row.lat,
    lng: row.lng,
    featured: row.featured,
    published: row.published,
    created_at: row.created_at,
    updated_at: row.updated_at,
    images: images || [],
  };
}

function rowToImage(row: any): PropertyImage {
  return {
    id: row.id,
    property_id: row.property_id,
    image_url: row.image_url,
    is_primary: row.is_primary,
    sort_order: row.sort_order,
  };
}

function rowToLead(row: any): Lead {
  return {
    id: row.id,
    created_at: row.created_at,
    property_id: row.property_id,
    nombre: row.nombre,
    email: row.email,
    telefono: row.telefono,
    mensaje: row.mensaje,
    estado: row.estado as Lead['estado'],
    observacion: row.observacion,
    property_name: row.property_name || 'Proyecto Eliminado',
  };
}

export const db = {
  // --------------------------------------------------
  // Properties Queries
  // --------------------------------------------------
  async getProperties(filters?: {
    comuna?: string;
    tipologia?: string;
    dormitorios?: number;
    precioMin?: number;
    precioMax?: number;
    entregaInmediata?: boolean;
    bonoPie?: boolean;
    onlyPublished?: boolean;
    includeImages?: boolean;
  }): Promise<Property[]> {
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIdx = 1;

      if (filters?.onlyPublished) {
        conditions.push(`p.published = true`);
      }
      if (filters?.comuna && filters.comuna !== 'all') {
        conditions.push(`p.comuna = $${paramIdx++}`);
        params.push(filters.comuna);
      }
      if (filters?.tipologia && filters.tipologia !== 'all') {
        conditions.push(`p.tipologia = $${paramIdx++}`);
        params.push(filters.tipologia);
      }
      if (filters?.dormitorios) {
        conditions.push(`p.dormitorios >= $${paramIdx++}`);
        params.push(filters.dormitorios);
      }
      if (filters?.precioMin) {
        conditions.push(`p.precio_desde_uf >= $${paramIdx++}`);
        params.push(filters.precioMin);
      }
      if (filters?.precioMax) {
        conditions.push(`p.precio_desde_uf <= $${paramIdx++}`);
        params.push(filters.precioMax);
      }
      if (filters?.entregaInmediata !== undefined) {
        conditions.push(`p.entrega_inmediata = $${paramIdx++}`);
        params.push(filters.entregaInmediata);
      }
      if (filters?.bonoPie !== undefined) {
        conditions.push(`p.bono_pie > 0`);
      }

      const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
      const includeImages = filters?.includeImages !== false;

      const sql = `
        SELECT p.* ${includeImages ? `, COALESCE(json_agg(pi.*) FILTER (WHERE pi.id IS NOT NULL), '[]'::json) AS images` : ''}
        FROM properties p
        ${includeImages ? 'LEFT JOIN property_images pi ON pi.property_id = p.id' : ''}
        ${where}
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT 100
      `;

      const result = await query(sql, params);
      return result.rows.map(row => {
        const images = includeImages ? (row.images || []).map(rowToImage) : [];
        return rowToProperty(row, images);
      });
    } catch (err) {
      console.error('Neon getProperties error:', err);
      return [];
    }
  },

  async getPropertyBySlug(slug: string): Promise<Property | null> {
    try {
      const result = await query(`
        SELECT p.*, COALESCE(json_agg(pi.*) FILTER (WHERE pi.id IS NOT NULL), '[]'::json) AS images
        FROM properties p
        LEFT JOIN property_images pi ON pi.property_id = p.id
        WHERE p.slug = $1
        GROUP BY p.id
        LIMIT 1
      `, [slug]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return rowToProperty(row, (row.images || []).map(rowToImage));
    } catch (err) {
      console.error('Neon getPropertyBySlug error:', err);
      return null;
    }
  },

  async getPropertyById(id: string): Promise<Property | null> {
    try {
      const result = await query(`
        SELECT p.*, COALESCE(json_agg(pi.*) FILTER (WHERE pi.id IS NOT NULL), '[]'::json) AS images
        FROM properties p
        LEFT JOIN property_images pi ON pi.property_id = p.id
        WHERE p.id = $1
        GROUP BY p.id
        LIMIT 1
      `, [id]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return rowToProperty(row, (row.images || []).map(rowToImage));
    } catch (err) {
      console.error('Neon getPropertyById error:', err);
      return null;
    }
  },

  async getRelatedProperties(propertyId: string, comuna: string, tipologia: string, limit = 3): Promise<Property[]> {
    try {
      const result = await query(`
        SELECT p.*, COALESCE(json_agg(pi.*) FILTER (WHERE pi.id IS NOT NULL), '[]'::json) AS images
        FROM properties p
        LEFT JOIN property_images pi ON pi.property_id = p.id
        WHERE p.id != $1 AND p.published = true AND (p.comuna = $2 OR p.tipologia = $3)
        GROUP BY p.id
        LIMIT $4
      `, [propertyId, comuna, tipologia, limit]);
      return result.rows.map(row => rowToProperty(row, (row.images || []).map(rowToImage)));
    } catch (err) {
      console.error('Neon getRelatedProperties error:', err);
      return [];
    }
  },

  // --------------------------------------------------
  // Properties Mutations
  // --------------------------------------------------
  async createProperty(
    propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'images'>,
    imagesData: Omit<PropertyImage, 'id' | 'property_id'>[]
  ): Promise<Property> {
    const slug = propertyData.slug || propertyData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const result = await query(`
      INSERT INTO properties (name, slug, comuna, tipologia, precio_desde_uf, dormitorios, banos, bono_pie,
        entrega_inmediata, descripcion, amenidades, ejecutivo_nombre, ejecutivo_cargo, ejecutivo_whatsapp,
        ejecutivo_email, brochure_url, lat, lng, featured, published)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING id
    `, [
      propertyData.name, slug, propertyData.comuna, propertyData.tipologia, propertyData.precio_desde_uf,
      propertyData.dormitorios, propertyData.banos, propertyData.bono_pie || 0, propertyData.entrega_inmediata,
      propertyData.descripcion, propertyData.amenidades, propertyData.ejecutivo_nombre,
      propertyData.ejecutivo_cargo, propertyData.ejecutivo_whatsapp, propertyData.ejecutivo_email,
      propertyData.brochure_url || '', propertyData.lat ?? null, propertyData.lng ?? null,
      propertyData.featured || false, propertyData.published || false,
    ]);

    const propId = result.rows[0].id;

    if (imagesData && imagesData.length > 0) {
      const imgValues = imagesData.map((img, i) => {
        const offset = i * 4;
        return `($1, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
      }).join(', ');

      const imgParams: any[] = [propId];
      for (const img of imagesData) {
        imgParams.push(img.image_url, img.is_primary, img.sort_order);
      }

      await query(`
        INSERT INTO property_images (property_id, image_url, is_primary, sort_order)
        VALUES ${imgValues}
      `, imgParams);
    }

    return (await this.getPropertyById(propId))!;
  },

  async updateProperty(
    id: string,
    propertyData: Partial<Omit<Property, 'id' | 'created_at' | 'updated_at' | 'images'>>,
    imagesData?: Omit<PropertyImage, 'id' | 'property_id'>[]
  ): Promise<Property> {
    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(propertyData)) {
      const col = key === 'precio_desde_uf' ? key
        : key === 'entrega_inmediata' ? key
        : key === 'bono_pie' ? key
        : key === 'ejecutivo_nombre' ? 'ejecutivo_nombre'
        : key === 'ejecutivo_cargo' ? 'ejecutivo_cargo'
        : key === 'ejecutivo_whatsapp' ? 'ejecutivo_whatsapp'
        : key === 'ejecutivo_email' ? 'ejecutivo_email'
        : key === 'brochure_url' ? 'brochure_url'
        : key === 'lat' ? 'lat'
        : key === 'lng' ? 'lng'
        : key;
      const dbCol = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      sets.push(`${dbCol} = $${idx++}`);
      params.push(value ?? null);
    }

    sets.push(`updated_at = now()`);
    params.push(id);

    await query(`
      UPDATE properties SET ${sets.join(', ')}
      WHERE id = $${idx}
    `, params);

    if (imagesData) {
      await query(`DELETE FROM property_images WHERE property_id = $1`, [id]);

      if (imagesData.length > 0) {
        const imgValues = imagesData.map((_, i) => {
          const offset = i * 4;
          return `($1, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
        }).join(', ');

        const imgParams: any[] = [id];
        for (const img of imagesData) {
          imgParams.push(img.image_url, img.is_primary, img.sort_order);
        }

        await query(`
          INSERT INTO property_images (property_id, image_url, is_primary, sort_order)
          VALUES ${imgValues}
        `, imgParams);
      }
    }

    const updated = await this.getPropertyById(id);
    if (!updated) throw new Error('Propiedad no encontrada después de actualizar');
    return updated;
  },

  async deleteProperty(id: string): Promise<boolean> {
    await query(`DELETE FROM properties WHERE id = $1`, [id]);
    return true;
  },

  async duplicateProperty(id: string): Promise<Property> {
    const original = await this.getPropertyById(id);
    if (!original) throw new Error('Propiedad no encontrada para duplicar');

    const cleanImages = (original.images || []).map(img => ({
      image_url: img.image_url,
      is_primary: img.is_primary,
      sort_order: img.sort_order,
    }));

    const copyData: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'images'> = {
      name: `${original.name} (Copia)`,
      slug: `${original.slug}-copia-${Math.random().toString(36).substr(2, 4)}`,
      comuna: original.comuna,
      tipologia: original.tipologia,
      precio_desde_uf: original.precio_desde_uf,
      dormitorios: original.dormitorios,
      banos: original.banos,
      bono_pie: Number(original.bono_pie) || 0,
      entrega_inmediata: original.entrega_inmediata,
      descripcion: original.descripcion,
      amenidades: [...original.amenidades],
      ejecutivo_nombre: original.ejecutivo_nombre,
      ejecutivo_cargo: original.ejecutivo_cargo,
      ejecutivo_whatsapp: original.ejecutivo_whatsapp,
      ejecutivo_email: original.ejecutivo_email,
      brochure_url: original.brochure_url,
      featured: false,
      published: false,
    };

    return this.createProperty(copyData, cleanImages);
  },

  // --------------------------------------------------
  // Leads Operations
  // --------------------------------------------------
  async getLeads(filters?: { propertyId?: string; search?: string; estado?: string }): Promise<Lead[]> {
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (filters?.propertyId) {
        conditions.push(`l.property_id = $${idx++}`);
        params.push(filters.propertyId);
      }
      if (filters?.estado && filters.estado !== 'all') {
        conditions.push(`l.estado = $${idx++}`);
        params.push(filters.estado.toLowerCase());
      }
      if (filters?.search) {
        const q = `%${filters.search.toLowerCase()}%`;
        conditions.push(`(LOWER(l.nombre) LIKE $${idx} OR LOWER(l.email) LIKE $${idx})`);
        params.push(q);
        idx++;
      }

      const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

      const result = await query(`
        SELECT l.*, p.name AS property_name
        FROM leads l
        LEFT JOIN properties p ON p.id = l.property_id
        ${where}
        ORDER BY l.created_at DESC
        LIMIT 500
      `, params);

      return result.rows.map(rowToLead);
    } catch (err) {
      console.error('Neon getLeads error:', err);
      return [];
    }
  },

  async createLead(leadData: Omit<Lead, 'id' | 'created_at'>): Promise<Lead> {
    const estado = leadData.estado.charAt(0).toUpperCase() + leadData.estado.slice(1).toLowerCase();
    const result = await query(`
      INSERT INTO leads (property_id, nombre, email, telefono, mensaje, estado, observacion)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      leadData.property_id, leadData.nombre, leadData.email,
      leadData.telefono, leadData.mensaje, estado, leadData.observacion || '',
    ]);
    return rowToLead(result.rows[0]);
  },

  async updateLeadStatus(id: string, estado: Lead['estado']): Promise<Lead> {
    const value = typeof estado === 'string' ? estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase() : estado;
    const result = await query(`
      UPDATE leads SET estado = $1 WHERE id = $2 RETURNING *
    `, [value, id]);
    return rowToLead(result.rows[0]);
  },

  async updateLeadObservation(id: string, observacion: string): Promise<Lead> {
    const result = await query(`
      UPDATE leads SET observacion = $1 WHERE id = $2 RETURNING *
    `, [observacion, id]);
    return rowToLead(result.rows[0]);
  },

  async updateLead(id: string, data: Partial<Omit<Lead, 'id' | 'created_at' | 'property_name'>>): Promise<Lead> {
    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (data.nombre !== undefined) { sets.push(`nombre = $${idx++}`); params.push(data.nombre); }
    if (data.email !== undefined) { sets.push(`email = $${idx++}`); params.push(data.email); }
    if (data.telefono !== undefined) { sets.push(`telefono = $${idx++}`); params.push(data.telefono); }
    if (data.mensaje !== undefined) { sets.push(`mensaje = $${idx++}`); params.push(data.mensaje); }
    if (data.estado !== undefined) {
      sets.push(`estado = $${idx++}`);
      params.push(typeof data.estado === 'string' ? data.estado.charAt(0).toUpperCase() + data.estado.slice(1).toLowerCase() : data.estado);
    }
    if (data.observacion !== undefined) { sets.push(`observacion = $${idx++}`); params.push(data.observacion); }
    if (data.property_id !== undefined) { sets.push(`property_id = $${idx++}`); params.push(data.property_id); }

    if (sets.length === 0) throw new Error('No hay campos para actualizar');
    params.push(id);

    const result = await query(`
      UPDATE leads SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *
    `, params);
    return rowToLead(result.rows[0]);
  },

  async deleteLead(id: string): Promise<boolean> {
    await query(`DELETE FROM leads WHERE id = $1`, [id]);
    return true;
  },

  // --------------------------------------------------
  // Analytics Tracking
  // --------------------------------------------------
  async trackPropertyView(propertyId: string): Promise<void> {
    try {
      await query(`INSERT INTO property_views (property_id) VALUES ($1)`, [propertyId]);
    } catch (err) {
      console.error('Error tracking view:', err);
    }
  },

  async trackWhatsappClick(propertyId: string): Promise<void> {
    try {
      await query(`INSERT INTO whatsapp_clicks (property_id) VALUES ($1)`, [propertyId]);
    } catch (err) {
      console.error('Error tracking whatsapp click:', err);
    }
  },

  async trackBrochureDownload(propertyId: string): Promise<void> {
    try {
      await query(`INSERT INTO brochure_downloads (property_id) VALUES ($1)`, [propertyId]);
    } catch (err) {
      console.error('Error tracking brochure download:', err);
    }
  },

  // --------------------------------------------------
  // Stats dashboard compilation
  // --------------------------------------------------
  async getDashboardStats(): Promise<any> {
    try {
      const promiseAll = Promise.all([
        query(`SELECT id, name, published FROM properties ORDER BY name`),
        query(`SELECT property_id FROM property_views`),
        query(`SELECT property_id FROM whatsapp_clicks`),
        query(`SELECT property_id FROM brochure_downloads`),
        query(`SELECT property_id, created_at FROM leads ORDER BY created_at DESC`),
      ]);

      const [props, views, clicks, downloads, leads] = await promiseAll;

      const allProperties = props.rows;
      const totalProperties = allProperties.length;
      const activeProperties = allProperties.filter((p: any) => p.published).length;
      const inactiveProperties = totalProperties - activeProperties;
      const totalLeads = leads.rows.length;
      const totalDownloads = downloads.rows.length;
      const totalWhatsappClicks = clicks.rows.length;
      const totalViews = views.rows.length;

      const getCountByProperty = (items: any[]) => {
        const counts: Record<string, number> = {};
        items.forEach((v: any) => {
          counts[v.property_id] = (counts[v.property_id] || 0) + 1;
        });
        return Object.keys(counts).map(pid => {
          const prop = allProperties.find((p: any) => p.id === pid);
          return { id: pid, name: prop ? prop.name : 'Proyecto Eliminado', count: counts[pid] };
        }).sort((a, b) => b.count - a.count);
      };

      const leadsByMonthMap: Record<string, number> = {};
      leads.rows.forEach((l: any) => {
        const date = new Date(l.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        leadsByMonthMap[key] = (leadsByMonthMap[key] || 0) + 1;
      });
      const leadsByMonth = Object.keys(leadsByMonthMap).sort().map(key => ({
        month: key, count: leadsByMonthMap[key]
      }));

      return {
        totalProperties, activeProperties, inactiveProperties,
        totalLeads, totalDownloads, totalWhatsappClicks, totalViews,
        leadsByMonth,
        whatsappClicksByProject: getCountByProperty(clicks.rows),
        downloadsByProject: getCountByProperty(downloads.rows),
        viewsByProject: getCountByProperty(views.rows),
      };
    } catch (err) {
      console.error('Neon getDashboardStats error:', err);
      return {
        totalProperties: 0, activeProperties: 0, inactiveProperties: 0,
        totalLeads: 0, totalDownloads: 0, totalWhatsappClicks: 0, totalViews: 0,
        leadsByMonth: [], whatsappClicksByProject: [], downloadsByProject: [], viewsByProject: [],
      };
    }
  }
};
