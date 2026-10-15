import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

// Deployments under a sub-path (e.g. https://owner.github.io/repo/) set
// BASE_PATH=/repo/ so that bundles, the manifest, the router and the
// prerendered head all agree on one prefix. Root hosts leave it unset.
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  // The `@` alias shadcn-style components import from
  // (`@/components/ui/…`). It maps to the same folder this app's own
  // UI primitives live in: src/components.
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      workbox: {
        // Only build assets are precached. The HTML documents are written
        // *after* this plugin runs (see scripts/prerender.mjs), and more
        // importantly each route has its own prerendered document — precaching
        // one shared `index.html` would serve the home page for every URL.
        globPatterns: ['**/*.{js,css,woff2,svg,png,ico,webmanifest}'],
        globIgnores: ['**/sw.js', '**/workbox-*.js', '**/registerSW.js', '**/og-*.png'],
        cleanupOutdatedCaches: true,
        // Do not fall back to a single app shell: that is exactly the behaviour
        // that breaks a prerendered multi-route site.
        navigateFallback: null,
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // Network-first, so a prerendered route is always served from the
            // origin when online and from its own cache entry when offline.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 3,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: ({ request }) =>
              ['style', 'script', 'worker', 'image', 'font'].includes(request.destination),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      manifest: {
        name: 'PTE Prep — Full Mock Tests',
        short_name: 'PTE Prep',
        description:
          'Free, unlimited PTE Academic mock tests with timed sections, detailed score reports and question-level review. Runs entirely in your browser.',
        theme_color: '#fff8ec',
        background_color: '#fff8ec',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: base,
        scope: base,
        categories: ['education', 'productivity'],
        icons: [
          { src: `${base}icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: `${base}icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: `${base}icon-maskable.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
  },
})
