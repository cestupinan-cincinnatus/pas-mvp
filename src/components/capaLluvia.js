// Dibuja las celdas de lluvia WRF como rectángulos semitransparentes.
import L from 'leaflet';
import { estiloLluvia } from '../lib/config.js';
import { aMilimetros, valorCelda } from '../lib/wrf.js';

/**
 * @param {L.LayerGroup} grupo capa donde se dibuja (se limpia antes)
 * @param {object} json respuesta WRF (real o simulada)
 * @param {number} paso índice del bloque horario (0..17)
 * @param {L.Renderer} renderer canvas compartido (rápido con ~3800 celdas)
 * @param {number} minMm no dibuja celdas por debajo de este valor (mm/3h)
 */
export function dibujarLluvia(grupo, json, paso, renderer, minMm = 0.1) {
  grupo.clearLayers();
  if (!json) return 0;
  const { malla } = json;
  let n = 0;
  for (let fila = 0; fila < malla.filas; fila++) {
    for (let col = 0; col < malla.cols; col++) {
      const bruto = valorCelda(json, paso, fila, col);
      if (bruto === null || bruto === undefined || bruto === 0) continue; // ignora null y 0
      const mm = aMilimetros(bruto);
      if (mm < minMm) continue;
      const lat = malla.lat0 - fila * malla.paso;
      const lon = malla.lon0 + col * malla.paso;
      const est = estiloLluvia(mm);
      L.rectangle(
        [
          [lat, lon],
          [lat - malla.paso, lon + malla.paso],
        ],
        {
          renderer,
          stroke: false,
          fillColor: est.color,
          fillOpacity: est.opacidad,
          interactive: false,
        }
      ).addTo(grupo);
      n++;
    }
  }
  return n;
}
