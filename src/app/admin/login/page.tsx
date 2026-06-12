'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Key, Mail, Loader2, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor ingresa email y contraseña.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión');
        setLoading(false);
        return;
      }

      router.push('/admin/dashboard');
    } catch (err) {
      console.error(err);
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground justify-center items-center px-4 font-sans">
      
      {/* Back button */}
      <Link 
        href="/"
        className="absolute top-8 left-8 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
      >
        <ArrowRight className="h-3.5 w-3.5 rotate-180" />
        Volver a PropiApp.cl
      </Link>

      <div className="w-full max-w-sm flex flex-col gap-6">
        
        {/* Logo Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="h-10 w-10 bg-card border border-border rounded-xl flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tight mt-2 text-foreground">PropiApp Administrador</h1>
          <p className="text-xs text-muted-foreground">Ingresa tus credenciales para administrar la plataforma</p>
        </div>

        {/* Login Form card */}
        <div className="bg-card border border-border p-6 rounded-2xl flex flex-col gap-4 shadow-xl">
          {error && (
            <div className="text-[11px] font-medium text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/30">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  placeholder="admin@propiapp.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                  <Key className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
