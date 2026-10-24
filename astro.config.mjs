import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

/**
 * Keep Cesium (~4.9 MB) out of every page's static import graph.
 *
 * Rolldown otherwise places small shared helpers (its module runtime, Vite's preload helper)
 * inside the largest chunk — Cesium. Every chunk that used a helper then statically imported
 * Cesium, so /story downloaded and parsed the whole 3D engine before its scroll script could
 * run, even on the static-poster tier. Cesium must only ever load via the dynamic
 * import('cesium') in spatial-viewer.ts.
 *
 * Client build only: includeDependenciesRecursively=false is rejected for the server build.
 * Check after builds: `grep -l 'from"./cesium' .vercel/output/static/_astro/*.js` lists nothing.
 */
const clientChunking = {
  name: 'bod-client-chunking',
  configEnvironment(name, config) {
    if (name !== 'client') return;
    return {
      build: {
        rolldownOptions: {
          // Required by includeDependenciesRecursively=false. Safe for client page-script
          // entries: nothing imports from them; this only allows extra exports to be added.
          preserveEntrySignatures: 'allow-extension',
          output: {
            codeSplitting: {
              groups: [
                { name: 'helpers', test: /rolldown\/runtime|vite\/preload-helper|commonjsHelpers/, priority: 100, includeDependenciesRecursively: false },
                { name: 'cesium', test: /node_modules[\\/](cesium|@cesium)[\\/]/, priority: 10, includeDependenciesRecursively: false },
              ],
            },
          },
        },
      },
    };
  },
};

// https://astro.build/config
export default defineConfig({
  site: 'https://thebombingofdarwin.com.au',
  compressHTML: true,

  output: 'server',
  adapter: vercel(),

  devToolbar: {
    enabled: false
  },

  vite: {
    plugins: [clientChunking],
  },
});
