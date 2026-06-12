import { supabase } from '../lib/supabase';
import { Property, PropertyImage, Lead } from '../types';
import { createServerSupabase } from '../lib/supabase-server';
import { createAdminSupabase } from '@/lib/supabase-admin';

function capitalizeEstado(s: string): Lead['estado'] {
  return (s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()) as Lead['estado'];
}

function normalizeLead(l: any): Lead {
  return {
    ...l,
    estado: l.estado ? capitalizeEstado(l.estado) : l.estado,
    property_name: l.properties?.name || 'Proyecto Eliminado'
  };
}

async function getClient() {
  try {
    const sb = await createServerSupabase();
    if (sb) return sb;
  } catch {}
  return supabase;
}

async function getAdminClient() {
  try {
    const sb = await createAdminSupabase();
    if (sb) return sb;
  } catch {}
  try {
    const sb = await createServerSupabase();
    if (sb) return sb;
  } catch {}
  return supabase;
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
    const sb = await getClient();
    if (!sb) return [];

    try {
      let query = sb
        .from('properties')
        .select(filters?.includeImages !== false ? '*, images:property_images(*)' : '*')
        .limit(100);

      if (filters?.onlyPublished) query = query.eq('published', true);
      if (filters?.comuna && filters.comuna !== 'all') query = query.eq('comuna', filters.comuna);
      if (filters?.tipologia && filters.tipologia !== 'all') query = query.eq('tipologia', filters.tipologia);
      if (filters?.dormitorios) query = query.gte('dormitorios', filters.dormitorios);
      if (filters?.precioMin) query = query.gte('precio_desde_uf', filters.precioMin);
      if (filters?.precioMax) query = query.lte('precio_desde_uf', filters.precioMax);
      if (filters?.entregaInmediata !== undefined) query = query.eq('entrega_inmediata', filters.entregaInmediata);
      if (filters?.bonoPie !== undefined) query = query.gt('bono_pie', 0);

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) {
        const isTimeout = error.message?.includes('timeout') || error.code === '57014';
        if (isTimeout) {
          console.warn('Supabase getProperties timeout, retrying once...');
          await new Promise(r => setTimeout(r, 2000));
          const retryQuery = sb
            .from('properties')
            .select('*')
            .limit(50);
          if (filters?.onlyPublished) retryQuery.eq('published', true);
          if (filters?.comuna && filters.comuna !== 'all') retryQuery.eq('comuna', filters.comuna);
          if (filters?.tipologia && filters.tipologia !== 'all') retryQuery.eq('tipologia', filters.tipologia);
          if (filters?.dormitorios) retryQuery.gte('dormitorios', filters.dormitorios);
          if (filters?.precioMin) retryQuery.gte('precio_desde_uf', filters.precioMin);
          if (filters?.precioMax) retryQuery.lte('precio_desde_uf', filters.precioMax);
          if (filters?.entregaInmediata !== undefined) retryQuery.eq('entrega_inmediata', filters.entregaInmediata);
          if (filters?.bonoPie !== undefined) retryQuery.gt('bono_pie', 0);
          retryQuery.order('created_at', { ascending: false });

          const { data: retryData } = await retryQuery;
          if (retryData) return retryData as unknown as Property[];
        }
        console.error('Supabase getProperties error:', error.message);
        return [];
      }
      return (data || []) as unknown as Property[];
    } catch (err) {
      const isTimeout = String(err).includes('timeout') || String(err).includes('57014');
      if (isTimeout) {
        console.warn('Supabase getProperties timeout (exception), retrying once...');
        await new Promise(r => setTimeout(r, 2000));
        try {
          const retryQuery = sb
            .from('properties')
            .select('*')
            .limit(50);
          if (filters?.onlyPublished) retryQuery.eq('published', true);
          if (filters?.comuna && filters.comuna !== 'all') retryQuery.eq('comuna', filters.comuna);
          if (filters?.tipologia && filters.tipologia !== 'all') retryQuery.eq('tipologia', filters.tipologia);
          if (filters?.dormitorios) retryQuery.gte('dormitorios', filters.dormitorios);
          if (filters?.precioMin) retryQuery.gte('precio_desde_uf', filters.precioMin);
          if (filters?.precioMax) retryQuery.lte('precio_desde_uf', filters.precioMax);
          if (filters?.entregaInmediata !== undefined) retryQuery.eq('entrega_inmediata', filters.entregaInmediata);
          if (filters?.bonoPie !== undefined) retryQuery.gt('bono_pie', 0);
          retryQuery.order('created_at', { ascending: false });
          const { data: retryData } = await retryQuery;
          if (retryData) return retryData as unknown as Property[];
        } catch {}
      }
      console.error('Supabase getProperties exception:', err);
      return [];
    }
  },

  async getPropertyBySlug(slug: string): Promise<Property | null> {
    const sb = await getClient();
    if (!sb) return null;

    try {
      const { data, error } = await sb
        .from('properties')
        .select('*, images:property_images(*)')
        .eq('slug', slug)
        .maybeSingle();
      if (error) {
        console.error('Supabase getPropertyBySlug error:', error.message);
        return null;
      }
      return data as Property | null;
    } catch (err) {
      console.error('Supabase getPropertyBySlug exception:', err);
      return null;
    }
  },

  async getPropertyById(id: string): Promise<Property | null> {
    const sb = await getClient();
    if (!sb) return null;

    try {
      const { data, error } = await sb
        .from('properties')
        .select('*, images:property_images(*)')
        .eq('id', id)
        .maybeSingle();
      if (error) {
        console.error('Supabase getPropertyById error:', error.message);
        return null;
      }
      return data as Property | null;
    } catch (err) {
      console.error('Supabase getPropertyById exception:', err);
      return null;
    }
  },

  async getRelatedProperties(propertyId: string, comuna: string, tipologia: string, limit = 3): Promise<Property[]> {
    const sb = await getClient();
    if (!sb) return [];

    try {
      const { data, error } = await sb
        .from('properties')
        .select('*, images:property_images(*)')
        .neq('id', propertyId)
        .eq('published', true)
        .or(`comuna.eq.${comuna},tipologia.eq.${tipologia}`)
        .limit(limit);

      if (error) {
        console.error('Supabase getRelatedProperties error:', error.message);
        return [];
      }
      return (data || []) as Property[];
    } catch (err) {
      console.error('Supabase getRelatedProperties exception:', err);
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
    const sb = await getAdminClient();  if (!sb) throw new Error('Supabase no está configurado');

    const slug = propertyData.slug || propertyData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { data: prop, error: propErr } = await sb
      .from('properties')
      .insert([{ ...propertyData, slug }])
      .select()
      .single();

    if (propErr) throw new Error(`Error al crear propiedad: ${propErr.message}`);

    if (imagesData && imagesData.length > 0) {
      const finalImages = imagesData.map(img => ({
        property_id: prop.id,
        image_url: img.image_url,
        is_primary: img.is_primary,
        sort_order: img.sort_order,
      }));

      const { error: imgErr } = await sb
        .from('property_images')
        .insert(finalImages);

      if (imgErr) throw new Error(`Error al guardar imágenes: ${imgErr.message}`);
    }

    const fullProp = await this.getPropertyById(prop.id);
    return fullProp || (prop as Property);
  },

  async updateProperty(
    id: string,
    propertyData: Partial<Omit<Property, 'id' | 'created_at' | 'updated_at' | 'images'>>,
    imagesData?: Omit<PropertyImage, 'id' | 'property_id'>[]
  ): Promise<Property> {
    const sb = await getAdminClient();  if (!sb) throw new Error('Supabase no está configurado');

    const nowStr = new Date().toISOString();

    const { error: propErr } = await sb
      .from('properties')
      .update({ ...propertyData, updated_at: nowStr })
      .eq('id', id);

    if (propErr) throw new Error(`Error al actualizar propiedad: ${propErr.message}`);

    if (imagesData) {
      const { error: delErr } = await sb
        .from('property_images')
        .delete()
        .eq('property_id', id);
      if (delErr) throw new Error(`Error al reemplazar imágenes: ${delErr.message}`);

      if (imagesData.length > 0) {
        const { error: insErr } = await sb
          .from('property_images')
          .insert(imagesData.map(img => ({
            property_id: id,
            image_url: img.image_url,
            is_primary: img.is_primary,
            sort_order: img.sort_order,
          })));
        if (insErr) throw new Error(`Error al insertar imágenes: ${insErr.message}`);
      }
    }

    const updated = await this.getPropertyById(id);
    if (!updated) throw new Error('Propiedad no encontrada después de actualizar');
    return updated;
  },

  async deleteProperty(id: string): Promise<boolean> {
    const sb = await getAdminClient();  if (!sb) throw new Error('Supabase no está configurado');

    const { error } = await sb
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error al eliminar propiedad: ${error.message}`);
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
    const sb = await getClient();
    if (!sb) return [];

    try {
      let query = sb
        .from('leads')
        .select('*, properties(name)');

      if (filters?.propertyId) query = query.eq('property_id', filters.propertyId);
      if (filters?.estado && filters.estado !== 'all') query = query.eq('estado', filters.estado.toLowerCase());

      if (filters?.search) {
        const q = `%${filters.search.toLowerCase()}%`;
        query = query.or(`nombre.ilike.${q},email.ilike.${q}`);
      }

      query = query.order('created_at', { ascending: false }).limit(500);

      const { data, error } = await query;
      if (error) {
        console.error('Supabase getLeads error:', error.message);
        return [];
      }

      return (data || []).map((l: any) => normalizeLead(l));
    } catch (err) {
      console.error('Supabase getLeads exception:', err);
      return [];
    }
  },

  async createLead(leadData: Omit<Lead, 'id' | 'created_at'>): Promise<Lead> {
    const sb = await getAdminClient();  if (!sb) throw new Error('Supabase no está configurado');

    const { data, error } = await sb
      .from('leads')
      .insert([{ ...leadData, estado: leadData.estado }])
      .select()
      .single();

    if (error) throw new Error(`Error al crear lead: ${error.message}`);
    return normalizeLead(data);
  },

  async updateLeadStatus(id: string, estado: Lead['estado']): Promise<Lead> {
    const sb = await getAdminClient();  if (!sb) throw new Error('Supabase no está configurado');

    const { data, error } = await sb
      .from('leads')
      .update({ estado })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error al actualizar estado del lead: ${error.message}`);
    return { ...data, estado: capitalizeEstado(data.estado) } as Lead;
  },

  async updateLeadObservation(id: string, observacion: string): Promise<Lead> {
    const sb = await getAdminClient();  if (!sb) throw new Error('Supabase no está configurado');

    const { data, error } = await sb
      .from('leads')
      .update({ observacion })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error al actualizar observación: ${error.message}`);
    return normalizeLead(data);
  },

  async updateLead(id: string, data: Partial<Omit<Lead, 'id' | 'created_at' | 'property_name'>>): Promise<Lead> {
    const sb = await getAdminClient();  if (!sb) throw new Error('Supabase no está configurado');

    const payload = { ...data } as any;
    // estado already in correct format (no lowercase conversion needed)

    const { data: updated, error } = await sb
      .from('leads')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error al actualizar lead: ${error.message}`);
    return normalizeLead(updated);
  },

  async deleteLead(id: string): Promise<boolean> {
    const sb = await getAdminClient();  if (!sb) throw new Error('Supabase no está configurado');

    const { error } = await sb
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error al eliminar lead: ${error.message}`);
    return true;
  },

  // --------------------------------------------------
  // Analytics Tracking
  // --------------------------------------------------
  async trackPropertyView(propertyId: string): Promise<void> {
    const sb = await getClient();
    if (!sb) return;
    try {
      await sb.from('property_views').insert([{ property_id: propertyId }]);
    } catch (err) {
      console.error('Error tracking view:', err);
    }
  },

  async trackWhatsappClick(propertyId: string): Promise<void> {
    const sb = await getClient();
    if (!sb) return;
    try {
      await sb.from('whatsapp_clicks').insert([{ property_id: propertyId }]);
    } catch (err) {
      console.error('Error tracking whatsapp click:', err);
    }
  },

  async trackBrochureDownload(propertyId: string): Promise<void> {
    const sb = await getClient();
    if (!sb) return;
    try {
      await sb.from('brochure_downloads').insert([{ property_id: propertyId }]);
    } catch (err) {
      console.error('Error tracking brochure download:', err);
    }
  },

  // --------------------------------------------------
  // Stats dashboard compilation
  // --------------------------------------------------
  async getDashboardStats(): Promise<any> {
    const sb = await getClient();
    if (!sb) {
      return {
        totalProperties: 0, activeProperties: 0, inactiveProperties: 0,
        totalLeads: 0, totalDownloads: 0, totalWhatsappClicks: 0, totalViews: 0,
        leadsByMonth: [], whatsappClicksByProject: [], downloadsByProject: [], viewsByProject: [],
      };
    }

    try {
      const [
        { data: props },
        { data: viewsList },
        { data: clicksList },
        { data: downloadsList },
        { data: leadsList },
      ] = await Promise.all([
        sb.from('properties').select('id, name, published'),
        sb.from('property_views').select('property_id').limit(5000),
        sb.from('whatsapp_clicks').select('property_id').limit(5000),
        sb.from('brochure_downloads').select('property_id').limit(5000),
        sb.from('leads').select('property_id, created_at').limit(5000),
      ]);

      const allProperties = (props || []) as any[];
      const totalProperties = allProperties.length;
      const activeProperties = allProperties.filter((p: any) => p.published).length;
      const inactiveProperties = totalProperties - activeProperties;
      const totalLeads = (leadsList || []).length;
      const totalDownloads = (downloadsList || []).length;
      const totalWhatsappClicks = (clicksList || []).length;
      const totalViews = (viewsList || []).length;

      const getCountByProperty = (items: any[]) => {
        const counts: any = {};
        items.forEach((v: any) => {
          counts[v.property_id] = (counts[v.property_id] || 0) + 1;
        });
        return Object.keys(counts).map(pid => {
          const prop = allProperties.find((p: any) => p.id === pid);
          return {
            id: pid,
            name: prop ? prop.name : 'Proyecto Eliminado',
            count: counts[pid]
          };
        }).sort((a, b) => b.count - a.count);
      };

      const leadsByMonthMap: any = {};
      (leadsList || []).forEach((l: any) => {
        const date = new Date(l.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        leadsByMonthMap[key] = (leadsByMonthMap[key] || 0) + 1;
      });
      const leadsByMonth = Object.keys(leadsByMonthMap).sort().map(key => ({
        month: key,
        count: leadsByMonthMap[key]
      }));

      return {
        totalProperties, activeProperties, inactiveProperties,
        totalLeads, totalDownloads, totalWhatsappClicks, totalViews,
        leadsByMonth,
        whatsappClicksByProject: getCountByProperty(clicksList || []),
        downloadsByProject: getCountByProperty(downloadsList || []),
        viewsByProject: getCountByProperty(viewsList || []),
      };
    } catch (err) {
      console.error('Supabase getDashboardStats error:', err);
      return {
        totalProperties: 0, activeProperties: 0, inactiveProperties: 0,
        totalLeads: 0, totalDownloads: 0, totalWhatsappClicks: 0, totalViews: 0,
        leadsByMonth: [], whatsappClicksByProject: [], downloadsByProject: [], viewsByProject: [],
      };
    }
  }
};
