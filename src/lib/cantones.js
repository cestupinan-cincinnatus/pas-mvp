// Límites cantonales: intenta INAMHI, con respaldo de polígonos aproximados (demo).
import { URL_CANTONES, PROXY_CANTONES } from './config.js';

// Polígonos esquemáticos [lon, lat] — SOLO para la simulación de respaldo, no son límites oficiales.
const poli = (nombre, coords) => ({
  type: 'Feature',
  properties: { nombre },
  geometry: { type: 'Polygon', coordinates: [[...coords, coords[0]]] },
});

export const CANTONES_RESPALDO = {
  type: 'FeatureCollection',
  features: [
    poli('Guayaquil', [[-80.18, -2.05], [-79.98, -1.98], [-79.84, -2.10], [-79.80, -2.28], [-79.90, -2.40], [-80.10, -2.45], [-80.25, -2.30], [-80.22, -2.15]]),
    poli('Durán', [[-79.84, -2.10], [-79.74, -2.10], [-79.70, -2.20], [-79.78, -2.24], [-79.84, -2.20]]),
    poli('Samborondón', [[-79.90, -1.98], [-79.76, -1.92], [-79.70, -2.04], [-79.74, -2.10], [-79.84, -2.10], [-79.98, -1.98]]),
    poli('Daule', [[-80.12, -1.70], [-79.90, -1.68], [-79.88, -1.92], [-79.98, -1.98], [-80.18, -2.05], [-80.20, -1.85]]),
    poli('Milagro', [[-79.70, -2.04], [-79.52, -2.04], [-79.48, -2.20], [-79.60, -2.26], [-79.70, -2.20], [-79.74, -2.10]]),
    poli('Babahoyo', [[-79.76, -1.92], [-79.60, -1.65], [-79.38, -1.78], [-79.40, -2.00], [-79.52, -2.04], [-79.70, -2.04]]),
  ],
};

export function nombreCanton(props = {}) {
  const claves = ['nombre', 'NOMBRE', 'canton', 'CANTON', 'dpa_descan', 'DPA_DESCAN', 'name', 'NAME', 'cantón'];
  for (const k of claves) if (props[k]) return String(props[k]);
  const primera = Object.values(props).find((v) => typeof v === 'string');
  return primera || 'Cantón';
}

async function conTimeout(url, ms = 8000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

export async function cargarCantones() {
  for (const url of [URL_CANTONES, PROXY_CANTONES]) {
    try {
      const json = await conTimeout(url);
      if (json && (json.type === 'FeatureCollection' || json.type === 'Feature' || Array.isArray(json.features))) {
        return { datos: json, modo: 'vivo' };
      }
    } catch (_) {
      /* silencioso */
    }
  }
  return { datos: CANTONES_RESPALDO, modo: 'simulacion' };
}
