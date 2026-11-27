import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.js';
import { LogoPAS, NombrePAS } from '../components/Marca.jsx';

export default function Login() {
  const { usuario, iniciarSesion, accesoRapido } = useAuth();
  const nav = useNavigate();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');

  if (usuario) return <Navigate to="/dashboard" replace />;

  const enviar = (e) => {
    e.preventDefault();
    const r = iniciarSesion(correo, clave);
    if (!r.ok) setError(r.error);
    else nav('/dashboard', { replace: true });
  };

  const rapido = (rol) => {
    accesoRapido(rol);
    nav('/dashboard', { replace: true });
  };

  return (
    <div className="flex min-h-full flex-col bg-pizarra text-humo lg:flex-row">
      {/* Panel de marca */}
      <section className="relative flex flex-1 flex-col justify-between overflow-hidden p-8 lg:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(circle at 20% 15%, #0284C7 0, transparent 45%), radial-gradient(circle at 85% 90%, #38BDF8 0, transparent 40%)',
          }}
        />
        <div className="relative flex items-center gap-3">
          <LogoPAS tamano={52} />
          <NombrePAS />
        </div>
        <div className="relative my-10 max-w-xl">
          <h1 className="text-4xl font-black leading-tight lg:text-5xl">
            Respuesta rápida ante <span className="text-cian-claro">inundaciones</span> en Ecuador
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            Centro de monitoreo, triaje automático y despacho de emergencias para organizaciones de respuesta.
          </p>
          <ul className="mt-6 space-y-2 text-base text-slate-200">
            <li>● <b className="text-critico">Proteger</b>: pronóstico de lluvia y zonas en riesgo</li>
            <li>● <b className="text-urgente">Avisar</b>: reportes de campo priorizados al instante</li>
            <li>● <b className="text-preventivo">Socorrer</b>: despacho y seguimiento de cada caso</li>
          </ul>
        </div>
        <p className="relative text-xs text-slate-400">Prototipo funcional (MVP) · Acceso restringido a usuarios autorizados</p>
      </section>

      {/* Formulario */}
      <section className="flex flex-1 items-center justify-center bg-humo p-6 text-pizarra lg:max-w-xl">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-black">Iniciar sesión</h2>
          <p className="mt-1 text-slate-600">Ingresa con tu cuenta autorizada de PAS.</p>

          <form onSubmit={enviar} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="correo" className="etiqueta">Correo electrónico</label>
              <input id="correo" type="email" autoComplete="username" className="campo" placeholder="usuario@pas.ec" value={correo} onChange={(e) => { setCorreo(e.target.value); setError(''); }} required />
            </div>
            <div>
              <label htmlFor="clave" className="etiqueta">Contraseña</label>
              <input id="clave" type="password" autoComplete="current-password" className="campo" placeholder="••••••••" value={clave} onChange={(e) => { setClave(e.target.value); setError(''); }} required />
            </div>
            {error && (
              <div role="alert" className="rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-critico">{error}</div>
            )}
            <button type="submit" className="btn-primario w-full">Entrar al Centro de Monitoreo</button>
          </form>

          <p className="mt-3 text-xs text-slate-500">¿Necesitas acceso? Solicítalo al administrador de tu organización. No hay registro público.</p>

          {/* Acceso Rápido Demo (discreto) */}
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-3">
            <div className="mb-2 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">Acceso rápido demo</div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => rapido('admin')} className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300">Entrar como Admin</button>
              <button type="button" onClick={() => rapido('operador')} className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300">Entrar como Operador</button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm font-semibold">
            <Link to="/comunidad" className="text-cian underline">Hub Ciudadano (público)</Link>
            <Link to="/reportar" className="text-cian underline">Formulario de campo</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
