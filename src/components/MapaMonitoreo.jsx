import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MAPA_INICIAL } from '../lib/config.js';
import { nombreCanton } from '../lib/cantones.js';
import { dibujarLluvia } from './capaLluvia.js';
import { META_PRIORIDAD } from '../lib/prioridad.js';
import { ETIQUETA_AGUA, ETIQUETA_ESTADO, ETIQUETA_VIVIENDA, ETIQUETA_VULNERABLE } from '../lib/reportes.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function iconoPin(prioridad, atendido) {
  const color = META_PRIORIDAD[prioridad].color;
  return L.divIcon({
    className: '',
    html: `<div class="pas-pin ${prioridad === 'rojo' && !atendido ? 'pas-pin-pulso' : ''}" style="background:${color};opacity:${atendido ? 0.45 : 1}"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -12],
  });
}

export function popupReporte(r) {
  const meta = META_PRIORIDAD[r.prioridad];
  const vul = (r.vulnerables || []).map((v) => ETIQUETA_VULNERABLE[v]).join(', ') || 'Ninguno';
  return `
    <div style="min-width:210px;font-family:inherit">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="background:${meta.color};color:#fff;font-weight:800;font-size:11px;padding:2px 8px;border-radius:999px">${meta.etiqueta}</span>
        <strong style="font-size:13px">${esc(r.id)}</strong>
      </div>
      <div style="font-size:13px;line-height:1.45">
        <b>${esc(r.canton)}</b> · ${esc(r.sector)}<br/>
        ${esc(r.contacto)} · <a href="tel:${esc(r.telefono)}">${esc(r.telefono)}</a><br/>
        Personas afectadas: <b>${esc(r.personas)}</b><br/>
        Agua: ${esc(ETIQUETA_AGUA[r.nivelAgua])}<br/>
        Vivienda: ${esc(ETIQUETA_VIVIENDA[r.estadoVivienda])}${r.personasAtrapadas ? ' · <b style="color:#DC2626">Personas atrapadas</b>' : ''}<br/>
        Vulnerables: ${esc(vul)}<br/>
        Estado: <b>${esc(ETIQUETA_ESTADO[r.estado])}</b>
      </div>
      ${r.foto ? `<img src="${r.foto}" alt="Evidencia" style="margin-top:6px;width:100%;border-radius:6px"/>` : ''}
    </div>`;
}

/**
 * Mapa del Centro de Monitoreo.
 * capas: { cantones, lluvia, reportes } (booleanos)
 */
export default function MapaMonitoreo({ wrf, cantones, reportes, paso, capas, seleccionId, onSeleccion }) {
  const contenedor = useRef(null);
  const mapa = useRef(null);
  const grupos = useRef({});
  const renderer = useRef(null);
  const marcadores = useRef({});

  // Inicialización única
  useEffect(() => {
    const m = L.map(contenedor.current, { preferCanvas: true, zoomControl: true }).setView(MAPA_INICIAL.centro, MAPA_INICIAL.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; Colaboradores de OpenStreetMap',
    }).addTo(m);
    m.attributionControl.addAttribution('Capa meteorológica referencial: Modelo WRF - INAMHI');
    renderer.current = L.canvas({ padding: 0.3 });
    grupos.current = {
      cantones: L.layerGroup(),
      lluvia: L.layerGroup(),
      reportes: L.layerGroup(),
    };
    mapa.current = m;
    setTimeout(() => m.invalidateSize(), 150);
    const onResize = () => m.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      m.remove();
      mapa.current = null;
    };
  }, []);

  // Visibilidad de capas (orden: cantones < lluvia < reportes)
  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    ['cantones', 'lluvia', 'reportes'].forEach((k) => {
      const g = grupos.current[k];
      if (capas[k] && !m.hasLayer(g)) g.addTo(m);
      if (!capas[k] && m.hasLayer(g)) m.removeLayer(g);
    });
    grupos.current.reportes.eachLayer((l) => l.bringToFront && l.bringToFront());
  }, [capas, cantones, wrf]);

  // Capa 1: cantones
  useEffect(() => {
    const g = grupos.current.cantones;
    if (!g || !cantones) return;
    g.clearLayers();
    L.geoJSON(cantones, {
      style: { color: '#0284C7', weight: 1.2, fillColor: '#0284C7', fillOpacity: 0.04 },
      onEachFeature: (f, layer) => {
        layer.bindTooltip(nombreCanton(f.properties), { sticky: true, className: 'pas-tooltip' });
        layer.on({
          mouseover: (e) => e.target.setStyle({ weight: 2.5, fillOpacity: 0.18 }),
          mouseout: (e) => e.target.setStyle({ weight: 1.2, fillOpacity: 0.04 }),
        });
      },
    }).addTo(g);
  }, [cantones]);

  // Capa 2: lluvia WRF por paso
  useEffect(() => {
    const g = grupos.current.lluvia;
    if (!g || !wrf) return;
    dibujarLluvia(g, wrf, paso, renderer.current);
  }, [wrf, paso]);

  // Capa 3: reportes
  useEffect(() => {
    const g = grupos.current.reportes;
    if (!g) return;
    g.clearLayers();
    marcadores.current = {};
    reportes.forEach((r) => {
      const mk = L.marker([r.lat, r.lon], { icon: iconoPin(r.prioridad, r.estado === 'atendido'), riseOnHover: true })
        .bindPopup(popupReporte(r))
        .on('click', () => onSeleccion && onSeleccion(r.id))
        .addTo(g);
      marcadores.current[r.id] = mk;
    });
  }, [reportes, onSeleccion]);

  // Centrar en el reporte seleccionado desde el panel
  useEffect(() => {
    const m = mapa.current;
    if (!m || !seleccionId) return;
    const r = reportes.find((x) => x.id === seleccionId);
    const mk = marcadores.current[seleccionId];
    if (r && mk) {
      m.flyTo([r.lat, r.lon], Math.max(m.getZoom(), 11), { duration: 0.6 });
      setTimeout(() => mk.openPopup(), 650);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccionId]);

  return <div ref={contenedor} className="h-full w-full" aria-label="Mapa interactivo de monitoreo" />;
}
