import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { ALBERGUES, MAPA_INICIAL } from '../lib/config.js';
import { dibujarLluvia } from './capaLluvia.js';
import { valorCelda } from '../lib/wrf.js';
import { nombreCanton } from '../lib/cantones.js';

// Combina los 18 bloques en uno solo con el máximo por celda (peor escenario de las próximas 54 h).
function maximosPorCelda(wrf) {
  const { filas, cols } = wrf.malla;
  const plano = new Array(filas * cols).fill(0);
  for (let p = 0; p < wrf.pasos.length; p++) {
    for (let f = 0; f < filas; f++) {
      for (let c = 0; c < cols; c++) {
        const v = valorCelda(wrf, p, f, c);
        if (typeof v === 'number' && v > plano[f * cols + c]) plano[f * cols + c] = v;
      }
    }
  }
  return { malla: wrf.malla, pasos: ['max'], valores: [plano] };
}

/** Mapa público: SOLO zonas de alerta de lluvia y albergues. Nunca muestra reportes de familias. */
export default function MapaPreventivo({ wrf, cantones, umbral }) {
  const el = useRef(null);
  const mapa = useRef(null);
  const g = useRef({});
  const renderer = useRef(null);

  useEffect(() => {
    const m = L.map(el.current, { preferCanvas: true }).setView(MAPA_INICIAL.centro, MAPA_INICIAL.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; Colaboradores de OpenStreetMap' }).addTo(m);
    m.attributionControl.addAttribution('Capa meteorológica referencial: Modelo WRF - INAMHI');
    renderer.current = L.canvas({ padding: 0.3 });
    g.current = { cant: L.layerGroup().addTo(m), lluvia: L.layerGroup().addTo(m), alb: L.layerGroup().addTo(m) };

    ALBERGUES.forEach((a) => {
      L.marker([a.lat, a.lon], {
        icon: L.divIcon({ className: '', html: '<div class="pas-albergue">⌂</div>', iconSize: [28, 28], iconAnchor: [14, 14] }),
      })
        .bindPopup(`<b>${a.nombre}</b><br/>Capacidad aprox.: ${a.capacidad} personas`)
        .addTo(g.current.alb);
    });

    mapa.current = m;
    setTimeout(() => m.invalidateSize(), 200);
    return () => { m.remove(); mapa.current = null; };
  }, []);

  useEffect(() => {
    if (!g.current.cant || !cantones) return;
    g.current.cant.clearLayers();
    L.geoJSON(cantones, {
      style: { color: '#0284C7', weight: 1, fillOpacity: 0.02 },
      onEachFeature: (f, l) => l.bindTooltip(nombreCanton(f.properties), { sticky: true, className: 'pas-tooltip' }),
    }).addTo(g.current.cant);
  }, [cantones]);

  useEffect(() => {
    if (!g.current.lluvia || !wrf) return;
    dibujarLluvia(g.current.lluvia, maximosPorCelda(wrf), 0, renderer.current, umbral);
  }, [wrf, umbral]);

  return <div ref={el} className="h-full w-full" aria-label="Mapa preventivo con zonas de alerta y albergues" />;
}
