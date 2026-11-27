import { useEffect, useRef, useState } from 'react';
import { formatoPaso } from '../lib/wrf.js';
import { ESCALA_LLUVIA } from '../lib/config.js';

export default function TimelineWRF({ pasos, paso, setPaso, deshabilitado }) {
  const [reproduciendo, setReproduciendo] = useState(false);
  const ref = useRef(null);
  const total = pasos?.length || 0;

  useEffect(() => {
    if (!reproduciendo || !total) return undefined;
    ref.current = setInterval(() => setPaso((p) => (p + 1) % total), 900);
    return () => clearInterval(ref.current);
  }, [reproduciendo, total, setPaso]);

  if (!total) return null;

  return (
    <div className="pointer-events-auto rounded-xl bg-pizarra/95 p-3 text-humo shadow-2xl ring-1 ring-white/10 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={deshabilitado}
          onClick={() => setReproduciendo((r) => !r)}
          aria-label={reproduciendo ? 'Pausar línea de tiempo' : 'Reproducir línea de tiempo'}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cian text-xl font-bold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-40"
        >
          {reproduciendo ? '❚❚' : '▶'}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-bold capitalize">{formatoPaso(pasos[paso])}</span>
            <span className="shrink-0 text-xs text-slate-300">
              Bloque {paso + 1}/{total} · cada 3 h
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={total - 1}
            value={paso}
            onChange={(e) => setPaso(Number(e.target.value))}
            aria-label="Bloque horario del pronóstico"
            className="mt-1 h-2 w-full cursor-pointer accent-cyan-400"
          />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-300">
        <span className="font-semibold">mm / 3 h:</span>
        {ESCALA_LLUVIA.map((e) => (
          <span key={e.etiqueta} className="flex items-center gap-1">
            <i className="inline-block h-3 w-3 rounded-sm" style={{ background: e.color, opacity: Math.min(1, e.opacidad + 0.25) }} />
            {e.etiqueta}
          </span>
        ))}
      </div>
    </div>
  );
}
