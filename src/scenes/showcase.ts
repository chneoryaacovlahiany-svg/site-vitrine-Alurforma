// The cinematic device sequence. One WebGL renderer, one scene, driven by a
// single timeline value t ∈ [0, 1] (scroll on desktop, autoplay on mobile).

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { DesktopScreen, DESK_PAGES, type ScreenState } from '../lms/desktop';
import { MobileScreen, MOB_PAGES } from '../lms/mobile';
import { renderAttestation } from '../lms/attestation';
import { createLaptop, createPhone, createPaper, createShadow, type Laptop, type Phone, type Paper } from './devices';

// ------------------------------------------------------------ math utils --

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Eased 0..1 progress of t inside [a, b]. */
const seg = (t: number, a: number, b: number) => ease(clamp01((t - a) / (b - a)));

type V3 = [number, number, number];
interface Key<T> {
  t: number;
  v: T;
}
/** Piecewise eased interpolation across keyframes of 3-vectors. */
function track(keys: Key<V3>[], t: number): V3 {
  if (t <= keys[0].t) return keys[0].v;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t <= b.t) {
      const e = seg(t, a.t, b.t);
      return [lerp(a.v[0], b.v[0], e), lerp(a.v[1], b.v[1], e), lerp(a.v[2], b.v[2], e)];
    }
  }
  return keys[keys.length - 1].v;
}
const scalar = (keys: Key<number>[], t: number) => track(keys.map((k) => ({ t: k.t, v: [k.v, 0, 0] as V3 })), t)[0];

/**
 * Split [t0, t1] into n "dwell" windows separated by short transitions and
 * return the continuous page index + in-page scroll for t.
 */
function pages(t: number, t0: number, t1: number, n: number): { page: number; scroll: number } {
  const r = 0.3; // transition length relative to a dwell window
  const d = (t1 - t0) / (n + (n - 1) * r);
  let u = clamp01((t - t0) / (t1 - t0)) * (t1 - t0);
  for (let i = 0; i < n; i++) {
    if (u <= d || i === n - 1) return { page: i, scroll: ease(clamp01(u / d)) };
    u -= d;
    if (u <= d * r) return { page: i + ease(u / (d * r)), scroll: 1 };
    u -= d * r;
  }
  return { page: n - 1, scroll: 1 };
}

// ----------------------------------------------------------- choreography --

// Camera keyframes — each one is a distinct "shot" of the product.
const CAM_POS: Key<V3>[] = [
  { t: 0.0, v: [0.4, 3.4, 8.8] },
  { t: 0.1, v: [0.2, 2.3, 7.0] },
  { t: 0.17, v: [0, 1.7, 5.6] },
  { t: 0.24, v: [0, 1.25, 4.75] }, // home — straight on
  { t: 0.33, v: [-0.9, 1.2, 4.45] }, // video — orbit left, closer
  { t: 0.43, v: [0.85, 1.35, 4.55] }, // quiz — orbit right
  { t: 0.54, v: [0, 1.75, 4.9] }, // progress — slightly high
  { t: 0.64, v: [0.9, 1.5, 6.2] }, // pull back, reveal the phone
  { t: 0.72, v: [1.35, 1.2, 5.2] },
  { t: 0.8, v: [1.05, 1.1, 4.9] },
  { t: 0.87, v: [1.6, 1.3, 5.0] },
  { t: 0.95, v: [0.2, 1.25, 5.7] },
  { t: 1.0, v: [0.1, 1.25, 5.6] },
];
const CAM_LOOK: Key<V3>[] = [
  { t: 0.0, v: [0, 0.4, 0] },
  { t: 0.1, v: [0, 0.8, 0] },
  { t: 0.17, v: [0, 1.05, -0.2] },
  { t: 0.24, v: [0, 1.08, -0.3] },
  { t: 0.54, v: [0, 1.05, -0.3] },
  { t: 0.64, v: [0.9, 1.05, 0.6] },
  { t: 0.72, v: [1.25, 1.12, 1.4] },
  { t: 0.87, v: [1.25, 1.12, 1.4] },
  { t: 0.95, v: [0.2, 1.12, 1.6] },
];
const LAPTOP_POS: Key<V3>[] = [
  { t: 0, v: [0, 0, 0] },
  { t: 0.58, v: [0, 0, 0] },
  { t: 0.68, v: [-1.25, -0.05, -1.0] },
  { t: 0.9, v: [-1.25, -0.05, -1.0] },
  { t: 0.97, v: [-2.1, -0.15, -1.6] },
];
const LAPTOP_ROT_Y: Key<number>[] = [
  { t: 0, v: -0.62 },
  { t: 0.1, v: -0.4 },
  { t: 0.17, v: 0 },
  { t: 0.58, v: 0 },
  { t: 0.68, v: 0.32 },
];
const PHONE_POS: Key<V3>[] = [
  { t: 0.58, v: [3.2, -1.8, 1.0] },
  { t: 0.66, v: [1.3, 1.0, 1.35] },
  { t: 0.72, v: [1.25, 1.12, 1.4] },
  { t: 0.9, v: [1.25, 1.12, 1.4] },
  { t: 0.97, v: [1.6, 1.0, 0.7] },
];
const PHONE_ROT: Key<V3>[] = [
  { t: 0.58, v: [0.5, -1.6, 0.4] },
  { t: 0.66, v: [0.05, -0.55, 0.04] }, // arrives showing its profile…
  { t: 0.72, v: [0, 0, 0] }, // …then pivots to face the visitor
  { t: 0.8, v: [0, 0.12, 0] },
  { t: 0.87, v: [0, -0.1, 0] },
  { t: 0.9, v: [0, 0, 0] },
  { t: 0.97, v: [0, -0.42, 0] },
];
const PAPER_POS: Key<V3>[] = [
  { t: 0.89, v: [1.25, 1.1, 1.3] },
  { t: 0.96, v: [0.1, 1.12, 2.25] },
];
const PAPER_ROT: Key<V3>[] = [
  { t: 0.89, v: [0, -0.6, 0] },
  { t: 0.96, v: [-0.04, -0.1, 0] },
  { t: 1.0, v: [-0.04, -0.06, 0] },
];

