import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://lumu-five.vercel.app/',
  integrations: [sitemap()],
  server: { port: 4321 },
  build: { inlineStylesheets: 'auto' },
  compressHTML: true,
});