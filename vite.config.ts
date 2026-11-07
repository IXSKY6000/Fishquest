import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'fish/*.svg', 'data/*.geojson'],
      manifest: {
        name: 'FishQuest — Explorer les eaux douces',
        short_name: 'FishQuest',
        lang: 'fr',
        description: 'Carte, espèces et exploration des eaux douces.',
        theme_color: '#123b3a',
        background_color: '#f6f8f7',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,geojson}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
      // No offline caching or prefetching of third-party map tiles or API responses.
    }),
  ],
  build: {
    rollupOptions: {
      output: { manualChunks: { mapping: ['leaflet', 'react-leaflet'], validation: ['zod'] } },
    },
  },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
