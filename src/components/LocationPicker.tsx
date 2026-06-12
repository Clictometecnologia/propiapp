'use client';

import { useEffect, useRef, useState } from 'react';
import { COMUNA_COORDS } from '@/lib/comunas';
import { MapPin, Search, Loader2 } from 'lucide-react';

interface LocationPickerProps {
  comuna: string;
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export default function LocationPicker({ comuna, initialLat, initialLng, onLocationChange }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    let isActive = true;
    let currentLat = initialLat;
    let currentLng = initialLng;

    const key = comuna.toLowerCase().trim();
    const defaultCoords = COMUNA_COORDS[key] || { lat: -33.4489, lng: -70.6693 };
    const center = currentLat != null && currentLng != null
      ? { lat: currentLat, lng: currentLng }
      : defaultCoords;

    (async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      if (!isActive || !mapRef.current) return;

      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      const map = L.map(mapRef.current, {
        center: [center.lat, center.lng],
        zoom: 15,
        scrollWheelZoom: true,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      const icon = L.divIcon({
        html: `<div style="background:#3B82F6;color:white;padding:6px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;width:32px;height:32px;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([center.lat, center.lng], { icon, draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        currentLat = pos.lat;
        currentLng = pos.lng;
        onLocationChange(pos.lat, pos.lng);
      });

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        currentLat = e.latlng.lat;
        currentLng = e.latlng.lng;
        onLocationChange(e.latlng.lat, e.latlng.lng);
      });

      mapInstance.current = map;
    })();

    return () => {
      isActive = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [comuna]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError('');

    try {
      const q = encodeURIComponent(`${searchQuery.trim()}, ${comuna}, Chile`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`);
      const data = await res.json();

      if (!data || data.length === 0) {
        setSearchError('No se encontró la dirección. Intenta con otro término.');
        return;
      }

      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);

      if (mapInstance.current && markerRef.current) {
        mapInstance.current.setView([lat, lng], 16);
        markerRef.current.setLatLng([lat, lng]);
      }

      onLocationChange(lat, lng);
    } catch {
      setSearchError('Error al buscar. Verifica tu conexión.');
    } finally {
      setSearching(false);
    }
  };

  const lat = initialLat;
  const lng = initialLng;

  return (
    <div className="flex flex-col gap-3">
      {/* Address Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            type="text"
            placeholder="Buscar dirección (ej: Av. Providencia 1234)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            className="w-full h-9 pl-9 pr-3 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching || !searchQuery.trim()}
          className="h-9 px-4 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
        >
          {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          Buscar
        </button>
      </div>
      {searchError && (
        <p className="text-[11px] text-destructive">{searchError}</p>
      )}

      {lat != null && lng != null && (
        <p className="text-[10px] text-muted-foreground">
          Coordenadas: {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      )}

      <div ref={mapRef} className="h-64 w-full rounded-xl overflow-hidden border border-border/60 z-0" />
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        <span>
          Arrastra el marcador o haz clic en el mapa para ajustar la ubicación.
        </span>
      </div>
    </div>
  );
}
