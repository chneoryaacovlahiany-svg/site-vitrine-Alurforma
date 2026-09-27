import '@fontsource-variable/inter';
import '@fontsource-variable/space-grotesk';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import './styles/main.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { CONFIG } from './config';
import { CHAPTERS, PILLARS, chapterAt } from './timeline';
import { initConfigurator } from './ui/configurator';
import { initForm } from './ui/form';
import { initTabs } from './ui/tabs';

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s)!;
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(s));

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// -------------------------------------------------------------- config ----

$$<HTMLAnchorElement>('[data-lms]').forEach((a) => (a.href = CONFIG.lmsUrl));
$$('[data-year]').forEach((n) => (n.textContent = String(new Date().getFullYear())));
if (CONFIG.logo) {
  const img = new Image();
  img.alt = 'Alurforma';
  img.decoding = 'async';
  img.onload = () => $$('[data-brand]').forEach((b) => b.replaceChildren(img.cloneNode()));
  img.src = CONFIG.logo;
}

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

document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!a || a.hasAttribute('data-play-demo')) return;
  const id = a.getAttribute('href')!;
  if (id.length < 2) return;
  const el = document.querySelector<HTMLElement>(id);
  if (!el) return;
  e.preventDefault();
  closeMenu();
  const sel = a.dataset.subject;
  if (sel) document.dispatchEvent(new CustomEvent('subject', { detail: sel }));
  scrollToY(el.getBoundingClientRect().top + window.scrollY - 72);
  history.replaceState(null, '', id);
  el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
});

// ------------------------------------------------------------------- nav --

const nav = $('[data-nav]');
const burger = $<HTMLButtonElement>('[data-burger]');
const menu = $('[data-menu]');
function closeMenu() {
  burger.setAttribute('aria-expanded', 'false');
  menu.hidden = true;
}
burger.addEventListener('click', () => {
  const open = burger.getAttribute('aria-expanded') !== 'true';
  burger.setAttribute('aria-expanded', String(open));
  menu.hidden = !open;
  nav.classList.add('is-solid');
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
  nav.classList.toggle('is-solid', y > 24 || !menu.hidden);
  nav.classList.toggle('is-hidden', y > 400 && y > lastY + 4 && menu.hidden === true);
  if (y < lastY - 4) nav.classList.remove('is-hidden');
  lastY = y;
}
window.addEventListener('scroll', onScrollNav, { passive: true });
onScrollNav();

// -------------------------------------------------------------- showcase --

const show = $('[data-show]');
const canvas = $<HTMLCanvasElement>('[data-canvas]');
const hero = $('[data-hero]');
const caption = $('[data-caption]');
const rail = $('[data-rail]');
const progressBar = $('[data-progress]');
const hint = $('[data-hint]');

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

type Mode = 'scroll' | 'auto' | 'static';
const mode: Mode = !webglAvailable() ? 'static' : window.innerWidth >= 1100 && finePointer && !reduced ? 'scroll' : 'auto';
show.dataset.mode = mode;
if (mode === 'static') $('[data-fallback]').hidden = false;

// Rail of chapters
const railButtons = CHAPTERS.map((c, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.innerHTML = `<span>${c.label}</span><i></i>`;
  b.setAttribute('aria-label', `Étape ${i + 1} : ${c.label}`);
  rail.appendChild(b);
  return b;
});

let activeChapter = -1;
let activePillar = -1;
function setChapter(i: number) {
  if (i === activeChapter) return;
  activeChapter = i;
  railButtons.forEach((b, j) => (j === i ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
  const p = CHAPTERS[i].pillar;
  if (p !== activePillar) {
    activePillar = p;
    const pl = PILLARS[p];
    $('[data-cap-kicker]').textContent = pl.kicker;
    $('[data-cap-title]').textContent = pl.title;
    $('[data-cap-body]').textContent = pl.body;
    caption.classList.remove('is-swap');
    void caption.offsetWidth;
    caption.classList.add('is-swap');
  }
}
setChapter(0);

type ShowcaseT = import('./scenes/showcase').Showcase;
let scene: ShowcaseT | null = null;

async function loadScene(damping: boolean) {
  // Screens are painted with web fonts: make sure they are ready first.
  await Promise.all([
    document.fonts.load('600 20px "Inter Variable"'),
    document.fonts.load('700 20px "Space Grotesk Variable"'),
    document.fonts.load('400 20px "Instrument Serif"'),
  ]).catch(() => undefined);
  const { Showcase } = await import('./scenes/showcase');
  scene = new Showcase(canvas, { damping });
  window.addEventListener('resize', () => scene?.resize(), { passive: true });
  requestAnimationFrame(() => canvas.classList.add('is-ready'));
  return scene;
}

function whenIdle(fn: () => void) {
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: object) => void }).requestIdleCallback;
  if (ric) ric(fn, { timeout: 1200 });
  else setTimeout(fn, 200);
}

