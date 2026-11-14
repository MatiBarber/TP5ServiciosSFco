import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// El manifiesto se declara aca y no en un archivo suelto para que el plugin
// lo mantenga sincronizado con el service worker que genera.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['iconos/icono-192.png', 'iconos/icono-512.png'],
      manifest: {
        name: 'Servicios San Francisco',
        short_name: 'Servicios SFco',
        description:
          'Acceso a los servicios municipales de la ciudad de San Francisco, Cordoba.',
        lang: 'es-AR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#0b6b3a',
        icons: [
          { src: 'iconos/icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'iconos/icono-512.png', sizes: '512x512', type: 'image/png' },
          {
            // Los lanzadores de Android recortan hasta un 20% del borde, de modo
            // que el icono adaptable necesita su propia version con margen.
            src: 'iconos/icono-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // El service worker de Firebase Messaging vive en public/ y lo registra
        // el propio SDK en su alcance. No debe entrar al precache de Workbox.
        globIgnores: ['**/firebase-messaging-sw.js'],
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Las teselas del mapa son el unico recurso externo de la aplicacion.
            // Se cachean para que los mapas sigan dibujandose sin conexion.
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'teselas-osm',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        // Permite probar el comportamiento sin conexion con `npm run dev`.
        enabled: false,
      },
    }),
  ],
  build: {
    rolldownOptions: {
      treeshake: {
        /**
         * Ni @ionic/react ni @ionic/core declaran "sideEffects" en su
         * package.json. Sin esa declaracion el empaquetador no puede suponer
         * que importar un componente no produce efectos, de modo que conserva
         * los ciento y pico de componentes de Ionic aunque la aplicacion use
         * treinta: en la primera compilacion eso costaba un megabyte.
         *
         * Aca se le indica que los modulos de componente de Ionic son libres
         * de efectos, lo que habilita a descartar los que ninguna pantalla
         * importa. Es valido porque los envoltorios de @ionic/react registran
         * cada elemento personalizado de forma explicita con
         * defineCustomElement, y no por el solo hecho de ser importados.
         */
        moduleSideEffects: (id) =>
          !/node_modules[\\/]@ionic[\\/]core[\\/]components[\\/]ion-/.test(id),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/pruebas/**/*.test.js'],
  },
});
