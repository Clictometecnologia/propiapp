'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { Property } from '@/types';

function fmt(n: number): string {
  return n.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtUF(n: number): string {
  return n.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' UF';
}

function fmtCLP(n: number): string {
  return '$' + n.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function calcularDividendo(monto: number, tasaAnual: number, años: number): number {
  const r = tasaAnual / 100 / 12;
  const n = años * 12;
  if (r === 0) return monto / n;
  return monto * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function calcularSeguros(montoCredito: number): { incendio: number; desgravamen: number; invalidez: number; total: number } {
  const incendio = (montoCredito / 1000) * 0.0218;
  const desgravamen = (montoCredito / 1000) * 0.0020;
  const invalidez = (montoCredito / 1000) * 0.0042;
  return { incendio, desgravamen, invalidez, total: incendio + desgravamen + invalidez };
}

const PLAN_TERMS = [5, 10, 15, 20, 25, 30, 35, 40];
const SURFACE_OPTIONS = [25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 100, 110, 120, 140, 160, 180, 200];

interface ClientInfo {
  nombre: string; rut: string; email: string; celular: string;
}

interface UnitInfo {
  numero: string; piso: string; orientacion: string;
  sup_util: number; sup_terraza: number; sup_total: number;
  descripcion: string; estacionamientos: number; bodegas: number;
}

interface PricingConfig {
  descuento_porcentaje: number;
  bonificacion_porcentaje: number;
  precio_estacionamiento_uf: number;
  precio_bodega_uf: number;
  tasa_anual: number;
  pie_porcentaje: number;
  antes_entrega_porcentaje: number;
  despues_entrega_porcentaje: number;
  despues_entrega_cuotas: number;
  credito_porcentaje: number;
  inmobiliaria: string;
  monto_reserva_uf: number;
}

const defaultClient: ClientInfo = { nombre: '', rut: '', email: '', celular: '' };
const defaultUnit: UnitInfo = { numero: '', piso: '', orientacion: '', sup_util: 0, sup_terraza: 0, sup_total: 0, descripcion: '', estacionamientos: 1, bodegas: 1 };
const defaultPricing: PricingConfig = {
  descuento_porcentaje: 8, bonificacion_porcentaje: 7.25,
  precio_estacionamiento_uf: 390, precio_bodega_uf: 80,
  tasa_anual: 3.5, pie_porcentaje: 4, antes_entrega_porcentaje: 0,
  despues_entrega_porcentaje: 8.75, despues_entrega_cuotas: 60,
  credito_porcentaje: 80, inmobiliaria: '', monto_reserva_uf: 10,
};

interface Props {
  properties: Property[];
  ufValue: number;
}

export default function Cotizador({ properties, ufValue }: Props) {
  const [prop, setProp] = useState<Property | null>(null);
  const [client, setClient] = useState<ClientInfo>(defaultClient);
  const [unit, setUnit] = useState<UnitInfo>(defaultUnit);
  const [cfg, setCfg] = useState<PricingConfig>(defaultPricing);
  const [uf, setUf] = useState(ufValue);
  const [ufEdit, setUfEdit] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState<'pdf' | 'whatsapp' | 'email' | null>(null);
  const [mostrarEmail, setMostrarEmail] = useState(false);
  const [emailDestino, setEmailDestino] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  const setCl = useCallback(<K extends keyof ClientInfo>(k: K, v: ClientInfo[K]) => setClient(p => ({ ...p, [k]: v })), []);
  const setUn = useCallback(<K extends keyof UnitInfo>(k: K, v: UnitInfo[K]) => setUnit(p => ({ ...p, [k]: v })), []);
  const setCf = useCallback(<K extends keyof PricingConfig>(k: K, v: PricingConfig[K]) => setCfg(p => ({ ...p, [k]: v })), []);

  const handleSelect = useCallback((id: string) => {
    const p = properties.find(x => x.id === id) ?? null;
    setProp(p);
    if (p) {
      setCfg(prev => ({ ...prev, inmobiliaria: '' }));
      setUnit(prev => ({ ...prev, descripcion: `${p.dormitorios}D+${p.banos}B - ${p.comuna}` }));
    }
  }, [properties]);

  const calc = useMemo(() => {
    if (!prop) return null;
    const precio_lista = prop.precio_desde_uf;
    const descuento = precio_lista * cfg.descuento_porcentaje / 100;
    const precio_final = precio_lista - descuento;
    const estacionamientos_uf = unit.estacionamientos * cfg.precio_estacionamiento_uf;
    const bodegas_uf = unit.bodegas * cfg.precio_bodega_uf;
    const base = precio_final + estacionamientos_uf + bodegas_uf;
    const total_escriturar = base / (1 - cfg.bonificacion_porcentaje / 100);
    const bonificacion_uf = total_escriturar * cfg.bonificacion_porcentaje / 100;

    const credito_uf = total_escriturar * cfg.credito_porcentaje / 100;
    const abono_inicial_uf = total_escriturar * cfg.pie_porcentaje / 100;
    const antes_entrega_uf = total_escriturar * cfg.antes_entrega_porcentaje / 100;
    const despues_entrega_total_uf = total_escriturar * cfg.despues_entrega_porcentaje / 100;
    const despues_entrega_cuota_uf = cfg.despues_entrega_cuotas > 0 ? despues_entrega_total_uf / cfg.despues_entrega_cuotas : 0;

    const simulacion = PLAN_TERMS.map(años => {
      const dividendo = calcularDividendo(credito_uf, cfg.tasa_anual, años);
      const seguros = calcularSeguros(credito_uf);
      return { años, dividendo, seguros, total: dividendo + seguros.total };
    });

    return {
      precio_lista, descuento, precio_final, bonificacion_uf,
      estacionamientos_uf, bodegas_uf, total_escriturar,
      abono_inicial_uf, antes_entrega_uf, despues_entrega_total_uf, despues_entrega_cuota_uf,
      credito_uf, simulacion,
    };
  }, [prop, cfg, unit]);

  useEffect(() => {
    setUn('sup_total', Number((unit.sup_util + unit.sup_terraza).toFixed(2)));
  }, [unit.sup_util, unit.sup_terraza]);

  const hoy = new Date();
  const fechaStr = hoy.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }) + ', ' + hoy.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) + ' hrs.';

  const imprimirPDF = useCallback(() => {
    if (!prop) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const content = previewRef.current?.cloneNode(true) as HTMLElement;
    if (!content) return;
    const styles = Array.from(document.styleSheets)
      .map(s => {
        try { return Array.from(s.cssRules || []).map(r => r.cssText).join(''); }
        catch { return ''; }
      })
      .join('');
    win.document.write(`
      <html><head><title>Cotización ${prop.name}</title>
      <style>${styles}</style>
      <style>
        @page { margin: 10mm; size: A4; }
        body { font-family: sans-serif; padding: 0; margin: 0; }
        .no-print { display: none !important; }
        .p-6\ sm\:p-10 { padding: 20px !important; }
      </style>
      </head><body>${content.outerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  }, [prop, unit]);

  const compartirWhatsApp = useCallback(() => {
    if (!prop) return;
    const texto = buildQuoteText({ prop, client, unit, cfg, calc: calc!, uf, fechaStr });
    const numero = prop.ejecutivo_whatsapp?.replace(/\D/g, '') || '';
    window.open(numero ? `https://wa.me/56${numero}?text=${encodeURIComponent(texto)}` : `https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  }, [prop, client, unit, cfg, calc, uf, fechaStr]);

  const enviarEmailPDF = useCallback(() => {
    if (!prop || !emailDestino) return;
    setSending('email');
    const texto = buildQuoteText({ prop, client, unit, cfg, calc: calc!, uf, fechaStr });
    const asunto = encodeURIComponent(`Cotización PropiApp.cl - ${prop.name} - Unidad ${unit.numero || '—'}`);
    const body = encodeURIComponent(texto + '\n\n---\nEsta cotización fue generada en PropiApp.cl');
    window.open(`mailto:${encodeURIComponent(emailDestino)}?subject=${asunto}&body=${body}`, '_blank');
    setMostrarEmail(false);
    setEmailDestino('');
    setSending(null);
  }, [prop, client, unit, cfg, calc, uf, fechaStr, emailDestino]);

  if (!properties.length) {
    return <div className="p-8 text-center text-muted-foreground text-xs">No hay propiedades publicadas para cotizar.</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Cotizador</h1>
          <p className="text-[11px] text-muted-foreground">Genera cotizaciones personalizadas</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>UF: {ufEdit
            ? <input type="number" step="0.01" value={uf} onChange={e => setUf(Number(e.target.value))} className="w-28 bg-card border border-border rounded px-2 py-0.5 text-foreground text-xs" />
            : <button onClick={() => setUfEdit(true)} className="text-primary font-semibold hover:underline">{fmt(uf)}</button>
          }</span>
          <span>{fechaStr}</span>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* LEFT — Forms */}
        <div className="xl:col-span-2 space-y-5">

          {/* Selector Propiedad */}
          <section className="bg-card border border-border rounded-2xl p-5">
            <h2 className="text-xs font-bold text-primary mb-3 tracking-wide uppercase">1. Seleccionar Propiedad</h2>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar proyecto..."
              className="w-full h-9 bg-background border border-border rounded-lg px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring mb-2"
            />
            <select
              value={prop?.id ?? ''}
              onChange={e => handleSelect(e.target.value)}
              className="w-full h-10 bg-background border border-border rounded-lg px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">— Seleccionar —</option>
              {properties
                .filter(p =>
                  searchQuery === '' ||
                  p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.comuna.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(p => (
                <option key={p.id} value={p.id}>{p.name} — {p.comuna} — {fmtUF(p.precio_desde_uf)}</option>
              ))}
            </select>
          </section>

          {prop && calc && (
            <>
              {/* Info Proyecto + Cliente + Ejecutivo */}
              <section className="bg-card border border-border rounded-2xl p-5">
                <h2 className="text-xs font-bold text-primary mb-3 tracking-wide uppercase">2. Información</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Proyecto */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Proyecto</h3>
                    <div className="space-y-1.5">
                      <Label text="Inmobiliaria">
                        <input value={cfg.inmobiliaria} onChange={e => setCf('inmobiliaria', e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 h-8 text-xs" placeholder="Ej: Grupo Araucana" />
                      </Label>
                      <Label text="Proyecto">
                        <div className="text-xs text-foreground h-8 flex items-center px-1">{prop.name}</div>
                      </Label>
                      <Label text="Unidad">
                        <input value={unit.numero} onChange={e => setUn('numero', e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 h-8 text-xs" placeholder="Ej: 602" />
                      </Label>
                      <Label text="Tipo de Entrega">
                        <div className="text-xs text-foreground h-8 flex items-center px-1">{prop.entrega_inmediata ? 'Entrega Inmediata' : 'En Proyecto'}</div>
                      </Label>
                    </div>
                  </div>
                  {/* Cliente */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cliente</h3>
                    <div className="space-y-1.5">
                      <Label text="Nombre">
                        <input value={client.nombre} onChange={e => setCl('nombre', e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 h-8 text-xs" placeholder="Nombre del cliente" />
                      </Label>
                      <Label text="RUT">
                        <input value={client.rut} onChange={e => setCl('rut', e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 h-8 text-xs" placeholder="12.345.678-9" />
                      </Label>
                      <Label text="Email">
                        <input value={client.email} onChange={e => setCl('email', e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 h-8 text-xs" placeholder="cliente@email.com" />
                      </Label>
                      <Label text="Celular">
                        <input value={client.celular} onChange={e => setCl('celular', e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 h-8 text-xs" placeholder="+56 9 XXXX XXXX" />
                      </Label>
                    </div>
                  </div>
                  {/* Ejecutivo */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ejecutivo</h3>
                    <div className="space-y-1.5">
                      <Label text="Nombre">
                        <div className="text-xs text-foreground h-8 flex items-center px-1">{prop.ejecutivo_nombre || '—'}</div>
                      </Label>
                      <Label text="Email">
                        <div className="text-xs text-foreground h-8 flex items-center px-1 break-all">{prop.ejecutivo_email || '—'}</div>
                      </Label>
                      <Label text="Celular">
                        <div className="text-xs text-foreground h-8 flex items-center px-1">{prop.ejecutivo_whatsapp || '—'}</div>
                      </Label>
                    </div>
                  </div>
                </div>
              </section>

              {/* Detalle Unidad */}
              <section className="bg-card border border-border rounded-2xl p-5">
                <h2 className="text-xs font-bold text-primary mb-3 tracking-wide uppercase">3. Detalle de la Unidad</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left font-bold text-muted-foreground pb-2 pr-4">Número</th>
                        <th className="text-left font-bold text-muted-foreground pb-2 pr-4">Piso</th>
                        <th className="text-left font-bold text-muted-foreground pb-2 pr-4">Orientación</th>
                        <th className="text-left font-bold text-muted-foreground pb-2 pr-4">Sup. Útil</th>
                        <th className="text-left font-bold text-muted-foreground pb-2 pr-4">Sup. Terraza</th>
                        <th className="text-left font-bold text-muted-foreground pb-2">Sup. Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2 pr-4"><input value={unit.numero} onChange={e => setUn('numero', e.target.value)} className="w-16 bg-background border border-border rounded px-2 h-7 text-xs" /></td>
                        <td className="py-2 pr-4"><input value={unit.piso} onChange={e => setUn('piso', e.target.value)} className="w-16 bg-background border border-border rounded px-2 h-7 text-xs" /></td>
                        <td className="py-2 pr-4"><input value={unit.orientacion} onChange={e => setUn('orientacion', e.target.value)} className="w-24 bg-background border border-border rounded px-2 h-7 text-xs" placeholder="Norte" /></td>
                        <td className="py-2 pr-4">
                          <input type="number" value={unit.sup_util || ''} list="sup-util-list" onChange={e => setUn('sup_util', Number(e.target.value))} className="w-20 bg-background border border-border rounded px-2 h-7 text-xs" placeholder="m²" />
                          <datalist id="sup-util-list">{SURFACE_OPTIONS.map(v => <option key={v} value={v} />)}</datalist>
                        </td>
                        <td className="py-2 pr-4">
                          <input type="number" value={unit.sup_terraza || ''} list="sup-terraza-list" onChange={e => setUn('sup_terraza', Number(e.target.value))} className="w-20 bg-background border border-border rounded px-2 h-7 text-xs" placeholder="m²" />
                          <datalist id="sup-terraza-list">{SURFACE_OPTIONS.map(v => <option key={v} value={v} />)}</datalist>
                        </td>
                        <td className="py-2"><span className="inline-flex items-center h-7 text-xs font-semibold text-foreground">{unit.sup_total} m²</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-3">
                  <Label text="Descripción">
                    <input value={unit.descripcion} onChange={e => setUn('descripcion', e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 h-8 text-xs" />
                  </Label>
                </div>
              </section>

              {/* Desglose de Precios */}
              <section className="bg-card border border-border rounded-2xl p-5">
                <h2 className="text-xs font-bold text-primary mb-3 tracking-wide uppercase">4. Desglose de Precios</h2>
                <div className="space-y-3">
                  <Row label="Precio Lista Depto." uf={calc.precio_lista} clp={calc.precio_lista * uf} />
                  <RowEdit label="Descuento" uf={calc.descuento} clp={calc.descuento * uf}
                    value={cfg.descuento_porcentaje} unit="%" onChange={v => setCf('descuento_porcentaje', v)} />
                  <Row label="Precio Final Depto. (CI)" uf={calc.precio_final} clp={calc.precio_final * uf} bold />
                  <div className="border-t border-border/40 pt-3">
                    <RowEdit label="Bonificación" uf={calc.bonificacion_uf} clp={calc.bonificacion_uf * uf}
                      value={cfg.bonificacion_porcentaje} unit="%" onChange={v => setCf('bonificacion_porcentaje', v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <RowEdit label="Estacionamiento(s)" uf={calc.estacionamientos_uf} clp={calc.estacionamientos_uf * uf}
                      value={cfg.precio_estacionamiento_uf} unit="UF c/u" onChange={v => setCf('precio_estacionamiento_uf', v)}
                      extra={<input type="number" value={unit.estacionamientos} onChange={e => setUn('estacionamientos', Number(e.target.value))} className="w-14 bg-background border border-border rounded px-2 h-7 text-xs" />} />
                    <RowEdit label="Bodega(s)" uf={calc.bodegas_uf} clp={calc.bodegas_uf * uf}
                      value={cfg.precio_bodega_uf} unit="UF c/u" onChange={v => setCf('precio_bodega_uf', v)}
                      extra={<input type="number" value={unit.bodegas} onChange={e => setUn('bodegas', Number(e.target.value))} className="w-14 bg-background border border-border rounded px-2 h-7 text-xs" />} />
                  </div>
                  <div className="border-t border-border pt-3 mt-3">
                    <Row label="Valor Total a Escriturar" uf={calc.total_escriturar} clp={calc.total_escriturar * uf} bold large />
                  </div>
                </div>
              </section>

              {/* Plan de Pagos */}
              <section className="bg-card border border-border rounded-2xl p-5">
                <h2 className="text-xs font-bold text-primary mb-3 tracking-wide uppercase">5. Plan de Pagos</h2>
                <div className="space-y-2 text-xs">
                  <RowEdit label="Monto de Reserva" uf={cfg.monto_reserva_uf} clp={cfg.monto_reserva_uf * uf}
                    value={cfg.monto_reserva_uf} unit="UF" onChange={v => setCf('monto_reserva_uf', v)} />
                  <RowEdit label="Abono Inicial" uf={calc.abono_inicial_uf} clp={calc.abono_inicial_uf * uf}
                    value={cfg.pie_porcentaje} unit="%" onChange={v => setCf('pie_porcentaje', v)} />
                  <RowEdit label="Antes de Entrega" uf={calc.antes_entrega_uf} clp={calc.antes_entrega_uf * uf}
                    value={cfg.antes_entrega_porcentaje} unit="%" onChange={v => setCf('antes_entrega_porcentaje', v)} />
                  <RowEdit label="Después de Entrega" uf={calc.despues_entrega_total_uf} clp={calc.despues_entrega_total_uf * uf}
                    value={cfg.despues_entrega_porcentaje} unit="%" onChange={v => setCf('despues_entrega_porcentaje', v)}
                    extra={<span className="text-muted-foreground text-[10px]"><input type="number" value={cfg.despues_entrega_cuotas} onChange={e => setCf('despues_entrega_cuotas', Number(e.target.value))} className="w-14 bg-background border border-border rounded px-2 h-7 text-xs text-foreground text-center inline-block" /> cuotas de {fmtUF(calc.despues_entrega_cuota_uf)} ({fmtCLP(calc.despues_entrega_cuota_uf * uf)})</span>} />
                  <RowEdit label="Crédito Hipotecario" uf={calc.credito_uf} clp={calc.credito_uf * uf}
                    value={cfg.credito_porcentaje} unit="%" onChange={v => setCf('credito_porcentaje', v)} bold />
                </div>
                <SumValidator pct1={cfg.pie_porcentaje} pct2={cfg.antes_entrega_porcentaje} pct3={cfg.despues_entrega_porcentaje} pct4={cfg.credito_porcentaje} />
              </section>

              {/* Simulación Crédito Hipotecario */}
              <section className="bg-card border border-border rounded-2xl p-5">
                <h2 className="text-xs font-bold text-primary mb-3 tracking-wide uppercase">6. Simulación Crédito Hipotecario</h2>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold text-muted-foreground">Tasa Anual:</span>
                  <input type="number" step="0.1" value={cfg.tasa_anual} onChange={e => setCf('tasa_anual', Number(e.target.value))}
                    className="w-20 bg-background border border-border rounded px-2 h-7 text-xs" />
                  <span className="text-[10px] text-muted-foreground">%</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left font-bold pb-2 pr-3">Plazo</th>
                        <th className="text-right font-bold pb-2 pr-3">Dividendo Base (UF)</th>
                        <th className="text-right font-bold pb-2 pr-3">Seguros (UF)</th>
                        <th className="text-right font-bold pb-2">Total Mensual (UF)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calc.simulacion.map(s => (
                        <tr key={s.años} className="border-b border-border/30">
                          <td className="py-1.5 pr-3">{s.años} años</td>
                          <td className="text-right py-1.5 pr-3">{fmt(s.dividendo)} UF</td>
                          <td className="text-right py-1.5 pr-3 text-muted-foreground">{fmt(s.seguros.total)} UF</td>
                          <td className="text-right py-1.5 font-semibold">{fmt(s.total)} UF <span className="text-muted-foreground font-normal">{fmtCLP(s.total * uf)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Vista Previa / Exportar */}
              <div className="flex gap-3">
                <button onClick={() => setShowPreview(!showPreview)}
                  className="h-10 px-5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors">
                  {showPreview ? 'Ocultar Vista Previa' : 'Vista Previa de Cotización'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* RIGHT — Sidebar (Resumen Rápido) */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 sticky top-6">
            <h2 className="text-xs font-bold text-muted-foreground mb-4 tracking-wide uppercase">Resumen Rápido</h2>
            {prop && calc ? (
              <div className="space-y-3 text-xs">
                <div><span className="text-muted-foreground">Proyecto</span><div className="font-semibold">{prop.name}</div></div>
                <div><span className="text-muted-foreground">Unidad</span><div className="font-semibold">{unit.numero || '—'}</div></div>
                <div><span className="text-muted-foreground">Precio Lista</span><div className="font-semibold">{fmtUF(calc.precio_lista)}</div></div>
                <div><span className="text-muted-foreground">Descuento</span><div className="font-semibold text-green-500">{cfg.descuento_porcentaje}% ({fmtUF(calc.descuento)})</div></div>
                <div className="border-t border-border pt-3">
                  <span className="text-muted-foreground">Total a Escriturar</span>
                  <div className="text-sm font-bold text-primary">{fmtUF(calc.total_escriturar)}</div>
                  <div className="text-[11px] text-muted-foreground">{fmtCLP(calc.total_escriturar * uf)}</div>
                </div>
                <div className="border-t border-border pt-3">
                  <span className="text-muted-foreground">Dividendo 30 años</span>
                  <div className="font-semibold">{fmt(calc.simulacion.find(s => s.años === 30)?.total ?? 0)} UF</div>
                  <div className="text-[11px] text-muted-foreground">{fmtCLP((calc.simulacion.find(s => s.años === 30)?.total ?? 0) * uf)}</div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Selecciona una propiedad para comenzar.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal Vista Previa */}
      {showPreview && prop && calc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowPreview(false)}>
          <div className="bg-white text-black rounded-2xl max-w-4xl w-full my-8 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4" style={{ background: 'linear-gradient(135deg, #0d9488, #0891b2)' }}>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-lg font-bold text-white">PropiApp.cl</h1>
                  <p className="text-xs text-white/80 mt-1">{prop.name} - Unidad {unit.numero || '—'}</p>
                </div>
                <button onClick={() => setShowPreview(false)} className="text-white/60 hover:text-white text-xl leading-none">&times;</button>
              </div>
              <p className="text-[11px] text-white/60 mt-3">Fecha y Hora: {fechaStr}<br />Valor UF: {fmt(uf)}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={imprimirPDF}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold rounded-lg transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/></svg>
                  Imprimir PDF
                </button>
                <button onClick={compartirWhatsApp}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold rounded-lg transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </button>
                <button onClick={() => setMostrarEmail(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold rounded-lg transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                  Enviar por Email
                </button>
              </div>
            </div>
            <div className="p-6 sm:p-10" ref={previewRef}>

              {/* Info Blocks */}
              <div className="grid grid-cols-3 gap-6 mb-8 text-xs">
                <div>
                  <h3 className="font-bold text-gray-700 mb-2 text-[10px] uppercase tracking-wider">Información del Proyecto</h3>
                  <div className="space-y-1 text-gray-600">
                    <p><span className="text-gray-400">Inmobiliaria:</span> {cfg.inmobiliaria || '—'}</p>
                    <p><span className="text-gray-400">Proyecto:</span> {prop.name}</p>
                    <p><span className="text-gray-400">Unidad:</span> {unit.numero} ({prop.dormitorios}D+{prop.banos}B)</p>
                    <p><span className="text-gray-400">Tipo de Entrega:</span> {prop.entrega_inmediata ? 'Entrega Inmediata' : 'En Proyecto'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-700 mb-2 text-[10px] uppercase tracking-wider">Información del Cliente</h3>
                  <div className="space-y-1 text-gray-600">
                    <p><span className="text-gray-400">Nombre:</span> {client.nombre || '—'}</p>
                    <p><span className="text-gray-400">RUT:</span> {client.rut || '—'}</p>
                    <p><span className="text-gray-400">Email:</span> {client.email || '—'}</p>
                    <p><span className="text-gray-400">Celular:</span> {client.celular || '—'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-700 mb-2 text-[10px] uppercase tracking-wider">Información del Ejecutivo</h3>
                  <div className="space-y-1 text-gray-600">
                    <p><span className="text-gray-400">Nombre:</span> {prop.ejecutivo_nombre || '—'}</p>
                    <p><span className="text-gray-400">Email:</span> {prop.ejecutivo_email || '—'}</p>
                    <p><span className="text-gray-400">Celular:</span> {prop.ejecutivo_whatsapp || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Unit Detail Table */}
              <h3 className="font-bold text-gray-700 mb-2 text-[10px] uppercase tracking-wider">Detalle de la Unidad</h3>
              <table className="w-full text-xs mb-8 border-collapse">
                <thead>
                  <tr style={{ background: '#1e3a5f', color: '#fff' }}>
                    <th className="text-left font-bold py-2 px-3 pr-4 text-[10px] uppercase">Número</th>
                    <th className="text-left font-bold py-2 px-3 pr-4 text-[10px] uppercase">Piso</th>
                    <th className="text-left font-bold py-2 px-3 pr-4 text-[10px] uppercase">Orientación</th>
                    <th className="text-left font-bold py-2 px-3 pr-4 text-[10px] uppercase">Sup. Útil</th>
                    <th className="text-left font-bold py-2 px-3 pr-4 text-[10px] uppercase">Sup. Terraza</th>
                    <th className="text-left font-bold py-2 px-3 text-[10px] uppercase">Sup. Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 pr-4 text-gray-800">{unit.numero || '—'}</td>
                    <td className="py-2 pr-4 text-gray-800">{unit.piso || '—'}</td>
                    <td className="py-2 pr-4 text-gray-800">{unit.orientacion || '—'}</td>
                    <td className="py-2 pr-4 text-gray-800">{unit.sup_util ? `${unit.sup_util} m²` : '—'}</td>
                    <td className="py-2 pr-4 text-gray-800">{unit.sup_terraza ? `${unit.sup_terraza} m²` : '—'}</td>
                    <td className="py-2 text-gray-800">{unit.sup_total ? `${unit.sup_total} m²` : '—'}</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-[11px] text-gray-500 mb-6">Descripción: {unit.descripcion || prop.dormitorios + 'D+' + prop.banos + 'B'}</p>

              {/* Price Breakdown */}
              <h3 className="font-bold text-gray-700 mb-2 text-[10px] uppercase tracking-wider">Desglose de Precios y Escrituración</h3>
              <table className="w-full text-xs mb-8 border-collapse">
                <thead>
                  <tr style={{ background: '#1e3a5f', color: '#fff' }}>
                    <th className="text-left font-bold py-2 px-3 text-[10px] uppercase">Ítem</th>
                    <th className="text-left font-bold py-2 px-3 text-[10px] uppercase">Detalle</th>
                    <th className="text-right font-bold py-2 px-3 text-[10px] uppercase">Valor UF</th>
                    <th className="text-right font-bold py-2 px-3 text-[10px] uppercase">Valor CLP</th>
                  </tr>
                </thead>
                <tbody>
                  <PreviewRow label="Precio Lista Depto." uf={calc.precio_lista} clp={calc.precio_lista * uf} />
                  <PreviewRow label={`Descuento Total (${cfg.descuento_porcentaje}%)`} uf={calc.descuento} clp={calc.descuento * uf} />
                  <PreviewRow label="Precio Final Depto. (CI)" uf={calc.precio_final} clp={calc.precio_final * uf} bold />
                  <PreviewRow label={`Aplicación Bonificación (${cfg.bonificacion_porcentaje}%)`} uf={calc.bonificacion_uf} clp={calc.bonificacion_uf * uf} />
                  <tr><td colSpan={4} className="text-[10px] text-gray-400 py-1">Bonificación se recalcula desde: {cfg.descuento_porcentaje}% a Bonificación sobre la operación: {cfg.bonificacion_porcentaje}%</td></tr>
                  <PreviewRow label="Estacionamiento(s)" uf={calc.estacionamientos_uf} clp={calc.estacionamientos_uf * uf} />
                  <PreviewRow label="Bodega(s)" uf={calc.bodegas_uf} clp={calc.bodegas_uf * uf} />
                  <PreviewRow label="Valor Total a Escriturar" uf={calc.total_escriturar} clp={calc.total_escriturar * uf} bold large />
                </tbody>
              </table>

              {/* Payment Plan */}
              <h3 className="font-bold text-gray-700 mb-2 text-[10px] uppercase tracking-wider">Resumen del Plan de Pagos (Nº Total de Cuotas: {cfg.despues_entrega_cuotas})</h3>
              <table className="w-full text-xs mb-8 border-collapse">
                <thead>
                  <tr style={{ background: '#1e3a5f', color: '#fff' }}>
                    <th className="text-left font-bold py-2 px-3 pr-4 text-[10px] uppercase">Etapa</th>
                    <th className="text-left font-bold py-2 px-3 pr-4 text-[10px] uppercase">Detalle</th>
                    <th className="text-right font-bold py-2 px-3 pr-4 text-[10px] uppercase">Monto UF</th>
                    <th className="text-right font-bold py-2 px-3 text-[10px] uppercase">Monto CLP</th>
                  </tr>
                </thead>
                <tbody>
                  <PreviewRow label="Reserva" detail="Monto para separar la unidad" uf={cfg.monto_reserva_uf} clp={cfg.monto_reserva_uf * uf} />
                  <PreviewRow label="Abono Inicial" detail={`${cfg.pie_porcentaje}% del total`} uf={calc.abono_inicial_uf} clp={calc.abono_inicial_uf * uf} />
                  <PreviewRow label="Antes de Entrega" detail={`${cfg.antes_entrega_porcentaje}% - 0 cuotas`} uf={calc.antes_entrega_uf} clp={calc.antes_entrega_uf * uf} />
                  <PreviewRow label="Después de Entrega" detail={`${cfg.despues_entrega_porcentaje}% - ${cfg.despues_entrega_cuotas} cuotas de ${fmtUF(calc.despues_entrega_cuota_uf)} (${fmtCLP(calc.despues_entrega_cuota_uf * uf)})`} uf={calc.despues_entrega_total_uf} clp={calc.despues_entrega_total_uf * uf} />
                  <PreviewRow label="Crédito Hipotecario" detail={`${cfg.credito_porcentaje}% a financiar`} uf={calc.credito_uf} clp={calc.credito_uf * uf} bold />
                </tbody>
              </table>

              {/* Mortgage Simulation */}
              <h3 className="font-bold text-gray-700 mb-2 text-[10px] uppercase tracking-wider">Simulación Crédito Hipotecario ({cfg.tasa_anual}% anual)</h3>
              <table className="w-full text-xs mb-8 border-collapse">
                <thead>
                  <tr style={{ background: '#1e3a5f', color: '#fff' }}>
                    <th className="text-left font-bold py-2 px-3 pr-4 text-[10px] uppercase">Plazo</th>
                    <th className="text-right font-bold pb-2 pr-4 text-[10px] uppercase">Dividendo Base (UF)</th>
                    <th className="text-right font-bold pb-2 pr-4 text-[10px] uppercase">Seguros (UF)</th>
                    <th className="text-right font-bold pb-2 pr-4 text-[10px] uppercase">Dividendo total (UF)</th>
                    <th className="text-right font-bold pb-2 text-[10px] uppercase">Total Mensual (CLP)</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.simulacion.map(s => (
                    <tr key={s.años} className="border-b border-gray-200">
                      <td className="py-1.5 pr-4 text-gray-800">{s.años} años</td>
                      <td className="text-right py-1.5 pr-4 text-gray-800">{fmt(s.dividendo)} UF</td>
                      <td className="text-right py-1.5 pr-4 text-gray-500">{fmt(s.seguros.total)} UF</td>
                      <td className="text-right py-1.5 pr-4 font-semibold text-gray-800">{fmt(s.total)} UF</td>
                      <td className="text-right py-1.5 text-gray-800">{fmtCLP(s.total * uf)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Insurance */}
              <h3 className="font-bold text-gray-700 mb-2 text-[10px] uppercase tracking-wider">Detalle de Seguros Hipotecarios</h3>
              <div className="text-xs text-gray-600 space-y-1 mb-6">
                <p className="font-semibold text-gray-700 mt-3">Seguros Obligatorios:</p>
                <p>• Incendio + Sismo: ~0,0218 UF por cada 1.000 UF del monto asegurado</p>
                <p>• Desgravamen: ~0,0020 UF por cada 1.000 UF del saldo insoluto</p>
                <p>• Invalidez: ~0,0042 UF por cada 1.000 UF del saldo insoluto</p>
                <p className="font-semibold text-gray-700 mt-3">Seguros Opcionales:</p>
                <p>• Cesantía: Prima única prorrateada (ej: BancoChile 1,71‰ × meses)</p>
                <p>• Deducible sismo: 1% monto asegurado, mín. 25 UF</p>
                <p className="text-gray-400 mt-2">Nota: Cálculos referenciales, pueden variar según institución.</p>
              </div>

              {/* Policy */}
              <div className="border-t border-gray-300 pt-6 mt-8">
                <h3 className="font-bold text-gray-700 mb-2 text-xs">Política de Cotización y Reserva</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Estimado Cliente<br /><br />
                  Le informamos que la cotización proporcionada tiene carácter provisional y será tratada como un borrador hasta que se realice una reserva formal. Esto significa que:
                </p>
                <ul className="text-[11px] text-gray-500 list-disc list-inside mt-2 space-y-1">
                  <li>La información detallada en esta cotización, incluidos los precios, descuentos, condiciones y disponibilidad, está sujeta a cambios sin previo aviso.</li>
                  <li>La cotización no garantiza la disponibilidad de la unidad ni la vigencia de los términos ofrecidos hasta que se concrete la reserva.</li>
                  <li>Para asegurar la disponibilidad y las condiciones establecidas en esta cotización, es necesario que proceda a realizar la reserva correspondiente dentro del plazo indicado.</li>
                  <li>En caso de no efectuar la reserva antes de la fecha de vencimiento, la cotización podría quedar sin efecto y las condiciones podrían ser modificadas o actualizadas.</li>
                  <li>Agradecemos su interés y comprensión. Si tiene alguna duda o requiere más información, no dude en contactarnos.</li>
                </ul>
                <p className="text-[10px] text-gray-400 mt-6">Esta cotización es válida por 7 días.</p>
              </div>
              <div className="mt-8 pt-4 border-t border-gray-200 text-center">
                <p className="text-[10px]" style={{ color: '#0d9488' }}>PropiApp.cl — Tu propiedad, nuestro compromiso</p>
              </div>

              {/* Images Gallery */}
              {prop.images && prop.images.length > 0 && (
                <div className="border-t border-gray-300 pt-6 mt-8">
                  <h3 className="font-bold text-gray-700 mb-3 text-xs">Galería del Proyecto</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {prop.images
                      .slice()
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map(img => (
                        <img key={img.id} src={img.image_url} alt={prop.name}
                          className="w-full h-40 object-cover rounded-lg border border-gray-200" />
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {mostrarEmail && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setMostrarEmail(false)}>
          <div className="bg-white text-black rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-gray-900 mb-2">Enviar Cotización por Email</h3>
            <p className="text-[11px] text-gray-500 mb-4">Ingresa el correo electrónico del destinatario</p>
            <input
              type="email"
              value={emailDestino}
              onChange={e => setEmailDestino(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setMostrarEmail(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-semibold">Cancelar</button>
              <button onClick={enviarEmailPDF} disabled={!emailDestino || sending === 'email'}
                className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors">
                {sending === 'email' ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Share Functions ---- */

function buildQuoteText(data: {
  prop: Property; client: ClientInfo; unit: UnitInfo;
  cfg: PricingConfig; calc: any; uf: number; fechaStr: string;
}) {
  const { prop, client, unit, cfg, calc, uf, fechaStr } = data;
  return `🏠 Cotización PropiApp.cl
${prop.name} - Unidad ${unit.numero || '—'}
${fechaStr} | UF: ${fmt(uf)}

Cliente: ${client.nombre || '—'} | ${client.rut || '—'}
Ejecutivo: ${prop.ejecutivo_nombre || '—'} | ${prop.ejecutivo_whatsapp || '—'}

Desglose:
Precio Lista: ${fmtUF(calc.precio_lista)}
Descuento (${cfg.descuento_porcentaje}%): ${fmtUF(calc.descuento)}
Total Depto.: ${fmtUF(calc.precio_final)}
Bonificacion (${cfg.bonificacion_porcentaje}%): ${fmtUF(calc.bonificacion_uf)}
Estacionamiento(s): ${fmtUF(calc.estacionamientos_uf)}
Bodega(s): ${fmtUF(calc.bodegas_uf)}
Total a Escriturar: ${fmtUF(calc.total_escriturar)} (${fmtCLP(calc.total_escriturar * uf)})

Plan de Pagos:
Reserva: ${fmtUF(cfg.monto_reserva_uf)}
Abono Inicial (${cfg.pie_porcentaje}%): ${fmtUF(calc.abono_inicial_uf)}
Antes de Entrega (${cfg.antes_entrega_porcentaje}%): ${fmtUF(calc.antes_entrega_uf)}
Despues de Entrega (${cfg.despues_entrega_porcentaje}% - ${cfg.despues_entrega_cuotas} cuotas): ${fmtUF(calc.despues_entrega_total_uf)} c/u ${fmtUF(calc.despues_entrega_cuota_uf)}
Credito Hipotecario (${cfg.credito_porcentaje}%): ${fmtUF(calc.credito_uf)}

Simulacion (${cfg.tasa_anual}% anual):
${calc.simulacion.map((s: any) => `${s.años}a: ${fmt(s.total)} UF/mes (${fmtCLP(s.total * uf)})`).join('\n')}

Valida por 7 dias.`;
}

/* ---- Helpers ---- */

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{text}</span>
      {children}
    </label>
  );
}

function Row({ label, uf, clp, bold, large }: { label: string; uf: number; clp: number; bold?: boolean; large?: boolean }) {
  return (
    <div className={`flex justify-between items-center ${bold ? 'font-bold' : ''} ${large ? 'text-sm' : 'text-xs'}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">
        <span className={large ? 'text-primary' : ''}>{fmtUF(uf)}</span>
        <span className="text-muted-foreground ml-2">/{fmtCLP(clp)}</span>
      </span>
    </div>
  );
}

function RowEdit({ label, uf, clp, value, unit, onChange, extra, bold }: {
  label: string; uf: number; clp: number; value: number; unit: string; onChange: (v: number) => void; extra?: React.ReactNode; bold?: boolean;
}) {
  return (
    <div className={`flex flex-wrap justify-between items-center gap-1 ${bold ? 'font-bold' : ''} text-xs`}>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1">
          <input type="number" step="0.01" value={value} onChange={e => onChange(Number(e.target.value))}
            className="w-16 bg-background border border-border rounded px-2 h-7 text-xs text-foreground text-center" />
          <span className="text-[10px] text-muted-foreground">{unit}</span>
        </div>
        {extra}
      </div>
      <span className="text-right whitespace-nowrap">
        <span>{fmtUF(uf)}</span>
        <span className="text-muted-foreground ml-2">/{fmtCLP(clp)}</span>
      </span>
    </div>
  );
}

function PreviewRow({ label, detail, uf, clp, bold, large }: { label: string; detail?: string; uf: number; clp: number; bold?: boolean; large?: boolean }) {
  return (
    <tr className={`border-b border-gray-200 ${bold ? 'font-bold' : ''}`}>
      <td className={`py-2 px-3 pr-2 ${large ? 'text-gray-900' : 'text-gray-700'}`}>{label}</td>
      <td className={`py-2 px-3 pr-2 text-[10px] text-gray-400 ${large ? 'text-gray-900' : ''}`}>{detail || ''}</td>
      <td className={`text-right py-2 px-3 pr-2 ${large ? 'text-gray-900' : 'text-gray-700'}`}>{fmtUF(uf)}</td>
      <td className={`text-right py-2 px-3 ${large ? 'text-gray-900' : 'text-gray-700'}`}>{fmtCLP(clp)}</td>
    </tr>
  );
}

function SumValidator({ pct1, pct2, pct3, pct4 }: { pct1: number; pct2: number; pct3: number; pct4: number }) {
  const total = pct1 + pct2 + pct3 + pct4;
  const ok = Math.abs(total - 100) < 0.01;
  return (
    <div
      className="mt-3 text-xs font-bold rounded-lg px-3 py-2"
      style={{ backgroundColor: ok ? '#f0fdf4' : '#fef2f2', color: ok ? '#16a34a' : '#dc2626' }}
    >
      Total distribución: {fmt(total)}%
      {ok ? ' ✓' : ' — ¡Los porcentajes deben sumar 100%!'}
    </div>
  );
}
