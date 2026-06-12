'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { COMUNAS, COMUNA_COORDS } from '@/lib/comunas';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Upload, 
  Trash2, 
  Star, 
  Building2, 
  ShieldCheck,
  User, 
  Image as ImageIcon,
  Send,
  Loader2,
  FileText,
  Expand,
  X,
  MapPin,
} from 'lucide-react';
import { Property, PropertyImage } from '@/types';
import { createPropertyAction, updatePropertyAction, uploadToImgbb } from '@/app/actions';
import LocationPicker from './LocationPicker';

interface PropertyWizardProps {
  property?: Property;
}

const AMENITY_OPTIONS = [
  'Piscina',
  'Gimnasio',
  'Quincho',
  'Coworking',
  'Lavandería',
  'Sala Multiuso',
  'Bicicletero',
  'Estacionamiento de visitas',
  'Seguridad 24/7',
  'Juegos',
];

export default function PropertyWizard({ property }: PropertyWizardProps) {
  const router = useRouter();
  const isEditMode = !!property;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [name, setName] = useState(property?.name || '');
  const [comuna, setComuna] = useState(property?.comuna || '');
  const [tipologia, setTipologia] = useState(property?.tipologia || 'Departamento');
  const [precioDesdeUf, setPrecioDesdeUf] = useState<number | ''>(property?.precio_desde_uf || '');
  const [dormitorios, setDormitorios] = useState<number | ''>(property?.dormitorios || '');
  const [banos, setBanos] = useState<number | ''>(property?.banos || '');
  const [descripcion, setDescripcion] = useState(property?.descripcion || '');

  const [bonoPie, setBonoPie] = useState<number | ''>(property?.bono_pie ?? '');
  const [entregaInmediata, setEntregaInmediata] = useState(property?.entrega_inmediata ?? false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(property?.amenidades || []);

  const [ejecutivoNombre, setEjecutivoNombre] = useState(property?.ejecutivo_nombre || '');
  const [ejecutivoCargo, setEjecutivoCargo] = useState(property?.ejecutivo_cargo || '');
  const [ejecutivoWhatsapp, setEjecutivoWhatsapp] = useState(property?.ejecutivo_whatsapp || '');
  const [ejecutivoEmail, setEjecutivoEmail] = useState(property?.ejecutivo_email || '');

  const [images, setImages] = useState<Omit<PropertyImage, 'id' | 'property_id'>[]>(
    property?.images?.map(img => ({
      image_url: img.image_url,
      is_primary: img.is_primary,
      sort_order: img.sort_order
    })) || []
  );
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [lat, setLat] = useState<number | undefined>(property?.lat);
  const [lng, setLng] = useState<number | undefined>(property?.lng);

  const [published, setPublished] = useState(property?.published ?? false);

  const handleToggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput) return;
    const isPrimary = images.length === 0;
    setImages([
      ...images,
      {
        image_url: imageUrlInput,
        is_primary: isPrimary,
        sort_order: images.length
      }
    ]);
    setImageUrlInput('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setErrorMsg('');
    const uploaded: { image_url: string; is_primary: boolean; sort_order: number }[] = [];
    let hasError = false;

    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const result = await uploadToImgbb(base64, file.name);
        if (!result.success || !result.url) {
          hasError = true;
          continue;
        }

        uploaded.push({
          image_url: result.url,
          is_primary: false,
          sort_order: images.length + uploaded.length,
        });
      } catch {
        hasError = true;
      }
    }

    if (uploaded.length > 0) {
      const firstIndex = images.length;
      setImages(prev => {
        const updated = [...prev, ...uploaded];
        if (updated.length > 0 && !updated.some(i => i.is_primary)) {
          updated[0].is_primary = true;
        }
        return updated;
      });
    }

    if (hasError && uploaded.length === 0) {
      setErrorMsg('Error al subir imágenes. Verifica tu conexión.');
    } else if (hasError) {
      setErrorMsg(`Se subieron ${uploaded.length} de ${files.length} imágenes.`);
    }

    setLoading(false);
  };

  const setPrimaryImage = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      is_primary: i === index
    }));
    setImages(updated);
  };

  const removeImage = (index: number) => {
    const isPrimaryRemoved = images[index].is_primary;
    let updated = images.filter((_, i) => i !== index);
    
    if (isPrimaryRemoved && updated.length > 0) {
      updated[0].is_primary = true;
    }
    
    updated = updated.map((img, i) => ({
      ...img,
      sort_order: i
    }));
    
    setImages(updated);
  };

  const validateStep = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!name) return 'Ingresa el nombre del proyecto.';
      if (!comuna) return 'Ingresa la comuna.';
      if (precioDesdeUf === '' || precioDesdeUf <= 0) return 'Ingresa un precio en UF válido.';
      if (dormitorios === '' || dormitorios < 0) return 'Ingresa un número de dormitorios.';
      if (banos === '' || banos < 1) return 'Selecciona la cantidad de baños.';
    }
    if (currentStep === 3) {
      if (!ejecutivoNombre) return 'Ingresa el nombre del ejecutivo.';
      if (!ejecutivoWhatsapp) return 'Ingresa el WhatsApp del ejecutivo.';
      if (!ejecutivoEmail) return 'Ingresa el correo del ejecutivo.';
    }
    if (currentStep === 5) {
      if (images.length === 0) return 'Debes agregar al menos una fotografía para el proyecto.';
      if (!images.some(img => img.is_primary)) return 'Debes marcar una imagen como principal.';
    }
    return '';
  };

  const handleNextStep = () => {
    const error = validateStep();
    if (error) {
      setErrorMsg(error);
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setErrorMsg('');
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg('');

    const propertyData = {
      name,
      slug: property?.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      comuna,
      tipologia,
      precio_desde_uf: Number(precioDesdeUf),
      dormitorios: Number(dormitorios),
      banos: Number(banos),
      bono_pie: bonoPie === '' ? 0 : Number(bonoPie),
      entrega_inmediata: entregaInmediata,
      descripcion,
      amenidades: selectedAmenities,
      ejecutivo_nombre: ejecutivoNombre,
      ejecutivo_cargo: ejecutivoCargo,
      ejecutivo_whatsapp: ejecutivoWhatsapp,
      ejecutivo_email: ejecutivoEmail,
      brochure_url: '',
      lat: lat ?? undefined,
      lng: lng ?? undefined,
      featured: property?.featured || false,
      published,
    };

    try {
      let result;
      if (isEditMode && property) {
        result = await updatePropertyAction(property.id, propertyData, images);
      } else {
        result = await createPropertyAction(propertyData, images);
      }

      if (result.success) {
        router.push('/admin/propiedades');
      } else {
        setErrorMsg(result.error || 'Ocurrió un error al guardar los datos.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      
      <div>
        <Link 
          href="/admin/propiedades"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a Propiedades
        </Link>
      </div>

      <div className="bg-card border border-border p-4 rounded-2xl">
        <div className="flex items-center justify-between">
          {[
            { step: 1, label: 'Básico', icon: Building2 },
            { step: 2, label: 'Beneficios', icon: ShieldCheck },
            { step: 3, label: 'Ejecutivo', icon: User },
            { step: 4, label: 'Mapa', icon: MapPin },
            { step: 5, label: 'Multimedia', icon: ImageIcon },
            { step: 6, label: 'Publicación', icon: Send },
          ].map((item) => {
            const Icon = item.icon;
            const isCompleted = currentStep > item.step;
            const isCurrent = currentStep === item.step;
            
            return (
              <div key={item.step} className="flex flex-col items-center gap-1.5 flex-1 relative group">
                <span className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all ${
                  isCompleted 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : isCurrent 
                      ? 'bg-foreground border-foreground text-background shadow' 
                      : 'bg-muted border-border text-muted-foreground'
                }`}>
                  {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider hidden md:inline ${
                  isCurrent ? 'text-foreground font-extrabold' : 'text-muted-foreground font-semibold'
                }`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="text-xs font-medium text-destructive bg-destructive/10 p-3.5 rounded-xl border border-destructive/30">
          {errorMsg}
        </div>
      )}

      <div className="bg-card border border-border p-6 rounded-2xl shadow-xl flex flex-col gap-6">
        
        {/* --- STEP 1: BASIC INFO --- */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Paso 1: Información Básica</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Define los aspectos principales del proyecto inmobiliario.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nombre del Proyecto *</label>
              <input
                type="text"
                required
                placeholder="Ej: Edificio Parque Bustamante"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 px-3 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Comuna *</label>
                <select
                  required
                  value={comuna}
                  onChange={(e) => setComuna(e.target.value)}
                  className="h-10 px-3 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                >
                  <option value="">Seleccionar comuna</option>
                  {COMUNAS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tipología *</label>
                <select
                  value={tipologia}
                  onChange={(e) => setTipologia(e.target.value)}
                  className="h-10 px-3 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                >
                  <option value="Departamento">Departamento</option>
                  <option value="Casa">Casa</option>
                  <option value="Oficina">Oficina</option>
                  <option value="Sitio">Sitio</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Precio Desde (UF) *</label>
                <input
                  type="number"
                  required
                  placeholder="Ej: 3200"
                  value={precioDesdeUf}
                  onChange={(e) => setPrecioDesdeUf(e.target.value === '' ? '' : Number(e.target.value))}
                  className="h-10 px-3 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Dormitorios *</label>
                <select
                  value={dormitorios}
                  onChange={(e) => setDormitorios(e.target.value === '' ? '' : Number(e.target.value))}
                  className="h-10 px-3 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                >
                  <option value="">Seleccionar</option>
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Dormitorio' : 'Dormitorios'}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Baños *</label>
                <select
                  value={banos}
                  onChange={(e) => setBanos(e.target.value === '' ? '' : Number(e.target.value))}
                  className="h-10 px-3 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                >
                  <option value="">Seleccionar</option>
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Baño' : 'Baños'}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Descripción del Proyecto</label>
              <textarea
                rows={4}
                placeholder="Escribe detalles del proyecto, ubicación, cercanías, etc."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="p-3 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring resize-none"
              />
            </div>
          </div>
        )}

        {/* --- STEP 2: BENEFITS & AMENITIES --- */}
        {currentStep === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Paso 2: Beneficios y Amenidades</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Selecciona los ganchos comerciales y el equipamiento.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Bono Pie (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0"
                    value={bonoPie}
                    onChange={(e) => setBonoPie(e.target.value === '' ? '' : Number(e.target.value))}
                    className="h-10 px-3 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring w-full"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">Porcentaje de bono pie (0 = sin bono).</span>
              </div>

              <div className="flex flex-col gap-1.5 justify-end">
                <label className="flex items-center justify-between p-4 bg-muted border border-border rounded-xl cursor-pointer select-none">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">Entrega Inmediata</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Destaca que está listo para entrega.</span>
                </div>
                <input
                  type="checkbox"
                  checked={entregaInmediata}
                  onChange={(e) => setEntregaInmediata(e.target.checked)}
                  className="h-5 w-5 rounded border-border text-primary focus:ring-ring bg-background accent-primary"
                />
              </label>
            </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Amenidades del Condominio</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-muted border border-border p-4 rounded-xl">
                {AMENITY_OPTIONS.map((amenity) => {
                  const isChecked = selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => handleToggleAmenity(amenity)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-left text-[11px] font-medium transition-colors border ${
                        isChecked 
                          ? 'bg-primary/10 border-primary/30 text-primary' 
                          : 'bg-background/40 border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <span className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 ${
                        isChecked ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'
                      }`}>
                        {isChecked && <Check className="h-2.5 w-2.5" />}
                      </span>
                      <span className="truncate">{amenity}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* --- STEP 3: EXECUTIVE ASSIGNMENT --- */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Paso 3: Ejecutivo Asignado</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Define los datos de contacto directos para WhatsApp y correo.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nombre del Asesor Comercial *</label>
              <input
                type="text"
                required
                placeholder="Ej: Mariela Silva"
                value={ejecutivoNombre}
                onChange={(e) => setEjecutivoNombre(e.target.value)}
                className="h-10 px-3 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cargo / Rol</label>
              <input
                type="text"
                placeholder="Ej: Asesor Comercial Senior"
                value={ejecutivoCargo}
                onChange={(e) => setEjecutivoCargo(e.target.value)}
                className="h-10 px-3 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">WhatsApp (ej: +56912345678) *</label>
                <input
                  type="text"
                  required
                  placeholder="+56912345678"
                  value={ejecutivoWhatsapp}
                  onChange={(e) => setEjecutivoWhatsapp(e.target.value)}
                  className="h-10 px-3 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="ejecutivo@propiapp.cl"
                  value={ejecutivoEmail}
                  onChange={(e) => setEjecutivoEmail(e.target.value)}
                  className="h-10 px-3 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                />
              </div>
            </div>
          </div>
        )}

        {/* --- STEP 4: MAP --- */}
        {currentStep === 4 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Paso 4: Ubicación en el Mapa</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Busca una dirección o arrastra el marcador para ubicar el proyecto.</p>
            </div>

            <div className="bg-card border border-border p-4 rounded-xl flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Comuna seleccionada: <strong className="text-foreground">{comuna || 'No seleccionada'}</strong></span>
              </div>

              <LocationPicker
                comuna={comuna}
                initialLat={lat}
                initialLng={lng}
                onLocationChange={(newLat, newLng) => {
                  setLat(newLat);
                  setLng(newLng);
                }}
              />
            </div>
          </div>
        )}

        {/* --- STEP 5: MULTIMEDIA & BROCHURE --- */}
        {currentStep === 5 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Paso 5: Archivos y Galería</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Carga las fotografías del proyecto y el brochure comercial.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Brochure</label>
              <div className="bg-muted border border-border p-4 rounded-xl">
                <span className="text-[11px] text-muted-foreground">
                  El brochure se genera automáticamente con las fotos e información del proyecto al crear la propiedad. Los clientes podrán descargarlo en PDF desde la página del proyecto.
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-3 border-t border-border">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Galería de Imágenes *</label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Pega URL de imagen (ej: Unsplash)"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1 h-9 px-3 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="h-9 px-4 bg-muted border border-border hover:bg-accent rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Agregar URL
                </button>
                <label className="h-9 px-4 bg-muted border border-border hover:bg-accent rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  Subir Fotos
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e)}
                  />
                </label>
              </div>

              {images.length === 0 ? (
                <div className="h-32 border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground text-xs gap-1.5 bg-muted/20">
                  <ImageIcon className="h-6 w-6 text-border" />
                  <span>No has agregado imágenes todavía.</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {images.map((img, i) => (
                    <div 
                      key={i} 
                      className="group relative aspect-[4/3] rounded-lg overflow-hidden border border-border bg-muted"
                    >
                      <img
                        src={img.image_url}
                        alt={`Subida ${i}`}
                        className="h-full w-full object-cover"
                      />
                      
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewImage(img.image_url)}
                          className="p-1.5 rounded bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          title="Vista previa"
                        >
                          <Expand className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(i)}
                          className={`p-1.5 rounded transition-colors ${
                            img.is_primary 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted hover:bg-accent text-muted-foreground hover:text-foreground'
                          }`}
                          title={img.is_primary ? 'Imagen Principal' : 'Definir como principal'}
                        >
                          <Star className={`h-3.5 w-3.5 ${img.is_primary ? 'fill-current' : ''}`} />
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="p-1.5 rounded bg-destructive/20 hover:bg-destructive/40 text-destructive transition-colors"
                          title="Eliminar imagen"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {img.is_primary && (
                        <span className="absolute top-1.5 left-1.5 text-[8px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                          Principal
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {previewImage && (
                <div
                  className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                  onClick={() => setPreviewImage(null)}
                >
                  <button
                    onClick={() => setPreviewImage(null)}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                  <img
                    src={previewImage}
                    alt="Vista previa"
                    className="max-w-full max-h-[90vh] object-contain rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- STEP 6: REVIEW & PUBLICATION --- */}
        {currentStep === 6 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Paso 6: Publicación y Estado</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Revisa el resumen y define si guardas en borrador o publicas ahora.</p>
            </div>

            <div className="bg-muted border border-border p-4 rounded-xl text-xs space-y-3.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Resumen del Proyecto</span>
              
              <div className="grid grid-cols-2 gap-4 border-b border-border pb-3">
                <div>
                  <span className="text-muted-foreground font-medium block">Proyecto:</span>
                  <span className="font-bold text-foreground mt-0.5 block">{name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium block">Ubicación y Tipo:</span>
                  <span className="font-bold text-foreground mt-0.5 block">{tipologia} en {comuna}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-border pb-3">
                <div>
                  <span className="text-muted-foreground font-medium block">Precio UF:</span>
                  <span className="font-extrabold text-foreground mt-0.5 block">
                    UF {new Intl.NumberFormat('es-CL').format(Number(precioDesdeUf) || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium block">Distribución:</span>
                  <span className="font-bold text-foreground mt-0.5 block">{dormitorios} Dormitorios, {banos} Baños</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-1">
                <div>
                  <span className="text-muted-foreground font-medium block">Ejecutivo:</span>
                  <span className="font-bold text-foreground mt-0.5 block">{ejecutivoNombre}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium block">Medios:</span>
                  <span className="font-bold text-foreground mt-0.5 block">{images.length} Fotos / PDF cargado</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Estado de publicación</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer select-none transition-colors ${
                  !published 
                    ? 'bg-muted border-border' 
                    : 'bg-background/40 border-border hover:bg-muted text-muted-foreground'
                }`}>
                  <input
                    type="radio"
                    name="pub_status"
                    checked={!published}
                    onChange={() => setPublished(false)}
                    className="h-4 w-4 border-border text-primary focus:ring-ring bg-background accent-primary"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">Guardar como Borrador</span>
                    <span className="text-[9px] text-muted-foreground mt-0.5">El proyecto no estará visible públicamente.</span>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer select-none transition-colors ${
                  published 
                    ? 'bg-primary/10 border-primary/30' 
                    : 'bg-background/40 border-border hover:bg-muted text-muted-foreground'
                }`}>
                  <input
                    type="radio"
                    name="pub_status"
                    checked={published}
                    onChange={() => setPublished(true)}
                    className="h-4 w-4 border-border text-primary focus:ring-ring bg-background accent-primary"
                  />
                  <div className="flex flex-col">
                    <span className={`text-xs font-bold ${published ? 'text-primary' : 'text-foreground'}`}>Publicar Ahora</span>
                    <span className="text-[9px] text-muted-foreground mt-0.5">El proyecto se mostrará en el listado del sitio web.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* --- NAVIGATION FOOTER BUTTONS --- */}
        <div className="flex items-center justify-between pt-6 border-t border-border mt-4">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 1 || loading}
            className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-all text-xs font-semibold disabled:opacity-50 disabled:pointer-events-none"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Anterior
          </button>

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 active:scale-[0.98] transition-all"
            >
              Siguiente
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="h-9 px-5 inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  {isEditMode ? 'Guardar Cambios' : 'Crear Proyecto'}
                  <Check className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
