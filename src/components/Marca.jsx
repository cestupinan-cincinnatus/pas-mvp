// Identidad visual propia de PAS (original, sin elementos de entidades gubernamentales).
export function LogoPAS({ tamano = 40 }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 64 64" role="img" aria-label="Logo PAS">
      <rect width="64" height="64" rx="14" fill="#0284C7" />
      <path d="M32 9c7 10 14 17 14 26a14 14 0 0 1-28 0c0-9 7-16 14-26z" fill="#0F172A" />
      <path d="M24 36h16M32 28v16" stroke="#F8FAFC" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function NombrePAS({ claro = true, subtitulo = true }) {
  return (
    <div className="leading-tight">
      <div className={`text-2xl font-black tracking-wide ${claro ? 'text-humo' : 'text-pizarra'}`}>PAS</div>
      {subtitulo && (
        <div className={`text-[11px] font-semibold uppercase tracking-widest ${claro ? 'text-cian-claro' : 'text-cian'}`}>
          Proteger · Avisar · Socorrer
        </div>
      )}
    </div>
  );
}

export function InsigniaPrioridad({ prioridad, grande = false }) {
  const m = {
    rojo: { t: 'ROJO', c: '#DC2626' },
    amarillo: { t: 'AMARILLO', c: '#D97706' },
    verde: { t: 'VERDE', c: '#16A34A' },
  }[prioridad];
  return (
    <span
      className={`inline-flex items-center rounded-full font-extrabold text-white ${grande ? 'px-4 py-1.5 text-base' : 'px-2.5 py-0.5 text-[11px]'}`}
      style={{ background: m.c }}
    >
      {m.t}
    </span>
  );
}

export function InsigniaModoDatos({ modo }) {
  const vivo = modo === 'vivo';
  const cargando = modo === 'cargando';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${
        cargando ? 'bg-slate-700 text-slate-200 ring-slate-500' : vivo ? 'bg-emerald-950 text-emerald-300 ring-emerald-500' : 'bg-amber-950 text-amber-300 ring-amber-500'
      }`}
      title={vivo ? 'Datos reales del INAMHI' : 'No se pudo acceder al INAMHI (CORS/red): se usa una simulación realista'}
    >
      <i className={`h-2 w-2 rounded-full ${cargando ? 'bg-slate-400' : vivo ? 'bg-emerald-400' : 'bg-amber-400'}`} />
      {cargando ? 'Modo Datos: Conectando…' : vivo ? 'Modo Datos: API en vivo' : 'Modo Datos: Simulación Respaldo'}
    </span>
  );
}
