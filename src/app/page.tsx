import { db } from '@/services/db';
import Header from '@/components/Header';
import Marketplace from '@/components/Marketplace';

export const revalidate = 60; // Revalidate every minute

export default async function Home() {
  // Fetch properties on the server side
  const properties = await db.getProperties({ onlyPublished: true });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Sticky Header */}
      <Header />

      {/* Main Marketplace */}
      <div className="flex-1 flex flex-col">
        {/* Subtle quick introduction grid (highly aesthetic) */}
        <section className="bg-card pt-8 pb-2 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-xl font-bold tracking-tight text-primary font-sans sm:text-2xl">
              Proyectos Inmobiliarios Destacados
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Encuentra tu próximo hogar o inversión. Descarga brochures oficiales y contacta directamente a ejecutivos por WhatsApp en 1 click.
            </p>
          </div>
        </section>

        {/* Real-time marketplace engine */}
        <Marketplace initialProperties={properties} />
      </div>

      {/* Minimalistic Footer */}
      <footer className="border-t border-border bg-card py-6 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PropiApp.cl. Todos los derechos reservados.</p>
          <div className="flex gap-6 font-medium">
            <a href="/admin/dashboard" className="hover:text-primary transition-colors">Panel Administrador</a>
            <span className="text-border">|</span>
            <span>Santiago, Chile</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
