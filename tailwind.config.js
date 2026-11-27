/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pizarra: { DEFAULT: '#0F172A', 700: '#1E293B', 600: '#334155' },
        humo: '#F8FAFC',
        cian: { DEFAULT: '#0284C7', claro: '#38BDF8' },
        critico: '#DC2626',
        urgente: '#D97706',
        preventivo: '#16A34A',
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', '-apple-system', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
