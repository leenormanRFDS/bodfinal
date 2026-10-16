import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://thebombingofdarwin.com.au',
  compressHTML: true,

  output: 'server',
  adapter: vercel(),

  devToolbar: {
    enabled: false
  }
});
