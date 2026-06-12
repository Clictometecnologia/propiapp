'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface GalleryImage {
  image_url: string;
  is_primary: boolean;
  alt?: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  projectName: string;
}

export default function ImageGallery({ images, projectName }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const openLightbox = useCallback((index: number) => {
    setCurrentIndex(index);
    setZoomed(false);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setZoomed(false);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    setZoomed(false);
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
    setZoomed(false);
  }, [images.length]);

  const toggleZoom = useCallback(() => {
    setZoomed(prev => !prev);
  }, []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape': closeLightbox(); break;
        case 'ArrowLeft': goToPrev(); break;
        case 'ArrowRight': goToNext(); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, closeLightbox, goToPrev, goToNext]);

  if (!images || images.length === 0) return null;

  const primaryImg = images.find(img => img.is_primary) || images[0];
  const secondaryImgs = images.filter(img => img.image_url !== primaryImg.image_url);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div
          className="relative aspect-video md:aspect-auto md:h-[420px] md:col-span-2 overflow-hidden bg-muted cursor-pointer group"
          onClick={() => openLightbox(images.indexOf(primaryImg))}
        >
          <img
            src={primaryImg.image_url}
            alt={`${projectName} Principal`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-semibold bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm transition-opacity">
              Ver galería
            </span>
          </div>
        </div>

        {secondaryImgs.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2 max-h-[420px] overflow-y-auto">
            {secondaryImgs.slice(0, 3).map((img, i) => (
              <div
                key={i}
                className="relative aspect-video overflow-hidden bg-muted rounded-md cursor-pointer group"
                onClick={() => openLightbox(images.indexOf(img))}
              >
                <img
                  src={img.image_url}
                  alt={`${projectName} Galería ${i + 1}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {i === 2 && secondaryImgs.length > 3 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-base font-bold">+{secondaryImgs.length - 3}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold text-muted-foreground border-t border-border bg-muted/30">
          {images.length} fotos en total
        </div>
      )}

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          <button
            onClick={toggleZoom}
            className="absolute top-4 left-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            {zoomed ? <ZoomOut className="h-6 w-6" /> : <ZoomIn className="h-6 w-6" />}
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          <div
            className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[currentIndex].image_url}
              alt={images[currentIndex].alt || `${projectName} ${currentIndex + 1}`}
              className={`max-w-full max-h-[90vh] object-contain transition-transform duration-300 ease-out cursor-pointer ${
                zoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
              }`}
              onClick={toggleZoom}
            />
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 text-white text-sm font-semibold px-4 py-2 rounded-full backdrop-blur-sm">
              <div className="flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); setZoomed(false); }}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
              <span className="text-white/80">{currentIndex + 1}/{images.length}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
