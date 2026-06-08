'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Mail, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Building,
  Loader2, 
  FileText,
  Plus,
  Pencil,
  Trash2,
  X
} from 'lucide-react';
import { Lead, Property } from '@/types';
import { 
  updateLeadStatusAction, 
  updateLeadObservationAction,
  createLeadAdminAction,
  updateLeadAction,
  deleteLeadAction
} from '@/app/actions';

interface AdminLeadsListProps {
  initialLeads: Lead[];
  properties: Property[];
}

const STATUS_TABS = [
  { label: 'Todos', value: 'all' },
  { label: 'Pendientes', value: 'Pendiente' },
  { label: 'Contactados', value: 'Contactado' },
  { label: 'Visita', value: 'Visita' },
  { label: 'Papeles', value: 'Papeles' },
  { label: 'Cerrados', value: 'Cerrado' },
];

const STATUS_COLORS: Record<string, string> = {
  'Pendiente': 'bg-secondary/10 border-secondary/20 text-secondary',
  'Contactado': 'bg-primary/10 border-primary/20 text-primary',
  'Visita': 'bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]',
  'Papeles': 'bg-[#8B5CF6]/10 border-[#8B5CF6]/20 text-[#8B5CF6]',
  'Cerrado': 'bg-success/10 border-success/20 text-success',
};

type LeadFormData = {
  property_id: string;
  nombre: string;
  telefono: string;
  email: string;
  mensaje: string;
  estado: Lead['estado'];
  observacion: string;
};

const emptyForm: LeadFormData = {
  property_id: '',
  nombre: '',
  telefono: '',
  email: '',
  mensaje: '',
  estado: 'Pendiente',
  observacion: '',
};

