import { db } from '@/services/db';
import { 
  Building2, 
  Users, 
  Download, 
  MessageSquare, 
  Eye, 
  TrendingUp, 
  CheckCircle2, 
  FileEdit 
} from 'lucide-react';

export const revalidate = 0;

export default async function AdminDashboard() {
  const stats = await db.getDashboardStats();

  const kpis = [
    {
      name: 'Total Proyectos',
      value: stats.totalProperties,
      description: `${stats.activeProperties} activos / ${stats.inactiveProperties} borradores`,
      icon: Building2,
      color: 'text-primary bg-primary/10 border-primary/20'
    },
    {
      name: 'Leads Recibidos',
      value: stats.totalLeads,
      description: 'Contactos por formulario',
      icon: Users,
      color: 'text-secondary bg-secondary/10 border-secondary/20'
    },
    {
      name: 'Clics a WhatsApp',
      value: stats.totalWhatsappClicks,
      description: 'Contactos directos a asesor',
      icon: MessageSquare,
      color: 'text-success bg-success/10 border-success/20'
    },
    {
      name: 'Descargas Brochure',
      value: stats.totalDownloads,
      description: 'Descargas de PDF',
      icon: Download,
      color: 'text-primary bg-primary/10 border-primary/20'
    },
    {
      name: 'Vistas Totales',
      value: stats.totalViews || stats.propertyViews || 0,
      description: 'Visualizaciones de proyectos',
      icon: Eye,
      color: 'text-muted-foreground bg-muted border-border'
    }
  ];

  const maxClicks = Math.max(...stats.whatsappClicksByProject.map((p: any) => p.count), 1);
  const maxDownloads = Math.max(...stats.downloadsByProject.map((p: any) => p.count), 1);
  const maxViews = Math.max(...stats.viewsByProject.map((p: any) => p.count), 1);
  const maxLeads = Math.max(...stats.leadsByMonth.map((m: any) => m.count), 1);

  return (
    <div className="flex flex-col gap-8">
      
      {/* Welcome header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-primary font-sans sm:text-2xl">
          Dashboard General
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Métricas consolidadas de conversión del Marketplace.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={i} 
              className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {kpi.name}
                </span>
                <span className={`p-1.5 rounded-lg border ${kpi.color}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-extrabold tracking-tight text-foreground font-sans">
                  {kpi.value}
                </span>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium leading-none">
                  {kpi.description}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Leads flow by month */}
        <div className="bg-card border border-border p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-secondary" />
              Flujo de Leads por Mes
            </h3>
          </div>
          
          {stats.leadsByMonth.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
              Sin datos registrados.
            </div>
          ) : (
            <div className="flex items-end gap-3 h-48 pt-6">
              {stats.leadsByMonth.map((item: any, i: number) => {
                const heightPct = (item.count / maxLeads) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-full relative group">
                      <div 
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-primary/10 hover:bg-primary border-t-2 border-primary rounded-t transition-all duration-300 min-h-[4px]"
                      />
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-card border border-border text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold text-foreground">
                        {item.count}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-sans whitespace-nowrap">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Most visited projects */}
        <div className="bg-card border border-border p-6 rounded-2xl">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 mb-6">
            <Eye className="h-3.5 w-3.5 text-primary" />
            Propiedades Más Visitadas
          </h3>
          
          <div className="space-y-4">
            {stats.viewsByProject.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">Sin registros de vistas.</div>
            ) : (
              stats.viewsByProject.slice(0, 4).map((p: any, i: number) => {
                const widthPct = (p.count / maxViews) * 100;
                return (
                  <div key={p.id} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold text-foreground">
                      <span className="truncate max-w-[280px]">{p.name}</span>
                      <span>{p.count} vistas</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border/40">
                      <div 
                        style={{ width: `${widthPct}%` }}
                        className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Clicks WhatsApp by project */}
        <div className="bg-card border border-border p-6 rounded-2xl">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 mb-6">
            <MessageSquare className="h-3.5 w-3.5 text-secondary" />
            Contactos por WhatsApp por Proyecto
          </h3>
          
          <div className="space-y-4">
            {stats.whatsappClicksByProject.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">Sin registros de clics.</div>
            ) : (
              stats.whatsappClicksByProject.slice(0, 4).map((p: any) => {
                const widthPct = (p.count / maxClicks) * 100;
                return (
                  <div key={p.id} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold text-foreground">
                      <span className="truncate max-w-[280px]">{p.name}</span>
                      <span>{p.count} clics</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border/40">
                      <div 
                        style={{ width: `${widthPct}%` }}
                        className="h-full bg-gradient-to-r from-secondary to-secondary/60 rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Brochure downloads by project */}
        <div className="bg-card border border-border p-6 rounded-2xl">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 mb-6">
            <Download className="h-3.5 w-3.5 text-primary" />
            Descargas de Brochure por Proyecto
          </h3>
          
          <div className="space-y-4">
            {stats.downloadsByProject.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">Sin descargas registradas.</div>
            ) : (
              stats.downloadsByProject.slice(0, 4).map((p: any) => {
                const widthPct = (p.count / maxDownloads) * 100;
                return (
                  <div key={p.id} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold text-foreground">
                      <span className="truncate max-w-[280px]">{p.name}</span>
                      <span>{p.count} descargas</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border/40">
                      <div 
                        style={{ width: `${widthPct}%` }}
                        className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </section>
    </div>
  );
}
