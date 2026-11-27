import { useCallback, useState } from 'react';
import { UMBRAL_ALERTA_MM_DEFECTO } from './config.js';

const CLAVE = 'pas.umbral.v1';

export function leerUmbral() {
  try {
    const v = Number(localStorage.getItem(CLAVE));
    return v >= 1 ? v : UMBRAL_ALERTA_MM_DEFECTO;
  } catch {
    return UMBRAL_ALERTA_MM_DEFECTO;
  }
}

export function useUmbral() {
  const [umbral, setU] = useState(leerUmbral);
  const setUmbral = useCallback((v) => {
    setU(v);
    try { localStorage.setItem(CLAVE, String(v)); } catch { /* ignora */ }
  }, []);
  return [umbral, setUmbral];
}
