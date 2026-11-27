import { useMemo, useState } from 'react';
import { InsigniaPrioridad } from './Marca.jsx';
import { META_PRIORIDAD } from '../lib/prioridad.js';
import { ETIQUETA_AGUA, ETIQUETA_ESTADO, ordenarPorGravedad, avanzarEstado } from '../lib/reportes.js';
import { CANTONES_LISTA } from '../lib/config.js';

const FILTROS = [
  ['todos', 'Todos'],
  ['pendiente', 'Pendiente'],
  ['en_atencion', 'En atención'],
  ['atendido', 'Atendido'],
];

const ACCION = {
  pendiente: { texto: 'Iniciar atención →', clase: 'bg-critico text-white' },
  en_atencion: { texto: 'Marcar atendido ✓', clase: 'bg-urgente text-white' },
  atendido: { texto: 'Reabrir ↺', clase: 'bg-slate-600 text-white' },
};

function haceCuanto(iso) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return 'justo ahora';
  if (min < 60) return `hace ${min} min`;
  return `hace ${Math.floor(min / 60)} h ${min % 60} min`;
}

export default function PanelTriaje({ reportes, seleccionId, onSeleccion }) {
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroCanton, setFiltroCanton] = useState('todos');

  const cantones = useMemo(
    () => Array.from(new Set([...CANTONES_LISTA, ...reportes.map((r) => r.canton)])).sort((a, b) => a.localeCompare(b, 'es')),
    [reportes]
  );

  const lista = useMemo(() => {
    const filtrada = reportes.filter(
      (r) => (filtroEstado === 'todos' || r.estado === filtroEstado) && (filtroCanton === 'todos' || r.canton === filtroCanton)
    );
    // Atendidos al final dentro de la misma gravedad, el resto por Rojo → Amarillo → Verde
    return ordenarPorGravedad(filtrada).sort((a, b) => (a.estado === 'atendido') - (b.estado === 'atendido'));
  }, [reportes, filtroEstado, filtroCanton]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-pizarra text-humo">
      <div className="space-y-3 border-b border-white/10 p-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-black">Triaje y despacho</h2>
          <span className="text-xs text-slate-400">{lista.length} de {reportes.length} casos</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Filtrar por estado">
          {FILTROS.map(([k, t]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFiltroEstado(k)}
              className={`min-h-[40px] rounded-lg px-1 text-xs font-bold transition ${filtroEstado === k ? 'bg-cian text-white' : 'bg-pizarra-700 text-slate-300 hover:bg-pizarra-600'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <select
          value={filtroCanton}
          onChange={(e) => setFiltroCanton(e.target.value)}
          aria-label="Filtrar por cantón"
          className="min-h-[44px] w-full rounded-lg bg-pizarra-700 px-3 text-sm font-semibold text-humo focus:outline-none focus:ring-2 focus:ring-cian"
        >
          <option value="todos">Todos los cantones</option>
          {cantones.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <ul className="scroll-fino min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3">
        {lista.length === 0 && (
          <li className="rounded-xl bg-pizarra-700 p-6 text-center text-sm text-slate-300">No hay casos con estos filtros.</li>
        )}
        {lista.map((r) => {
          const meta = META_PRIORIDAD[r.prioridad];
          const acc = ACCION[r.estado];
          const atendido = r.estado === 'atendido';
          return (
            <li
              key={r.id}
              className={`overflow-hidden rounded-xl bg-pizarra-700 transition ${seleccionId === r.id ? 'ring-2 ring-cian-claro' : ''} ${atendido ? 'opacity-60' : ''}`}
              style={{ borderLeft: `6px solid ${meta.color}` }}
            >
              <button type="button" onClick={() => onSeleccion(r.id)} className="block w-full p-3 text-left">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <InsigniaPrioridad prioridad={r.prioridad} />
                    <span className="text-sm font-bold">{r.id}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{haceCuanto(r.creado)}</span>
                </div>
                <div className="mt-1.5 text-base font-bold leading-tight">{r.canton} · {r.sector}</div>
                <div className="mt-1 text-xs text-slate-300">
                  {r.personas} {r.personas === 1 ? 'persona' : 'personas'} · {ETIQUETA_AGUA[r.nivelAgua]}
                  {r.personasAtrapadas && <b className="text-red-400"> · ATRAPADAS</b>}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className="rounded bg-pizarra px-2 py-0.5 font-semibold text-slate-200">{ETIQUETA_ESTADO[r.estado]}</span>
                  {!r.sincronizado && <span className="rounded bg-amber-900 px-2 py-0.5 font-semibold text-amber-300">Pendiente de sincronizar</span>}
                </div>
              </button>
              <div className="flex gap-2 px-3 pb-3">
                <button type="button" onClick={() => avanzarEstado(r.id)} className={`min-h-[44px] flex-1 rounded-lg px-3 text-sm font-extrabold transition hover:brightness-110 active:scale-[0.98] ${acc.clase}`}>
                  {acc.texto}
                </button>
                <a href={`tel:${r.telefono}`} aria-label={`Llamar a ${r.contacto}`} className="flex min-h-[44px] w-12 items-center justify-center rounded-lg bg-pizarra text-lg hover:bg-pizarra-600">📞</a>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
