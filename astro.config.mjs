// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://lumu.cd',
  server: {
    port: 4321,
  },
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
});