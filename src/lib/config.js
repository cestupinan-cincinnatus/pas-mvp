// Configuración central del prototipo PAS.

export const URL_WRF = 'https://servicios.inamhi.gob.ec/wp-json/inamhi-mapa/v1/wrf-malla';
export const URL_CANTONES =
  'https://servicios.inamhi.gob.ec/wp-content/plugins/inamhi-mapa-pronostico/assets/data/cantones.json?ver=1.0.2';

// Proxy de desarrollo definido en vite.config.js (solo funciona con `npm run dev`)
export const PROXY_WRF = '/proxy-inamhi/wp-json/inamhi-mapa/v1/wrf-malla';
export const PROXY_CANTONES = '/proxy-inamhi/wp-content/plugins/inamhi-mapa-pronostico/assets/data/cantones.json?ver=1.0.2';

export const MAPA_INICIAL = { centro: [-2.18, -79.88], zoom: 8 };

// Escala de color de precipitación (mm en 3 h)
export const ESCALA_LLUVIA = [
  { max: 2.0, color: '#38BDF8', opacidad: 0.35, etiqueta: '0,1 – 2 mm' },
  { max: 8.0, color: '#22C55E', opacidad: 0.45, etiqueta: '2,1 – 8 mm' },
  { max: 15.0, color: '#FACC15', opacidad: 0.55, etiqueta: '8,1 – 15 mm' },
  { max: 25.0, color: '#F97316', opacidad: 0.65, etiqueta: '15,1 – 25 mm' },
  { max: Infinity, color: '#E11D48', opacidad: 0.75, etiqueta: '> 25 mm' },
];

export function estiloLluvia(mm) {
  return ESCALA_LLUVIA.find((e) => mm <= e.max) || ESCALA_LLUVIA[ESCALA_LLUVIA.length - 1];
}

// Teléfonos del directorio. IMPORTANTE: verificar los números antes de la demo oficial.
export const DIRECTORIO = [
  { id: 'ecu911', nombre: 'ECU 911', detalle: 'Emergencias nacionales las 24 horas', numero: '911', color: '#DC2626' },
  { id: 'bomberos', nombre: 'Cuerpo de Bomberos', detalle: 'Rescate, incendios y emergencias', numero: '102', color: '#D97706' },
  { id: 'sgr', nombre: 'Secretaría de Gestión de Riesgos', detalle: 'Coordinación de riesgos (vía ECU 911)', numero: '911', color: '#0284C7' },
  { id: 'cruzroja', nombre: 'Cruz Roja Ecuatoriana', detalle: 'Ayuda humanitaria y primeros auxilios', numero: '132', color: '#16A34A' },
];

// Albergues / puntos seguros FICTICIOS para la demostración.
export const ALBERGUES = [
  { id: 'a1', nombre: 'Punto seguro · Coliseo comunitario (demo)', lat: -2.1895, lon: -79.9102, capacidad: 300 },
  { id: 'a2', nombre: 'Albergue · Unidad educativa (demo)', lat: -2.1624, lon: -79.8437, capacidad: 180 },
  { id: 'a3', nombre: 'Punto seguro · Casa comunal Daule (demo)', lat: -1.8601, lon: -79.9778, capacidad: 120 },
  { id: 'a4', nombre: 'Albergue · Coliseo Babahoyo (demo)', lat: -1.8019, lon: -79.5348, capacidad: 250 },
  { id: 'a5', nombre: 'Punto seguro · Estadio Milagro (demo)', lat: -2.1344, lon: -79.5878, capacidad: 400 },
];

export const CANTONES_LISTA = [
  'Guayaquil', 'Durán', 'Samborondón', 'Daule', 'Milagro', 'Babahoyo', 'Vinces', 'Quevedo', 'Naranjal', 'Balzar',
];

export const UMBRAL_ALERTA_MM_DEFECTO = 15; // mm / 3 h
