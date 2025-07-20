import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Arret-Tabac/', // 👈 le nom EXACT de ton dépôt GitHub
  server: {
    host: true,
    port: 5173,
    strictPort: true
  }
});