// TypeScript definitions for PROPIAPP.CL

export interface Property {
  id: string;
  name: string;
  slug: string;
  comuna: string;
  tipologia: string; // E.g. 'Departamento', 'Casa'
  precio_desde_uf: number;
  dormitorios: number;
  bono_pie: number; // percentage 0-100 (0 = no bonus)
  entrega_inmediata: boolean;
  descripcion: string;
  amenidades: string[]; // E.g. ['Piscina', 'Gimnasio']
  ejecutivo_nombre: string;
  ejecutivo_cargo: string;
  ejecutivo_whatsapp: string;
  ejecutivo_email: string;
  brochure_url: string;
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
  images?: PropertyImage[];
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
  created_at?: string;
}

export interface Lead {
  id: string;
  property_id: string | null;
  nombre: string;
  telefono: string;
  email: string;
  mensaje: string;
  estado: 'Pendiente' | 'Contactado' | 'Visita' | 'Papeles' | 'Cerrado';
  observacion?: string;
  created_at: string;
  property_name?: string; // Joint helper for dashboard list
}

export interface BrochureDownload {
  id: string;
  property_id: string;
  downloaded_at: string;
}

export interface WhatsappClick {
  id: string;
  property_id: string;
  clicked_at: string;
}

export interface PropertyView {
  id: string;
  property_id: string;
  viewed_at: string;
}

export interface DashboardStats {
  totalProperties: number;
  activeProperties: number;
  inactiveProperties: number;
  totalLeads: number;
  totalDownloads: number;
  totalWhatsappClicks: number;
  totalViews: number;
  leadsByMonth: { month: string; count: number }[];
  whatsappClicksByProject: { id: string; name: string; count: number }[];
  downloadsByProject: { id: string; name: string; count: number }[];
  viewsByProject: { id: string; name: string; count: number }[];
}
