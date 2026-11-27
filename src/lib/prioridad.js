// Función pura de priorización automática PAS.
// Reglas exactas del protocolo (Rojo > Amarillo > Verde).

export const PRIORIDAD = {
  ROJO: 'rojo',
  AMARILLO: 'amarillo',
  VERDE: 'verde',
};

export const META_PRIORIDAD = {
  rojo: { etiqueta: 'ROJO', nombre: 'Crítico', detalle: 'Atención inmediata', color: '#DC2626', orden: 0 },
  amarillo: { etiqueta: 'AMARILLO', nombre: 'Urgente', detalle: 'Atención prioritaria', color: '#D97706', orden: 1 },
  verde: { etiqueta: 'VERDE', nombre: 'Preventivo', detalle: 'Monitoreo', color: '#16A34A', orden: 2 },
};

/**
 * @param {{
 *   personasAtrapadas?: boolean,
 *   estadoVivienda?: 'sin_dano'|'dano_parcial'|'colapso',
 *   nivelAgua?: 'patio_calle'|'dentro_vivienda'|'mayor_1m',
 *   tieneVulnerables?: boolean
 * }} d
 * @returns {'rojo'|'amarillo'|'verde'}
 */
export function calcularPrioridadPAS(d = {}) {
  const { personasAtrapadas, estadoVivienda, nivelAgua, tieneVulnerables } = d;

  // ROJO
  if (
    personasAtrapadas === true ||
    estadoVivienda === 'colapso' ||
    nivelAgua === 'mayor_1m' ||
    (nivelAgua === 'dentro_vivienda' && tieneVulnerables === true)
  ) {
    return PRIORIDAD.ROJO;
  }

  // AMARILLO
  if (nivelAgua === 'dentro_vivienda' || estadoVivienda === 'dano_parcial') {
    return PRIORIDAD.AMARILLO;
  }

  // VERDE (patio/calle + sin daño + sin atrapados); cualquier otro caso residual
  // también se monitorea como verde para no dejar casos sin clasificar.
  return PRIORIDAD.VERDE;
}
