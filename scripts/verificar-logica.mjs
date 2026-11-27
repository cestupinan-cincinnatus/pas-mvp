// Verificación rápida de la lógica pura (sin navegador): npm run test:logica
import assert from 'node:assert/strict';
import { calcularPrioridadPAS } from '../src/lib/prioridad.js';
import { generarWRFSimulado, validarWRF, coordenadaCelda, valorCelda, aMilimetros } from '../src/lib/wrf.js';
import { estiloLluvia } from '../src/lib/config.js';

// --- Prioridad ---
const c = (o) => calcularPrioridadPAS({ nivelAgua: 'patio_calle', estadoVivienda: 'sin_dano', personasAtrapadas: false, tieneVulnerables: false, ...o });
assert.equal(c({}), 'verde');
assert.equal(c({ personasAtrapadas: true }), 'rojo');
assert.equal(c({ estadoVivienda: 'colapso' }), 'rojo');
assert.equal(c({ nivelAgua: 'mayor_1m' }), 'rojo');
assert.equal(c({ nivelAgua: 'dentro_vivienda', tieneVulnerables: true }), 'rojo');
assert.equal(c({ nivelAgua: 'dentro_vivienda' }), 'amarillo');
assert.equal(c({ estadoVivienda: 'dano_parcial' }), 'amarillo');
assert.equal(c({ estadoVivienda: 'dano_parcial', tieneVulnerables: true }), 'amarillo'); // vulnerables solo escala con agua dentro
assert.equal(c({ nivelAgua: 'patio_calle', tieneVulnerables: true }), 'verde');

// --- WRF simulado ---
const w = generarWRFSimulado(new Date('2026-11-26T22:00:00-05:00'));
assert.ok(validarWRF(w), 'estructura WRF válida');
assert.equal(w.pasos.length, 18);
assert.equal(w.valores.length, 18);
assert.equal(w.valores[0].length, 65 * 59);
assert.equal(w.malla.filas, 65);
assert.equal(w.malla.cols, 59);

// --- Georreferenciación ---
const { lat, lon } = coordenadaCelda(w.malla, 37, 11);
assert.ok(Math.abs(lat - (1.5 - 37 * 0.1)) < 1e-9);
assert.ok(Math.abs(lon - (-81 + 11 * 0.1)) < 1e-9);

// --- Escala de colores ---
assert.equal(estiloLluvia(1).color, '#38BDF8');
assert.equal(estiloLluvia(5).color, '#22C55E');
assert.equal(estiloLluvia(12).color, '#FACC15');
assert.equal(estiloLluvia(20).color, '#F97316');
assert.equal(estiloLluvia(30).color, '#E11D48');
assert.equal(aMilimetros(197), 19.7);

// Hay lluvia visible sobre el Guayas en algún bloque
let max = 0;
for (let p = 0; p < 18; p++) max = Math.max(max, aMilimetros(valorCelda(w, p, 37, 11) ?? 0));
console.log('Máx. simulado cerca de Guayaquil (mm/3h):', max.toFixed(1));
assert.ok(max > 5, 'la simulación debe mostrar lluvia relevante sobre Guayas');

console.log('✔ Lógica verificada: prioridad, estructura WRF, georreferenciación y escala de color.');
