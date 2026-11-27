import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, ETIQUETA_ROL } from '../lib/auth.js';
import { calcularKpis, marcarSincronizados, useReportes } from '../lib/reportes.js';
import { useDatosClima } from '../lib/useDatosClima.js';
import { useUmbral } from '../lib/umbral.js';
import { maximoPaso } from '../lib/wrf.js';
import { LogoPAS, NombrePAS, InsigniaModoDatos } from '../components/Marca.jsx';
import MapaMonitoreo from '../components/MapaMonitoreo.jsx';
import TimelineWRF from '../components/TimelineWRF.jsx';
import PanelTriaje from '../components/PanelTriaje.jsx';
import PanelAdmin from '../components/PanelAdmin.jsx';

function Kpi({ titulo, valor, color, texto = 'text-white', sub }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: color }}>
      <div className={`text-4xl font-black leading-none tabular-nums ${texto}`}>{valor}</div>
      <div className={`min-w-0 leading-tight ${texto}`}>
        <div className="truncate text-sm font-extrabold uppercase tracking-wide">{titulo}</div>
        <div className="truncate text-[11px] opacity-90">{sub}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { usuario, cerrarSesion } = useAuth();
  const nav = useNavigate();
  const reportes = useReportes();
  const clima = useDatosClima();
  const [umbral, setUmbral] = useUmbral();

  const [paso, setPaso] = useState(0);
  const [capas, setCapas] = useState({ cantones: true, lluvia: true, reportes: true });
  const [seleccionId, setSeleccionId] = useState(null);
  const [adminAbierto, setAdminAbierto] = useState(false);
  const [vistaMovil, setVistaMovil] = useState('mapa'); // en móvil: mapa | casos
  const [enLinea, setEnLinea] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  const kpis = useMemo(() => calcularKpis(reportes), [reportes]);
  const pendientesSync = reportes.filter((r) => !r.sincronizado).length;
  const esAdmin = usuario?.rol === 'admin';

  // Simulación de sincronización al recuperar conexión
  useEffect(() => {
    const on = () => { setEnLinea(true); setTimeout(marcarSincronizados, 1200); };
    const off = () => setEnLinea(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    if (navigator.onLine) marcarSincronizados();
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const maxMm = useMemo(() => (clima.wrf ? maximoPaso(clima.wrf, paso) : 0), [clima.wrf, paso]);

  const alternarCapa = (k) => setCapas((c) => ({ ...c, [k]: !c[k] }));

  const salir = () => { cerrarSesion(); nav('/login', { replace: true }); };

  const seleccionar = (id) => { setSeleccionId(id); setVistaMovil('mapa'); };

  return (
    <div className="flex h-full flex-col bg-pizarra text-humo">
      {/* Barra superior */}
      <header className="shrink-0 border-b border-white/10 bg-pizarra">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <LogoPAS tamano={40} />
            <NombrePAS subtitulo={false} />
          </div>
          <div className="hidden text-xs font-semibold uppercase tracking-widest text-cian-claro md:block">Centro de Monitoreo</div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <InsigniaModoDatos modo={clima.modo} />
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${enLinea ? 'bg-slate-700 text-slate-200' : 'bg-amber-900 text-amber-200'}`}>
              {enLinea ? 'En línea' : 'Sin conexión'}{pendientesSync > 0 ? ` · ${pendientesSync} por sincronizar` : ''}
            </span>
            <span className="rounded-lg bg-pizarra-700 px-3 py-1.5 text-sm">
              <b>{usuario.nombre}</b> · <span className="text-cian-claro">{ETIQUETA_ROL[usuario.rol]}</span>
            </span>
            {esAdmin && (
              <button type="button" onClick={() => setAdminAbierto(true)} className="min-h-[44px] rounded-xl bg-pizarra-700 px-4 text-sm font-bold hover:bg-pizarra-600">⚙ Administración</button>
            )}
            <button type="button" onClick={salir} className="min-h-[44px] rounded-xl bg-white/10 px-4 text-sm font-bold hover:bg-white/20">Cerrar sesión</button>
          </div>
        </div>

        <div className="flex flex-wrap items-stretch gap-2 px-3 pb-3">
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 lg:grid-cols-4">
            <Kpi titulo="Críticos" valor={kpis.criticos} color="#DC2626" sub="Atención inmediata" />
            <Kpi titulo="Urgentes" valor={kpis.urgentes} color="#D97706" sub="Atención prioritaria" />
            <Kpi titulo="Preventivos" valor={kpis.preventivos} color="#16A34A" sub="Monitoreo" />
            <Kpi titulo="Atendidos" valor={kpis.atendidos} color="#0284C7" sub="Casos cerrados" />
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Link to="/reportar" className="btn-primario flex-1 !min-h-[56px] sm:flex-none">＋ Formulario de campo</Link>
            <Link to="/comunidad" className="btn-claro flex-1 !min-h-[56px] sm:flex-none">Hub Ciudadano</Link>
          </div>
        </div>

        {/* Selector móvil mapa/casos */}
        <div className="grid grid-cols-2 gap-1 border-t border-white/10 p-1.5 lg:hidden">
          {[['mapa', '🗺 Mapa'], ['casos', `📋 Casos (${reportes.length})`]].map(([k, t]) => (
            <button key={k} type="button" onClick={() => setVistaMovil(k)} className={`min-h-[44px] rounded-lg text-sm font-bold ${vistaMovil === k ? 'bg-cian text-white' : 'bg-pizarra-700 text-slate-300'}`}>{t}</button>
          ))}
        </div>
      </header>

      {/* Cuerpo: mapa 70% + panel 30% */}
      <main className="flex min-h-0 flex-1">
        <section className={`relative min-w-0 flex-1 lg:basis-[70%] ${vistaMovil === 'mapa' ? 'block' : 'hidden'} lg:block`}>
          <MapaMonitoreo
            wrf={clima.wrf}
            cantones={clima.cantones}
            reportes={reportes}
            paso={paso}
            capas={capas}
            seleccionId={seleccionId}
            onSeleccion={setSeleccionId}
          />

          {/* Control de capas */}
          <div className="absolute left-3 top-3 z-[1000] w-52 rounded-xl bg-pizarra/95 p-3 text-humo shadow-2xl ring-1 ring-white/10">
            <div className="mb-1.5 text-xs font-extrabold uppercase tracking-widest text-cian-claro">Capas</div>
            {[
              ['cantones', 'Límites cantonales'],
              ['lluvia', 'Pronóstico WRF'],
              ['reportes', 'Reportes PAS'],
            ].map(([k, t]) => (
              <label key={k} className="flex min-h-[40px] cursor-pointer items-center gap-2.5 text-sm font-semibold">
                <input type="checkbox" checked={capas[k]} onChange={() => alternarCapa(k)} className="h-5 w-5 accent-sky-500" />
                {t}
              </label>
            ))}
            {clima.wrf && capas.lluvia && (
              <div className={`mt-1.5 rounded-lg px-2 py-1 text-xs font-bold ${maxMm >= umbral ? 'bg-critico text-white' : 'bg-pizarra-700 text-slate-200'}`}>
                Máx. del bloque: {maxMm.toFixed(1)} mm/3 h{maxMm >= umbral ? ' · ALERTA' : ''}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="pointer-events-none absolute inset-x-3 bottom-8 z-[1000] mx-auto max-w-3xl">
            <TimelineWRF pasos={clima.wrf?.pasos} paso={paso} setPaso={setPaso} deshabilitado={!clima.wrf} />
          </div>
        </section>

        <aside className={`min-h-0 w-full border-l border-white/10 lg:block lg:w-auto lg:basis-[30%] lg:min-w-[320px] lg:max-w-[460px] ${vistaMovil === 'casos' ? 'block' : 'hidden'}`}>
          <PanelTriaje reportes={reportes} seleccionId={seleccionId} onSeleccion={seleccionar} />
        </aside>
      </main>

      {esAdmin && <PanelAdmin abierto={adminAbierto} onCerrar={() => setAdminAbierto(false)} umbral={umbral} setUmbral={setUmbral} />}
    </div>
  );
}
