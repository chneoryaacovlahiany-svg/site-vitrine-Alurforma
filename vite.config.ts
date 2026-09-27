import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const pages = [
  'index',
  'formations',
  'entreprises',
  'financement',
  'faq',
  'contact',
  'mentions-legales',
  'cgv',
  'confidentialite',
  'accessibilite',
  'reclamations',
];

/**
 * Static includes: `<!-- @include header -->` is replaced at build (and dev)
 * time by partials/header.html. The current page's nav link receives
 * aria-current="page", so every page ships complete, crawlable HTML.
 */
function includes(): Plugin {
  return {
    name: 'alurforma-includes',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const page = basename(ctx.filename, '.html');
        return html.replace(/<!--\s*@include\s+([\w-]+)\s*-->/g, (_, name: string) => {
          const partial = readFileSync(resolve(import.meta.dirname, 'partials', `${name}.html`), 'utf8');
          return partial.replace(new RegExp(`data-page="${page}"`, 'g'), `data-page="${page}" aria-current="page"`);
        });
      },
    },
  };
}

export default defineConfig({
  plugins: [includes()],
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: Object.fromEntries(pages.map((p) => [p, resolve(import.meta.dirname, `${p}.html`)])),
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/gsap') || id.includes('node_modules/lenis')) return 'motion';
          return undefined;
        },
      },
    },
  },
});
