import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogoPAS, NombrePAS, InsigniaModoDatos } from '../components/Marca.jsx';
import MapaPreventivo from '../components/MapaPreventivo.jsx';
import { DIRECTORIO, ESCALA_LLUVIA } from '../lib/config.js';
import { useDatosClima } from '../lib/useDatosClima.js';
import { leerUmbral } from '../lib/umbral.js';
import { useAuth } from '../lib/auth.js';

const PROTOCOLOS = [
  {
    fase: 'ANTES',
    titulo: 'Proteger',
    color: '#0284C7',
    icono: '🛡',
    pasos: [
      'Prepara una mochila de emergencia: agua, alimentos no perecibles, linterna, radio, botiquín y medicinas.',
      'Guarda documentos importantes en una bolsa plástica sellada.',
      'Conoce tu ruta de evacuación y el punto seguro o albergue más cercano.',
      'Acuerda con tu familia un punto de encuentro y anota los teléfonos de emergencia.',
      'Limpia canaletas y desagües; sube enseres y artefactos a lugares altos.',
      'Revisa el pronóstico de lluvias y las alertas oficiales.',
    ],
  },
  {
    fase: 'DURANTE',
    titulo: 'Avisar y evacuar',
    color: '#DC2626',
    icono: '🚨',
    pasos: [
      'Si te piden evacuar o el agua sube rápido, sal de inmediato hacia terreno alto.',
      'Corta la luz y el gas antes de salir, si puedes hacerlo con seguridad.',
      'No camines ni conduzcas por agua en movimiento: 15 cm pueden derribarte.',
      'Aléjate de cables caídos, postes y paredes dañadas.',
      'Ayuda primero a niños, adultos mayores, embarazadas y personas con discapacidad.',
      'Llama al 911 si hay personas atrapadas o en peligro y reporta tu ubicación.',
    ],
  },
  {
    fase: 'DESPUÉS',
    titulo: 'Socorrer y recuperar',
    color: '#16A34A',
    icono: '🤝',
    pasos: [
      'Regresa a casa solo cuando las autoridades indiquen que es seguro.',
      'Revisa grietas y estructura antes de entrar; no enciendas la luz si hay humedad.',
      'Hierve o desinfecta el agua para beber; descarta alimentos que tocaron el agua.',
      'Usa botas, guantes y mascarilla al limpiar: hay lodo contaminado.',
      'Elimina agua estancada para evitar mosquitos (dengue).',
      'Reporta tu afectación a los equipos de PAS y toma fotos como respaldo.',
    ],
  },
];

const TABS = [
  ['directorio', '📞 Directorio'],
  ['mapa', '🗺 Mapa preventivo'],
  ['protocolos', '📘 Protocolos PAS'],
];

export default function Comunidad() {
  const { usuario } = useAuth();
  const [tab, setTab] = useState('directorio');
  const clima = useDatosClima();
  const umbral = leerUmbral();

  return (
    <div className="flex min-h-full flex-col bg-humo">
      <header className="sticky top-0 z-[1100] bg-pizarra text-humo shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <LogoPAS tamano={36} />
          <NombrePAS subtitulo={false} />
          <div className="ml-auto flex items-center gap-2">
            <Link to="/reportar" className="hidden rounded-xl bg-cian px-4 py-2.5 text-sm font-bold sm:block">Reportar afectación</Link>
            <Link to={usuario ? '/dashboard' : '/login'} className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/20">
              {usuario ? '← Dashboard' : 'Acceso operadores'}
            </Link>
          </div>
        </div>
        <nav className="mx-auto grid max-w-5xl grid-cols-3 gap-1 px-2 pb-2" role="tablist" aria-label="Secciones del Hub Ciudadano">
          {TABS.map(([k, t]) => (
            <button key={k} role="tab" aria-selected={tab === k} type="button" onClick={() => setTab(k)}
              className={`min-h-[52px] rounded-xl px-1 text-sm font-extrabold transition sm:text-base ${tab === k ? 'bg-cian text-white' : 'bg-pizarra-700 text-slate-300 hover:bg-pizarra-600'}`}>
              {t}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 p-4">
        {tab === 'directorio' && (
          <section>
            <h1 className="text-2xl font-black">Directorio de emergencia</h1>
            <p className="text-slate-600">Toca un botón para llamar directamente.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {DIRECTORIO.map((d) => (
                <a key={d.id} href={`tel:${d.numero}`} className="flex min-h-[96px] items-center gap-4 rounded-2xl p-4 text-white shadow-lg transition active:scale-[0.98]" style={{ background: d.color }}>
                  <span className="text-4xl" aria-hidden>📞</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xl font-black leading-tight">{d.nombre}</span>
                    <span className="block text-sm opacity-90">{d.detalle}</span>
                  </span>
                  <span className="rounded-xl bg-black/25 px-3 py-2 text-2xl font-black tabular-nums">{d.numero}</span>
                </a>
              ))}
            </div>
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
              En caso de peligro inmediato para la vida, llama primero al <b>911</b>.
            </p>
          </section>
        )}

        {tab === 'mapa' && (
          <section>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-black">Mapa preventivo</h1>
                <p className="text-slate-600">Zonas con lluvia intensa pronosticada (≥ {umbral} mm en 3 h) y puntos seguros.</p>
              </div>
              <InsigniaModoDatos modo={clima.modo} />
            </div>
            <div className="mt-3 h-[58vh] min-h-[360px] overflow-hidden rounded-2xl border-2 border-slate-300 shadow">
              <MapaPreventivo wrf={clima.wrf} cantones={clima.cantones} umbral={umbral} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span className="flex items-center gap-2 font-bold"><i className="flex h-6 w-6 items-center justify-center rounded-md bg-cian text-xs text-white">⌂</i> Albergue / punto seguro</span>
              {ESCALA_LLUVIA.filter((e) => e.max > umbral).map((e) => (
                <span key={e.etiqueta} className="flex items-center gap-1.5"><i className="inline-block h-4 w-4 rounded-sm" style={{ background: e.color }} />{e.etiqueta}</span>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">Por privacidad, este mapa no muestra datos ni ubicaciones de familias que han reportado afectaciones. Los albergues mostrados son de demostración.</p>
          </section>
        )}

        {tab === 'protocolos' && (
          <section>
            <h1 className="text-2xl font-black">Protocolos PAS de autoprotección</h1>
            <p className="text-slate-600">Qué hacer ante una inundación.</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {PROTOCOLOS.map((p) => (
                <article key={p.fase} className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
                  <div className="flex items-center gap-3 p-4 text-white" style={{ background: p.color }}>
                    <span className="text-4xl" aria-hidden>{p.icono}</span>
                    <div>
                      <div className="text-xs font-extrabold tracking-widest opacity-90">{p.fase}</div>
                      <div className="text-xl font-black leading-tight">{p.titulo}</div>
                    </div>
                  </div>
                  <ol className="space-y-3 p-4">
                    {p.pasos.map((t, i) => (
                      <li key={i} className="flex gap-3 text-base leading-snug">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black text-white" style={{ background: p.color }}>{i + 1}</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="px-4 py-4 text-center text-xs text-slate-500">PAS · Proteger, Avisar, Socorrer — Prototipo funcional</footer>
    </div>
  );
}
