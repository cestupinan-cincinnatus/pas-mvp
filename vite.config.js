import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy opcional para evitar CORS en desarrollo (npm run dev).
// En producción, la app intenta fetch directo y, si falla, usa la simulación de respaldo.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/proxy-inamhi': {
        target: 'https://servicios.inamhi.gob.ec',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/proxy-inamhi/, ''),
      },
    },
  },
});
