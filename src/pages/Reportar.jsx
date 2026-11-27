import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogoPAS, NombrePAS, InsigniaPrioridad } from '../components/Marca.jsx';
import MiniMapa from '../components/MiniMapa.jsx';
import { calcularPrioridadPAS, META_PRIORIDAD } from '../lib/prioridad.js';
import { agregarReporte, ETIQUETA_VULNERABLE } from '../lib/reportes.js';
import { CANTONES_LISTA } from '../lib/config.js';
import { comprimirImagen, formatoKB } from '../lib/imagen.js';
import { useAuth } from '../lib/auth.js';

const OPC_AGUA = [
  ['patio_calle', 'Patio / calle', '< 20 cm'],
  ['dentro_vivienda', 'Dentro de la vivienda', '20 cm – 1 m'],
  ['mayor_1m', 'Inundación severa', '> 1 m'],
];
const OPC_VIVIENDA = [
  ['sin_dano', 'Sin daño estructural', ''],
  ['dano_parcial', 'Daño parcial / enseres perdidos', ''],
  ['colapso', 'Colapso / pérdida total', ''],
];

const INICIAL = {
  canton: '', sector: '', contacto: '', telefono: '', personas: 1,
  nivelAgua: 'patio_calle', estadoVivienda: 'sin_dano', personasAtrapadas: false, vulnerables: [],
};

function Opcion({ activo, onClick, titulo, sub, color = '#0284C7' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className="min-h-[60px] rounded-xl border-2 px-4 py-3 text-left transition active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300"
      style={{ borderColor: activo ? color : '#CBD5E1', background: activo ? color : '#fff', color: activo ? '#fff' : '#0F172A' }}
    >
      <div className="text-base font-extrabold leading-tight">{titulo}</div>
      {sub && <div className={`text-sm ${activo ? 'text-white/90' : 'text-slate-500'}`}>{sub}</div>}
    </button>
  );
}

