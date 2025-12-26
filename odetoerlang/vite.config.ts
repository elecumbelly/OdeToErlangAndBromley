import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg', 'sql-wasm.wasm'],
      manifest: {
        name: 'OdeToErlang WFM Calculator',
        short_name: 'OdeToErlang',
        description: 'Contact Center Capacity Planning & WFM Tool',
        theme_color: '#0891b2',
        background_color: '#0f172a',
        display: 'standalone',
        scope: '/OdeToErlangAndBromley/',
        start_url: '/OdeToErlangAndBromley/',
        icons: [
          {
            src: 'vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
        // Force new service worker to activate immediately
        skipWaiting: true,
        clientsClaim: true,
        // Don't cache-bust hashed assets (Vite already does this)
        dontCacheBustURLsMatching: /\.[0-9a-f]{8}\./,
      }
    })
  ],
  base: '/OdeToErlangAndBromley/',
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
