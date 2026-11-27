// Autenticación local para el MVP (sesión en sessionStorage).
// Preparada para reemplazarse por Supabase Auth: basta con sustituir `iniciarSesion` y `cerrarSesion`
// por supabase.auth.signInWithPassword / signOut y leer el rol desde el perfil del usuario.
import { createContext, useContext, useState, useCallback, createElement } from 'react';

const CLAVE_SESION = 'pas.sesion.v1';
const CLAVE_USUARIOS = 'pas.usuarios.v1';

const USUARIOS_DEMO = [
  { id: 'u1', nombre: 'Administrador PAS', correo: 'admin@pas.ec', clave: 'admin123', rol: 'admin', activo: true },
  { id: 'u2', nombre: 'Operador de Monitoreo', correo: 'operador@pas.ec', clave: 'operador123', rol: 'operador', activo: true },
];

export function listarUsuarios() {
  try {
    const crudo = localStorage.getItem(CLAVE_USUARIOS);
    if (crudo) return JSON.parse(crudo);
  } catch (_) { /* ignora */ }
  localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(USUARIOS_DEMO));
  return USUARIOS_DEMO;
}

export function guardarUsuarios(lista) {
  localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(lista));
}

function leerSesion() {
  try {
    const s = sessionStorage.getItem(CLAVE_SESION);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerSesion);

  const abrir = useCallback((u) => {
    const sesion = { id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol };
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    setUsuario(sesion);
    return sesion;
  }, []);

  const iniciarSesion = useCallback(
    (correo, clave) => {
      const u = listarUsuarios().find(
        (x) => x.correo.toLowerCase() === String(correo).trim().toLowerCase() && x.clave === clave && x.activo
      );
      if (!u) return { ok: false, error: 'Credenciales incorrectas o usuario inactivo.' };
      abrir(u);
      return { ok: true };
    },
    [abrir]
  );

  const accesoRapido = useCallback(
    (rol) => {
      const u = listarUsuarios().find((x) => x.rol === rol && x.activo) || USUARIOS_DEMO.find((x) => x.rol === rol);
      abrir(u);
    },
    [abrir]
  );

  const cerrarSesion = useCallback(() => {
    sessionStorage.removeItem(CLAVE_SESION);
    setUsuario(null);
  }, []);

  return createElement(AuthCtx.Provider, { value: { usuario, iniciarSesion, accesoRapido, cerrarSesion } }, children);
}

export const useAuth = () => useContext(AuthCtx);

export const ETIQUETA_ROL = { admin: 'Administrador', operador: 'Operador de Monitoreo' };