export default function Reportar() {
  const { usuario } = useAuth();
  const [f, setF] = useState(INICIAL);
  const [pos, setPos] = useState(null);
  const [gpsMsg, setGpsMsg] = useState('');
  const [foto, setFoto] = useState(null); // { dataUrl, bytes, original }
  const [fotoMsg, setFotoMsg] = useState('');
  const [errores, setErrores] = useState({});
  const [guardado, setGuardado] = useState(null);

  const set = (k, v) => { setF((p) => ({ ...p, [k]: v })); setErrores((e) => ({ ...e, [k]: undefined })); };

  const prioridad = useMemo(
    () => calcularPrioridadPAS({ ...f, tieneVulnerables: f.vulnerables.length > 0 }),
    [f]
  );
  const meta = META_PRIORIDAD[prioridad];

  const alternarVulnerable = (k) =>
    set('vulnerables', f.vulnerables.includes(k) ? f.vulnerables.filter((x) => x !== k) : [...f.vulnerables, k]);

  const obtenerGPS = () => {
    if (!navigator.geolocation) { setGpsMsg('Tu dispositivo no permite geolocalización. Toca el mapa para marcar el punto.'); return; }
    setGpsMsg('Buscando señal GPS…');
    navigator.geolocation.getCurrentPosition(
      (p) => { setPos([p.coords.latitude, p.coords.longitude]); setGpsMsg(`Ubicación obtenida (±${Math.round(p.coords.accuracy)} m)`); setErrores((e) => ({ ...e, pos: undefined })); },
      () => setGpsMsg('No se pudo obtener el GPS. Toca el mini-mapa para marcar la ubicación.'),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  };

  const elegirEnMapa = (p) => { setPos(p); setGpsMsg('Ubicación marcada en el mapa'); setErrores((e) => ({ ...e, pos: undefined })); };

  const onFoto = async (e) => {
    const a = e.target.files?.[0];
    if (!a) return;
    setFotoMsg('Comprimiendo…');
    try {
      const r = await comprimirImagen(a);
      setFoto(r);
      setFotoMsg(`${formatoKB(r.original)} → ${formatoKB(r.bytes)}`);
    } catch {
      setFotoMsg('No se pudo procesar la imagen. Intenta con otra.');
    }
  };

  const validar = () => {
    const er = {};
    if (!f.canton) er.canton = 'Selecciona el cantón.';
    if (!f.sector.trim()) er.sector = 'Indica el sector o parroquia.';
    if (!pos) er.pos = 'Obtén tu ubicación o márcala en el mapa.';
    if (!f.contacto.trim()) er.contacto = 'Escribe el nombre de contacto.';
    if (!/^[0-9+\s-]{7,15}$/.test(f.telefono.trim())) er.telefono = 'Teléfono no válido.';
    if (!(Number(f.personas) >= 1)) er.personas = 'Mínimo 1 persona.';
    return er;
  };

  const guardar = (e) => {
    e.preventDefault();
    const er = validar();
    setErrores(er);
    if (Object.keys(er).length) {
      document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const r = agregarReporte({
      canton: f.canton, sector: f.sector.trim(), lat: pos[0], lon: pos[1],
      contacto: f.contacto.trim(), telefono: f.telefono.trim(), personas: Number(f.personas),
      nivelAgua: f.nivelAgua, estadoVivienda: f.estadoVivienda, personasAtrapadas: f.personasAtrapadas,
      vulnerables: f.vulnerables, foto: foto?.dataUrl || null,
    });
    setGuardado(r);
  };

  const nuevo = () => { setF(INICIAL); setPos(null); setFoto(null); setFotoMsg(''); setGpsMsg(''); setErrores({}); setGuardado(null); };

  const Error = ({ k }) => (errores[k] ? <p data-error="true" role="alert" className="mt-1 text-sm font-bold text-critico">{errores[k]}</p> : null);

  const cabecera = (
    <header className="sticky top-0 z-[1100] flex items-center gap-3 bg-pizarra px-4 py-3 text-humo shadow-lg">
      <LogoPAS tamano={36} />
      <div className="min-w-0 flex-1">
        <NombrePAS subtitulo={false} />
      </div>
      <div className="hidden text-xs font-bold uppercase tracking-widest text-cian-claro sm:block">Levantamiento en campo</div>
      <Link to={usuario ? '/dashboard' : '/login'} className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/20">
        {usuario ? '← Dashboard' : 'Ingresar'}
      </Link>
    </header>
  );

  if (guardado) {
    const m = META_PRIORIDAD[guardado.prioridad];
    return (
      <div className="min-h-full bg-humo">
        {cabecera}
        <main className="mx-auto max-w-lg p-5">
          <div className="rounded-2xl bg-white p-6 text-center shadow-lg ring-1 ring-slate-200">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl text-white" style={{ background: m.color }}>✓</div>
            <h1 className="mt-4 text-2xl font-black">Reporte registrado</h1>
            <p className="mt-1 text-slate-600">Código <b>{guardado.id}</b></p>
            <div className="mt-4"><InsigniaPrioridad prioridad={guardado.prioridad} grande /></div>
            <p className="mt-2 font-semibold" style={{ color: m.color }}>{m.nombre} · {m.detalle}</p>
            <p className="mt-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
              {guardado.sincronizado
                ? 'El caso ya aparece en el mapa del Centro de Monitoreo.'
                : 'Sin conexión: el caso quedó guardado en este dispositivo y se sincronizará al recuperar la señal.'}
            </p>
            <div className="mt-5 grid gap-3">
              <button type="button" onClick={nuevo} className="btn-primario">Registrar otra familia</button>
              <Link to={usuario ? '/dashboard' : '/comunidad'} className="btn-claro">{usuario ? 'Ver en el dashboard' : 'Ir al Hub Ciudadano'}</Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-humo pb-40">
      {cabecera}
      <form onSubmit={guardar} noValidate className="mx-auto max-w-2xl space-y-6 p-4">
        <div>
          <h1 className="text-2xl font-black">Triaje rápido de afectación</h1>
          <p className="text-slate-600">Menos de 2 minutos. Los campos con * son obligatorios.</p>
        </div>

        {/* Ubicación administrativa */}
        <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-black">1 · ¿Dónde?</h2>
          <div>
            <label htmlFor="canton" className="etiqueta">Cantón *</label>
            <select id="canton" className="campo" value={f.canton} onChange={(e) => set('canton', e.target.value)}>
              <option value="">Selecciona…</option>
              {CANTONES_LISTA.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Error k="canton" />
          </div>
          <div>
            <label htmlFor="sector" className="etiqueta">Sector / Parroquia *</label>
            <input id="sector" className="campo" placeholder="Ej.: Guasmo Sur" value={f.sector} onChange={(e) => set('sector', e.target.value)} />
            <Error k="sector" />
          </div>
          <div>
            <span className="etiqueta">Ubicación GPS *</span>
            <button type="button" onClick={obtenerGPS} className="btn-primario w-full">📍 Obtener mi ubicación actual</button>
            {gpsMsg && <p className="mt-2 text-sm font-semibold text-slate-700" role="status">{gpsMsg}</p>}
            <p className="mb-2 mt-3 text-sm text-slate-600">O toca el mapa para marcar el punto exacto:</p>
            <MiniMapa posicion={pos} onElegir={elegirEnMapa} />
            {pos && <p className="mt-1 text-xs text-slate-500">Lat {pos[0].toFixed(5)} · Lon {pos[1].toFixed(5)}</p>}
            <Error k="pos" />
          </div>
        </section>

        {/* Contacto */}
        <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-black">2 · ¿Quién?</h2>
          <div>
            <label htmlFor="contacto" className="etiqueta">Nombre del contacto / jefe de familia *</label>
            <input id="contacto" className="campo" autoComplete="name" value={f.contacto} onChange={(e) => set('contacto', e.target.value)} />
            <Error k="contacto" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="telefono" className="etiqueta">Teléfono *</label>
              <input id="telefono" type="tel" inputMode="tel" autoComplete="tel" className="campo" placeholder="09XXXXXXXX" value={f.telefono} onChange={(e) => set('telefono', e.target.value)} />
              <Error k="telefono" />
            </div>
            <div>
              <label htmlFor="personas" className="etiqueta">Personas afectadas *</label>
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Menos personas" onClick={() => set('personas', Math.max(1, Number(f.personas) - 1))} className="btn-claro !min-h-[48px] !w-14 !px-0 text-2xl">−</button>
                <input id="personas" type="number" inputMode="numeric" min={1} className="campo text-center text-xl font-black" value={f.personas} onChange={(e) => set('personas', e.target.value)} />
                <button type="button" aria-label="Más personas" onClick={() => set('personas', Number(f.personas) + 1)} className="btn-claro !min-h-[48px] !w-14 !px-0 text-2xl">+</button>
              </div>
              <Error k="personas" />
            </div>
          </div>
        </section>

        {/* Nivel de afectación */}
        <section className="space-y-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-black">3 · Nivel de afectación</h2>

          <div>
            <span className="etiqueta">Nivel del agua</span>
            <div className="grid gap-2">
              {OPC_AGUA.map(([v, t, s], i) => (
                <Opcion key={v} activo={f.nivelAgua === v} onClick={() => set('nivelAgua', v)} titulo={t} sub={s} color={['#16A34A', '#D97706', '#DC2626'][i]} />
              ))}
            </div>
          </div>

          <div>
            <span className="etiqueta">Estado estructural</span>
            <div className="grid gap-2">
              {OPC_VIVIENDA.map(([v, t], i) => (
                <Opcion key={v} activo={f.estadoVivienda === v} onClick={() => set('estadoVivienda', v)} titulo={t} color={['#16A34A', '#D97706', '#DC2626'][i]} />
              ))}
            </div>
          </div>

          <label className={`flex min-h-[60px] cursor-pointer items-center gap-3 rounded-xl border-2 p-3 ${f.personasAtrapadas ? 'border-critico bg-red-50' : 'border-slate-300'}`}>
            <input type="checkbox" className="h-7 w-7 accent-red-600" checked={f.personasAtrapadas} onChange={(e) => set('personasAtrapadas', e.target.checked)} />
            <span className="text-base font-extrabold">Hay personas atrapadas <span className="block text-sm font-semibold text-slate-600">Prioridad ROJO automática</span></span>
          </label>

          <div>
            <span className="etiqueta">Grupos vulnerables en el hogar</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(ETIQUETA_VULNERABLE).map(([k, t]) => (
                <label key={k} className={`flex min-h-[56px] cursor-pointer items-center gap-3 rounded-xl border-2 p-3 ${f.vulnerables.includes(k) ? 'border-cian bg-sky-50' : 'border-slate-300'}`}>
                  <input type="checkbox" className="h-6 w-6 accent-sky-600" checked={f.vulnerables.includes(k)} onChange={() => alternarVulnerable(k)} />
                  <span className="text-base font-bold">{t}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Foto */}
        <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-black">4 · Evidencia fotográfica <span className="text-sm font-semibold text-slate-500">(opcional)</span></h2>
          <label className="btn-claro w-full cursor-pointer">
            📷 Tomar o elegir foto
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={onFoto} />
          </label>
          {fotoMsg && <p className="text-sm font-semibold text-slate-700" role="status">Compresión: {fotoMsg}</p>}
          {foto && (
            <div className="relative">
              <img src={foto.dataUrl} alt="Vista previa de la evidencia" className="max-h-64 w-full rounded-xl object-cover" />
              <button type="button" onClick={() => { setFoto(null); setFotoMsg(''); }} className="absolute right-2 top-2 rounded-lg bg-pizarra/90 px-3 py-2 text-sm font-bold text-white">Quitar</button>
            </div>
          )}
        </section>
      </form>

      {/* Indicador de prioridad en tiempo real + guardar */}
      <div className="fixed inset-x-0 bottom-0 z-[1200] border-t-4 bg-white p-3 shadow-[0_-8px_24px_rgba(0,0,0,.18)]" style={{ borderColor: meta.color }}>
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3" aria-live="polite">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl font-black text-white" style={{ background: meta.color }}>
              {prioridad === 'rojo' ? '!' : prioridad === 'amarillo' ? '▲' : '●'}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Prioridad asignada</div>
              <div className="text-xl font-black" style={{ color: meta.color }}>{meta.etiqueta}</div>
              <div className="truncate text-xs text-slate-600">{meta.nombre} · {meta.detalle}</div>
            </div>
          </div>
          <button type="button" onClick={guardar} className="btn-primario !min-h-[56px] shrink-0 !px-6 text-lg">Guardar reporte</button>
        </div>
      </div>
    </div>
  );
}
