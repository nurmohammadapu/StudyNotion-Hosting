import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import envCompatible from 'vite-plugin-env-compatible';

export default defineConfig({
  envPrefix: 'REACT_APP_',
  define: {
    global: 'window',
  },
  plugins: [
    react(),
    envCompatible(),
  ],
  optimizeDeps: {
    include: ['swiper/react', 'swiper'],
  },
});
