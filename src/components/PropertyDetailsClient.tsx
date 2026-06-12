'use client';

import { useEffect, useState } from 'react';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Download, 
  Check, 
  Loader2, 
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import PropertyMap from './PropertyMap';
import { Property } from '@/types';
import { 
  trackViewAction, 
  trackWhatsappClickAction, 
  trackBrochureDownloadAction, 
  createLeadAction 
} from '@/app/actions';

interface PropertyDetailsClientProps {
  property: Property;
}

export default function PropertyDetailsClient({ property }: PropertyDetailsClientProps) {
  // Statistics tracking on mount
  useEffect(() => {
    trackViewAction(property.id);
  }, [property.id]);

  // Lead Form States
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState(`Hola, me interesa el proyecto ${property.name} en ${property.comuna}. Solicito más información.`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  // Brochure Download State
  const [isDownloading, setIsDownloading] = useState(false);

  // WhatsApp Click Handler
  const handleWhatsappClick = async () => {
    // Increment DB count
    await trackWhatsappClickAction(property.id);

    // Pre-filled message format
    const text = `Hola.\nMe interesa el proyecto ${property.name}.\nComuna: ${property.comuna}.\nPrecio desde UF ${new Intl.NumberFormat('es-CL').format(property.precio_desde_uf)}.\n¿Podrían enviarme más información?`;
    
    // Format WhatsApp phone number (strip spaces, symbols)
    const cleanNumber = property.ejecutivo_whatsapp.replace(/[^0-9+]/g, '');
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
    
    window.open(url, '_blank');
  };

  // Brochure Download Handler
  const handleBrochureDownload = () => {
    setIsDownloading(true);
    // Increment DB count (fire and forget)
    trackBrochureDownloadAction(property.id);

    // Open generated PDF via API route
    window.open(`/api/brochure/${property.id}`, '_blank');

    setTimeout(() => {
      setIsDownloading(false);
    }, 1500);
  };

  // Form Submit Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !telefono || !email) {
      setFormError('Por favor completa todos los campos requeridos.');
      return;
    }
    
    setFormError('');
    setIsSubmitting(true);

    try {
      const response = await createLeadAction({
        property_id: property.id,
        nombre,
        telefono,
        email,
        mensaje,
        estado: 'Pendiente'
      });

      if (response.success) {
        setIsSubmitted(true);
      } else {
        setFormError('Ocurrió un error al enviar el formulario. Intenta nuevamente.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Error de red. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Columns: Brochure & Description & Map */}
      <div className="lg:col-span-2 flex flex-col gap-8">
        
        {/* Quick action buttons row (Mobile prominent) */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleWhatsappClick}
            className="flex-1 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-success text-success-foreground px-6 text-sm font-semibold shadow-sm hover:bg-success/95 active:scale-[0.98] transition-all"
          >
            <MessageSquare className="h-5 w-5 fill-current" />
            Hablar con Asesor
          </button>
          
          <button
            onClick={handleBrochureDownload}
            disabled={isDownloading}
            className="flex-1 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 text-sm font-semibold shadow-sm hover:bg-primary/95 active:scale-[0.98] transition-all disabled:opacity-70"
          >
            {isDownloading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            Descargar Brochure
          </button>
        </div>

        {/* Description */}
        <div className="bg-card border border-border p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-primary mb-3 font-sans">Sobre el proyecto</h2>
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line font-sans">
            {property.descripcion || 'No hay descripción disponible para este proyecto.'}
          </p>
        </div>

        {/* Amenities */}
        {property.amenidades && property.amenidades.length > 0 && (
          <div className="bg-card border border-border p-6 rounded-2xl">
            <h2 className="text-lg font-bold text-primary mb-4 font-sans">Equipamiento y Amenidades</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {property.amenidades.map((amenity, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-medium text-foreground bg-muted px-3.5 py-2.5 rounded-lg border border-border/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <PropertyMap comuna={property.comuna} propertyName={property.name} lat={property.lat} lng={property.lng} />
      </div>

      {/* Right Column: Contact & Executive Sticky Widget */}
      <div className="flex flex-col gap-6">
        
        {/* Executive Profile Widget */}
        <div className="bg-card border border-border p-6 rounded-2xl">
          <span className="text-[9px] uppercase tracking-wider font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded">Asesor Asignado</span>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="h-12 w-12 rounded-full bg-primary/5 text-primary border border-primary/10 flex items-center justify-center font-bold text-lg font-sans">
              {property.ejecutivo_nombre?.[0] || 'A'}
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground leading-snug">{property.ejecutivo_nombre || 'Asesor Comercial'}</h3>
              <p className="text-xs text-muted-foreground">{property.ejecutivo_cargo || 'Ejecutivo de Proyectos'}</p>
            </div>
          </div>

          <div className="mt-5 space-y-3 pt-4 border-t border-border/60">
            <button 
              onClick={handleWhatsappClick}
              className="flex items-center gap-3 text-xs font-semibold text-muted-foreground hover:text-success transition-colors w-full text-left"
            >
              <span className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center border border-border text-success">
                <Phone className="h-3.5 w-3.5" />
              </span>
              <span>{property.ejecutivo_whatsapp}</span>
            </button>
            <a 
              href={`mailto:${property.ejecutivo_email}`} 
              className="flex items-center gap-3 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors w-full"
            >
              <span className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                <Mail className="h-3.5 w-3.5" />
              </span>
              <span className="truncate">{property.ejecutivo_email}</span>
            </a>
          </div>
        </div>

        {/* Lead Form Widget */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          {isSubmitted ? (
            <div className="flex flex-col items-center justify-center text-center py-6">
              <span className="h-12 w-12 rounded-full bg-success/10 text-success flex items-center justify-center mb-4 border border-success/20">
                <Check className="h-6 w-6" />
              </span>
              <h3 className="text-base font-bold text-primary">¡Solicitud recibida!</h3>
              <p className="text-xs text-muted-foreground mt-2 max-w-[200px]">
                Hemos enviado tus datos a <strong>{property.ejecutivo_nombre}</strong>. Te contactaremos a la brevedad.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="mt-6 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline"
              >
                Enviar otra solicitud
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-primary font-sans flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-secondary fill-secondary/20" />
                  Solicitar Información
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Completa el formulario y el asesor se comunicará contigo vía email o llamada.
                </p>
              </div>

              {formError && (
                <div className="text-[11px] font-medium text-destructive bg-destructive/5 p-2.5 rounded-lg border border-destructive/20">
                  {formError}
                </div>
              )}

              {/* Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="h-9 px-3 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Teléfono *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: +56912345678"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="h-9 px-3 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="Ej: juan@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 px-3 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Mensaje</label>
                <textarea
                  rows={3}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  className="px-3 py-2 bg-muted border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow hover:bg-primary/95 active:scale-[0.98] transition-all disabled:opacity-75"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Solicitud'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
