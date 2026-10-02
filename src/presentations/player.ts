// A small "video-like" player for GSAP presentations: fixed virtual canvas
// scaled to fit, chapters, progress, play/pause, autoplay only while visible,
// and a still (non-animated) mode for prefers-reduced-motion.


export interface Layout {
  tall: boolean;
  W: number;
  H: number;
}

export interface Scene {
  tl: gsap.core.Timeline;
  chapters: { id: string; label: string }[];
}

export type Builder = (stage: HTMLElement, layout: Layout) => Scene;

type Style = Partial<Record<'x' | 'y' | 'w' | 'h', number>> & Record<string, string | number | undefined>;

/** Create an absolutely positioned element in the virtual canvas. */
export function el(parent: HTMLElement, cls: string, s: Style = {}, html = ''): HTMLElement {
  const n = document.createElement('div');
  n.className = cls;
  const { x, y, w, h, ...rest } = s;
  if (x !== undefined) n.style.left = `${x}px`;
  if (y !== undefined) n.style.top = `${y}px`;
  if (w !== undefined) n.style.width = `${w}px`;
  if (h !== undefined) n.style.height = `${h}px`;
  for (const [k, v] of Object.entries(rest)) if (v !== undefined) n.style.setProperty(k, String(v));
  n.innerHTML = html;
  parent.appendChild(n);
  return n;
}

/** Animate a number inside an element. */
export function counter(tl: gsap.core.Timeline, node: HTMLElement, from: number, to: number, at: string | number, suffix = ' h', duration = 1.2) {
  const o = { v: from };
  tl.to(o, { v: to, duration, ease: 'power2.out', onUpdate: () => (node.textContent = `${Math.round(o.v)}${suffix}`) }, at);
}

export function endCard(stage: HTMLElement, L: Layout) {
  const w = L.tall ? 620 : 640;
  const card = el(stage, 'st-endcard', { x: (L.W - w) / 2, y: L.tall ? 300 : 170, w });
  card.innerHTML = `<img src="${import.meta.env.BASE_URL}brand/alurforma-logo-640.png" alt="Alurforma" /><p>COMPRENDRE LA RÈGLE. SÉCURISER LA PRATIQUE.</p>`;
  if (L.tall) (card.querySelector('img') as HTMLImageElement).style.width = '420px';
  return card;
}

export class Player {
  private screen: HTMLElement;
  private stage!: HTMLElement;
  private scene!: Scene;
  private layout!: Layout;
  private visible = false;
  private userPaused = false;
  private chapterButtons: HTMLButtonElement[] = [];
  private labels: number[] = [];

  constructor(
    private root: HTMLElement,
    private build: Builder,
    private reduced: boolean,
  ) {
    this.screen = root.querySelector<HTMLElement>('[data-pres-screen]')!;
    this.mount();
    new ResizeObserver(() => this.onResize()).observe(this.screen);
    new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this.sync();
    }, { threshold: 0.35 }).observe(this.screen);
    root.querySelector<HTMLButtonElement>('[data-pres-toggle]')!.addEventListener('click', () => {
      this.userPaused = !this.userPaused;
      this.sync();
    });
    document.addEventListener('visibilitychange', () => this.sync());
  }

  private pickLayout(): Layout {
    const tall = this.screen.clientWidth < 700;
    return tall ? { tall, W: 720, H: 900 } : { tall, W: 1280, H: 656 };
  }

  private mount(at = 0) {
    this.scene?.tl.kill();
    this.layout = this.pickLayout();
    this.screen.dataset.layout = this.layout.tall ? 'tall' : 'wide';
    this.screen.replaceChildren();
    this.stage = el(this.screen, 'st', { w: this.layout.W, h: this.layout.H });
    this.scale();
    this.scene = this.build(this.stage, this.layout);
    const tl = this.scene.tl;
    tl.pause();
    tl.repeat(-1).repeatDelay(1.2);
    this.labels = this.scene.chapters.map((c) => tl.labels[c.id] ?? 0);
    const progress = this.root.querySelector<HTMLElement>('[data-pres-progress]')!;
    tl.eventCallback('onUpdate', () => {
      progress.style.transform = `scaleX(${tl.progress()})`;
      this.markChapter(tl.time());
    });
    this.renderChapters();
    if (this.reduced) this.still(0);
    else tl.time(at);
    this.sync();
  }

  private onResize() {
    const next = this.pickLayout();
    if (next.tall !== this.layout.tall) this.mount(this.scene.tl.time());
    else this.scale();
  }

  private scale() {
    const s = this.screen.clientWidth / this.layout.W;
    this.stage.style.transform = `scale(${s})`;
  }

  /** Reduced motion: show the settled end state of a chapter, no playback. */
  private still(i: number) {
    const tl = this.scene.tl;
    const end = i + 1 < this.labels.length ? this.labels[i + 1] - 0.05 : tl.duration() - 0.05;
    tl.pause().time(Math.max(0, end));
    this.markChapter(tl.time());
  }

  private renderChapters() {
    const list = this.root.querySelector<HTMLElement>('[data-pres-chapters]')!;
    list.replaceChildren();
    this.chapterButtons = this.scene.chapters.map((c, i) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = c.label;
      b.addEventListener('click', () => {
        if (this.reduced) return this.still(i);
        this.scene.tl.time(this.labels[i]);
        this.userPaused = false;
        this.sync();
      });
      li.appendChild(b);
      list.appendChild(li);
      return b;
    });
  }

  private markChapter(t: number) {
    let idx = 0;
    this.labels.forEach((l, i) => {
      if (t >= l - 0.001) idx = i;
    });
    this.chapterButtons.forEach((b, i) => (i === idx ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
  }

  private sync() {
    const toggle = this.root.querySelector<HTMLButtonElement>('[data-pres-toggle]')!;
    const playing = !this.reduced && !this.userPaused && this.visible && !document.hidden;
    if (playing) this.scene.tl.play();
    else this.scene.tl.pause();
    const paused = this.reduced || this.userPaused;
    toggle.textContent = paused ? '▶' : '❚❚';
    toggle.setAttribute('aria-label', paused ? 'Lire la présentation' : 'Mettre en pause');
    toggle.hidden = this.reduced;
  }
}
