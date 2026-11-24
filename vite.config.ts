import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { createRequire } from 'node:module'
import { fileURLToPath, URL } from 'node:url'

// Die Versionsnummer steht an genau einer Stelle: package.json. Gelesen wird
// sie ueber createRequire statt ueber process.env.npm_package_version, damit
// auch ein direkter Aufruf von vite build die richtige Nummer bekommt.
const { version } = createRequire(import.meta.url)('./package.json') as { version: string }

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Billard Training',
        short_name: 'Billard',
        description: 'Eigene Poolbillard-Stoesse bauen, trainieren und auswerten.',
        lang: 'de',
        theme_color: '#0d1f17',
        background_color: '#0d1f17',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },

  define: { __APP_VERSION__: JSON.stringify(version) },
  // Vites Standardziel waere Safari 14. Aeltere iPads bleiben damit weiss,
  // weil sie schon ?. und ?? nicht kennen - ein Syntaxfehler im Modul zeigt
  // gar nichts an. Der niedrigere Wert kostet ein paar Kilobyte.
  build: { target: ['es2019', 'safari13', 'chrome80', 'firefox78', 'edge88'] },

  // Nur auf Wunsch ans Netz. Dauerhaft offen heisst: jedes Geraet im WLAN
  // erreicht den Server, und die Pfadluecken des Entwicklungsservers stehen
  // ihm offen. Fuer die Probe auf dem iPad: VITE_HOST=1 npm run dev
  // oder npm run dev -- --host
  server: { host: process.env.VITE_HOST === '1', port: 5173 },
  /*
   * Zwei Testprofile nebeneinander, unterschieden an der Dateiendung:
   *
   * - .test.ts  rechnet. Reine Funktionen, kein Browser, sehr schnell.
   * - .test.tsx klickt. Eine Seite wird gezeichnet und bedient; dafuer
   *   braucht es eine Nachbildung der Browser-Bausteine (jsdom) und eine
   *   nachgebildete Datenbank (src/test/setup.ts).
   *
   * "extends: true" heisst: beide erben den Rest dieser Datei - vor allem
   * den Kurznamen @ fuer src und den React-Baustein.
   */
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'rechnen',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'oberflaeche',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['src/test/setup.ts'],
        },
      },
    ],
  },
})
