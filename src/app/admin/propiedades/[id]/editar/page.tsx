import { notFound } from 'next/navigation';
import { db } from '@/services/db';
import dynamic from 'next/dynamic';

const PropertyWizard = dynamic(() => import('@/components/PropertyWizard'), {
  loading: () => <div className="flex items-center justify-center py-20 text-xs text-muted-foreground">Cargando...</div>,
});

interface EditPropertyPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPropertyPage({ params }: EditPropertyPageProps) {
  const resolvedParams = await params;
  const property = await db.getPropertyById(resolvedParams.id);

  if (!property) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-primary font-sans sm:text-2xl">
          Editar Proyecto
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Modifica los detalles del proyecto. Recuerda guardar los cambios al finalizar.
        </p>
      </div>

      <PropertyWizard property={property} />
    </div>
  );
}