export default function AdminLeadsList({ initialLeads, properties }: AdminLeadsListProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingObsId, setEditingObsId] = useState<string | null>(null);
  const [obsText, setObsText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState<LeadFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Auto-refresh leads data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [router]);

  const openCreateModal = () => {
    setEditingLead(null);
    setFormData(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      property_id: lead.property_id || '',
      nombre: lead.nombre,
      telefono: lead.telefono,
      email: lead.email,
      mensaje: lead.mensaje || '',
      estado: lead.estado,
      observacion: lead.observacion || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.telefono || !formData.email) {
      alert('Completa nombre, teléfono y email.');
      return;
    }
    setSaving(true);
    if (editingLead) {
      const previous = leads;
      setLeads(prev => prev.map(l => l.id === editingLead.id ? { ...l, ...formData } : l));
      setModalOpen(false);
      const result = await updateLeadAction(editingLead.id, formData);
      if (!result.success) { setLeads(previous); alert('Error: ' + (result.error || '')); }
    } else {
      const result = await createLeadAdminAction({
        ...formData,
        property_id: formData.property_id || null,
      });
      if (!result.success) { alert('Error: ' + (result.error || '')); }
      else { setLeads(prev => [result.lead!, ...prev]); }
    }
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = (lead: Lead) => {
    if (!confirm(`¿Eliminar lead de ${lead.nombre}? Esta acción no se puede deshacer.`)) return;
    const previous = leads;
    setLeads(prev => prev.filter(l => l.id !== lead.id));
    startTransition(async () => {
      const result = await deleteLeadAction(lead.id);
      if (!result.success) {
        setLeads(previous);
        alert('Error: ' + (result.error || ''));
      }
    });
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    const previous = leads;
    setLeads(prev => prev.map(l => l.id === id ? { ...l, estado: newStatus as Lead['estado'] } : l));
    startTransition(async () => {
      const result = await updateLeadStatusAction(id, newStatus as Lead['estado']);
      if (!result.success) {
        setLeads(previous);
        alert('Error al actualizar estado: ' + (result.error || ''));
      }
    });
  };

  const handleObservationSave = (id: string) => {
    const previous = leads;
    setLeads(prev => prev.map(l => l.id === id ? { ...l, observacion: obsText } : l));
    setEditingObsId(null);
    startTransition(async () => {
      const result = await updateLeadObservationAction(id, obsText);
      if (!result.success) {
        setLeads(previous);
        alert('Error: ' + (result.error || ''));
      }
    });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const filtered = leads.filter(l => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = l.nombre.toLowerCase().includes(q);
      const emailMatch = l.email.toLowerCase().includes(q);
      const phoneMatch = l.telefono.includes(q);
      const msgMatch = l.mensaje?.toLowerCase().includes(q) || false;
      const propMatch = l.property_name?.toLowerCase().includes(q) || false;
      const obsMatch = l.observacion?.toLowerCase().includes(q) || false;
      if (!nameMatch && !emailMatch && !phoneMatch && !msgMatch && !propMatch && !obsMatch) return false;
    }
    if (selectedStatus !== 'all' && l.estado !== selectedStatus) return false;
    return true;
  });

  const getCounts = () => {
    const counts: Record<string, number> = { all: leads.length };
    leads.forEach(l => { counts[l.estado] = (counts[l.estado] || 0) + 1; });
    return counts;
  };
  const counts = getCounts();

  return (
    <div className="flex flex-col gap-6">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar por cliente, email, mensaje, observación o proyecto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
          />
        </div>

        <button
          onClick={openCreateModal}
          className="h-10 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          <Plus className="h-4 w-4" />
          Nuevo Lead
        </button>
      </div>

      <div className="flex bg-muted border border-border p-1 rounded-xl w-full overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedStatus(tab.value)}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
              selectedStatus === tab.value
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}{tab.value !== 'all' ? ` (${counts[tab.value] || 0})` : ''}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {filtered.length === 0 ? (
          <div className="bg-card border border-border py-12 text-center text-xs text-muted-foreground rounded-2xl">
            No se encontraron solicitudes de contacto.
          </div>
        ) : (
          filtered.map((lead) => {
            const isBusy = isPending && updatingId === lead.id;
            return (
              <div
                key={lead.id}
                className={`bg-card border border-border p-5 rounded-2xl flex flex-col gap-4 transition-all hover:border-border/80 ${
                  isBusy ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-bold text-foreground text-sm leading-none">{lead.nombre}</span>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${STATUS_COLORS[lead.estado] || STATUS_COLORS['Pendiente']}`}>
                        {lead.estado}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(lead.created_at).toLocaleString('es-CL', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                      <Building className="h-3.5 w-3.5 shrink-0" />
                      <span>Proyecto: {lead.property_name}</span>
                    </div>

                    {lead.mensaje && (
                      <div className="bg-muted border border-border p-3 rounded-xl text-muted-foreground text-xs italic leading-relaxed">
                        &quot;{lead.mensaje}&quot;
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 pt-1">
                      <a href={`mailto:${lead.email}`} className="inline-flex h-7 items-center justify-center gap-1.5 rounded-lg bg-muted border border-border px-3 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {lead.email}
                      </a>
                      <a href={`tel:${lead.telefono}`} className="inline-flex h-7 items-center justify-center gap-1.5 rounded-lg bg-muted border border-border px-3 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {lead.telefono}
                      </a>
                      <a
                        href={`https://wa.me/${lead.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${lead.nombre}, te contacto desde PropiApp.cl en respuesta a tu solicitud de información sobre el proyecto ${lead.property_name}.`)}`}
                        target="_blank"
                        className="inline-flex h-7 items-center justify-center gap-1.5 rounded-lg bg-secondary/10 border border-secondary/20 px-3 text-[10px] font-semibold text-secondary hover:bg-secondary/20 transition-colors"
                      >
                        <MessageSquare className="h-3 w-3 text-secondary fill-current" />
                        WhatsApp
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 shrink-0 gap-3">
                    <div className="flex items-center gap-2">
                      {isBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <button onClick={() => openEditModal(lead)} className="p-1.5 rounded bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors" title="Editar lead">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(lead)} className="p-1.5 rounded bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 transition-colors" title="Eliminar lead">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                    <select
                      value={lead.estado}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      className="h-8 px-2 bg-background border border-border rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring text-foreground"
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Contactado">Contactado</option>
                      <option value="Visita">Visita</option>
                      <option value="Papeles">Papeles</option>
                      <option value="Cerrado">Cerrado</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  {editingObsId === lead.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={obsText}
                        onChange={(e) => setObsText(e.target.value)}
                        placeholder="Agregar observación..."
                        rows={2}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring resize-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingObsId(null)} className="px-3 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
                        <button onClick={() => handleObservationSave(lead.id)} className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-lg hover:bg-primary/90 transition-colors">Guardar</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingObsId(lead.id); setObsText(lead.observacion || ''); }} className="w-full flex items-center gap-2 text-left group">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                      {lead.observacion ? (
                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2">{lead.observacion}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50 group-hover:text-muted-foreground transition-colors italic">Agregar observación...</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">
                {editingLead ? 'Editar Lead' : 'Nuevo Lead'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Proyecto</label>
                <select name="property_id" value={formData.property_id} onChange={handleSelectChange} className="h-10 px-3 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring">
                  <option value="">Sin proyecto asignado</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nombre *</label>
                <input name="nombre" value={formData.nombre} onChange={handleSelectChange} placeholder="Ej: Juan Pérez" className="h-10 px-3 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Teléfono *</label>
                  <input name="telefono" value={formData.telefono} onChange={handleSelectChange} placeholder="+56912345678" className="h-10 px-3 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email *</label>
                  <input name="email" type="email" value={formData.email} onChange={handleSelectChange} placeholder="juan@example.com" className="h-10 px-3 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Estado</label>
                <select name="estado" value={formData.estado} onChange={handleSelectChange} className="h-10 px-3 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring">
                  <option value="Pendiente">Pendiente</option>
                  <option value="Contactado">Contactado</option>
                  <option value="Visita">Visita</option>
                  <option value="Papeles">Papeles</option>
                  <option value="Cerrado">Cerrado</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mensaje</label>
                <textarea name="mensaje" value={formData.mensaje} onChange={handleSelectChange} rows={3} placeholder="Mensaje del cliente..." className="px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring resize-none" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Observación interna</label>
                <textarea name="observacion" value={formData.observacion} onChange={handleSelectChange} rows={2} placeholder="Notas internas..." className="px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring resize-none" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
              <button onClick={() => setModalOpen(false)} className="h-9 px-4 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="h-9 px-5 inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-70">
                {saving ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando...</>
                ) : (
                  editingLead ? 'Guardar Cambios' : 'Crear Lead'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}