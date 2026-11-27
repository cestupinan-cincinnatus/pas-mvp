// Almacén de reportes en localStorage (soporte offline) con suscripción reactiva.
import { useSyncExternalStore } from 'react';
import { calcularPrioridadPAS, META_PRIORIDAD } from './prioridad.js';

const CLAVE = 'pas.reportes.v1';
const listeners = new Set();
let cache = null;

const hace = (min) => new Date(Date.now() - min * 60000).toISOString();

function semilla() {
  const base = [
    { id: 'PAS-0001', canton: 'Guayaquil', sector: 'Guasmo Sur', lat: -2.2486, lon: -79.8998, contacto: 'María Quimí', telefono: '0991234501', personas: 6, nivelAgua: 'mayor_1m', estadoVivienda: 'dano_parcial', vulnerables: ['ninos', 'mayores'], personasAtrapadas: false, estado: 'pendiente', creado: hace(95) },
    { id: 'PAS-0002', canton: 'Babahoyo', sector: 'Barreiro', lat: -1.8071, lon: -79.5298, contacto: 'José Cedeño', telefono: '0987654302', personas: 4, nivelAgua: 'dentro_vivienda', estadoVivienda: 'dano_parcial', vulnerables: ['mayores'], personasAtrapadas: false, estado: 'en_atencion', creado: hace(70) },
    { id: 'PAS-0003', canton: 'Daule', sector: 'La Aurora', lat: -1.8763, lon: -79.9712, contacto: 'Rosa Macías', telefono: '0993332203', personas: 5, nivelAgua: 'dentro_vivienda', estadoVivienda: 'dano_parcial', vulnerables: [], personasAtrapadas: false, estado: 'pendiente', creado: hace(52) },
    { id: 'PAS-0004', canton: 'Durán', sector: 'Primavera 1', lat: -2.1623, lon: -79.8201, contacto: 'Luis Vera', telefono: '0985551104', personas: 3, nivelAgua: 'dentro_vivienda', estadoVivienda: 'sin_dano', vulnerables: [], personasAtrapadas: false, estado: 'pendiente', creado: hace(38) },
    { id: 'PAS-0005', canton: 'Milagro', sector: 'Barrio Los Ceibos', lat: -2.1296, lon: -79.5934, contacto: 'Carmen Ruiz', telefono: '0996667705', personas: 2, nivelAgua: 'patio_calle', estadoVivienda: 'sin_dano', vulnerables: [], personasAtrapadas: false, estado: 'pendiente', creado: hace(25) },
    { id: 'PAS-0006', canton: 'Samborondón', sector: 'La Puntilla (sector bajo)', lat: -2.1342, lon: -79.8663, contacto: 'Pedro Alvarado', telefono: '0982228806', personas: 4, nivelAgua: 'patio_calle', estadoVivienda: 'sin_dano', vulnerables: [], personasAtrapadas: false, estado: 'pendiente', creado: hace(12) },
  ];
  // Reglas: 2 rojos (0001 y uno con colapso) — ajustamos 0002 a colapso/atrapados para tener 2 rojos reales.
  base[1] = { ...base[1], nivelAgua: 'dentro_vivienda', estadoVivienda: 'colapso', personasAtrapadas: true, vulnerables: ['mayores'] };
  // 2 amarillos: 0003 y 0004. 2 verdes: 0005 y 0006.
  return base.map((r) => ({ ...r, prioridad: calcularPrioridadPAS({ ...r, tieneVulnerables: r.vulnerables.length > 0 }), sincronizado: true, foto: null }));
}

function cargar() {
  if (cache) return cache;
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (crudo) {
      cache = JSON.parse(crudo);
      return cache;
    }
  } catch (_) { /* ignora */ }
  cache = semilla();
  guardar(cache, false);
  return cache;
}

function guardar(lista, avisar = true) {
  cache = lista;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
  } catch (_) {
    // Cuota llena (fotos): reintenta sin fotos antiguas.
    try {
      const liviana = lista.map((r, i) => (i < lista.length - 3 ? { ...r, foto: null } : r));
      localStorage.setItem(CLAVE, JSON.stringify(liviana));
      cache = liviana;
    } catch (_) { /* ignora */ }
  }
  if (avisar) listeners.forEach((l) => l());
}

function suscribir(fn) {
  listeners.add(fn);
  const onStorage = (e) => {
    if (e.key === CLAVE) {
      cache = null;
      fn();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', onStorage);
  };
}

export function useReportes() {
  return useSyncExternalStore(suscribir, cargar, cargar);
}

export function nuevoId() {
  const lista = cargar();
  const n = lista.reduce((m, r) => Math.max(m, parseInt(String(r.id).replace(/\D/g, ''), 10) || 0), 0) + 1;
  return 'PAS-' + String(n).padStart(4, '0');
}

export function agregarReporte(datos) {
  const lista = cargar();
  const reporte = {
    ...datos,
    id: nuevoId(),
    estado: 'pendiente',
    creado: new Date().toISOString(),
    sincronizado: typeof navigator !== 'undefined' ? navigator.onLine : true,
    prioridad: calcularPrioridadPAS({ ...datos, tieneVulnerables: (datos.vulnerables || []).length > 0 }),
  };
  guardar([reporte, ...lista]);
  return reporte;
}

export const SIGUIENTE_ESTADO = { pendiente: 'en_atencion', en_atencion: 'atendido', atendido: 'pendiente' };

export function avanzarEstado(id) {
  guardar(cargar().map((r) => (r.id === id ? { ...r, estado: SIGUIENTE_ESTADO[r.estado] } : r)));
}

export function marcarSincronizados() {
  const lista = cargar();
  if (lista.some((r) => !r.sincronizado)) guardar(lista.map((r) => ({ ...r, sincronizado: true })));
}

export function restablecerDemo() {
  guardar(semilla());
}

export function calcularKpis(lista) {
  const activos = lista.filter((r) => r.estado !== 'atendido');
  return {
    criticos: activos.filter((r) => r.prioridad === 'rojo').length,
    urgentes: activos.filter((r) => r.prioridad === 'amarillo').length,
    preventivos: activos.filter((r) => r.prioridad === 'verde').length,
    atendidos: lista.filter((r) => r.estado === 'atendido').length,
  };
}

export function ordenarPorGravedad(lista) {
  return [...lista].sort(
    (a, b) =>
      META_PRIORIDAD[a.prioridad].orden - META_PRIORIDAD[b.prioridad].orden ||
      new Date(a.creado) - new Date(b.creado)
  );
}

export const ETIQUETA_ESTADO = { pendiente: 'Pendiente', en_atencion: 'En atención', atendido: 'Atendido' };
export const ETIQUETA_AGUA = {
  patio_calle: 'Patio/calle (< 20 cm)',
  dentro_vivienda: 'Dentro de vivienda (20 cm – 1 m)',
  mayor_1m: 'Inundación severa (> 1 m)',
};
export const ETIQUETA_VIVIENDA = {
  sin_dano: 'Sin daño estructural',
  dano_parcial: 'Daño parcial / enseres perdidos',
  colapso: 'Colapso / pérdida total',
};
export const ETIQUETA_VULNERABLE = {
  mayores: 'Adultos mayores',
  ninos: 'Niños menores de 5 años',
  discapacidad: 'Personas con discapacidad',
  embarazadas: 'Embarazadas',
};
