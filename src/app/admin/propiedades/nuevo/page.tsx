import dynamic from 'next/dynamic';

const PropertyWizard = dynamic(() => import('@/components/PropertyWizard'), {
  loading: () => <div className="flex items-center justify-center py-20 text-xs text-muted-foreground">Cargando...</div>,
});

export default function NewPropertyPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-primary font-sans sm:text-2xl">
          Agregar Nuevo Proyecto
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Completa los 5 pasos del asistente para publicar o guardar un borrador.
        </p>
      </div>

      <PropertyWizard />
    </div>
  );
}
