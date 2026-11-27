import { useEffect, useState } from 'react';
import { cargarWRF } from './wrf.js';
import { cargarCantones } from './cantones.js';

// Caché de módulo: se carga una sola vez por sesión de navegación.
let promesa = null;

function cargarTodo() {
  if (!promesa) {
    promesa = Promise.all([cargarWRF(), cargarCantones()]).then(([wrf, cant]) => ({
      wrf: wrf.datos,
      modoWrf: wrf.modo,
      cantones: cant.datos,
      modoCantones: cant.modo,
    }));
  }
  return promesa;
}

export function useDatosClima() {
  const [estado, setEstado] = useState({ wrf: null, cantones: null, modo: 'cargando' });

  useEffect(() => {
    let vivo = true;
    cargarTodo().then((r) => {
      if (!vivo) return;
      // Si cualquiera de las fuentes cayó al respaldo, se informa "Simulación Respaldo".
      const modo = r.modoWrf === 'vivo' && r.modoCantones === 'vivo' ? 'vivo' : 'simulacion';
      setEstado({ wrf: r.wrf, cantones: r.cantones, modo, modoWrf: r.modoWrf, modoCantones: r.modoCantones });
    });
    return () => {
      vivo = false;
    };
  }, []);

  return estado;
}
