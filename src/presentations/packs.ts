// Formations page: how Alurforma follows an ALUR obligation, in five steps —
// card, courses, plan (14 → 28 → 42 h), follow-up, centralised attestations.

import { gsap } from 'gsap';
import { el, counter, endCard, type Builder } from './player';

// Only themes that exist in the catalogue today.
const COURSES = ['F01 · Cadre juridique', 'F02 · Déontologie', 'F03 · Non-discrimination'];
const COLORS = ['#123a7e', '#0b8f63', '#2c58c8', '#0a6f4e', '#1d4aa8', '#0f7d59'];

export const buildPacks: Builder = (stage, L) => {
  const tl = gsap.timeline();
  const T = L.tall;
  const tx = T ? 48 : 70;
  const titleStyle = { x: tx, y: 56, 'white-space': T ? 'normal' : 'nowrap', w: T ? 620 : undefined };
  const step = (parent: HTMLElement, n: number) => el(parent, 'st-label', { x: tx, y: T ? 20 : 26, color: '#7fd8b5', 'letter-spacing': '.14em' }, `ÉTAPE ${n} / 5`);

  // ------------------------------------------------------- 1. the card
  const g0 = el(stage, 'g0', { x: 0, y: 0, w: L.W, h: L.H });
  const s0 = step(g0, 1);
  const t0 = el(g0, 'st-title', titleStyle, 'Choisissez <em>votre carte.</em>');
  const CARDS: [string, string, boolean][] = [
    ['T', 'Transaction', true],
    ['G', 'Gestion', false],
    ['S', 'Syndic', false],
  ];
  const tiles = CARDS.map(([k, name, open], i) => {
    const x = T ? 48 + i * 214 : 70 + i * 230;
    const y = T ? 250 : 200;
    return el(
      g0,
      'st-card',
      { x, y, w: T ? 196 : 206, h: 200, 'white-space': 'normal', opacity: open ? 1 : 0.55 },
      `<b style="font-size:64px;line-height:1">${k}</b><span style="display:block;margin-top:14px;font-size:19px">${name}</span><small style="display:block;margin-top:10px;color:${open ? '#7fd8b5' : 'rgba(255,255,255,.6)'}">${open ? 'Disponible' : 'Bientôt disponible'}</small>`,
    );
  });
  tl.addLabel('carte')
    .from([s0, t0], { y: '+=20', autoAlpha: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' })
    .from(tiles, { y: 40, autoAlpha: 0, rotationX: -30, transformPerspective: 1200, duration: 0.7, stagger: 0.14, ease: 'back.out(1.6)' }, '<0.2')
    .to(tiles[0], { borderColor: 'rgba(127,216,181,.9)', boxShadow: '0 0 0 4px rgba(127,216,181,.25)', scale: 1.04, duration: 0.5 }, '>0.4')
    .to({}, { duration: 1.2 })
    .to(g0, { autoAlpha: 0, y: -20, duration: 0.5 });

  // ------------------------------------------------ 2. the courses
  const g1 = el(stage, 'g1', { x: 0, y: 0, w: L.W, h: L.H });
  const s1 = step(g1, 2);
  const t1 = el(g1, 'st-title', titleStyle, 'Choisissez <em>vos formations.</em>');
  const panel = el(g1, 'st-panel', T ? { x: 48, y: 520, w: 624, h: 300 } : { x: 680, y: 170, w: 530, h: 330 });
  el(panel, 'st-label', { x: 24, y: 20 }, 'MON PARCOURS');
  const picks = COURSES.map((c, i) =>
    el(g1, 'st-card', T ? { x: 48, y: 220 + i * 92, w: 624, 'font-size': '19px' } : { x: 70, y: 200 + i * 100, w: 520, 'font-size': '20px' }, c),
  );
  gsap.set(g1, { autoAlpha: 0 });
  tl.addLabel('formations')
    .set(g1, { autoAlpha: 1 })
    .from([s1, t1], { y: '+=20', autoAlpha: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' })
    .from(panel, { autoAlpha: 0, x: '+=40', duration: 0.6, ease: 'power3.out' }, '<0.2')
    .from(picks, { x: -40, autoAlpha: 0, duration: 0.5, stagger: 0.14, ease: 'power2.out' }, '<0.2');
  picks.forEach((p, i) => {
    tl.to(p, T ? { top: 580 + i * 76, left: 72, width: 576, duration: 0.6, ease: 'power3.inOut' } : { top: 230 + i * 86, left: 704, width: 482, duration: 0.6, ease: 'power3.inOut' }, `>${i ? 0.05 : 0.4}`);
  });
  tl.to({}, { duration: 1.2 }).to(g1, { autoAlpha: 0, y: -20, duration: 0.5 });

  // -------------------------------------- 3-5. plan, follow-up, attestations
  const g2 = el(stage, 'g2', { x: 0, y: 0, w: L.W, h: L.H });
  const s2 = el(g2, 'st-label', { x: tx, y: T ? 20 : 26, color: '#7fd8b5', 'letter-spacing': '.14em' }, 'ÉTAPE 3 / 5');
  const t3 = el(g2, 'st-title', titleStyle, 'Construisez <em>votre parcours.</em>');
  const t4 = el(g2, 'st-title', titleStyle, 'Alurforma suit <em>vos obligations.</em>');
  const t5 = el(g2, 'st-title', titleStyle, 'Vos attestations, <em>centralisées.</em>');
  const sx = T ? 48 : 300;
  const sw = T ? 624 : 900;
  const sy0 = T ? 230 : 190;
  const gap = T ? 150 : 104;
  const sh = T ? 76 : 72;
  const splits = [
    [0.22, 0.43, 0.35],
    [0.5, 0.14, 0.36],
    [0.29, 0.29, 0.42],
  ];
  const blocks: HTMLElement[][] = [];
  const docs: HTMLElement[] = [];
  const slotLabels: HTMLElement[] = [];
  const slots = [0, 1, 2].map((yr) => {
    const y = sy0 + yr * gap;
    slotLabels.push(el(g2, 'st-label', T ? { x: sx, y: y - 34 } : { x: 70, y: y + 24 }, `Année ${yr + 1} · 14 h`));
    const slot = el(g2, 'st-slot', { x: sx, y, w: sw, h: sh });
    let acc = 0;
    blocks.push(
      splits[yr].map((f, j) => {
        const w = f * sw - 6;
        const b = el(g2, 'st-block', { x: sx + acc * sw + 3, y: y + 4, w, h: sh - 8, background: COLORS[(yr * 3 + j) % COLORS.length] }, '');
        docs.push(el(g2, 'st-doc', { x: sx + acc * sw + w / 2 - 12, y: y - 22, w: 28, h: 36, 'border-radius': '4px' }));
        acc += f;
        return b;
      }),
    );
    return slot;
  });
  const big = el(g2, 'st-big', T ? { x: 48, y: 680 } : { x: 70, y: 500 }, '0 h');
  const packBadge = el(g2, 'st-badge st-badge--green', T ? { x: 48, y: 800 } : { x: 330, y: 528 }, '1 année');
  const checks = ['✓ Déontologie', '✓ Non-discrimination', '✓ Heures réalisées'].map((txt, i) =>
    el(g2, 'st-badge st-badge--gold', T ? { x: 380, y: 680 + i * 64 } : { x: 860, y: 486 + i * 54 }, txt),
  );
  gsap.set(g2, { autoAlpha: 0 });
  gsap.set([t4, t5, packBadge, ...checks, ...docs], { autoAlpha: 0 });

  const fill = (yr: number) => gsap.from(blocks[yr], { x: '+=260', autoAlpha: 0, rotationY: -70, duration: 0.8, stagger: 0.22, ease: 'power3.out' });
  const badge = (text: string) =>
    gsap
      .timeline()
      .to(packBadge, { autoAlpha: 0, duration: 0.2 })
      .add(() => (packBadge.textContent = text))
      .to(packBadge, { autoAlpha: 1, duration: 0.4 });

  // 3. plan: 14 → 28 → 42 h
  tl.addLabel('parcours')
    .set(g2, { autoAlpha: 1 })
    .from([s2, t3], { y: 20, autoAlpha: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' })
    .from([...slots, ...slotLabels], { autoAlpha: 0, duration: 0.5, stagger: 0.06 }, '<0.2')
    .from(big, { autoAlpha: 0, duration: 0.4 }, '<')
    .add(fill(0));
  counter(tl, big, 0, 14, '<');
  tl.to(packBadge, { autoAlpha: 1, duration: 0.4 }, '>-0.3').to({}, { duration: 0.6 }).add(fill(1));
  counter(tl, big, 14, 28, '<');
  tl.add(badge('2 années'), '>-0.4').to({}, { duration: 0.4 }).add(fill(2));
  counter(tl, big, 28, 42, '<');
  tl.add(badge('Cycle complet'), '>-0.4').to({}, { duration: 1 });

  // 4. follow-up
  tl.addLabel('suivi')
    .add(() => (s2.textContent = tl.time() >= tl.labels.suivi ? 'ÉTAPE 4 / 5' : 'ÉTAPE 3 / 5'))
    .to(t3, { autoAlpha: 0, duration: 0.3 })
    .to(t4, { autoAlpha: 1, duration: 0.5 }, '<0.2')
    .to(checks, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.3, ease: 'back.out(2)' })
    .to({}, { duration: 1.4 });

  // 5. attestations
  tl.addLabel('attest')
    .add(() => (s2.textContent = tl.time() >= tl.labels.attest ? 'ÉTAPE 5 / 5' : 'ÉTAPE 4 / 5'))
    .to(t4, { autoAlpha: 0, duration: 0.3 })
    .to(t5, { autoAlpha: 1, duration: 0.5 }, '<0.2')
    .to(docs, { autoAlpha: 1, y: '-=10', duration: 0.4, stagger: 0.08, ease: 'back.out(2)' })
    .to({}, { duration: 1.4 })
    .to(g2, { autoAlpha: 0, scale: 0.96, duration: 0.6 });
  const end = endCard(stage, L);
  gsap.set(end, { autoAlpha: 0 });
  tl.fromTo(end, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }).to({}, { duration: 2 }).to(end, { autoAlpha: 0, duration: 0.5 });

  return {
    tl,
    chapters: [
      { id: 'carte', label: 'Carte' },
      { id: 'formations', label: 'Formations' },
      { id: 'parcours', label: 'Parcours' },
      { id: 'suivi', label: 'Suivi' },
      { id: 'attest', label: 'Attestations' },
    ],
  };
};
