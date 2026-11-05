import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    react(),
    cloudflare({
      configPath: './wrangler.jsonc',
    }),
  ],
  ssr: {
    target: 'webworker',
    noExternal: true,
  },
});
