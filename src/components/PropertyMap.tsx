'use client';

import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { COMUNA_COORDS } from '@/lib/comunas';

interface PropertyMapProps {
  comuna: string;
  propertyName: string;
  lat?: number;
  lng?: number;
}

export default function PropertyMap({ comuna, propertyName, lat: customLat, lng: customLng }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    let isActive = true;

    const key = comuna.toLowerCase().trim();
    const defaultCoords = COMUNA_COORDS[key] || { lat: -33.4489, lng: -70.6693 };
    const coords = customLat != null && customLng != null
      ? { lat: customLat, lng: customLng }
      : defaultCoords;

    (async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      if (!isActive || !mapRef.current) return;

      // Remove existing map instance if any (handles StrictMode double-render)
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      const icon = L.divIcon({
        html: `<div style="background:#3B82F6;color:white;padding:6px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;width:32px;height:32px;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const map = L.map(mapRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 13,
        scrollWheelZoom: false,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      const marker = L.marker([coords.lat, coords.lng], { icon }).addTo(map);
      marker.bindPopup(`<strong>${propertyName}</strong><br/>${comuna}, Santiago, Chile`);

      mapInstance.current = map;
    })();

    return () => {
      isActive = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [comuna, propertyName]);

  return (
    <div className="bg-card border border-border p-6 rounded-2xl overflow-hidden">
      <h2 className="text-lg font-bold text-primary mb-3 font-sans">Ubicación</h2>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
        <MapPin className="h-3.5 w-3.5 text-secondary" />
        <span>Proyecto ubicado en la comuna de {comuna}, Santiago, Chile.</span>
      </div>
      <div ref={mapRef} className="h-72 w-full rounded-xl overflow-hidden border border-border/60 z-0" />
    </div>
  );
}
