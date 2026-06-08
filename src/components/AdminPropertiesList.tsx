'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit2, 
  Copy, 
  Trash2,
  Loader2,
} from 'lucide-react';
import { Property } from '@/types';
import { 
  deletePropertyAction, 
  duplicatePropertyAction, 
  togglePublishAction 
} from '@/app/actions';

interface AdminPropertiesListProps {
  properties: Property[];
}

export default function AdminPropertiesList({ properties }: AdminPropertiesListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = properties.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.comuna.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTogglePublish = async (id: string, currentlyPublished: boolean) => {
    setActionId(id);
    const result = await togglePublishAction(id, !currentlyPublished);
    setActionId(null);
    if (!result.success) {
      alert('Error: ' + (result.error || 'No se pudo cambiar el estado.'));
      return;
    }
    router.refresh();
  };
  const handleDuplicate = (id: string) => {
    if (confirm('¿Estás seguro de que quieres duplicar este proyecto?')) {
      setActionId(id);
      startTransition(async () => {
        await duplicatePropertyAction(id);
        setActionId(null);
        router.refresh();
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar definitivamente este proyecto? Esta acción no se puede deshacer.')) {
      setActionId(id);
      startTransition(async () => {
        await deletePropertyAction(id);
        setActionId(null);
        router.refresh();
      });
    }
  };

  const formatUF = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="flex flex-col gap-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre o comuna..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
          />
        </div>

        <Link
          href="/admin/propiedades/nuevo"
          className="h-10 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 active:scale-[0.98] transition-all self-stretch sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Nuevo Proyecto
        </Link>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                <th className="py-4 px-5">Proyecto</th>
                <th className="py-4 px-5">Ubicación</th>
                <th className="py-4 px-5">Precio UF</th>
                <th className="py-4 px-5">Hab.</th>
                <th className="py-4 px-5">Estado</th>
                <th className="py-4 px-5">Creación</th>
                <th className="py-4 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No se encontraron proyectos. Crea uno nuevo para comenzar.
                  </td>
                </tr>
              ) : (
                filtered.map((property) => {
                  const isOperating = actionId === property.id;
                  const primaryImage = property.images?.find(img => img.is_primary)?.image_url 
                    || property.images?.[0]?.image_url 
                    || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=120&q=80';

                  return (
                    <tr 
                      key={property.id}
                      className={`hover:bg-muted transition-colors ${isOperating ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-14 rounded-lg overflow-hidden bg-muted border border-border shrink-0">
                            <Image
                              src={primaryImage}
                              alt={property.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-foreground leading-tight block">{property.name}</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5 block">{property.tipologia}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-foreground font-medium">{property.comuna}</td>

                      <td className="py-4 px-5 text-foreground font-bold font-sans">
                        UF {formatUF(property.precio_desde_uf)}
                      </td>

                      <td className="py-4 px-5 text-foreground">{property.dormitorios} {property.dormitorios === 1 ? 'hab' : 'habs'}</td>

                      <td className="py-4 px-5">
                        <button
                          onClick={() => handleTogglePublish(property.id, property.published)}
                          disabled={isOperating}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${
                            property.published ? 'bg-secondary' : 'bg-muted-foreground/30'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                              property.published ? 'translate-x-[18px]' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>

                      <td className="py-4 px-5 text-muted-foreground font-medium">
                        {new Date(property.created_at).toLocaleDateString('es-CL', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isOperating ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <Link
                                href={`/propiedades/${property.slug}`}
                                target="_blank"
                                className="p-1.5 rounded bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors"
                                title="Ver publicación pública"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                              
                              <Link
                                href={`/admin/propiedades/${property.id}/editar`}
                                className="p-1.5 rounded bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors"
                                title="Editar datos"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Link>

                              <button
                                onClick={() => handleDuplicate(property.id)}
                                className="p-1.5 rounded bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors"
                                title="Duplicar proyecto"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => handleDelete(property.id)}
                                className="p-1.5 rounded bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 transition-colors"
                                title="Eliminar proyecto"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
