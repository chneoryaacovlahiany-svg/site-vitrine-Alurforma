// Low-level 2D drawing helpers used to paint the LMS screens that are
// projected onto the 3D devices (laptop, smartphone).

export const UI = {
  bg: '#F5F6FB',
  surface: '#FFFFFF',
  line: '#E6E8F0',
  ink: '#0E1330',
  ink2: '#4A5073',
  ink3: '#8A90AE',
  primary: '#2F5BFF',
  primary2: '#1E3FCC',
  cyan: '#18B6D6',
  green: '#10B981',
  amber: '#F59E0B',
  rose: '#F43F5E',
  navy: '#0A1633',
  gold: '#B8924A',
} as const;

export const FONT = '"Inter Variable", Inter, system-ui, sans-serif';
export const DISPLAY = '"Space Grotesk Variable", "Inter Variable", system-ui, sans-serif';
export const SERIF = '"Instrument Serif", Georgia, serif';

export type Ctx = CanvasRenderingContext2D;

export function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function card(ctx: Ctx, x: number, y: number, w: number, h: number, r = 18, fill: string = UI.surface) {
  ctx.save();
  ctx.shadowColor = 'rgba(20, 24, 60, 0.07)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
  rr(ctx, x, y, w, h, r);
  ctx.strokeStyle = UI.line;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function text(
  ctx: Ctx,
  s: string,
  x: number,
  y: number,
  size: number,
  color: string = UI.ink,
  weight = 500,
  align: CanvasTextAlign = 'left',
  family: string = FONT,
) {
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

export function gradient(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

export function pill(ctx: Ctx, x: number, y: number, label: string, bg: string, fg: string, size = 18) {
  ctx.font = `600 ${size}px ${FONT}`;
  const w = ctx.measureText(label).width + size * 1.4;
  const h = size * 1.9;
  rr(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = bg;
  ctx.fill();
  text(ctx, label, x + w / 2, y + h / 2 + size * 0.36, size, fg, 600, 'center');
  return w;
}

export function progressBar(ctx: Ctx, x: number, y: number, w: number, h: number, v: number, color: string | CanvasGradient = UI.primary) {
  rr(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = '#EBEDF5';
  ctx.fill();
  if (v > 0) {
    rr(ctx, x, y, Math.max(h, w * v), h, h / 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

export function ring(ctx: Ctx, cx: number, cy: number, r: number, lw: number, v: number, color: string | CanvasGradient) {
  ctx.lineCap = 'round';
  ctx.lineWidth = lw;
  ctx.strokeStyle = '#ECEEF6';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * v);
  ctx.stroke();
}

export function avatar(ctx: Ctx, cx: number, cy: number, r: number, initials: string, c1: string, c2: string) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = gradient(ctx, cx - r, cy - r, cx + r, cy + r, [[0, c1], [1, c2]]);
  ctx.fill();
  text(ctx, initials, cx, cy + r * 0.34, r * 0.9, '#fff', 700, 'center');
}

/**
 * Neutral typographic wordmark used inside the simulated LMS screens.
 * The official Alurforma logo (PNG supplied by the owner) is used on the
 * site itself; it is intentionally not redrawn here.
 */
export function wordmark(ctx: Ctx, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'left') {
  text(ctx, 'Alurforma', x, y, size, color, 700, align, DISPLAY);
}

/** Simple line icons (24x24 grid) drawn with strokes. */
export function icon(ctx: Ctx, name: string, x: number, y: number, s: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 24, s / 24);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  switch (name) {
    case 'home':
      ctx.moveTo(3, 11); ctx.lineTo(12, 3); ctx.lineTo(21, 11); ctx.moveTo(5, 9.5); ctx.lineTo(5, 21); ctx.lineTo(19, 21); ctx.lineTo(19, 9.5);
      break;
    case 'book':
      ctx.moveTo(4, 5); ctx.quadraticCurveTo(8, 3, 12, 5); ctx.quadraticCurveTo(16, 3, 20, 5); ctx.lineTo(20, 19); ctx.quadraticCurveTo(16, 17, 12, 19); ctx.quadraticCurveTo(8, 17, 4, 19); ctx.closePath(); ctx.moveTo(12, 5); ctx.lineTo(12, 19);
      break;
    case 'award':
      ctx.arc(12, 9, 6, 0, Math.PI * 2); ctx.moveTo(8.5, 14); ctx.lineTo(7, 22); ctx.lineTo(12, 19); ctx.lineTo(17, 22); ctx.lineTo(15.5, 14);
      break;
    case 'calendar':
      ctx.rect(3, 5, 18, 16); ctx.moveTo(3, 10); ctx.lineTo(21, 10); ctx.moveTo(8, 3); ctx.lineTo(8, 7); ctx.moveTo(16, 3); ctx.lineTo(16, 7);
      break;
    case 'chat':
      ctx.moveTo(4, 5); ctx.lineTo(20, 5); ctx.lineTo(20, 16); ctx.lineTo(10, 16); ctx.lineTo(5, 20); ctx.lineTo(5, 16); ctx.lineTo(4, 16); ctx.closePath();
      break;
    case 'chart':
      ctx.moveTo(4, 20); ctx.lineTo(4, 4); ctx.moveTo(4, 20); ctx.lineTo(20, 20); ctx.moveTo(8, 16); ctx.lineTo(8, 12); ctx.moveTo(12, 16); ctx.lineTo(12, 8); ctx.moveTo(16, 16); ctx.lineTo(16, 11);
      break;
    case 'bell':
      ctx.moveTo(6, 17); ctx.lineTo(6, 11); ctx.arc(12, 11, 6, Math.PI, 0); ctx.lineTo(18, 17); ctx.lineTo(20, 17); ctx.lineTo(4, 17); ctx.moveTo(10, 20); ctx.lineTo(14, 20);
      break;
    case 'search':
      ctx.arc(10.5, 10.5, 6.5, 0, Math.PI * 2); ctx.moveTo(15.5, 15.5); ctx.lineTo(20, 20);
      break;
    case 'play':
      ctx.moveTo(8, 5); ctx.lineTo(19, 12); ctx.lineTo(8, 19); ctx.closePath(); ctx.fill();
      break;
    case 'check':
      ctx.moveTo(5, 12.5); ctx.lineTo(10, 17.5); ctx.lineTo(19, 7);
      break;
    case 'lock':
      ctx.rect(5, 11, 14, 10); ctx.moveTo(8, 11); ctx.lineTo(8, 8); ctx.arc(12, 8, 4, Math.PI, 0); ctx.lineTo(16, 11);
      break;
    case 'download':
      ctx.moveTo(12, 4); ctx.lineTo(12, 15); ctx.moveTo(7, 10.5); ctx.lineTo(12, 15.5); ctx.lineTo(17, 10.5); ctx.moveTo(4, 20); ctx.lineTo(20, 20);
      break;
    case 'clock':
      ctx.arc(12, 12, 8.5, 0, Math.PI * 2); ctx.moveTo(12, 7); ctx.lineTo(12, 12); ctx.lineTo(15.5, 14);
      break;
    case 'user':
      ctx.arc(12, 8, 4, 0, Math.PI * 2); ctx.moveTo(4, 21); ctx.quadraticCurveTo(12, 11, 20, 21);
      break;
    case 'menu':
      ctx.moveTo(4, 7); ctx.lineTo(20, 7); ctx.moveTo(4, 12); ctx.lineTo(20, 12); ctx.moveTo(4, 17); ctx.lineTo(14, 17);
      break;
    case 'back':
      ctx.moveTo(15, 5); ctx.lineTo(8, 12); ctx.lineTo(15, 19);
      break;
    case 'shield':
      ctx.moveTo(12, 3); ctx.lineTo(20, 6); ctx.lineTo(20, 12); ctx.quadraticCurveTo(20, 18, 12, 21); ctx.quadraticCurveTo(4, 18, 4, 12); ctx.lineTo(4, 6); ctx.closePath(); ctx.moveTo(8.5, 12); ctx.lineTo(11, 14.5); ctx.lineTo(15.5, 9.5);
      break;
    case 'spark':
      ctx.moveTo(12, 3); ctx.lineTo(13.8, 10.2); ctx.lineTo(21, 12); ctx.lineTo(13.8, 13.8); ctx.lineTo(12, 21); ctx.lineTo(10.2, 13.8); ctx.lineTo(3, 12); ctx.lineTo(10.2, 10.2); ctx.closePath(); ctx.fill();
      break;
  }
  ctx.stroke();
  ctx.restore();
}

/** Deterministic pseudo "QR code" pattern for the certificate verification block. */
export function qr(ctx: Ctx, x: number, y: number, size: number, seed = 7) {
  const n = 25;
  const c = size / n;
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = UI.ink;
  const finder = (fx: number, fy: number) => {
    ctx.fillRect(x + fx * c, y + fy * c, 7 * c, 7 * c);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + (fx + 1) * c, y + (fy + 1) * c, 5 * c, 5 * c);
    ctx.fillStyle = UI.ink;
    ctx.fillRect(x + (fx + 2) * c, y + (fy + 2) * c, 3 * c, 3 * c);
  };
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const inFinder = (i < 8 && j < 8) || (i > n - 9 && j < 8) || (i < 8 && j > n - 9);
      if (!inFinder && rnd() > 0.52) ctx.fillRect(x + i * c, y + j * c, c + 0.5, c + 0.5);
    }
  }
  finder(0, 0);
  finder(n - 7, 0);
  finder(0, n - 7);
}

export function wrap(ctx: Ctx, s: string, x: number, y: number, maxW: number, lh: number, size: number, color: string, weight = 400, family = FONT) {
  ctx.font = `${weight} ${size}px ${family}`;
  const words = s.split(' ');
  let line = '';
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      text(ctx, line, x, yy, size, color, weight, 'left', family);
      line = w;
      yy += lh;
    } else line = test;
  }
  if (line) text(ctx, line, x, yy, size, color, weight, 'left', family);
  return yy;
}
