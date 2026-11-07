import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  server: {
    proxy: {
      '/storage': {
        target: 'https://opgiyqxsthrxzrbgupso.supabase.co',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  plugins: [
    cloudflare({
      configPath: './wrangler.jsonc',
      viteEnvironment: { name: 'ssr' },
    }),
    tailwindcss(),
    tanstackStart(),
    react(),
  ],
});
