// Home page 3D device sequence controller (scroll on desktop, autoplay on touch).

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CHAPTERS, PILLARS, chapterAt } from '../timeline';

interface Ctx {
  reduced: boolean;
  finePointer: boolean;
  scrollToY: (y: number, immediate?: boolean) => void;
}

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s)!;

export function initShowcase({ reduced, finePointer, scrollToY }: Ctx) {

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

  type ShowcaseT = import('../scenes/showcase').Showcase;
  let scene: ShowcaseT | null = null;

  async function loadScene(damping: boolean) {
    // Screens are painted with web fonts: make sure they are ready first.
    await Promise.all([
      document.fonts.load('600 20px "Inter Variable"'),
      document.fonts.load('700 20px "Space Grotesk Variable"'),
      document.fonts.load('400 20px "Instrument Serif"'),
    ]).catch(() => undefined);
    // The screens also draw the official logo: wait for it to decode.
    await (await import('../lms/draw')).logoReady;
    const { Showcase } = await import('../scenes/showcase');
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
      .fromTo(rail, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, ease: 'none', duration: 0.5 }, 0.5)
      .fromTo(caption, { autoAlpha: 0 }, { autoAlpha: 1, ease: 'none', duration: 0.5 }, 0.5);

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
      let onScreen = false;
      new IntersectionObserver(([e]) => {
        onScreen = e.isIntersecting;
        if (onScreen) s.start();
        else s.stop();
      }).observe(show);
      // The caption follows the scene: it sits in the free space beside the
      // device in focus (laptop screen, phone, attestation), never on it.
      placeCaption(() => s.focusRect, () => s.otherRects, () => onScreen);
    });

    // "Lecture": the page scrolls itself through the sequence at a steady
    // pace; any wheel, touch or navigation key hands control back.
    const controls = $('[data-controls]');
    const toggle = $<HTMLButtonElement>('[data-toggle]');
    const toggleLabel = $('[data-toggle-label]');
    controls.hidden = false;
    const DURATION = 45; // seconds for the whole sequence
    let playing = false;
    let raf = 0;
    let last = 0;
    let y = 0;
    const bounds = () => {
      const top = show.offsetTop;
      const len = show.offsetHeight - window.innerHeight;
      return { top, len, end: top + len };
    };
    const setLabel = () => {
      const done = window.scrollY >= bounds().end - 2;
      toggleLabel.textContent = playing ? '❚❚ Pause' : done ? '↺ Revoir' : '▶ Lecture';
      toggle.setAttribute('aria-pressed', String(playing));
      toggle.setAttribute('aria-label', playing ? 'Mettre la démonstration en pause' : 'Lire la démonstration automatiquement');
    };
    const nav = document.querySelector('[data-nav]');
    const stop = () => {
      playing = false;
      cancelAnimationFrame(raf);
      // Header comes back once, as soon as the visitor has control again.
      // Wait for the last programmatic scroll to land before releasing it,
      // so "hide on scroll down" does not catch it.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          document.body.classList.remove('is-demo-playing');
          nav?.classList.remove('is-hidden');
        }),
      );
      setLabel();
    };
    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      // Capped at 0.25 s so a slow machine keeps a steady pace without jumps.
      const dt = last ? Math.min(0.25, (now - last) / 1000) : 0;
      last = now;
      const b = bounds();
      y = Math.min(b.end, y + (b.len / DURATION) * dt);
      scrollToY(y, true);
      if (y >= b.end) stop();
    };
    const play = () => {
      const b = bounds();
      y = Math.max(window.scrollY, b.top);
      if (y >= b.end - 2) y = b.top;
      playing = true;
      last = 0;
      // Immersive playback: the header slides away once instead of flickering.
      document.body.classList.add('is-demo-playing');
      scrollToY(y, true);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(step);
      setLabel();
    };
    setLabel();
    toggle.addEventListener('click', () => (playing ? stop() : play()));
    const interrupt = () => {
      if (playing) stop();
    };
    window.addEventListener('wheel', interrupt, { passive: true });
    window.addEventListener('touchstart', interrupt, { passive: true });
    window.addEventListener('keydown', (e) => {
      if (e.target !== toggle && ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) interrupt();
    });
    window.addEventListener('scroll', () => {
      if (!playing) setLabel();
    }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
    });

    railButtons.forEach((b, i) =>
      b.addEventListener('click', () => {
        stop();
        const { top, len } = bounds();
        scrollToY(top + CHAPTERS[i].at * len);
      }),
    );
    $('[data-play-demo]').addEventListener('click', (e) => {
      e.preventDefault();
      play();
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
      toggleLabel.textContent = p ? '❚❚ Pause' : '▶ Lecture';
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


}

/**
 * Keep the chapter caption next to the device in focus, never on it, and
 * away from the other visible devices whenever possible. Candidate spots
 * (left, right, below, above the device, then the stage corners) are tried
 * in full and compact size; the one overlapping the least wins.
 */
type R = import('../scenes/showcase').FocusRect;
function placeCaption(focus: () => R, others: () => R[], active: () => boolean) {
  const caption = document.querySelector<HTMLElement>('[data-caption]')!;
  const stage = document.querySelector<HTMLElement>('[data-stage]')!;
  const rail = document.querySelector<HTMLElement>('[data-rail]')!;
  caption.classList.add('is-floating');
  const qx = gsap.quickTo(caption, 'x', { duration: 0.8, ease: 'power3' });
  const qy = gsap.quickTo(caption, 'y', { duration: 0.8, ease: 'power3' });
  const PAD = 32;
  const heights = { full: 230, compact: 96 };
  let first = true;
  const overlap = (a: R, b: R) =>
    Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

  gsap.ticker.add(() => {
    if (!active()) return;
    const hard = focus();
    if (!(hard.right > hard.left)) return;
    const soft = others();
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const minX = Math.max(24, (W - 1360) / 2 + 24);
    const maxX = rail.getBoundingClientRect().left - stage.getBoundingClientRect().left - 24;
    const minY = 88;
    const maxY = H - 28;
    const clampX = (x: number, w: number) => Math.min(Math.max(x, minX), maxX - w);
    const clampY = (y: number, h: number) => Math.min(Math.max(y, minY), maxY - h);

    let best: { x: number; y: number; w: number; compact: boolean; score: number } | null = null;
    for (const compact of [false, true]) {
      const w = compact ? 280 : Math.min(420, W * 0.3);
      const h = compact ? heights.compact : heights.full;
      const cy = clampY((hard.top + hard.bottom) / 2 - h / 2, h);
      const spots: [number, number][] = [
        [hard.left - PAD - w, cy],
        [hard.right + PAD, cy],
        [clampX(hard.left, w), hard.bottom + 16],
        [clampX(hard.left, w), hard.top - h - 16],
        [minX, maxY - h],
        [minX, minY],
      ];
      spots.forEach(([x, y], i) => {
        if (x < minX - 0.5 || x + w > maxX + 0.5 || y < minY - 0.5 || y + h > maxY + 0.5) return;
        const box = { left: x, top: y, right: x + w, bottom: y + h };
        const area = w * h;
        const onFocus = overlap(box, hard) / area;
        const onOthers = soft.reduce((sum, o) => sum + overlap(box, o), 0) / area;
        const score = onFocus * 10 + onOthers + (compact ? 0.12 : 0) + i * 0.01;
        if (!best || score < best.score) best = { x, y, w, compact, score };
      });
    }
    if (!best) return;
    const b: { x: number; y: number; w: number; compact: boolean } = best;
    caption.classList.toggle('is-compact', b.compact);
    caption.style.width = `${b.w}px`;
    heights[b.compact ? 'compact' : 'full'] = caption.offsetHeight;
    if (first) {
      gsap.set(caption, { x: b.x, y: b.y });
      first = false;
    } else {
      qx(b.x);
      qy(b.y);
    }
  });
}
