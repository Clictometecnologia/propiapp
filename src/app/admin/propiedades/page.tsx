import { db } from '@/services/db';
import dynamic from 'next/dynamic';

const AdminPropertiesList = dynamic(() => import('@/components/AdminPropertiesList'), {
  loading: () => <div className="flex items-center justify-center py-20 text-xs text-muted-foreground">Cargando...</div>,
});

export const revalidate = 0; // Dynamic server rendering for admin section

export default async function AdminPropertiesPage() {
  const properties = await db.getProperties({ onlyPublished: false });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-primary font-sans sm:text-2xl">
          Administrar Proyectos
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Crea, edita, duplica, elimina y publica tus proyectos inmobiliarios.
        </p>
      </div>

      <AdminPropertiesList properties={properties} />
    </div>
  );
}
