import { useState } from 'react';
import { guardarUsuarios, listarUsuarios, ETIQUETA_ROL } from '../lib/auth.js';
import { restablecerDemo } from '../lib/reportes.js';

// Panel exclusivo del rol Administrador: gestión de usuarios y umbral de alerta de lluvia.
export default function PanelAdmin({ abierto, onCerrar, umbral, setUmbral }) {
  const [usuarios, setUsuarios] = useState(listarUsuarios);
  const [nuevo, setNuevo] = useState({ nombre: '', correo: '', clave: '', rol: 'operador' });
  const [error, setError] = useState('');

  if (!abierto) return null;

  const persistir = (lista) => {
    setUsuarios(lista);
    guardarUsuarios(lista);
  };

  const agregar = (e) => {
    e.preventDefault();
    if (!nuevo.nombre.trim() || !nuevo.correo.includes('@') || nuevo.clave.length < 6) {
      setError('Completa nombre, un correo válido y una contraseña de al menos 6 caracteres.');
      return;
    }
    if (usuarios.some((u) => u.correo.toLowerCase() === nuevo.correo.trim().toLowerCase())) {
      setError('Ya existe un usuario con ese correo.');
      return;
    }
    persistir([...usuarios, { id: 'u' + Date.now(), ...nuevo, correo: nuevo.correo.trim(), nombre: nuevo.nombre.trim(), activo: true }]);
    setNuevo({ nombre: '', correo: '', clave: '', rol: 'operador' });
    setError('');
  };

  const alternar = (id) => persistir(usuarios.map((u) => (u.id === id && u.rol !== 'admin' ? { ...u, activo: !u.activo } : u)));

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Administración">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-humo p-5 text-pizarra shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">Administración</h2>
          <button type="button" onClick={onCerrar} className="btn-claro !min-h-[40px] !px-3 !py-1" aria-label="Cerrar">✕</button>
        </div>

        <section className="mt-5">
          <h3 className="text-lg font-bold">Umbral de alerta de lluvia</h3>
          <p className="text-sm text-slate-600">Celdas del pronóstico sobre este valor se consideran zona de alerta en el Hub Ciudadano.</p>
          <div className="mt-2 flex items-center gap-4">
            <input type="range" min={5} max={40} step={1} value={umbral} onChange={(e) => setUmbral(Number(e.target.value))} className="h-2 flex-1 accent-sky-600" aria-label="Umbral de alerta en milímetros por 3 horas" />
            <span className="w-28 rounded-lg bg-pizarra px-3 py-2 text-center font-bold text-humo">{umbral} mm / 3 h</span>
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-lg font-bold">Usuarios autorizados</h3>
          <ul className="mt-2 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {usuarios.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="truncate font-bold">{u.nombre}</div>
                  <div className="truncate text-sm text-slate-600">{u.correo} · {ETIQUETA_ROL[u.rol]}</div>
                </div>
                {u.rol === 'admin' ? (
                  <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold">Fijo</span>
                ) : (
                  <button type="button" onClick={() => alternar(u.id)} className={`min-h-[40px] rounded-lg px-3 text-sm font-bold ${u.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </button>
                )}
              </li>
            ))}
          </ul>

          <form onSubmit={agregar} className="mt-3 grid gap-2 sm:grid-cols-2" noValidate>
            <input className="campo" placeholder="Nombre completo" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} aria-label="Nombre" />
            <input className="campo" type="email" placeholder="Correo" value={nuevo.correo} onChange={(e) => setNuevo({ ...nuevo, correo: e.target.value })} aria-label="Correo" />
            <input className="campo" type="password" placeholder="Contraseña (mín. 6)" value={nuevo.clave} onChange={(e) => setNuevo({ ...nuevo, clave: e.target.value })} aria-label="Contraseña" />
            <select className="campo" value={nuevo.rol} onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })} aria-label="Rol">
              <option value="operador">Operador de Monitoreo</option>
              <option value="admin">Administrador</option>
            </select>
            {error && <div role="alert" className="text-sm font-semibold text-critico sm:col-span-2">{error}</div>}
            <button type="submit" className="btn-primario sm:col-span-2">Agregar usuario</button>
          </form>
        </section>

        <section className="mt-6 border-t border-slate-200 pt-4">
          <h3 className="text-lg font-bold">Datos de demostración</h3>
          <button type="button" onClick={() => { if (window.confirm('¿Restablecer los 6 casos de demostración? Se perderán los reportes nuevos.')) restablecerDemo(); }} className="btn-claro mt-2">Restablecer casos de demostración</button>
        </section>
      </div>
    </div>
  );
}
