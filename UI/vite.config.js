// vite.config.js at the root of frontend
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  return {
    root: path.resolve(__dirname, 'src'), // unified root
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      port: mode === 'guest' ? 3000 : mode === 'job-seeker' ? 3002 : 3001,
      open: mode === 'job-seeker' ? '/seeker/land' : mode === 'employer' ? '/employer/land' : true, // open on seeker or employer landing
    },
    build: {
      outDir: path.resolve(__dirname, 'dist', mode),
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    assetsInclude: ['**/*.glb', '**/*.csv'],
  };
});
