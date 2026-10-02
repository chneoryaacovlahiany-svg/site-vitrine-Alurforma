// Financement page: a funding request handled with Alurforma, in five steps —
// situation, identification, file, administrative follow-up, funder's decision.
// The decision is never shown as granted: it belongs to the funder.

import { gsap } from 'gsap';
import { el, endCard, type Builder } from './player';

export const buildFinancement: Builder = (stage, L) => {
  const tl = gsap.timeline();
  const T = L.tall;
  const tx = T ? 48 : 70;
  const titleStyle = { x: tx, y: 56, 'white-space': T ? 'normal' : 'nowrap', w: T ? 620 : undefined };
  const group = () => el(stage, 'g', { x: 0, y: 0, w: L.W, h: L.H });
  const step = (g: HTMLElement, n: number) => el(g, 'st-label', { x: tx, y: T ? 20 : 26, color: '#7fd8b5', 'letter-spacing': '.14em' }, `ÉTAPE ${n} / 5`);
  const enter = (g: HTMLElement, s: HTMLElement, t: HTMLElement, label: string) =>
    tl.addLabel(label).set(g, { autoAlpha: 1 }).from([s, t], { y: '+=20', autoAlpha: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' });
  const leave = (g: HTMLElement) => tl.to({}, { duration: 1.3 }).to(g, { autoAlpha: 0, y: -20, duration: 0.5 });

  // ------------------------------------------------------ 1. situation
  const g1 = group();
  const s1 = step(g1, 1);
  const t1 = el(g1, 'st-title', titleStyle, 'Votre <em>situation.</em>');
  const sits = ['Salarié', 'Indépendant', 'Entreprise'].map((txt, i) =>
    el(g1, 'st-card', T ? { x: 48, y: 230 + i * 120, w: 624, 'font-size': '26px', padding: '26px 28px' } : { x: 70 + i * 300, y: 220, w: 270, 'font-size': '26px', padding: '34px 28px' }, txt),
  );
  enter(g1, s1, t1, 'situation')
    .from(sits, { y: 30, autoAlpha: 0, duration: 0.6, stagger: 0.14, ease: 'back.out(1.6)' }, '<0.2')
    .to(sits[2], { borderColor: 'rgba(127,216,181,.9)', boxShadow: '0 0 0 4px rgba(127,216,181,.25)', scale: 1.04, duration: 0.5 }, '>0.4');
  leave(g1);

  // -------------------------------------------------- 2. identification
  const g2 = group();
  const s2 = step(g2, 2);
  const t2 = el(g2, 'st-title', titleStyle, 'La bonne <em>démarche.</em>');
  const sub2 = el(g2, 'st-sub', { x: tx, y: T ? 176 : 126, w: T ? 620 : 900 }, 'Alurforma vous aide à identifier la démarche adaptée à votre situation.');
  const opts = ['OPCO', 'Fonds de formation', 'Employeur', 'Autre dispositif applicable'].map((txt, i) =>
    el(g2, 'st-card', T ? { x: 48, y: 290 + i * 110, w: 624, 'font-size': '22px' } : { x: 70 + (i % 2) * 560, y: 230 + Math.floor(i / 2) * 120, w: 520, 'font-size': '22px' }, txt),
  );
  const found = el(g2, 'st-badge st-badge--green', T ? { x: 48, y: 760 } : { x: 70, y: 490 }, '✓ Démarche identifiée selon votre situation');
  gsap.set([g2, found], { autoAlpha: 0 });
  enter(g2, s2, t2, 'identification')
    .from(sub2, { autoAlpha: 0, duration: 0.5 }, '<0.3')
    .from(opts, { x: -30, autoAlpha: 0, duration: 0.5, stagger: 0.12, ease: 'power2.out' }, '<0.2')
    .to(opts.filter((_, i) => i !== 0), { opacity: 0.4, duration: 0.4 }, '>0.4')
    .to(opts[0], { borderColor: 'rgba(127,216,181,.9)', boxShadow: '0 0 0 4px rgba(127,216,181,.25)', duration: 0.4 }, '<')
    .to(found, { autoAlpha: 1, duration: 0.4 }, '>0.2');
  leave(g2);

  // -------------------------------------------------------- 3. the file
  const g3 = group();
  const s3 = step(g3, 3);
  const t3 = el(g3, 'st-title', titleStyle, 'Le dossier, <em>préparé.</em>');
  const folder = el(g3, 'st-panel', T ? { x: 48, y: 560, w: 624, h: 220 } : { x: 760, y: 190, w: 450, h: 300 });
  el(folder, 'st-label', { x: 24, y: 20 }, 'DOSSIER DE FINANCEMENT');
  const ready = el(g3, 'st-badge st-badge--green', T ? { x: 48, y: 800 } : { x: 760, y: 510 }, '✓ Dossier préparé');
  const docs = ['Programme', 'Devis', 'Convention / contrat'].map((txt, i) =>
    el(g3, 'st-card', T ? { x: 48, y: 220 + i * 100, w: 624, 'font-size': '21px' } : { x: 70, y: 200 + i * 104, w: 480, 'font-size': '22px' }, txt),
  );
  gsap.set([g3, ready], { autoAlpha: 0 });
  enter(g3, s3, t3, 'dossier')
    .from(folder, { autoAlpha: 0, x: '+=40', duration: 0.6 }, '<0.2')
    .from(docs, { x: -30, autoAlpha: 0, duration: 0.5, stagger: 0.14, ease: 'power2.out' }, '<0.1');
  docs.forEach((d, i) => {
    tl.to(d, T ? { top: 610 + i * 50, left: 72, width: 576, fontSize: '17px', padding: '8px 14px', duration: 0.6, ease: 'power3.inOut' } : { top: 240 + i * 74, left: 784, width: 402, duration: 0.6, ease: 'power3.inOut' }, `>${i ? 0.05 : 0.4}`);
  });
  tl.to(ready, { autoAlpha: 1, duration: 0.4 }, '>0.2');
  leave(g3);

  // ------------------------------------------------ 4. administrative follow-up
  const g4 = group();
  const s4 = step(g4, 4);
  const t4 = el(g4, 'st-title', titleStyle, 'Alurforma <em>suit le dossier.</em>');
  const rows = [
    ['Dossier préparé', true],
    ['Dossier transmis', true],
    ['Pièces complémentaires', true],
    ['En cours d’instruction', false],
  ] as const;
  const line = el(g4, '', T ? { x: 76, y: 240, w: 2, h: 440, background: 'rgba(255,255,255,.2)' } : { x: 98, y: 200, w: 2, h: 330, background: 'rgba(255,255,255,.2)' });
  const items = rows.map(([txt, done], i) =>
    el(
      g4,
      'st-card',
      T ? { x: 48, y: 210 + i * 120, w: 624, 'font-size': '22px', display: 'flex', 'align-items': 'center', gap: '16px' } : { x: 70, y: 180 + i * 96, w: 620, 'font-size': '22px', display: 'flex', 'align-items': 'center', gap: '16px' },
      `<span style="display:grid;place-items:center;width:34px;height:34px;flex:none;border-radius:50%;${done ? 'background:#0b8f63;color:#fff' : 'border:2px dashed rgba(127,216,181,.8);color:#7fd8b5'}">${done ? '✓' : '…'}</span>${txt}`,
    ),
  );
  const msg = el(g4, 'st-badge st-badge--gold', T ? { x: 48, y: 720 } : { x: 760, y: 280 }, 'Alurforma suit le dossier');
  gsap.set([g4, msg], { autoAlpha: 0 });
  enter(g4, s4, t4, 'suivi')
    .from(line, { scaleY: 0, transformOrigin: 'top', duration: 0.8, ease: 'power2.out' }, '<0.2')
    .from(items, { x: -20, autoAlpha: 0, duration: 0.45, stagger: 0.35, ease: 'power2.out' }, '<0.1')
    .to(msg, { autoAlpha: 1, duration: 0.4 }, '>0.1')
    .to(items[3], { opacity: 0.6, duration: 0.6, yoyo: true, repeat: 3, ease: 'sine.inOut' }, '<');
  leave(g4);

  // ------------------------------------------------------- 5. decision
  const g5 = group();
  const s5 = step(g5, 5);
  const t5 = el(g5, 'st-title', titleStyle, 'La décision <em>du financeur.</em>');
  const card = el(
    g5,
    'st-card',
    T ? { x: 48, y: 260, w: 624, 'white-space': 'normal', padding: '40px 34px' } : { x: 70, y: 200, w: 700, 'white-space': 'normal', padding: '40px 40px' },
    '<small>Étape finale</small><b style="display:block;font-size:40px;margin:10px 0 12px">Décision du financeur</b><span style="font-size:20px;color:rgba(255,255,255,.75)">Selon ses critères, ses budgets et ses délais.</span>',
  );
  const pair = el(
    g5,
    'st-sub',
    T ? { x: 48, y: 560, w: 624 } : { x: 820, y: 230, w: 400 },
    '<b style="color:#7fd8b5">Alurforma</b> prépare et accompagne.<br /><br /><b style="color:#f1e2c4">Le financeur</b> examine et décide.',
  );
  gsap.set(g5, { autoAlpha: 0 });
  enter(g5, s5, t5, 'decision')
    .from(card, { y: 30, autoAlpha: 0, scale: 0.96, duration: 0.7, ease: 'power3.out' }, '<0.2')
    .from(pair, { autoAlpha: 0, x: 20, duration: 0.6 }, '>0.2')
    .to({}, { duration: 2 })
    .to(g5, { autoAlpha: 0, duration: 0.6 });

  const end = endCard(stage, L);
  gsap.set(end, { autoAlpha: 0 });
  tl.fromTo(end, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8 }).to({}, { duration: 2 }).to(end, { autoAlpha: 0, duration: 0.5 });

  return {
    tl,
    chapters: [
      { id: 'situation', label: 'Situation' },
      { id: 'identification', label: 'Identification' },
      { id: 'dossier', label: 'Dossier' },
      { id: 'suivi', label: 'Suivi' },
      { id: 'decision', label: 'Décision' },
    ],
  };
};
