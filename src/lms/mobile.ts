// Simulated mobile LMS screens projected onto the 3D smartphone.
// Same fictitious learner as the desktop views (illustrative data).

import {
  UI, DISPLAY, type Ctx,
  rr, card, text, gradient, pill, progressBar, ring, avatar, wordmark, icon, wrap,
} from './draw';
import type { ScreenState } from './desktop';

export const MOB_W = 780;
export const MOB_H = 1688;
const STATUS = 110;
const TABBAR = 150;
const VIEW = MOB_H - STATUS - TABBAR;
const P = 36;

interface Page {
  tab: number;
  height: number;
  draw: (ctx: Ctx, w: number) => void;
}

function header(ctx: Ctx, w: number, title: string) {
  icon(ctx, 'back', 30, 34, 38, UI.ink);
  text(ctx, title, w / 2, 66, 30, UI.ink, 700, 'center', DISPLAY);
}

function mProgress(ctx: Ctx, w: number) {
  const bw = w - P * 2;
  text(ctx, 'Bonjour,', P, 58, 28, UI.ink3, 500);
  text(ctx, 'Camille', P, 106, 50, UI.ink, 700, 'left', DISPLAY);
  avatar(ctx, w - 76, 74, 38, 'CM', '#5B7BE0', UI.navy);
  pill(ctx, P, 132, 'Aperçu illustratif', UI.amber + '22', '#92400E', 19);

  const y = 200;
  rr(ctx, P, y, bw, 470, 36);
  ctx.fillStyle = gradient(ctx, P, y, P + bw, y + 470, [[0, UI.navy], [1, '#13265C']]);
  ctx.fill();
  text(ctx, 'CARTE T · CYCLE 2025 → 2028', P + 36, y + 58, 19, '#7FD8B5', 700);
  ring(ctx, w / 2, y + 240, 132, 26, 21.2 / 42, gradient(ctx, P, 0, P + bw, 0, [[0, '#8FB0FF'], [1, UI.cyan]]));
  text(ctx, '21 h 12', w / 2, y + 250, 58, '#fff', 700, 'center', DISPLAY);
  text(ctx, 'sur 42 h', w / 2, y + 292, 24, 'rgba(255,255,255,.65)', 500, 'center');
  text(ctx, 'Année 2 : 7 h 12 / 14 h', w / 2, y + 430, 24, '#fff', 600, 'center');

  const ry = y + 510;
  const req: [string, string][] = [['Non-discrimination', '2 h / 2 h'], ['Déontologie', '2 h / 2 h']];
  const sw = (bw - 20) / 2;
  req.forEach(([l, v], i) => {
    const x = P + i * (sw + 20);
    card(ctx, x, ry, sw, 170, 28);
    ctx.beginPath();
    ctx.arc(x + 50, ry + 50, 24, 0, Math.PI * 2);
    ctx.fillStyle = UI.green;
    ctx.fill();
    icon(ctx, 'check', x + 35, ry + 35, 30, '#fff');
    text(ctx, l, x + 28, ry + 118, 22, UI.ink, 650);
    text(ctx, v + ' · sur 3 ans', x + 28, ry + 148, 19, UI.ink3, 500);
  });

  const cy = ry + 220;
  text(ctx, 'En cours', P, cy, 32, UI.ink, 700, 'left', DISPLAY);
  card(ctx, P, cy + 26, bw, 200, 30);
  rr(ctx, P + 26, cy + 52, 84, 84, 22);
  ctx.fillStyle = UI.navy;
  ctx.fill();
  text(ctx, 'T03', P + 68, cy + 104, 26, '#fff', 700, 'center', DISPLAY);
  text(ctx, 'Lutte contre le blanchiment', P + 132, cy + 84, 25, UI.ink, 650);
  text(ctx, 'Séquence 3 / 6 · 3 h 12 sur 6 h', P + 132, cy + 118, 20, UI.ink3, 500);
  progressBar(ctx, P + 26, cy + 170, bw - 52, 12, 0.53, UI.primary);
}