export interface Frame {
  laptopScreen: ScreenState;
  phoneScreen: ScreenState;
  lid: number;
  paper: number;
}

export function frameAt(t: number): Frame {
  const lp = pages(t, 0.2, 0.585, DESK_PAGES);
  const mp = pages(t, 0.705, 0.895, MOB_PAGES);
  return {
    lid: lerp(Math.PI / 2 - 0.02, -0.26, seg(t, 0.01, 0.11)),
    laptopScreen: {
      power: seg(t, 0.12, 0.155) * (1 - 0.35 * seg(t, 0.6, 0.68)),
      boot: seg(t, 0.155, 0.2),
      page: lp.page,
      scroll: lp.scroll,
    },
    phoneScreen: {
      power: seg(t, 0.655, 0.675),
      boot: seg(t, 0.672, 0.705),
      page: mp.page,
      scroll: mp.scroll,
    },
    paper: seg(t, 0.89, 0.93),
  };
}

// ------------------------------------------------------------ the scene --

export class Showcase {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  private laptop: Laptop;
  private phone: Phone;
  private paper: Paper;
  private laptopShadow: THREE.Mesh;
  private phoneShadow: THREE.Mesh;
  private desk = new DesktopScreen();
  private mob = new MobileScreen();
  private deskTex: THREE.CanvasTexture;
  private mobTex: THREE.CanvasTexture;
  private lastDesk = '';
  private lastMob = '';
  private target = 0;
  private current = 0;
  private pointer = new THREE.Vector2();
  private tilt = new THREE.Vector2();
  private root = new THREE.Group();
  private raf = 0;
  private running = false;
  private dirty = true;
  private offsetX = 0;
  private lastTime = 0;

