// « SPÉCIMEN » training certificate. Mentions follow article 5 of décret
// n° 2016-173 (objectifs, contenu, durée, date de réalisation). It is always
// watermarked SPÉCIMEN: it illustrates a document, it is not one.

import { UI, DISPLAY, SERIF, text, wrap, qr, wordmark, icon } from './draw';

export const ATT_W = 1000;
export const ATT_H = 1414;

export function renderAttestation(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = ATT_W;
  c.height = ATT_H;
  const ctx = c.getContext('2d')!;
  const W = ATT_W;
  const H = ATT_H;

  ctx.fillStyle = '#FFFEFA';
  ctx.fillRect(0, 0, W, H);

  // Fine guilloche background
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = UI.navy;
  for (let i = 0; i < 46; i++) {
    ctx.beginPath();
    ctx.ellipse(W / 2, H * 0.42, 60 + i * 10, 30 + i * 6, i * 0.12, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Frame
  ctx.strokeStyle = UI.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.lineWidth = 1;
  ctx.strokeRect(48, 48, W - 96, H - 96);

  ctx.fillStyle = UI.navy;
  ctx.fillRect(48, 48, W - 96, 150);
  wordmark(ctx, 96, 140, 46, '#fff');
  text(ctx, 'Organisme de formation', W - 96, 118, 18, 'rgba(255,255,255,.7)', 500, 'right');
  text(ctx, 'Identité complète sur le document réel', W - 96, 146, 18, 'rgba(255,255,255,.7)', 500, 'right');

  text(ctx, 'Attestation de formation', W / 2, 300, 62, UI.ink, 400, 'center', SERIF);
  text(ctx, 'Formation continue des professionnels de l’immobilier — décret n° 2016-173, art. 5', W / 2, 342, 17, UI.ink3, 500, 'center');

  text(ctx, 'Délivrée à', W / 2, 418, 20, UI.ink2, 500, 'center');
  text(ctx, 'Camille Martin', W / 2, 486, 64, UI.primary2, 400, 'center', SERIF);
  ctx.fillStyle = UI.gold;
  ctx.fillRect(W / 2 - 170, 508, 340, 1.5);
  text(ctx, 'Titulaire d’une carte professionnelle « Transaction » (T)', W / 2, 546, 18, UI.ink3, 500, 'center');

  const rows: [string, string][] = [
    ['Formation', 'T03 · Lutte contre le blanchiment des capitaux et le financement du terrorisme'],
    ['Objectifs', 'Identifier le client, questionner l’origine des fonds, documenter la vigilance et connaître la procédure de déclaration.'],
    ['Contenu', 'Cadre LCB-FT · Identification · Origine des fonds · Cas pratiques · Déclaration de soupçon · Évaluation.'],
    ['Durée', '7 heures'],
    ['Réalisation', 'Du 09/10/2026 au 16/10/2026 — formation à distance'],
  ];
  let y = 620;
  rows.forEach(([k, v]) => {
    text(ctx, k.toUpperCase(), 96, y, 15, UI.gold, 700);
    const end = wrap(ctx, v, 280, y, W - 380, 30, 20, UI.ink, 500);
    y = end + 56;
    ctx.fillStyle = UI.line;
    ctx.fillRect(96, y - 34, W - 192, 1);
  });

  // Seal + signature + QR
  const sy = H - 250;
  ctx.strokeStyle = UI.navy;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(110, sy + 20);
  ctx.bezierCurveTo(150, sy - 30, 160, sy + 40, 200, sy);
  ctx.bezierCurveTo(230, sy - 25, 250, sy + 20, 300, sy - 10);
  ctx.stroke();
  ctx.fillStyle = UI.line;
  ctx.fillRect(96, sy + 44, 250, 1.5);
  text(ctx, 'Signature du responsable', 96, sy + 74, 15, UI.ink3, 550);

  const gx = W / 2 + 20;
  const gy = sy + 10;
  ctx.beginPath();
  ctx.arc(gx, gy, 62, 0, Math.PI * 2);
  ctx.fillStyle = UI.gold;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(gx, gy, 50, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  icon(ctx, 'award', gx - 24, gy - 28, 48, '#fff');

  qr(ctx, W - 96 - 140, sy - 60, 140, 91);
  text(ctx, 'Vérification en ligne', W - 96 - 70, sy + 106, 14, UI.ink3, 550, 'center');
  text(ctx, 'N° AF-SPECIMEN-0000', W / 2, H - 76, 15, UI.ink3, 550, 'center');

  // SPÉCIMEN watermark
  ctx.save();
  ctx.translate(W / 2, H / 2 + 40);
  ctx.rotate(-Math.PI / 6);
  ctx.font = `700 170px ${DISPLAY}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(220, 38, 38, 0.16)';
  ctx.fillText('SPÉCIMEN', 0, 60);
  ctx.strokeStyle = 'rgba(200, 30, 30, 0.5)';
  ctx.lineWidth = 3;
  ctx.strokeText('SPÉCIMEN', 0, 60);
  ctx.restore();
  return c;
}
