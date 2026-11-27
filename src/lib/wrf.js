// Carga, validación y generación de respaldo de la malla WRF (INAMHI).
import { URL_WRF, PROXY_WRF } from './config.js';

export const MALLA_REF = { lat0: 1.5, lon0: -81, paso: 0.1, filas: 65, cols: 59 };

/** Coordenadas de la esquina superior-izquierda de la celda (fila, col). */
export function coordenadaCelda(malla, fila, col) {
  return {
    lat: malla.lat0 - fila * malla.paso,
    lon: malla.lon0 + col * malla.paso,
  };
}

/** Convierte décimas de mm a mm reales. */
export const aMilimetros = (v) => v / 10;

/** Valida forma básica de la respuesta. */
export function validarWRF(json) {
  if (!json || json.ok === false) return false;
  const { malla, pasos, valores } = json;
  if (!malla || !Array.isArray(pasos) || !Array.isArray(valores)) return false;
  if (pasos.length === 0 || valores.length !== pasos.length) return false;
  const esperado = malla.filas * malla.cols;
  // Cada paso puede venir plano (filas*cols) o como matriz [fila][col].
  const p0 = valores[0];
  if (!Array.isArray(p0)) return false;
  if (Array.isArray(p0[0])) return p0.length === malla.filas;
  return p0.length === esperado;
}

/** Devuelve el valor (décimas de mm) de una celda en un paso, sea plano o matricial. */
export function valorCelda(json, paso, fila, col) {
  const datos = json.valores[paso];
  if (Array.isArray(datos[0])) return datos[fila]?.[col];
  return datos[fila * json.malla.cols + col];
}

async function fetchConTimeout(url, ms = 6000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

/**
 * Híbrido: intenta fetch directo, luego proxy de desarrollo y, si todo falla,
 * activa silenciosamente la simulación. Retorna { datos, modo }.
 */
export async function cargarWRF() {
  for (const url of [URL_WRF, PROXY_WRF]) {
    try {
      const json = await fetchConTimeout(url);
      if (validarWRF(json)) return { datos: json, modo: 'vivo' };
    } catch (_) {
      /* silencioso: se intenta la siguiente vía o el respaldo */
    }
  }
  return { datos: generarWRFSimulado(), modo: 'simulacion' };
}

// ---------- Generador de respaldo ----------

// PRNG determinista para que la demo siempre luzca igual.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Genera datos con la MISMA estructura que el endpoint real (65x59, 18 pasos, valores planos).
 * Simula un sistema de lluvia intenso sobre la cuenca del Guayas que se desplaza y se intensifica.
 */
export function generarWRFSimulado(inicio = new Date()) {
  const m = MALLA_REF;
  const rnd = mulberry32(20261126);
  const base = new Date(inicio);
  base.setMinutes(0, 0, 0);
  const pasos = [];
  for (let i = 0; i < 18; i++) {
    const d = new Date(base.getTime() + i * 3 * 3600 * 1000);
    pasos.push(toIsoLocal(d, -5));
  }

  // Núcleos de lluvia (centro lat/lon, radio en grados, intensidad máx en mm/3h)
  const nucleos = [
    { lat: -2.0, lon: -79.8, r: 0.9, mm: 38, vLat: 0.03, vLon: 0.05, pico: 9 },  // Guayas
    { lat: -1.6, lon: -79.4, r: 0.7, mm: 30, vLat: 0.02, vLon: 0.03, pico: 11 }, // Los Ríos
    { lat: -2.9, lon: -79.6, r: 0.6, mm: 22, vLat: -0.01, vLon: 0.02, pico: 6 }, // sur
    { lat: -0.6, lon: -79.5, r: 0.8, mm: 18, vLat: 0.0, vLon: 0.03, pico: 14 },  // norte
  ];

  const valores = [];
  for (let p = 0; p < 18; p++) {
    const plano = new Array(m.filas * m.cols);
    for (let f = 0; f < m.filas; f++) {
      for (let c = 0; c < m.cols; c++) {
        const { lat, lon } = coordenadaCelda(m, f, c);
        let mm = 0;
        for (const n of nucleos) {
          const cLat = n.lat + n.vLat * p;
          const cLon = n.lon + n.vLon * p;
          const dist2 = (lat - cLat) ** 2 + (lon - cLon) ** 2;
          const ciclo = Math.exp(-((p - n.pico) ** 2) / 26); // crece y decae
          mm += n.mm * ciclo * Math.exp(-dist2 / (2 * (n.r / 1.6) ** 2));
        }
        mm *= 0.75 + rnd() * 0.5; // textura
        let dec = Math.round(mm * 10);
        // Océano muy al oeste o celdas sin dato → null; sin lluvia → 0
        if (lon < -80.7 && lat > -1.0) plano[f * m.cols + c] = null;
        else plano[f * m.cols + c] = dec < 1 ? 0 : dec;
      }
    }
    valores.push(plano);
  }

  return {
    ok: true,
    capa: 'lluvia',
    malla: { ...m },
    unidad: 'décimas de mm en 3 horas',
    pasos,
    valores,
    simulado: true,
  };
}

function toIsoLocal(d, offsetHoras) {
  const t = new Date(d.getTime() + offsetHoras * 3600 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  const sign = offsetHoras < 0 ? '-' : '+';
  return (
    `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())}T` +
    `${p(t.getUTCHours())}:${p(t.getUTCMinutes())}:${p(t.getUTCSeconds())}` +
    `${sign}${p(Math.abs(offsetHoras))}:00`
  );
}

export function formatoPaso(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-EC', {
      weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Guayaquil',
    });
  } catch {
    return iso;
  }
}

/** Máximo de lluvia (mm) en toda la malla para un paso. Útil para el badge de alerta. */
export function maximoPaso(json, paso) {
  let max = 0;
  const { filas, cols } = json.malla;
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < cols; c++) {
      const v = valorCelda(json, paso, f, c);
      if (typeof v === 'number' && v > max) max = v;
    }
  }
  return aMilimetros(max);
}