  constructor(private canvas: HTMLCanvasElement, private opts: { damping?: boolean } = {}) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(3, 6, 4);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x6f8cff, 1.6);
    rim.position.set(-4, 3, -4);
    this.scene.add(rim);

    const aniso = this.renderer.capabilities.getMaxAnisotropy();
    this.deskTex = new THREE.CanvasTexture(this.desk.canvas);
    this.mobTex = new THREE.CanvasTexture(this.mob.canvas);
    for (const t of [this.deskTex, this.mobTex]) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = aniso;
      t.generateMipmaps = true;
      t.minFilter = THREE.LinearMipmapLinearFilter;
    }
    const attTex = new THREE.CanvasTexture(renderAttestation());
    attTex.colorSpace = THREE.SRGBColorSpace;
    attTex.anisotropy = aniso;

    this.laptop = createLaptop(this.deskTex);
    this.phone = createPhone(this.mobTex);
    this.paper = createPaper(attTex);
    this.laptopShadow = createShadow(5.2, 3.6);
    this.phoneShadow = createShadow(1.6, 0.9);
    this.laptop.group.add(this.laptopShadow);
    this.root.add(this.laptop.group, this.phone.group, this.paper.group, this.phoneShadow);
    this.scene.add(this.root);

    window.addEventListener('pointermove', this.onPointer, { passive: true });
    this.resize();
    this.apply(0);
  }

  /** Timeline position requested by the controller (scroll/autoplay). */
  setProgress(t: number, immediate = false) {
    this.target = clamp01(t);
    if (immediate || !this.opts.damping) this.current = this.target;
    this.dirty = true;
  }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // On wide screens, shift the optical centre right so copy sits on the left.
    this.offsetX = w >= 1100 ? -w * 0.14 : 0;
    this.camera.setViewOffset(w, h, this.offsetX, 0, w, h);
    this.camera.fov = w / h < 1 ? 42 : 30;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  start() {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      this.tick();
    };
    loop();
  }

  stop() {
    this.running = false;
    this.lastTime = 0;
    cancelAnimationFrame(this.raf);
  }

  /** Render one frame synchronously (used for reduced-motion stills). */
  renderOnce() {
    this.apply(this.current);
    this.renderer.render(this.scene, this.camera);
  }

  private onPointer = (e: PointerEvent) => {
    this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  };

  private tick() {
    const now = performance.now();
    const dt = Math.min(0.1, this.lastTime ? (now - this.lastTime) / 1000 : 1 / 60);
    this.lastTime = now;
    const prev = this.current;
    // Frame-rate independent smoothing (same feel at 30, 60 or 120 Hz).
    if (this.opts.damping) {
      this.current += (this.target - this.current) * (1 - Math.exp(-dt * 7));
      if (Math.abs(this.target - this.current) < 1e-4) this.current = this.target;
    }
    // Subtle pointer tilt, capped to a few degrees.
    const k = 1 - Math.exp(-dt * 3);
    this.tilt.x += (this.pointer.x - this.tilt.x) * k;
    this.tilt.y += (this.pointer.y - this.tilt.y) * k;
    const moving = Math.abs(this.current - prev) > 1e-5 || Math.abs(this.pointer.x - this.tilt.x) > 1e-3 || Math.abs(this.pointer.y - this.tilt.y) > 1e-3;
    if (!moving && !this.dirty) return;
    this.dirty = false;
    this.apply(this.current);
    this.renderer.render(this.scene, this.camera);
  }

  private apply(t: number) {
    const f = frameAt(t);

    // Laptop
    const lg = this.laptop.group;
    lg.position.set(...track(LAPTOP_POS, t));
    lg.rotation.y = scalar(LAPTOP_ROT_Y, t);
    this.laptop.lid.rotation.x = f.lid;
    const lit = f.laptopScreen.power;
    (this.laptop.glow.material as THREE.MeshBasicMaterial).opacity = 0.3 * lit;
    this.laptopShadow.position.set(0, 0.002, 0.2);

    // Phone
    const pg = this.phone.group;
    const pv = t > 0.575;
    pg.visible = pv;
    this.phoneShadow.visible = pv;
    if (pv) {
      pg.position.set(...track(PHONE_POS, t));
      const r = track(PHONE_ROT, t);
      pg.rotation.set(r[0], r[1], r[2]);
      this.phoneShadow.position.set(pg.position.x, -0.02, pg.position.z);
      (this.phoneShadow.material as THREE.MeshBasicMaterial).opacity = 0.4 * clamp01(1 - (pg.position.y - 0.9) * 0.5);
    }

    // Attestation
    const paperOn = f.paper > 0;
    this.paper.group.visible = paperOn;
    if (paperOn) {
      this.paper.group.position.set(...track(PAPER_POS, t));
      const r = track(PAPER_ROT, t);
      this.paper.group.rotation.set(r[0], r[1], r[2]);
      this.paper.group.scale.setScalar(lerp(0.35, 1, f.paper));
      this.paper.mat.opacity = f.paper;
    }

    // Camera + gentle tilt
    const cp = track(CAM_POS, t);
    const cl = track(CAM_LOOK, t);
    this.camera.position.set(cp[0] + this.tilt.x * 0.18, cp[1] - this.tilt.y * 0.1, cp[2]);
    this.camera.lookAt(cl[0], cl[1], cl[2]);

    // Screens — only repaint the canvas when the visible state changed.
    const ds = f.laptopScreen;
    const dk = `${ds.power.toFixed(3)}|${ds.boot.toFixed(3)}|${ds.page.toFixed(3)}|${ds.scroll.toFixed(3)}`;
    if (dk !== this.lastDesk) {
      this.lastDesk = dk;
      this.desk.render(ds);
      this.deskTex.needsUpdate = true;
    }
    if (pv) {
      const ms = f.phoneScreen;
      const mk = `${ms.power.toFixed(3)}|${ms.boot.toFixed(3)}|${ms.page.toFixed(3)}|${ms.scroll.toFixed(3)}`;
      if (mk !== this.lastMob) {
        this.lastMob = mk;
        this.mob.render(ms);
        this.mobTex.needsUpdate = true;
      }
    }
  }

  dispose() {
    this.stop();
    window.removeEventListener('pointermove', this.onPointer);
    this.renderer.dispose();
  }
}
