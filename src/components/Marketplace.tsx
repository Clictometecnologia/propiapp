'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Search, SlidersHorizontal, RotateCcw, X, Building2, Filter } from 'lucide-react';
import { Property } from '@/types';
import PropertyCard from './PropertyCard';

interface MarketplaceProps {
  initialProperties: Property[];
}

export default function Marketplace({ initialProperties }: MarketplaceProps) {
  // Debounced Search
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 250);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    setSearchQuery('');
  }, []);
  const [selectedComuna, setSelectedComuna] = useState('all');
  const [selectedTipologia, setSelectedTipologia] = useState('all');
  const [minBedrooms, setMinBedrooms] = useState<number | 'all'>('all');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [onlyEntregaInmediata, setOnlyEntregaInmediata] = useState(false);
  const [onlyBonoPie, setOnlyBonoPie] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [filterVisible, setFilterVisible] = useState(true);
  const filterScrollY = useRef(0);
  const [isMobileFilter, setIsMobileFilter] = useState(false);

  useEffect(() => {
    const check = () => setIsMobileFilter(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isMobileFilter) return;
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > filterScrollY.current && currentY > 80) {
        setFilterVisible(false);
      } else if (currentY < filterScrollY.current) {
        setFilterVisible(true);
      }
      filterScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileFilter]);

  // Dynamic Options lists compiled from data
  const comunas = useMemo(() => {
    const list = initialProperties.map(p => p.comuna);
    return ['all', ...Array.from(new Set(list))];
  }, [initialProperties]);

  const tipologias = useMemo(() => {
    const list = initialProperties.map(p => p.tipologia);
    return ['all', ...Array.from(new Set(list))];
  }, [initialProperties]);

  // Filter Logic
  const filteredProperties = useMemo(() => {
    return initialProperties.filter(property => {
      // 1. Search Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = property.name.toLowerCase().includes(query);
        const matchesComuna = property.comuna.toLowerCase().includes(query);
        const matchesDesc = property.descripcion?.toLowerCase().includes(query);
        if (!matchesName && !matchesComuna && !matchesDesc) {
          return false;
        }
      }

      // 2. Comuna
      if (selectedComuna !== 'all' && property.comuna !== selectedComuna) {
        return false;
      }

      // 3. Tipologia
      if (selectedTipologia !== 'all' && property.tipologia !== selectedTipologia) {
        return false;
      }

      // 4. Bedrooms
      if (minBedrooms !== 'all' && property.dormitorios < minBedrooms) {
        return false;
      }

      // 5. Min Price
      if (minPrice !== '' && property.precio_desde_uf < Number(minPrice)) {
        return false;
      }

      // 6. Max Price
      if (maxPrice !== '' && property.precio_desde_uf > Number(maxPrice)) {
        return false;
      }

      // 7. Entrega Inmediata
      if (onlyEntregaInmediata && !property.entrega_inmediata) {
        return false;
      }

      // 8. Bono Pie
      if (onlyBonoPie && !(property.bono_pie > 0)) {
        return false;
      }

      return true;
    });
  }, [
    initialProperties,
    searchQuery,
    selectedComuna,
    selectedTipologia,
    minBedrooms,
    minPrice,
    maxPrice,
    onlyEntregaInmediata,
    onlyBonoPie
  ]);

  const handleResetFilters = useCallback(() => {
    setSearchInput('');
    setSearchQuery('');
    setSelectedComuna('all');
    setSelectedTipologia('all');
    setMinBedrooms('all');
    setMinPrice('');
    setMaxPrice('');
    setOnlyEntregaInmediata(false);
    setOnlyBonoPie(false);
  }, []);

  const isFiltering = searchQuery || 
    selectedComuna !== 'all' || 
    selectedTipologia !== 'all' || 
    minBedrooms !== 'all' || 
    minPrice !== '' || 
    maxPrice !== '' || 
    onlyEntregaInmediata || 
    onlyBonoPie;

  return (
    <div className="w-full" id="marketplace">
      {/* Search and Filters Section */}
      <section className={`bg-card border-b border-border py-6 sticky top-16 z-40 shadow-sm transition-all duration-300 ${
          isMobileFilter && !filterVisible ? '-translate-y-full' : 'translate-y-0'
        }`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">
            
            {/* Top Search bar row */}
            <div className="relative w-full max-w-lg">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Buscar por comuna, nombre del proyecto..."
                value={searchInput}
                onChange={handleSearchChange}
                className="w-full h-10 pl-9 pr-8 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground transition-all"
              />
              {searchInput && (
                <button 
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Mobile filter toggle */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="flex items-center gap-1.5 h-9 px-4 bg-muted border border-border rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <Filter className="h-3.5 w-3.5" />
                Filtros
                {isFiltering && (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                )}
              </button>
              {isFiltering && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-secondary hover:text-secondary/80"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Filter controls Grid - hidden on mobile unless toggled */}
            <div className={`${mobileFiltersOpen ? 'flex' : 'hidden'} md:grid md:grid-cols-4 lg:grid-cols-7 flex-col gap-3 items-end`}>
              {/* Comuna */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Comuna</label>
                <select
                  value={selectedComuna}
                  onChange={(e) => setSelectedComuna(e.target.value)}
                  className="w-full h-9 px-3 bg-card border border-border rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="all">Todas las comunas</option>
                  {comunas.filter(c => c !== 'all').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Tipología */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tipología</label>
                <select
                  value={selectedTipologia}
                  onChange={(e) => setSelectedTipologia(e.target.value)}
                  className="w-full h-9 px-3 bg-card border border-border rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="all">Todos</option>
                  {tipologias.filter(t => t !== 'all').map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Dormitorios */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Dormitorios</label>
                <select
                  value={minBedrooms}
                  onChange={(e) => setMinBedrooms(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full h-9 px-3 bg-card border border-border rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="all">Cualquiera</option>
                  <option value="1">1+ Dormitorios</option>
                  <option value="2">2+ Dormitorios</option>
                  <option value="3">3+ Dormitorios</option>
                  <option value="4">4+ Dormitorios</option>
                </select>
              </div>

              {/* Precio Min */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mínimo UF</label>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full h-9 px-3 bg-card border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Precio Max */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Máximo UF</label>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full h-9 px-3 bg-card border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Checkboxes Row */}
              <div className="col-span-2 lg:col-span-2 flex gap-4 h-9 items-center justify-start lg:justify-center border-t lg:border-t-0 border-border lg:pt-0 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyEntregaInmediata}
                    onChange={(e) => setOnlyEntregaInmediata(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-2 accent-primary"
                  />
                  <span>Entrega Inmediata</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyBonoPie}
                    onChange={(e) => setOnlyBonoPie(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-2 accent-primary"
                  />
                  <span>Bono Pie</span>
                </label>
              </div>
            </div>

            {/* Clear filters badge */}
            {isFiltering && (
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-muted-foreground font-medium">
                  Resultados encontrados: <strong className="text-foreground">{filteredProperties.length}</strong>
                </span>
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-secondary/80 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Grid of properties */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {filteredProperties.map((property) => (
              <div key={property.id}>
                <PropertyCard property={property} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
              <SlidersHorizontal className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No encontramos proyectos</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Intenta flexibilizar los filtros de búsqueda o restablecerlos para ver todos los proyectos.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg transition-colors hover:bg-primary/95"
            >
              Restablecer todos los filtros
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
