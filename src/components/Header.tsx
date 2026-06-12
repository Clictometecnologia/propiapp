'use client';

import Link from 'next/link';
import { Home, Building2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function Header() {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleScroll = () => {
      const currentY = window.scrollY;
      if (isMobile && currentY > lastScrollY.current && currentY > 80) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobile);
    };
  }, [isMobile]);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-border glass transition-transform duration-300 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary transition-opacity hover:opacity-90"
        >
          <span className="bg-primary text-background p-1.5 rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </span>
          <span className="font-semibold text-primary font-sans">PropiApp<span className="text-secondary font-bold">.cl</span></span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href="/" 
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <Home className="h-4 w-4" />
            Inicio
          </Link>
          <Link 
            href="/#marketplace" 
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <Building2 className="h-4 w-4" />
            Propiedades
          </Link>
        </nav>
      </div>
    </header>
  );
}
