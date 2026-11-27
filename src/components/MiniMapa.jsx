import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MAPA_INICIAL } from '../lib/config.js';

// Mini-mapa para elegir ubicación con un clic (formulario de campo).
export default function MiniMapa({ posicion, onElegir }) {
  const el = useRef(null);
  const mapa = useRef(null);
  const marcador = useRef(null);
  const cb = useRef(onElegir);
  cb.current = onElegir;

  useEffect(() => {
    const m = L.map(el.current, { zoomControl: true }).setView(posicion || MAPA_INICIAL.centro, posicion ? 15 : 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap' }).addTo(m);
    m.on('click', (e) => cb.current([e.latlng.lat, e.latlng.lng]));
    mapa.current = m;
    setTimeout(() => m.invalidateSize(), 150);
    return () => { m.remove(); mapa.current = null; marcador.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = mapa.current;
    if (!m || !posicion) return;
    if (!marcador.current) {
      marcador.current = L.marker(posicion, {
        icon: L.divIcon({ className: '', html: '<div class="pas-pin" style="background:#0284C7"></div>', iconSize: [26, 26], iconAnchor: [13, 13] }),
      }).addTo(m);
    } else {
      marcador.current.setLatLng(posicion);
    }
    m.setView(posicion, Math.max(m.getZoom(), 14));
  }, [posicion]);

  return <div ref={el} className="h-56 w-full overflow-hidden rounded-xl border-2 border-slate-300" aria-label="Mini-mapa para seleccionar ubicación" />;
}