function mVideo(ctx: Ctx, w: number) {
  const bw = w - P * 2;
  header(ctx, w, 'T03 · Séquence 3');
  const vy = 110;
  const vh = bw * 0.5625;
  ctx.save();
  rr(ctx, P, vy, bw, vh, 28);
  ctx.clip();
  ctx.fillStyle = gradient(ctx, P, vy, P + bw, vy + vh, [[0, '#0A1633'], [1, '#1B3478']]);
  ctx.fillRect(P, vy, bw, vh);
  ctx.fillStyle = gradient(ctx, 0, vy + 80, 0, vy + vh, [[0, '#5B7BE0'], [1, '#1B2F6B']]);
  ctx.beginPath();
  ctx.arc(P + bw * 0.3, vy + vh * 0.42, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(P + bw * 0.3, vy + vh + 30, 130, 150, 0, Math.PI, 0);
  ctx.fill();
  ctx.restore();
  text(ctx, 'Vérifier', P + bw * 0.6, vy + 110, 26, '#fff', 700, 'left', DISPLAY);
  text(ctx, 'Délimiter', P + bw * 0.6, vy + 148, 26, 'rgba(255,255,255,.7)', 700, 'left', DISPLAY);
  text(ctx, 'Tracer', P + bw * 0.6, vy + 186, 26, 'rgba(255,255,255,.5)', 700, 'left', DISPLAY);
  progressBar(ctx, P + 24, vy + vh - 34, bw - 48, 8, 0.58, '#8FB0FF');

  const ty = vy + vh + 60;
  pill(ctx, P, ty - 34, '● Reprise à 08:10', UI.green + '1C', '#047857', 20);
  text(ctx, 'Vigilance sur l’origine', P, ty + 50, 36, UI.ink, 700, 'left', DISPLAY);
  text(ctx, 'des fonds', P, ty + 94, 36, UI.ink, 700, 'left', DISPLAY);
  text(ctx, 'avec le formateur référent · 14 min', P, ty + 134, 22, UI.ink3, 500);
  wrap(ctx, 'Savoir questionner, documenter et identifier les situations qui demandent une vigilance renforcée.', P, ty + 190, bw, 34, 23, UI.ink2, 450);

  const ly = ty + 290;
  const ch: [string, number][] = [['Identifier le client', 2], ['Origine des fonds', 1], ['Cas pratiques guidés', 0]];
  ch.forEach(([t, st], i) => {
    const yy = ly + i * 112;
    card(ctx, P, yy, bw, 94, 24, st === 1 ? '#EEF2FF' : UI.surface);
    ctx.beginPath();
    ctx.arc(P + 50, yy + 47, 24, 0, Math.PI * 2);
    ctx.fillStyle = st === 2 ? UI.green : st === 1 ? UI.primary : '#EEF0F7';
    ctx.fill();
    icon(ctx, st === 2 ? 'check' : st === 1 ? 'play' : 'lock', P + 37, yy + 34, 26, st === 0 ? UI.ink3 : '#fff');
    text(ctx, t, P + 94, yy + 56, 24, st === 0 ? UI.ink3 : UI.ink, st === 1 ? 700 : 550);
  });
}

function mQuiz(ctx: Ctx, w: number) {
  const bw = w - P * 2;
  header(ctx, w, 'Cas pratique');
  progressBar(ctx, P, 106, bw, 10, 0.4, UI.primary);
  text(ctx, 'Question 4 / 10', P, 160, 21, UI.ink3, 600);
  card(ctx, P, 186, bw, 250, 28);
  avatar(ctx, P + 56, 246, 30, '', UI.green, '#06543B');
  icon(ctx, 'user', P + 44, 234, 24, '#fff');
  text(ctx, 'Professionnel de terrain', P + 104, 256, 22, UI.ink, 700);
  wrap(ctx, '« L’acquéreur ne peut pas préciser l’origine d’un virement venant de l’étranger. »', P + 28, 324, bw - 56, 32, 23, UI.ink2, 450);
  text(ctx, 'Votre réaction ?', P, 500, 36, UI.ink, 700, 'left', DISPLAY);
  const ans = ['Poursuivre sans vérifier', 'Vigilance, justificatifs, traçabilité', 'Refuser sans analyse'];
  ans.forEach((a, i) => {
    const yy = 530 + i * 110;
    const ok = i === 1;
    rr(ctx, P, yy, bw, 92, 24);
    ctx.fillStyle = ok ? UI.green + '14' : UI.surface;
    ctx.fill();
    ctx.strokeStyle = ok ? UI.green : UI.line;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    if (ok) {
      ctx.beginPath();
      ctx.arc(P + bw - 48, yy + 46, 20, 0, Math.PI * 2);
      ctx.fillStyle = UI.green;
      ctx.fill();
      icon(ctx, 'check', P + bw - 62, yy + 32, 28, '#fff');
    }
    text(ctx, a, P + 30, yy + 56, 24, UI.ink, ok ? 650 : 500);
  });
  const fy = 890;
  rr(ctx, P, fy, bw, 230, 28);
  ctx.fillStyle = '#F0FDF7';
  ctx.fill();
  icon(ctx, 'shield', P + 28, fy + 30, 38, UI.green);
  text(ctx, 'Bonne réponse', P + 82, fy + 60, 26, '#065F46', 700);
  wrap(ctx, 'Questionner l’origine des fonds, conserver les pièces et tracer les échanges.', P + 28, fy + 118, bw - 56, 32, 22, UI.ink2, 450);
  rr(ctx, P, fy + 262, bw, 96, 28);
  ctx.fillStyle = UI.primary;
  ctx.fill();
  text(ctx, 'Question suivante', w / 2, fy + 320, 26, '#fff', 650, 'center');
}

const PAGES: Page[] = [
  { tab: 0, height: 1530, draw: mProgress },
  { tab: 1, height: 1520, draw: mVideo },
  { tab: 1, height: 1500, draw: mQuiz },
];
export const MOB_PAGES = PAGES.length;

function statusBar(ctx: Ctx, dark: boolean) {
  const c = dark ? '#fff' : UI.ink;
  text(ctx, '9:41', 92, 72, 30, c, 650, 'center');
  rr(ctx, MOB_W / 2 - 110, 26, 220, 64, 32);
  ctx.fillStyle = '#000';
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    rr(ctx, MOB_W - 206 + i * 12, 64 - i * 6, 8, 10 + i * 6, 2);
    ctx.fillStyle = c;
    ctx.fill();
  }
  rr(ctx, MOB_W - 132, 46, 58, 28, 8);
  ctx.strokeStyle = c;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  rr(ctx, MOB_W - 128, 50, 42, 20, 5);
  ctx.fillStyle = c;
  ctx.fill();
}

