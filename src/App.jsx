import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth.js';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Reportar from './pages/Reportar.jsx';
import Comunidad from './pages/Comunidad.jsx';

function Protegida({ children }) {
  const { usuario } = useAuth();
  const loc = useLocation();
  if (!usuario) return <Navigate to="/login" replace state={{ desde: loc.pathname }} />;
  return children;
}

function RedirigirInicio() {
  const { usuario } = useAuth();
  return <Navigate to={usuario ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<RedirigirInicio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Protegida><Dashboard /></Protegida>} />
          {/* /reportar: accesible por enlace directo (voluntarios en campo) y desde el dashboard */}
          <Route path="/reportar" element={<Reportar />} />
          {/* /comunidad: público, sin login */}
          <Route path="/comunidad" element={<Comunidad />} />
          <Route path="*" element={<RedirigirInicio />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
