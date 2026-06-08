import { db } from '@/services/db';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  MessageSquare, 
  Download, 
  Users 
} from 'lucide-react';

export const revalidate = 0;

export default async function AdminEstadisticasPage() {
  const properties = await db.getProperties({ onlyPublished: false });
  const stats = await db.getDashboardStats();
  const leads = await db.getLeads();

  const projectStats = properties.map(prop => {
    const views = stats.viewsByProject.find((v: any) => v.id === prop.id)?.count || 0;
    const whatsapp = stats.whatsappClicksByProject.find((c: any) => c.id === prop.id)?.count || 0;
    const downloads = stats.downloadsByProject.find((d: any) => d.id === prop.id)?.count || 0;
    const projectLeads = leads.filter(l => l.property_id === prop.id).length;

    const totalConversions = projectLeads + whatsapp;
    const conversionRate = views > 0 ? (totalConversions / views) * 100 : 0;

    return {
      id: prop.id,
      name: prop.name,
      slug: prop.slug,
      comuna: prop.comuna,
      published: prop.published,
      views,
      whatsapp,
      downloads,
      leads: projectLeads,
      conversionRate
    };
  });

  projectStats.sort((a, b) => b.conversionRate - a.conversionRate);

  const totalViews = stats.totalViews || 0;
  const totalConversions = stats.totalLeads + stats.totalWhatsappClicks;
  const averageConversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;

  return (
    <div className="flex flex-col gap-8">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-primary font-sans sm:text-2xl">
          Estadísticas de Conversión
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Análisis del embudo de conversión y rendimiento por proyecto individual.
        </p>
      </div>

      {/* Global Conversion Card */}
      <section className="bg-card border border-border p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <span className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
            <TrendingUp className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-foreground">Tasa de Conversión Global</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Contactos totales (Leads + WhatsApp) en relación a las visitas.</p>
          </div>
        </div>
        <div className="text-right self-stretch sm:self-auto border-t sm:border-t-0 border-border pt-4 sm:pt-0">
          <span className="text-3xl sm:text-4xl font-extrabold text-primary font-sans tracking-tight">
            {averageConversionRate.toFixed(1)}%
          </span>
          <span className="text-[10px] text-muted-foreground block mt-1 font-semibold uppercase">Promedio del Sitio</span>
        </div>
      </section>

      {/* Analytics Table */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-md">
        <div className="p-5 border-b border-border bg-muted flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Métricas por Proyecto</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                <th className="py-4 px-5">Proyecto</th>
                <th className="py-4 px-5 text-center">
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    Vistas
                  </span>
                </th>
                <th className="py-4 px-5 text-center">
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    WhatsApp
                  </span>
                </th>
                <th className="py-4 px-5 text-center">
                  <span className="inline-flex items-center gap-1">
                    <Download className="h-3.5 w-3.5" />
                    Brochures
                  </span>
                </th>
                <th className="py-4 px-5 text-center">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    Leads Form
                  </span>
                </th>
                <th className="py-4 px-5 text-right">Tasa Conversión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {projectStats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No hay proyectos registrados para mostrar estadísticas.
                  </td>
                </tr>
              ) : (
                projectStats.map((item) => (
                  <tr key={item.id} className="hover:bg-muted transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground block">{item.name}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] text-muted-foreground font-semibold uppercase">{item.comuna}</span>
                          <span className="text-[10px] text-border">•</span>
                          <span className={`text-[9px] font-bold ${item.published ? 'text-secondary' : 'text-muted-foreground'}`}>
                            {item.published ? 'Publicado' : 'Borrador'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-center font-bold text-foreground font-sans">{item.views}</td>
                    <td className="py-4 px-5 text-center font-bold text-foreground font-sans">{item.whatsapp}</td>
                    <td className="py-4 px-5 text-center font-bold text-foreground font-sans">{item.downloads}</td>
                    <td className="py-4 px-5 text-center font-bold text-foreground font-sans">{item.leads}</td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="font-extrabold text-foreground font-sans text-sm">{item.conversionRate.toFixed(1)}%</span>
                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden border border-border">
                          <div 
                            style={{ width: `${Math.min(item.conversionRate, 100)}%` }}
                            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
