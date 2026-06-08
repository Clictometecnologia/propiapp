'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, 
  LayoutDashboard, 
  ListOrdered, 
  Users, 
  BarChart3, 
  LogOut, 
  Loader2,
  ExternalLink,
  Menu,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cerrar sidebar al navegar (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setCheckingAuth(false);
      setAuthorized(true);
      return;
    }

    async function checkAuth() {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/admin/login');
        } else {
          setAuthorized(true);
        }
      } else {
        router.push('/admin/login');
      }
      setCheckingAuth(false);
    }
    checkAuth();
  }, [router, pathname]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/admin/login');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground font-medium font-sans">Verificando sesión...</span>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Propiedades', href: '/admin/propiedades', icon: ListOrdered },
    { name: 'Leads de Contacto', href: '/admin/leads', icon: Users },
    { name: 'Estadísticas', href: '/admin/estadisticas', icon: BarChart3 },
  ];

  const isLoginPage = pathname === '/admin/login';

  return (
    <div className="dark h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
      
      {/* Boton Hamburguesa - solo visible en mobile */}
      {!isLoginPage && (
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
            aria-label="Abrir menú"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/" className="flex items-center gap-2 font-bold text-sm text-primary tracking-tight">
            <span className="bg-primary text-background p-1 rounded-lg flex items-center justify-center">
              <Building2 className="h-3.5 w-3.5" />
            </span>
            <span>PropiApp<span className="text-secondary">.cl</span></span>
          </Link>
          <span className="text-[10px] font-semibold text-muted-foreground border border-border bg-muted px-2 py-0.5 rounded uppercase">
            Admin
          </span>
        </div>
      )}

      {/* Overlay oscuro en mobile cuando el sidebar esta abierto */}
      {!isLoginPage && sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      {!isLoginPage && (
      <aside className={`
        w-64 sticky top-0 h-screen border-r border-border bg-card p-5 flex flex-col justify-between shrink-0
        md:flex
        ${sidebarOpen ? 'fixed inset-y-0 left-0 z-50 flex' : 'hidden'}
      `}>

        <div className="flex flex-col gap-8">
          {/* Logo Header */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight">
              <span className="bg-primary text-background p-1.5 rounded-lg flex items-center justify-center">
                <Building2 className="h-4 w-4" />
              </span>
              <span>PropiApp<span className="text-secondary">.cl</span></span>
            </Link>
            <span className="text-[10px] font-semibold text-muted-foreground border border-border bg-muted px-2 py-0.5 rounded uppercase">
              Admin
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ' + (
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="flex flex-col gap-4 pt-6 border-t border-border/40 mt-8 md:mt-0">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver Sitio Público
          </Link>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive transition-all w-full text-left"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>
      )}

      {/* Main Content Area */}
      <main className={'flex-1 min-w-0 bg-background overflow-y-auto ' + (!isLoginPage ? 'pt-14 md:pt-0 px-4 py-4 sm:px-6 lg:px-8' : 'p-0')}>
        {isLoginPage ? (
          children
        ) : (
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        )}
      </main>
    </div>
  );
}