import { db } from '@/services/db';
import dynamic from 'next/dynamic';

const AdminLeadsList = dynamic(() => import('@/components/AdminLeadsList'), {
  loading: () => <div className="flex items-center justify-center py-20 text-xs text-muted-foreground">Cargando...</div>,
});

export const revalidate = 0;

export default async function AdminLeadsPage() {
  const [leads, properties] = await Promise.all([
    db.getLeads(),
    db.getProperties({ onlyPublished: false }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-primary font-sans sm:text-2xl">
          Leads de Contacto
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Revisa y gestiona las solicitudes de información recibidas por formulario.
        </p>
      </div>

      <AdminLeadsList initialLeads={leads} properties={properties} />
    </div>
  );
}
