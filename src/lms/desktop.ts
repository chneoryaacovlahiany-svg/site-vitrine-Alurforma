// Simulated desktop LMS screens projected onto the 3D laptop.
// All learner data below is ILLUSTRATIVE (fictitious learner, fictitious
// progress). The site labels the demo as « Aperçu illustratif ».

import {
  UI, DISPLAY, type Ctx,
  rr, card, text, gradient, pill, progressBar, ring, avatar, wordmark, icon, wrap,
} from './draw';

export const DESK_W = 1600;
export const DESK_H = 1000;
const SIDE = 264;
const TOP = 78;
const CW = DESK_W - SIDE;
const CH = DESK_H - TOP;

export interface ScreenState {
  /** 0 = off, 1 = fully lit */
  power: number;
  /** 0..1 boot splash progress. >= 1 means the app is shown */
  boot: number;
  /** Continuous page index (fractional part = transition to next page). */
  page: number;
  /** 0..1 scroll position inside the current page */
  scroll: number;
}

interface Page {
  nav: number;
  crumb: string;
  height: number;
  draw: (ctx: Ctx, w: number) => void;
}

const PAD = 44;

// --------------------------------------------------------------- Accueil --

function drawHome(ctx: Ctx, w: number) {
  const bw = w - PAD * 2;
  text(ctx, 'Bonjour Camille', PAD, 74, 38, UI.ink, 700, 'left', DISPLAY);
  text(ctx, 'Carte T — Transaction · Cycle triennal 2025 → 2028', PAD, 108, 19, UI.ink3, 500);
  pill(ctx, PAD + bw - 196, 58, 'Aperçu illustratif', UI.amber + '1F', '#92400E', 15);

  // Resume banner (navy, restrained)
  const y = 140;
  rr(ctx, PAD, y, bw, 210, 24);
  ctx.fillStyle = gradient(ctx, PAD, y, PAD + bw, y + 210, [[0, UI.navy], [1, '#13265C']]);
  ctx.fill();
  text(ctx, 'REPRENDRE', PAD + 40, y + 52, 14, '#8FB0FF', 700);
  text(ctx, 'T03 · Lutte contre le blanchiment (LCB-FT)', PAD + 40, y + 96, 30, '#fff', 700, 'left', DISPLAY);
  text(ctx, 'Séquence 3 — Vigilance sur l’origine des fonds · avec Maître Laurent', PAD + 40, y + 130, 18, 'rgba(255,255,255,.72)', 500);
  rr(ctx, PAD + 40, y + 152, 206, 44, 22);
  ctx.fillStyle = UI.primary;
  ctx.fill();
  icon(ctx, 'play', PAD + 60, y + 163, 20, '#fff');
  text(ctx, 'Reprendre la vidéo', PAD + 88, y + 180, 16, '#fff', 650);
  ring(ctx, PAD + bw - 120, y + 105, 64, 13, 0.46, '#8FB0FF');
  text(ctx, '3 h 12', PAD + bw - 120, y + 108, 26, '#fff', 700, 'center', DISPLAY);
  text(ctx, 'sur 7 h', PAD + bw - 120, y + 132, 14, 'rgba(255,255,255,.6)', 500, 'center');

  // KPI row
  const kpis: [string, string, string][] = [
    ['clock', '10 h 12', 'Temps de formation validé'],
    ['book', '1 / 2', 'Formations de l’année'],
    ['chart', '85 %', 'Dernier quiz réussi'],
    ['award', '1', 'Attestation disponible'],
  ];
  const kw = (bw - 3 * 22) / 4;
  kpis.forEach(([ic, v, l], i) => {
    const x = PAD + i * (kw + 22);
    card(ctx, x, 384, kw, 124, 20);
    rr(ctx, x + 24, 408, 44, 44, 12);
    ctx.fillStyle = UI.primary + '14';
    ctx.fill();
    icon(ctx, ic, x + 34, 418, 24, UI.primary);
    text(ctx, v, x + 24, 488, 28, UI.ink, 700, 'left', DISPLAY);
    text(ctx, l, x + 84, 436, 15, UI.ink3, 500);
  });

  // Formations of the current year
  text(ctx, 'Mon parcours 2026 · 14 h', PAD, 564, 24, UI.ink, 700, 'left', DISPLAY);
  const courses: [string, string, string, number, string][] = [
    ['T01', 'Déontologie & non-discrimination', '7 h · Terminée', 1, UI.green],
    ['T03', 'Lutte contre le blanchiment (LCB-FT)', '7 h · En cours', 0.46, UI.primary],
  ];
  const cw = (bw - 24) / 2;
  courses.forEach(([code, t, m, p, c], i) => {
    const x = PAD + i * (cw + 24);
    const yy = 590;
    card(ctx, x, yy, cw, 176, 22);
    rr(ctx, x + 24, yy + 24, 64, 64, 16);
    ctx.fillStyle = UI.navy;
    ctx.fill();
    text(ctx, code, x + 56, yy + 64, 20, '#fff', 700, 'center', DISPLAY);
    text(ctx, t, x + 108, yy + 50, 20, UI.ink, 650);
    text(ctx, m, x + 108, yy + 78, 15, p === 1 ? UI.green : UI.ink3, 600);
    progressBar(ctx, x + 24, yy + 120, cw - 118, 10, p, c);
    text(ctx, `${Math.round(p * 100)} %`, x + cw - 24, yy + 130, 16, UI.ink2, 650, 'right');
  });

  // Next steps
  card(ctx, PAD, 800, bw, 200, 22);
  text(ctx, 'Prochaines étapes', PAD + 28, 846, 21, UI.ink, 700, 'left', DISPLAY);
  const steps: [string, string, string][] = [
    ['play', 'Terminer la séquence 3', 'Vidéo · 14 min restantes'],
    ['chart', 'Cas pratique « Origine des fonds »', 'Quiz · 10 questions'],
    ['award', 'Évaluation finale T03', 'Débloquée à 100 % du temps'],
  ];
  const sw = (bw - 56) / 3;
  steps.forEach(([ic, t, s], i) => {
    const x = PAD + 28 + i * sw;
    rr(ctx, x, 872, 52, 52, 14);
    ctx.fillStyle = '#F0F3FF';
    ctx.fill();
    icon(ctx, ic, x + 14, 886, 24, UI.primary);
    text(ctx, t, x + 68, 894, 16.5, UI.ink, 650);
    text(ctx, s, x + 68, 918, 14, UI.ink3, 500);
  });
}