function tabBar(ctx: Ctx, active: number) {
  const y = MOB_H - TABBAR;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, y, MOB_W, TABBAR);
  ctx.fillStyle = UI.line;
  ctx.fillRect(0, y, MOB_W, 1.5);
  const tabs: [string, string][] = [['chart', 'Progression'], ['book', 'Formations'], ['award', 'Attestations'], ['user', 'Profil']];
  const tw = MOB_W / tabs.length;
  tabs.forEach(([ic, l], i) => {
    const on = i === active;
    const cx = tw * i + tw / 2;
    icon(ctx, ic, cx - 20, y + 22, 40, on ? UI.primary : UI.ink3);
    text(ctx, l, cx, y + 90, 19, on ? UI.primary : UI.ink3, on ? 700 : 500, 'center');
  });
  rr(ctx, MOB_W / 2 - 110, MOB_H - 26, 220, 9, 5);
  ctx.fillStyle = UI.ink;
  ctx.fill();
}

export class MobileScreen {
  readonly canvas: HTMLCanvasElement;
  private ctx: Ctx;
  private pages: HTMLCanvasElement[] = [];

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = MOB_W;
    this.canvas.height = MOB_H;
    this.ctx = this.canvas.getContext('2d')!;
    this.build();
  }

  build() {
    this.pages = PAGES.map((pg) => {
      const c = document.createElement('canvas');
      c.width = MOB_W;
      c.height = pg.height;
      const x = c.getContext('2d')!;
      x.fillStyle = UI.bg;
      x.fillRect(0, 0, MOB_W, pg.height);
      pg.draw(x, MOB_W);
      return c;
    });
  }

  private blit(i: number, scroll: number, dx: number, alpha: number) {
    const src = this.pages[i];
    const maxY = Math.max(0, src.height - VIEW);
    const sy = Math.round(Math.max(0, Math.min(1, scroll)) * maxY);
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.rect(0, STATUS, MOB_W, VIEW);
    ctx.clip();
    ctx.drawImage(src, 0, sy, MOB_W, VIEW, dx, STATUS, MOB_W, VIEW);
    ctx.restore();
  }

  render(s: ScreenState) {
    const ctx = this.ctx;
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, MOB_W, MOB_H);
    if (s.power <= 0.001) return;

    if (s.boot < 1) {
      this.renderLock(s.boot);
    } else {
      const page = Math.max(0, Math.min(PAGES.length - 1, s.page));
      const i = Math.floor(page);
      const f = page - i;
      const next = Math.min(PAGES.length - 1, i + 1);
      ctx.fillStyle = UI.bg;
      ctx.fillRect(0, 0, MOB_W, MOB_H);
      if (f > 0.001 && next !== i) {
        const e = f * f * (3 - 2 * f);
        this.blit(i, s.scroll, -e * MOB_W * 0.3, 1 - e * 0.6);
        this.blit(next, 0, (1 - e) * MOB_W, 1);
      } else {
        this.blit(i, s.scroll, 0, 1);
      }
      ctx.fillStyle = UI.bg;
      ctx.fillRect(0, 0, MOB_W, STATUS);
      statusBar(ctx, false);
      tabBar(ctx, PAGES[f > 0.5 ? next : i].tab);
    }

    if (s.power < 1) {
      ctx.fillStyle = `rgba(0,0,0,${1 - s.power})`;
      ctx.fillRect(0, 0, MOB_W, MOB_H);
    }
  }

  /** Lock screen with a notification sliding in (the phone "wakes up"). */
  private renderLock(b: number) {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, MOB_W, MOB_H);
    g.addColorStop(0, '#0A1633');
    g.addColorStop(1, '#1B3478');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, MOB_W, MOB_H);
    statusBar(ctx, true);
    text(ctx, 'mardi 14 octobre', MOB_W / 2, 260, 30, 'rgba(255,255,255,.8)', 550, 'center');
    text(ctx, '9:41', MOB_W / 2, 440, 190, '#fff', 600, 'center', DISPLAY);
    const n = Math.min(1, b * 1.6);
    const e = 1 - Math.pow(1 - n, 3);
    const ny = 520 - (1 - e) * 80;
    ctx.globalAlpha = e;
    rr(ctx, 30, ny, MOB_W - 60, 180, 40);
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.fill();
    wordmark(ctx, 62, ny + 62, 26, '#fff');
    text(ctx, 'maintenant', MOB_W - 64, ny + 62, 22, 'rgba(255,255,255,.6)', 500, 'right');
    text(ctx, 'Reprenez là où vous en étiez', 62, ny + 110, 27, '#fff', 650);
    text(ctx, 'T03 · Séquence 3 — reprise à 08:10', 62, ny + 148, 23, 'rgba(255,255,255,.78)', 500);
    ctx.globalAlpha = 1;
    rr(ctx, MOB_W / 2 - 110, MOB_H - 26, 220, 9, 5);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }
}
