import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ChevronLeft, MapPin, Bed, Building2, Percent, Calendar, Image as ImageIcon } from 'lucide-react';
import { db } from '@/services/db';
import Header from '@/components/Header';
import PropertyCard from '@/components/PropertyCard';
import PropertyDetailsClient from '@/components/PropertyDetailsClient';

export const dynamic = 'force-static';
export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const properties = await db.getProperties({ onlyPublished: true });
    return properties.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
} = await import('@/services/db');
    const properties = await db.getProperties({ onlyPublished: true });
    return properties.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Dynamic SEO metadata generation
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const property = await db.getPropertyBySlug(resolvedParams.slug);
  
  if (!property) {
    return {
      title: 'Proyecto no encontrado - PropiApp.cl',
    };
  }

  const cleanPrice = new Intl.NumberFormat('es-CL').format(property.precio_desde_uf);
  const title = `Proyecto ${property.name} desde UF ${cleanPrice} | PropiApp.cl`;
  const description = `Conoce el proyecto ${property.name} en la comuna de ${property.comuna}. ${property.descripcion?.substring(0, 140)}...`;

  const primaryImage = property.images?.find(img => img.is_primary)?.image_url 
    || property.images?.[0]?.image_url 
    || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: primaryImage }],
      type: 'website',
      url: `https://propiapp.cl/propiedades/${property.slug}`
    }
  };
}

export default async function PropertyPage({ params }: PageProps) {
  const resolvedParams = await params;
  const property = await db.getPropertyBySlug(resolvedParams.slug);

  if (!property) {
    notFound();
  }

  // Format currency
  const formatUF = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const relatedProperties = await db.getRelatedProperties(
    property.id,
    property.comuna,
    property.tipologia,
    3
  );

  // Gallery calculations
  const images = property.images || [];
  const primaryImg = images.find(img => img.is_primary) || images[0];
  const secondaryImgs = images.filter(img => img.id !== primaryImg?.id);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Global Header */}
      <Header />

      {/* Back navigation */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <Link 
            href="/" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver al listado
          </Link>
        </div>
      </div>

      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Title & Specs summary header */}
        <section className="mb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="inline-flex rounded-full bg-primary/5 border border-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase">
                  {property.tipologia}
                </span>
                {property.entrega_inmediata && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 border border-success/20 px-2.5 py-0.5 text-[10px] font-bold text-success">
                    <Calendar className="h-3 w-3" />
                    Entrega Inmediata
                  </span>
                )}
                {property.bono_pie > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 border border-secondary/20 px-2.5 py-0.5 text-[10px] font-bold text-secondary">
                    Bono Pie {property.bono_pie}%
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-primary font-sans sm:text-3xl">
                {property.name}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5 font-medium">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{property.comuna}, Santiago, Chile</span>
              </div>
            </div>

            <div className="flex flex-col md:items-end">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold leading-none">Precio desde</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-primary font-sans mt-1">
                UF {formatUF(property.precio_desde_uf)}
              </span>
            </div>
          </div>
        </section>

        {/* Photogallery Layout */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {images.length === 0 ? (
            <div className="relative aspect-video w-full bg-muted flex items-center justify-center text-muted-foreground">
              Sin imágenes cargadas.
            </div>
          ) : images.length === 1 || secondaryImgs.length === 0 ? (
            <div className="relative aspect-[21/9] w-full bg-muted">
              <Image
                src={primaryImg.image_url}
                alt={property.name}
                fill
                priority
                className="object-cover"
                sizes="(max-w-7xl) 100vw"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* Primary large image (left/main) */}
              <div className="relative aspect-video md:aspect-auto md:h-[420px] md:col-span-2 overflow-hidden bg-muted">
                <Image
                  src={primaryImg.image_url}
                  alt={`${property.name} Principal`}
                  fill
                  priority
                  className="object-cover hover:scale-101 transition-transform duration-300"
                  sizes="(max-w-7xl) 66vw"
                />
              </div>
              
              {/* Secondary stacked images (right side) */}
              <div className="grid grid-cols-2 md:grid-cols-1 gap-2 max-h-[420px] overflow-y-auto">
                {secondaryImgs.map((img, i) => (
                  <div key={img.id} className="relative aspect-video overflow-hidden bg-muted rounded-md">
                    <Image
                      src={img.image_url}
                      alt={`${property.name} Galería ${i + 1}`}
                      fill
                      className="object-cover hover:scale-102 transition-transform duration-300"
                      sizes="(max-w-7xl) 33vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {images.length > 3 && (
            <div className="flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold text-muted-foreground border-t border-border bg-muted/30">
              <ImageIcon className="h-3.5 w-3.5" />
              {images.length} fotos en total
            </div>
          )}
        </section>

        {/* Specifications quick summary bar */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-card border border-border p-5 rounded-2xl mb-8">
          <div className="flex flex-col p-2.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Comuna</span>
            <span className="text-sm font-bold text-foreground mt-1.5 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-secondary" />
              {property.comuna}
            </span>
          </div>
          <div className="flex flex-col p-2.5 border-l border-border/50">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Tipología</span>
            <span className="text-sm font-bold text-foreground mt-1.5 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-secondary" />
              {property.tipologia}
            </span>
          </div>
          <div className="flex flex-col p-2.5 border-l border-border/50">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Distribución</span>
            <span className="text-sm font-bold text-foreground mt-1.5 flex items-center gap-1.5">
              <Bed className="h-4 w-4 text-secondary" />
              {property.dormitorios} {property.dormitorios === 1 ? 'Dormitorio' : 'Dormitorios'}
            </span>
          </div>
          <div className="flex flex-col p-2.5 border-l border-border/50">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Bono Pie</span>
            <span className="text-sm font-bold text-foreground mt-1.5 flex items-center gap-1.5">
              <Percent className="h-4 w-4 text-secondary" />
              {property.bono_pie > 0 ? `${property.bono_pie}%` : 'No Disponible'}
            </span>
          </div>
        </section>

        {/* Client Interactive Area (Details, executive, brochure, contact form) */}
        <PropertyDetailsClient property={property} />

        {/* Related properties section */}
        {relatedProperties.length > 0 && (
          <section className="mt-16 pt-10 border-t border-border">
            <h2 className="text-lg font-bold text-primary mb-6 font-sans">Proyectos similares recomendados</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProperties.map(prop => (
                <PropertyCard key={prop.id} property={prop} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6 mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} PropiApp.cl. Todos los derechos reservados.</p>
          <div className="flex gap-6 font-medium">
            <Link href="/" className="hover:text-primary transition-colors">Volver al Inicio</Link>
            <span className="text-border">|</span>
            <Link href="/admin/dashboard" className="hover:text-primary transition-colors">Panel Administrador</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
