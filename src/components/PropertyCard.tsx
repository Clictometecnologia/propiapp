import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Home, Bed, Calendar, MessageSquare } from 'lucide-react';
import { Property } from '@/types';

interface PropertyCardProps {
  property: Property;
}

const PropertyCard = memo(function PropertyCard({ property }: PropertyCardProps) {
  // Find primary image or use first image, or fallback
  const primaryImage = property.images?.find(img => img.is_primary)?.image_url 
    || property.images?.[0]?.image_url 
    || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80';

  // Format currency
  const formatUF = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card hover-lift transition-all duration-300">
      {/* Property Image container */}
      <Link href={`/propiedades/${property.slug}`} className="relative aspect-video w-full overflow-hidden bg-muted block">
        <Image
          src={primaryImage}
          alt={property.name}
          fill
          sizes="(max-w-7xl) 33vw, (max-w-md) 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority={property.featured}
        />
        
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {property.entrega_inmediata && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-0.5 text-xs font-semibold text-success-foreground shadow-sm">
              <Calendar className="h-3 w-3" />
              Entrega Inmediata
            </span>
          )}
          {property.bono_pie > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground shadow-sm">
              Bono Pie {property.bono_pie}%
            </span>
          )}
        </div>
        
        <div className="absolute top-3 right-3">
          <span className="inline-flex rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-xs font-medium text-white">
            {property.tipologia}
          </span>
        </div>
      </Link>

      {/* Property Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex-1">
          {/* Location */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
            <MapPin className="h-3 w-3" />
            <span>{property.comuna}</span>
          </div>

          {/* Project Name */}
          <h3 className="text-base font-semibold text-foreground tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
            {property.name}
          </h3>

          {/* Key specs */}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground border-b border-border/50 pb-3">
            <div className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{property.dormitorios} {property.dormitorios === 1 ? 'Dorm' : 'Dorms'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{property.banos} {property.banos === 1 ? 'Baño' : 'Baños'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Home className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{property.tipologia}</span>
            </div>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="flex items-end justify-between pt-4 mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Precio desde</span>
            <span className="text-lg font-bold text-foreground font-sans">
              UF {formatUF(property.precio_desde_uf)}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <a
              href={`https://wa.me/${property.ejecutivo_whatsapp.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(`Hola, me interesa el proyecto ${property.name} en ${property.comuna}. Me gustaría recibir más información.`)}`}
              target="_blank"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-success px-3 text-xs font-bold text-success-foreground shadow-sm hover:bg-success/90 active:scale-[0.98] transition-all"
            >
              <MessageSquare className="h-4 w-4 fill-current shrink-0" />
              <span className="hidden sm:inline">Hablar con Asesor</span>
            </a>
            <Link
              href={`/propiedades/${property.slug}`}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-primary bg-transparent px-4 text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-[0.98]"
            >
              Ver Proyecto
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PropertyCard;
