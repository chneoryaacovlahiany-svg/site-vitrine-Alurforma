// Formations page: how formations (1 h to 12 h) add up to 14, 28 and 42 h.

import { gsap } from 'gsap';
import { el, counter, endCard, type Builder } from './player';

const THEMES = ['Cadre juridique', 'Mandats', 'Déontologie', 'Non-discrimination', 'Lutte contre le blanchiment', 'Digitalisation', 'Sécurisation de la vente'];
const COLORS = ['#123a7e', '#0b8f63', '#2c58c8', '#0a6f4e', '#1d4aa8', '#0f7d59'];

export const buildPacks: Builder = (stage, L) => {
  const tl = gsap.timeline();
  const T = L.tall;

  // ------------------------------------------------ 1. durations 1 h → 12 h
  const g1 = el(stage, 'g1', { x: 0, y: 0, w: L.W, h: L.H });
  const title1 = el(g1, 'st-title', { x: T ? 48 : 70, y: T ? 56 : 56, 'white-space': T ? 'normal' : 'nowrap', w: T ? 620 : undefined }, 'Chaque thématique, <em>sa juste durée.</em>');
  const sub1 = el(g1, 'st-sub', { x: T ? 48 : 70, y: T ? 176 : 124, w: T ? 600 : 620 }, 'Une formation dure de 1 h à 12 h, selon ce que le sujet exige.');
  const rx = T ? 60 : 120;
  const rw = T ? 600 : 1040;
  const ry = T ? 470 : 470;
  const ruler = el(g1, '', { x: rx, y: ry, w: rw, h: 2, background: 'rgba(255,255,255,.35)', 'transform-origin': 'left' });
  const ticks: HTMLElement[] = [];
  for (let i = 1; i <= 12; i++) {
    const x = rx + ((i - 1) / 11) * rw;
    ticks.push(el(g1, '', { x: x - 1, y: ry - 10, w: 2, h: 20, background: 'rgba(255,255,255,.35)' }));
    if (i === 1 || i === 12 || (!T && i % 3 === 0)) ticks.push(el(g1, 'st-label', { x: x - 16, y: ry + 22 }, `${i} h`));
  }
  const cursor = el(g1, '', { x: rx - 9, y: ry - 9, w: 18, h: 18, 'border-radius': '50%', background: '#7fd8b5', 'box-shadow': '0 0 0 6px rgba(127,216,181,.2)' });
  const cards = THEMES.slice(0, T ? 6 : 7).map((t, i) => {
    const col = T ? i % 2 : i;
    const row = T ? Math.floor(i / 2) : i % 2;
    const x = T ? 48 + col * 318 : 70 + col * 160;
    const y = T ? 250 + row * 64 : 226 + row * 90 + (i % 3) * 8;
    return el(g1, 'st-card', { x, y, 'font-size': '17px', padding: '12px 16px' }, t);
  });
  tl.addLabel('durees')
    .from([title1, sub1], { y: '+=20', autoAlpha: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out' })
    .from(ruler, { scaleX: 0, duration: 1, ease: 'power3.inOut' }, '<0.3')
    .from(ticks, { autoAlpha: 0, duration: 0.3, stagger: 0.03 }, '<0.3')
    .from(cards, { y: '-=30', autoAlpha: 0, rotationX: -40, duration: 0.7, stagger: 0.12, ease: 'back.out(1.6)' }, '<')
    .to(cursor, { x: rw, duration: 2.2, ease: 'power2.inOut' }, '<0.2')
    .to({}, { duration: 0.8 })
    .to(g1, { autoAlpha: 0, y: -20, duration: 0.5 });

  // ------------------------------------------------ 2-4. packs 14 / 28 / 42
  const g2 = el(stage, 'g2', { x: 0, y: 0, w: L.W, h: L.H });
  const title2 = el(g2, 'st-title', { x: T ? 48 : 70, y: 56, 'white-space': T ? 'normal' : 'nowrap', w: T ? 620 : undefined }, 'Les formations s’additionnent. <em>L’obligation se remplit.</em>');
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
  const big = el(g2, 'st-big', T ? { x: 48, y: 690 } : { x: 70, y: 500 }, '0 h');
  const packBadge = el(g2, 'st-badge st-badge--green', T ? { x: 300, y: 716 } : { x: 330, y: 528 }, 'Pack annuel');
  const nd = el(g2, 'st-badge st-badge--gold', T ? { x: 48, y: 820 } : { x: 860, y: 500 }, '✓ 2 h non-discrimination');
  const de = el(g2, 'st-badge st-badge--gold', T ? { x: 360, y: 820 } : { x: 860, y: 556 }, '✓ 2 h déontologie');
  gsap.set(g2, { autoAlpha: 0 });
  gsap.set([packBadge, nd, de, ...docs], { autoAlpha: 0 });

  const fill = (yr: number) =>
    gsap.from(blocks[yr], { x: '+=260', autoAlpha: 0, rotationY: -70, duration: 0.8, stagger: 0.22, ease: 'power3.out' });

  tl.addLabel('p14')
    .set(g2, { autoAlpha: 1 })
    .from(title2, { y: 20, autoAlpha: 0, duration: 0.7, ease: 'power3.out' })
    .from([...slots, ...slotLabels], { autoAlpha: 0, duration: 0.5, stagger: 0.06 }, '<0.2')
    .from(big, { autoAlpha: 0, duration: 0.4 }, '<')
    .add(fill(0));
  counter(tl, big, 0, 14, '<');
  tl.to(packBadge, { autoAlpha: 1, duration: 0.4 }, '>-0.3').to({}, { duration: 1.2 });

  tl.addLabel('p28').add(fill(1));
  counter(tl, big, 14, 28, '<');
  tl.to(packBadge, { autoAlpha: 0, duration: 0.2 }, '<')
    .add(() => {
      packBadge.textContent = tl.time() >= (tl.labels.p28 ?? 0) ? 'Pack deux ans' : 'Pack annuel';
    }, '<0.2')
    .to(packBadge, { autoAlpha: 1, duration: 0.4 }, '>0.6')
    .to({}, { duration: 1.2 });

  tl.addLabel('p42').add(fill(2));
  counter(tl, big, 28, 42, '<');
  tl.to(packBadge, { autoAlpha: 0, duration: 0.2 }, '<')
    .add(() => {
      packBadge.textContent = tl.time() >= (tl.labels.p42 ?? 0) ? 'Cycle complet' : 'Pack deux ans';
    }, '<0.2')
    .to(packBadge, { autoAlpha: 1, duration: 0.4 }, '>0.6')
    .to([nd, de], { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.25, ease: 'back.out(2)' })
    .to({}, { duration: 1.4 });

  // ------------------------------------------------ 5. attestations + end
  tl.addLabel('attest')
    .to(docs, { autoAlpha: 1, y: '-=10', duration: 0.4, stagger: 0.08, ease: 'back.out(2)' })
    .to({}, { duration: 1.2 })
    .to(g2, { autoAlpha: 0, scale: 0.96, duration: 0.6 });
  const end = endCard(stage, L);
  gsap.set(end, { autoAlpha: 0 });
  tl.fromTo(end, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }).to({}, { duration: 2 }).to(end, { autoAlpha: 0, duration: 0.5 });

  return {
    tl,
    chapters: [
      { id: 'durees', label: '1 h à 12 h' },
      { id: 'p14', label: '14 h' },
      { id: 'p28', label: '28 h' },
      { id: 'p42', label: '42 h' },
      { id: 'attest', label: 'Attestations' },
    ],
  };
};