// ----------------------------------------------------------------- Vidéo --

function drawVideo(ctx: Ctx, w: number) {
  const bw = w - PAD * 2;
  text(ctx, 'T03 · Lutte contre le blanchiment', PAD, 70, 32, UI.ink, 700, 'left', DISPLAY);
  text(ctx, 'Séquence 3 / 6 — Vigilance sur l’origine des fonds', PAD, 102, 18, UI.ink3, 500);
  pill(ctx, PAD + bw - 228, 52, '● Temps comptabilisé', UI.green + '1C', '#047857', 15);

  const vw = bw * 0.665;
  const vh = vw * 0.5625;
  const vy = 132;
  ctx.save();
  rr(ctx, PAD, vy, vw, vh, 22);
  ctx.clip();
  ctx.fillStyle = gradient(ctx, PAD, vy, PAD + vw, vy + vh, [[0, '#0A1633'], [1, '#1B3478']]);
  ctx.fillRect(PAD, vy, vw, vh);
  // Studio set: bookshelf lines
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(PAD + 30, vy + 60 + i * 52, vw * 0.4, 3);
  }
  ctx.globalAlpha = 1;
  // Presenter silhouette (Maître Laurent)
  const px = PAD + vw * 0.28;
  ctx.fillStyle = gradient(ctx, 0, vy + 110, 0, vy + vh, [[0, '#5B7BE0'], [1, '#1B2F6B']]);
  ctx.beginPath();
  ctx.arc(px, vy + vh * 0.38, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(px, vy + vh + 40, 150, 180, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(px - 18, vy + vh * 0.62);
  ctx.lineTo(px, vy + vh * 0.72);
  ctx.lineTo(px + 18, vy + vh * 0.62);
  ctx.fill();
  // Slide panel
  const sx = PAD + vw * 0.52;
  rr(ctx, sx, vy + 56, vw * 0.42, vh * 0.56, 14);
  ctx.fillStyle = 'rgba(255,255,255,.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.15)';
  ctx.stroke();
  text(ctx, 'Vérifier · Délimiter · Tracer', sx + 24, vy + 100, 21, '#fff', 700, 'left', DISPLAY);
  ['Identifier le client et le bénéficiaire', 'Questionner l’origine des fonds', 'Conserver les justificatifs', 'Savoir quand déclarer'].forEach((s, i) => {
    ctx.fillStyle = '#8FB0FF';
    ctx.beginPath();
    ctx.arc(sx + 30, vy + 136 + i * 34, 4.5, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, s, sx + 46, vy + 142 + i * 34, 16, 'rgba(255,255,255,.85)', 500);
  });
  // Lower third
  rr(ctx, PAD + 28, vy + vh - 148, 290, 56, 12);
  ctx.fillStyle = 'rgba(255,255,255,.95)';
  ctx.fill();
  text(ctx, 'Maître Laurent', PAD + 46, vy + vh - 116, 18, UI.ink, 700);
  text(ctx, 'Formateur — droit immobilier', PAD + 46, vy + vh - 98, 13, UI.ink3, 550);
  const g = ctx.createLinearGradient(0, vy + vh - 80, 0, vy + vh);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,.6)');
  ctx.fillStyle = g;
  ctx.fillRect(PAD, vy + vh - 80, vw, 80);
  ctx.restore();
  progressBar(ctx, PAD + 26, vy + vh - 46, vw - 52, 6, 0.58, '#8FB0FF');
  icon(ctx, 'play', PAD + 26, vy + vh - 32, 20, '#fff');
  text(ctx, '08:10 / 14:05', PAD + 58, vy + vh - 15, 14, 'rgba(255,255,255,.85)', 550);
  text(ctx, 'Sous-titres FR · 1.0x', PAD + vw - 26, vy + vh - 15, 14, 'rgba(255,255,255,.85)', 550, 'right');

  // Programme
  const lx = PAD + vw + 24;
  const lw = bw - vw - 24;
  card(ctx, lx, vy, lw, vh, 22);
  text(ctx, 'Programme · 7 h', lx + 24, vy + 46, 20, UI.ink, 700, 'left', DISPLAY);
  const ch: [string, string, number][] = [
    ['Cadre LCB-FT & rôle de TRACFIN', '1 h 05', 2],
    ['Identifier le client', '1 h 10', 2],
    ['Origine des fonds', '1 h 15', 1],
    ['Cas pratiques guidés', '1 h 30', 0],
    ['Déclaration de soupçon', '1 h', 0],
    ['Évaluation finale', '1 h', 0],
  ];
  const rowH = (vh - 80) / 6;
  ch.forEach(([t, d, st], i) => {
    const yy = vy + 66 + i * rowH;
    if (st === 1) {
      rr(ctx, lx + 12, yy, lw - 24, rowH - 6, 12);
      ctx.fillStyle = UI.primary + '10';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(lx + 38, yy + rowH / 2 - 3, 14, 0, Math.PI * 2);
    ctx.fillStyle = st === 2 ? UI.green : st === 1 ? UI.primary : '#EEF0F7';
    ctx.fill();
    icon(ctx, st === 2 ? 'check' : st === 1 ? 'play' : 'lock', lx + 29, yy + rowH / 2 - 12, 18, st === 0 ? UI.ink3 : '#fff');
    text(ctx, t, lx + 64, yy + rowH / 2 - 6, 15.5, st === 0 ? UI.ink3 : UI.ink, st === 1 ? 700 : 550);
    text(ctx, d, lx + 64, yy + rowH / 2 + 15, 13.5, UI.ink3, 500);
  });

  // Tabs + résumé
  const ty = vy + vh + 44;
  ['Aperçu', 'Ressources', 'Mes notes', 'Questions au formateur'].forEach((t, i) => {
    text(ctx, t, PAD + i * 160, ty, 17, i === 0 ? UI.primary : UI.ink3, i === 0 ? 700 : 550);
  });
  ctx.fillStyle = UI.line;
  ctx.fillRect(PAD, ty + 18, bw, 1.5);
  ctx.fillStyle = UI.primary;
  ctx.fillRect(PAD, ty + 16, 62, 3);
  wrap(ctx, 'Objectif de la séquence : savoir interroger l’origine des fonds d’un acquéreur, documenter les réponses obtenues et identifier les situations qui nécessitent une vigilance renforcée.', PAD, ty + 60, vw, 30, 18, UI.ink2, 450);
  const ry = ty + 130;
  const res: [string, string][] = [['Fiche mémo — Vigilance', 'PDF · 420 Ko'], ['Modèle de questionnaire client', 'DOCX · 38 Ko'], ['Textes de référence', 'Liens officiels']];
  const rw = (bw - 48) / 3;
  res.forEach(([t, s], i) => {
    const x = PAD + i * (rw + 24);
    card(ctx, x, ry, rw, 86, 18);
    icon(ctx, 'download', x + 24, ry + 30, 26, UI.primary);
    text(ctx, t, x + 66, ry + 40, 16, UI.ink, 650);
    text(ctx, s, x + 66, ry + 64, 13.5, UI.ink3, 500);
  });
}

// ------------------------------------------------------------------ Quiz --

function drawQuiz(ctx: Ctx, w: number) {
  const bw = w - PAD * 2;
  text(ctx, 'Cas pratique — Origine des fonds', PAD, 70, 32, UI.ink, 700, 'left', DISPLAY);
  text(ctx, 'T03 · Question 4 / 10', PAD, 102, 18, UI.ink3, 500);
  progressBar(ctx, PAD + bw - 320, 80, 320, 10, 0.4, UI.primary);

  // Scenario with Sarah
  const y = 136;
  card(ctx, PAD, y, bw, 196, 22);
  avatar(ctx, PAD + 64, y + 66, 34, 'S', '#5B7BE0', UI.navy);
  text(ctx, 'Sarah, négociatrice', PAD + 118, y + 56, 19, UI.ink, 700);
  text(ctx, 'Situation', PAD + 118, y + 80, 14, UI.ink3, 600);
  wrap(ctx, '« Un acquéreur que je rencontre pour la première fois souhaite signer rapidement. Il indique qu’une partie importante du financement proviendra d’un virement depuis l’étranger, sans pouvoir préciser l’origine des fonds. »', PAD + 118, y + 118, bw - 160, 29, 18, UI.ink2, 450);

  text(ctx, 'Quelle est la réaction la plus adaptée ?', PAD, y + 256, 26, UI.ink, 700, 'left', DISPLAY);
  const ans = [
    'Poursuivre : le notaire vérifiera plus tard',
    'Appliquer les mesures de vigilance, demander des justificatifs et tracer les échanges',
    'Refuser le client sans autre analyse',
    'Accepter une attestation sur l’honneur',
  ];
  ans.forEach((a, i) => {
    const yy = y + 286 + i * 84;
    const ok = i === 1;
    rr(ctx, PAD, yy, bw, 68, 16);
    ctx.fillStyle = ok ? UI.green + '12' : UI.surface;
    ctx.fill();
    ctx.strokeStyle = ok ? UI.green : UI.line;
    ctx.lineWidth = 2;
    ctx.stroke();
    rr(ctx, PAD + 20, yy + 17, 34, 34, 10);
    ctx.fillStyle = ok ? UI.green : '#F1F3F9';
    ctx.fill();
    if (ok) icon(ctx, 'check', PAD + 26, yy + 23, 22, '#fff');
    else text(ctx, 'ABCD'[i], PAD + 37, yy + 41, 16, UI.ink2, 700, 'center');
    text(ctx, a, PAD + 74, yy + 42, 17.5, UI.ink, ok ? 650 : 500);
  });

  // Feedback
  const fy = y + 632;
  rr(ctx, PAD, fy, bw, 150, 20);
  ctx.fillStyle = '#F0FDF7';
  ctx.fill();
  icon(ctx, 'shield', PAD + 26, fy + 26, 30, UI.green);
  text(ctx, 'Bonne réponse — Vérifier, Délimiter, Tracer', PAD + 72, fy + 50, 19, '#065F46', 700);
  wrap(ctx, 'L’origine des fonds doit être questionnée et documentée. Les réponses et les pièces obtenues sont conservées ; si le doute persiste, la question d’une déclaration de soupçon se pose.', PAD + 72, fy + 84, bw - 110, 26, 16, UI.ink2, 450);

  rr(ctx, PAD + bw - 200, fy + 180, 200, 52, 16);
  ctx.fillStyle = UI.primary;
  ctx.fill();
  text(ctx, 'Question suivante →', PAD + bw - 100, fy + 212, 16, '#fff', 650, 'center');
  text(ctx, 'Seuil de réussite fixé par Alurforma (choix pédagogique interne)', PAD, fy + 212, 14, UI.ink3, 500);
}

// ------------------------------------------------------------ Progression --

function drawProgress(ctx: Ctx, w: number) {
  const bw = w - PAD * 2;
  text(ctx, 'Mon obligation de formation', PAD, 70, 32, UI.ink, 700, 'left', DISPLAY);
  text(ctx, 'Carte T · 14 h par an ou 42 h sur trois années consécutives', PAD, 102, 18, UI.ink3, 500);

  const y = 136;
  // Triennial ring
  card(ctx, PAD, y, 420, 400, 24);
  ring(ctx, PAD + 210, y + 180, 110, 22, 24.2 / 42, gradient(ctx, PAD + 100, 0, PAD + 320, 0, [[0, UI.primary], [1, UI.cyan]]));
  text(ctx, '24 h 12', PAD + 210, y + 186, 42, UI.ink, 700, 'center', DISPLAY);
  text(ctx, 'sur 42 h', PAD + 210, y + 216, 17, UI.ink3, 500, 'center');
  text(ctx, 'Cycle 2025 → 2028', PAD + 210, y + 336, 18, UI.ink, 650, 'center');
  text(ctx, 'Données fictives', PAD + 210, y + 364, 14, UI.ink3, 500, 'center');

  // Years
  const yx = PAD + 444;
  const yw = bw - 444;
  card(ctx, yx, y, yw, 400, 24);
  text(ctx, 'Répartition par année', yx + 28, y + 48, 20, UI.ink, 700, 'left', DISPLAY);
  const years: [string, number, string][] = [
    ['Année 1', 14, '14 h · Validée'],
    ['Année 2', 10.2, '10 h 12 · En cours'],
    ['Année 3', 0, 'À planifier'],
  ];
  years.forEach(([l, v, s], i) => {
    const yy = y + 96 + i * 70;
    text(ctx, l, yx + 28, yy + 16, 16, UI.ink, 650);
    progressBar(ctx, yx + 130, yy + 4, yw - 330, 14, v / 14, v >= 14 ? UI.green : UI.primary);
    text(ctx, s, yx + yw - 28, yy + 16, 15, v >= 14 ? UI.green : UI.ink3, 600, 'right');
  });
  ctx.fillStyle = UI.line;
  ctx.fillRect(yx + 28, y + 300, yw - 56, 1.5);
  const req: [string, boolean][] = [['Non-discrimination · 2 h sur 3 ans', true], ['Déontologie · 2 h sur 3 ans', true]];
  req.forEach(([l, ok], i) => {
    const x = yx + 28 + i * ((yw - 56) / 2);
    ctx.beginPath();
    ctx.arc(x + 14, y + 344, 14, 0, Math.PI * 2);
    ctx.fillStyle = ok ? UI.green : '#EEF0F7';
    ctx.fill();
    icon(ctx, 'check', x + 5, y + 335, 18, '#fff');
    text(ctx, l, x + 38, y + 350, 15.5, UI.ink, 600);
  });

  // Traceability log
  const ly = y + 430;
  card(ctx, PAD, ly, bw, 330, 24);
  text(ctx, 'Journal de traçabilité', PAD + 28, ly + 48, 20, UI.ink, 700, 'left', DISPLAY);
  pill(ctx, PAD + bw - 190, ly + 26, 'Export PDF', '#F0F3FF', UI.primary, 15);
  const cols = ['Date', 'Activité', 'Durée', 'Résultat'];
  const cx = [PAD + 28, PAD + 220, PAD + bw - 330, PAD + bw - 170];
  cols.forEach((c, i) => text(ctx, c.toUpperCase(), cx[i], ly + 92, 13, UI.ink3, 700));
  const rows: [string, string, string, string][] = [
    ['14/10 · 09:12', 'T03 · Séquence 3 — vidéo', '42 min', 'En cours'],
    ['13/10 · 18:40', 'T03 · Séquence 2 — quiz', '18 min', '9 / 10'],
    ['13/10 · 18:02', 'T03 · Séquence 2 — vidéo', '52 min', 'Terminée'],
    ['09/10 · 20:15', 'T03 · Séquence 1 — cas pratique', '35 min', 'Terminée'],
  ];
  rows.forEach((r, i) => {
    const yy = ly + 132 + i * 48;
    ctx.fillStyle = UI.line;
    ctx.fillRect(PAD + 28, yy - 26, bw - 56, 1);
    r.forEach((c, j) => text(ctx, c, cx[j], yy, 15.5, j === 3 && c !== 'En cours' ? '#047857' : UI.ink2, j === 1 ? 600 : 500));
  });
}

const PAGES: Page[] = [
  { nav: 0, crumb: 'Accueil', height: 1030, draw: drawHome },
  { nav: 1, crumb: 'Mes formations / T03 · LCB-FT / Séquence 3', height: 1080, draw: drawVideo },
  { nav: 1, crumb: 'Mes formations / T03 · LCB-FT / Cas pratique', height: 1050, draw: drawQuiz },
  { nav: 2, crumb: 'Ma progression', height: 940, draw: drawProgress },
];
export const DESK_PAGES = PAGES.length;

// ---------------------------------------------------------------- chrome --

function drawSidebar(ctx: Ctx, active: number) {
  ctx.fillStyle = UI.navy;
  ctx.fillRect(0, 0, SIDE, DESK_H);
  wordmark(ctx, 32, 54, 27, '#fff');
  text(ctx, 'ESPACE APPRENANT', 32, 80, 11.5, '#8FB0FF', 700);
  const items: [string, string][] = [
    ['home', 'Accueil'],
    ['book', 'Mes formations'],
    ['chart', 'Ma progression'],
    ['award', 'Attestations'],
    ['calendar', 'Agenda'],
    ['chat', 'Messagerie'],
  ];
  items.forEach(([ic, l], i) => {
    const y = 124 + i * 58;
    const on = i === active;
    if (on) {
      rr(ctx, 16, y, SIDE - 32, 46, 12);
      ctx.fillStyle = 'rgba(47,91,255,.35)';
      ctx.fill();
    }
    icon(ctx, ic, 34, y + 11, 24, on ? '#fff' : 'rgba(255,255,255,.55)');
    text(ctx, l, 72, y + 30, 16.5, on ? '#fff' : 'rgba(255,255,255,.65)', on ? 650 : 500);
  });
  rr(ctx, 18, DESK_H - 176, SIDE - 36, 140, 18);
  ctx.fillStyle = 'rgba(255,255,255,.06)';
  ctx.fill();
  icon(ctx, 'shield', 36, DESK_H - 158, 26, '#8FB0FF');
  text(ctx, 'Une question ?', 36, DESK_H - 104, 16, '#fff', 650);
  text(ctx, 'Écrivez au formateur', 36, DESK_H - 80, 14, 'rgba(255,255,255,.6)', 500);
  text(ctx, 'depuis chaque séquence.', 36, DESK_H - 60, 14, 'rgba(255,255,255,.6)', 500);
}

function drawTopbar(ctx: Ctx, page: Page) {
  ctx.fillStyle = '#fff';
  ctx.fillRect(SIDE, 0, CW, TOP);
  ctx.fillStyle = UI.line;
  ctx.fillRect(SIDE, TOP - 1, CW, 1);
  text(ctx, page.crumb, SIDE + 44, 47, 16, UI.ink3, 550);
  icon(ctx, 'bell', SIDE + CW - 226, 26, 26, UI.ink2);
  avatar(ctx, SIDE + CW - 156, 39, 21, 'CM', '#5B7BE0', UI.navy);
  text(ctx, 'Camille M.', SIDE + CW - 124, 45, 16, UI.ink, 650);
}

// -------------------------------------------------------------- composer --

export class DesktopScreen {
  readonly canvas: HTMLCanvasElement;
  private ctx: Ctx;
  private pages: HTMLCanvasElement[] = [];
  private frames: HTMLCanvasElement[] = [];

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = DESK_W;
    this.canvas.height = DESK_H;
    this.ctx = this.canvas.getContext('2d')!;
    this.build();
  }

  /** Pre-render each page and each chrome once; frames only blit slices. */
  build() {
    this.pages = PAGES.map((p) => {
      const c = document.createElement('canvas');
      c.width = CW;
      c.height = p.height;
      const x = c.getContext('2d')!;
      x.fillStyle = UI.bg;
      x.fillRect(0, 0, CW, p.height);
      p.draw(x, CW);
      return c;
    });
    this.frames = PAGES.map((p) => {
      const c = document.createElement('canvas');
      c.width = DESK_W;
      c.height = DESK_H;
      const x = c.getContext('2d')!;
      drawSidebar(x, p.nav);
      drawTopbar(x, p);
      return c;
    });
  }

  private blit(i: number, scroll: number, dx: number, alpha: number) {
    const src = this.pages[i];
    const maxY = Math.max(0, src.height - CH);
    const sy = Math.round(Math.max(0, Math.min(1, scroll)) * maxY);
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.rect(SIDE, TOP, CW, CH);
    ctx.clip();
    ctx.drawImage(src, 0, sy, CW, CH, SIDE + dx, TOP, CW, CH);
    ctx.restore();
  }

  render(s: ScreenState) {
    const ctx = this.ctx;
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, DESK_W, DESK_H);
    if (s.power <= 0.001) return;

    if (s.boot < 1) {
      this.renderBoot(s.boot);
    } else {
      const page = Math.max(0, Math.min(PAGES.length - 1, s.page));
      const i = Math.floor(page);
      const f = page - i;
      const next = Math.min(PAGES.length - 1, i + 1);
      ctx.drawImage(this.frames[f > 0.5 ? next : i], 0, 0);
      ctx.fillStyle = UI.bg;
      ctx.fillRect(SIDE, TOP, CW, CH);
      if (f > 0.001 && next !== i) {
        const e = f * f * (3 - 2 * f);
        this.blit(i, s.scroll, -e * CW * 0.2, 1 - e);
        this.blit(next, 0, (1 - e) * CW * 0.2, e);
      } else {
        this.blit(i, s.scroll, 0, 1);
      }
    }

    if (s.power < 1) {
      const p = s.power;
      ctx.fillStyle = `rgba(0,0,0,${1 - p})`;
      ctx.fillRect(0, 0, DESK_W, DESK_H);
    }
  }

  private renderBoot(b: number) {
    const ctx = this.ctx;
    const g = ctx.createRadialGradient(DESK_W / 2, DESK_H / 2, 10, DESK_W / 2, DESK_H / 2, DESK_W * 0.6);
    g.addColorStop(0, '#13265C');
    g.addColorStop(1, '#050B1E');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, DESK_W, DESK_H);
    const a = Math.min(1, b * 2.2);
    ctx.globalAlpha = a;
    wordmark(ctx, DESK_W / 2, DESK_H / 2 + 10, 84, '#fff', 'center');
    text(ctx, 'Espace apprenant', DESK_W / 2, DESK_H / 2 + 60, 22, 'rgba(255,255,255,.6)', 500, 'center');
    const lp = Math.max(0, Math.min(1, (b - 0.3) / 0.65));
    progressBar(ctx, DESK_W / 2 - 160, DESK_H / 2 + 110, 320, 5, lp, '#8FB0FF');
    ctx.globalAlpha = 1;
  }
}
