import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'header-logo.png', 'icon.svg'],
      manifest: {
        name: 'Maittar Quotation Maker',
        short_name: 'Maittar Quote',
        description: 'Create and share Maittar Engineering quotations.',
        theme_color: '#123b2e',
        background_color: '#f4f7f5',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ttf,woff2}'],
        cleanupOutdatedCaches: true
      }
    })
  ]
});