if (mode === 'scroll') {
  // The hero copy hands over to the chapter caption and rail.
  const tl = gsap.timeline({
    scrollTrigger: { trigger: show, start: 'top top', end: '+=70%', scrub: true },
  });
  tl.to(hero, { autoAlpha: 0, y: -60, ease: 'none' }, 0)
    .to('.show__veil', { opacity: 0.25, ease: 'none' }, 0)
    .to(hint, { autoAlpha: 0, ease: 'none', duration: 0.3 }, 0)
    .fromTo([caption, rail], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, ease: 'none', duration: 0.5 }, 0.5);

  let st: ScrollTrigger;
  whenIdle(async () => {
    const s = await loadScene(true);
    st = ScrollTrigger.create({
      trigger: show,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        s.setProgress(self.progress);
        progressBar.style.transform = `scaleX(${self.progress})`;
        setChapter(chapterAt(self.progress));
      },
    });
    s.setProgress(st.progress, true);
    // Only render while the section is on screen.
    new IntersectionObserver(([e]) => (e.isIntersecting ? s.start() : s.stop())).observe(show);
  });

  railButtons.forEach((b, i) =>
    b.addEventListener('click', () => {
      const top = show.offsetTop;
      const len = show.offsetHeight - window.innerHeight;
      scrollToY(top + CHAPTERS[i].at * len);
    }),
  );
  $('[data-play-demo]').addEventListener('click', (e) => {
    e.preventDefault();
    const len = show.offsetHeight - window.innerHeight;
    scrollToY(show.offsetTop + CHAPTERS[1].at * len);
  });
} else if (mode === 'auto') {
  // Touch devices / small screens / reduced motion: a self-running loop with
  // an explicit pause, tap-to-jump chapters, and no autoplay if reduced.
  const controls = $('[data-controls]');
  const toggle = $<HTMLButtonElement>('[data-toggle]');
  const toggleLabel = $('[data-toggle-label]');
  controls.hidden = false;
  hint.hidden = true;
  const LOOP = 38; // seconds for a full pass
  let t = CHAPTERS[0].at;
  let playing = !reduced;
  let visible = false;
  let last = 0;
  let raf = 0;

  const setPlaying = (p: boolean) => {
    playing = p;
    toggle.setAttribute('aria-pressed', String(!p));
    toggleLabel.textContent = p ? 'Pause' : 'Lecture';
  };
  setPlaying(playing);

  whenIdle(async () => {
    const s = await loadScene(!reduced);
    s.setProgress(t, true);
    s.renderOnce();
    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (playing && visible) {
        t += dt / LOOP;
        if (t > 1) t = 0;
        s.setProgress(t, true);
        setChapter(chapterAt(t));
      }
    };
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) {
        s.start();
        last = 0;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(step);
      } else {
        s.stop();
        cancelAnimationFrame(raf);
      }
    }).observe(canvas);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) setPlaying(false);
    });
    toggle.addEventListener('click', () => setPlaying(!playing));
    railButtons.forEach((b, i) =>
      b.addEventListener('click', () => {
        t = CHAPTERS[i].at;
        setChapter(i);
        s.setProgress(t, reduced);
        if (reduced) s.renderOnce();
      }),
    );
  });
  $('[data-play-demo]').addEventListener('click', (e) => {
    e.preventDefault();
    canvas.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    setPlaying(true);
  });
}

// ------------------------------------------------------------ reveals ----

if (!reduced) {
  gsap.set('.reveal', { autoAlpha: 0, y: 34 });
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%',
    once: true,
    onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, overwrite: true }),
  });

  // Method underline fills as the section scrolls.
  $$('.step').forEach((el, i) => {
    gsap.fromTo(el, { '--p': 0 }, { '--p': 1, ease: 'none', scrollTrigger: { trigger: '.steps', start: `top ${80 - i * 8}%`, end: `top ${40 - i * 8}%`, scrub: true } });
  });
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

$$('.board, .chain').forEach((el) => {
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

initConfigurator($('[data-config]'), $('[data-config-result]'));
initTabs($('[data-tabs]'));
initForm($<HTMLFormElement>('[data-form]'));

window.addEventListener('load', () => ScrollTrigger.refresh());
