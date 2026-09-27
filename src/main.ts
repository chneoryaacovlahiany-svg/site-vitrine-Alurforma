import '@fontsource-variable/inter';
import '@fontsource-variable/space-grotesk';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import './styles/main.css';
import './styles/pages.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { CONFIG } from './config';
import { initConfigurator } from './ui/configurator';
import { initForm } from './ui/form';
import { initTabs } from './ui/tabs';

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(s));

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// -------------------------------------------------------------- config ----

$$<HTMLAnchorElement>('[data-lms]').forEach((a) => (a.href = CONFIG.lmsUrl));
$$('[data-year]').forEach((n) => (n.textContent = String(new Date().getFullYear())));

// ------------------------------------------------------------ smooth scroll

let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function scrollToY(y: number, immediate = false) {
  if (lenis) lenis.scrollTo(y, { immediate, duration: 1.4 });
  else window.scrollTo({ top: y, behavior: 'auto' });
}

function scrollToEl(el: HTMLElement) {
  scrollToY(el.getBoundingClientRect().top + window.scrollY - 88);
  el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

// ------------------------------------------------------------------- nav --

const nav = $('[data-nav]')!;
const burger = $<HTMLButtonElement>('[data-burger]')!;
const menu = $('[data-menu]')!;
function closeMenu() {
  burger.setAttribute('aria-expanded', 'false');
  menu.hidden = true;
}
burger.addEventListener('click', () => {
  const open = burger.getAttribute('aria-expanded') !== 'true';
  burger.setAttribute('aria-expanded', String(open));
  menu.hidden = !open;
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !menu.hidden) {
    closeMenu();
    burger.focus();
  }
});
let lastY = 0;
function onScrollNav() {
  const y = window.scrollY;
  nav.classList.toggle('is-solid', y > 24);
  nav.classList.toggle('is-hidden', y > 500 && y > lastY + 4 && menu.hidden === true);
  if (y < lastY - 4) nav.classList.remove('is-hidden');
  lastY = y;
}
window.addEventListener('scroll', onScrollNav, { passive: true });
onScrollNav();

// ------------------------------------------------------------ tabs ----

const tabs = $('[data-tabs]');
const tabApi = tabs ? initTabs(tabs, { syncHash: tabs.hasAttribute('data-hash-tabs') }) : null;

// In-page anchors (smooth, and able to open a tab panel first).
document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
  if (!a || a.hasAttribute('data-play-demo')) return;
  const url = new URL(a.href, location.href);
  if (url.pathname !== location.pathname || url.hash.length < 2) return;
  const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
  if (!target) return;
  e.preventDefault();
  closeMenu();
  if (tabApi?.has(target.id)) {
    tabApi.select(target.id);
    scrollToEl(tabs!);
  } else scrollToEl(target);
  history.replaceState(null, '', url.hash);
  const preset = a.dataset.preset;
  if (preset) document.dispatchEvent(new CustomEvent('preset-hours', { detail: preset }));
});

// ------------------------------------------------------------ home hero ---

const heroVideo = $<HTMLVideoElement>('[data-hero-video]');
if (heroVideo) {
  if (reduced) {
    // Still image of the open door, no playback.
    heroVideo.removeAttribute('preload');
    heroVideo.poster = `${import.meta.env.BASE_URL}media/porte-ouverte.jpg`;
  } else {
    // The door opens once, then rests on its last (open) frame.
    heroVideo.play().catch(() => (heroVideo.poster = `${import.meta.env.BASE_URL}media/porte-ouverte.jpg`));
  }
}

const filmBtn = $('[data-film]');
const filmModal = $<HTMLDialogElement>('[data-film-modal]');
if (filmBtn && filmModal) {
  const v = $<HTMLVideoElement>('[data-film-video]', filmModal)!;
  filmBtn.addEventListener('click', () => {
    filmModal.showModal();
    v.currentTime = 0;
    v.play().catch(() => undefined);
  });
  const close = () => {
    v.pause();
    filmModal.close();
  };
  $('[data-film-close]', filmModal)!.addEventListener('click', close);
  filmModal.addEventListener('click', (e) => {
    if (e.target === filmModal) close();
  });
  filmModal.addEventListener('close', () => v.pause());
}

// ------------------------------------------------------ 3D sequence ----

if ($('[data-show]')) {
  import('./ui/showcase').then(({ initShowcase }) => initShowcase({ reduced, finePointer, scrollToY }));
}

// ---------------------------------------------------- presentations ----

$$('[data-presentation]').forEach(async (root) => {
  const kind = root.dataset.presentation;
  const [{ Player }, builder] = await Promise.all([
    import('./presentations/player'),
    kind === 'packs'
      ? import('./presentations/packs').then((m) => m.buildPacks)
      : kind === 'agence'
        ? import('./presentations/agence').then((m) => m.buildAgence)
        : import('./presentations/financement').then((m) => m.buildFinancement),
  ]);
  await document.fonts.ready;
  new Player(root, builder, reduced);
});

// ------------------------------------------------------------ reveals ----

if (!reduced && $$('.reveal').length) {
  gsap.set('.reveal', { autoAlpha: 0, y: 34 });
  ScrollTrigger.batch('.reveal', {
    start: 'top 90%',
    once: true,
    onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, overwrite: true }),
  });

  // Inner-page heroes: the two light paths draw themselves.
  $$<SVGPathElement>('.page-hero__paths path').forEach((p, i) => {
    const len = p.getTotalLength();
    gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 2.2, delay: 0.2 + i * 0.25, ease: 'power3.out' });
  });
  const intro = (sel: string, vars: gsap.TweenVars) => {
    const els = $$(sel);
    if (els.length) gsap.from(els, vars);
  };
  intro('.page-hero__inner > *', { y: 24, autoAlpha: 0, duration: 1, stagger: 0.1, ease: 'expo.out', delay: 0.1 });
  intro('.hero-v__copy > *, .preview', { y: 28, autoAlpha: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out', delay: 0.3 });
}

// Subtle 3D tilt on premium cards (pointer devices only, ≤ 6°).
if (finePointer && !reduced) {
  $$('[data-tilt]').forEach((el) => {
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
    gsap.set(el, { transformPerspective: 1200 });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 8);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 6);
    });
    el.addEventListener('pointerleave', () => {
      rx(0);
      ry(0);
    });
  });
}

$$('.chain').forEach((el) => {
  new IntersectionObserver(
    ([e], o) => {
      if (e.isIntersecting) {
        el.classList.add('is-in');
        o.disconnect();
      }
    },
    { threshold: 0.4 },
  ).observe(el);
});

// ------------------------------------------------------------ widgets ----

const config = $('[data-config]');
if (config) initConfigurator(config, $('[data-config-result]')!);
const form = $<HTMLFormElement>('[data-form]');
if (form) initForm(form);

// Open a tab from the URL hash on load (e.g. formations.html#packs).
if (tabApi && location.hash.length > 1) {
  const id = decodeURIComponent(location.hash.slice(1));
  if (tabApi.has(id)) tabApi.select(id);
}

window.addEventListener('load', () => ScrollTrigger.refresh());
