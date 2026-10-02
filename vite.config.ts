import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import type { Plugin as PostcssPlugin } from 'postcss';
import { defineConfig, type Plugin } from 'vite';
import { CONFIG } from './src/config';
import { renderFaqJsonLd, renderFaqList, renderFaqNav } from './src/content/faq';

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

/**
 * FAQ: `<!-- @faq nav|list|jsonld -->` markers are filled from
 * src/content/faq.ts, so accordions, nav and FAQPage JSON-LD share one source.
 */
function faq(): Plugin {
  const render = { nav: renderFaqNav, list: renderFaqList, jsonld: renderFaqJsonLd } as const;
  return {
    name: 'alurforma-faq',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replace(/<!--\s*@faq\s+(nav|list|jsonld)\s*-->/g, (_, k: keyof typeof render) => render[k]()),
    },
  };
}

/**
 * Contact details: `{{phone}}`, `{{email}}`, `{{address}}`… in pages and
 * partials are filled from CONFIG, the single source of truth. Runs after
 * the includes so partials are covered too.
 */
function coords(): Plugin {
  const nbsp = (s: string) => s.replace(/ /g, '&nbsp;');
  const tokens: Record<string, string> = {
    phone: CONFIG.phone.display,
    phone_nbsp: nbsp(CONFIG.phone.display),
    phone_href: `tel:${CONFIG.phone.href}`,
    phone_e164: CONFIG.phone.href,
    email: CONFIG.email,
    email_href: `mailto:${CONFIG.email}`,
    address: CONFIG.address,
    address_nbsp: CONFIG.address.split(', ').map(nbsp).join(', '),
  };
  return {
    name: 'alurforma-coords',
    transformIndexHtml: {
      order: 'pre',
      handler: (html, ctx) =>
        html.replace(/\{\{(\w+)\}\}/g, (m, k: string) => {
          if (!(k in tokens)) throw new Error(`Unknown token ${m} in ${ctx.filename}`);
          return tokens[k];
        }),
    },
  };
}

/**
 * Accessibility preferences are re-applied before first paint by
 * public/a11y-boot.js (a file, not inline: the CSP only allows 'self').
 */
function a11yBoot(): Plugin {
  return {
    name: 'alurforma-a11y-boot',
    transformIndexHtml: () => [{ tag: 'script', attrs: { src: '/a11y-boot.js' }, injectTo: 'head-prepend' }],
  };
}

/**
 * CSS rewrites for the accessibility panel (src/ui/a11y.ts):
 * - every font size is multiplied by --a11y-fs (A− … A++), since the site's
 *   sizes are in px and a root font-size change would not reach them;
 * - semi-transparent text colours get a minimum opacity, --a11y-alpha, raised
 *   by « Contraste renforcé ».
 * Both variables default to a no-op, so the normal rendering is unchanged.
 */
function a11yCss(): PostcssPlugin {
  const SIZE = /\d*\.?\d+px|(?:clamp|min|max)\((?:[^()]|\([^()]*\))*\)/;
  const scale = (v: string) => `calc(${v} * var(--a11y-fs, 1))`;
  return {
    postcssPlugin: 'alurforma-a11y',
    Declaration(decl) {
      if (decl.value.includes('--a11y-')) return;
      if (decl.prop === 'font-size' && /px|vw|vh/.test(decl.value)) decl.value = scale(decl.value);
      else if (decl.prop === 'font') decl.value = decl.value.replace(SIZE, scale);
      else if (decl.prop === 'color')
        decl.value = decl.value.replace(
          /rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*(0?\.\d+)\s*\)/g,
          (_, r, g, b, a) => `rgba(${r}, ${g}, ${b}, max(${a}, var(--a11y-alpha, 0)))`,
        );
    },
  };
}

export default defineConfig({
  plugins: [includes(), faq(), coords(), a11yBoot()],
  css: { postcss: { plugins: [a11yCss()] } },
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
