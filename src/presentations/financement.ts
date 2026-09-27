// Financement page: from the learner's status to the funder's decision,
// drawn as the logo's two light paths (blue and green).

import { gsap } from 'gsap';
import { el, endCard, type Builder } from './player';

const SVGNS = 'http://www.w3.org/2000/svg';

export const buildFinancement: Builder = (stage, L) => {
  const tl = gsap.timeline();
  const T = L.tall;
  const title = el(stage, 'st-title', { x: T ? 40 : 70, y: 50, 'white-space': T ? 'normal' : 'nowrap', w: T ? 640 : undefined }, 'De votre statut <em>à la décision.</em>');

  const nodes = [
    ['01 · Statut', 'Votre situation', 'Salarié, indépendant ou agence'],
    ['02 · Financeur', 'Le bon interlocuteur', 'OPCO ou fonds d’assurance formation'],
    ['03 · Dossier', 'Les pièces fournies', 'Programme, devis, convention'],
    ['04 · Décision', 'Le financeur tranche', 'Selon ses critères et son budget'],
  ];
  const W = T ? 600 : 250;
  const pos = nodes.map((_, i) => (T ? { x: 60, y: 170 + i * 170 } : { x: 70 + i * 300, y: 190 }));
  const boxes = nodes.map(([k, b, s], i) => el(stage, 'st-node', { ...pos[i], w: W }, `<i>${k}</i><b>${b}</b><span>${s}</span>`));

  // Paths between nodes (two parallel strokes, like the logo).
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('width', String(L.W));
  svg.setAttribute('height', String(L.H));
  svg.style.cssText = 'position:absolute;left:0;top:0';
  stage.insertBefore(svg, stage.firstChild);
  const paths: SVGPathElement[] = [];
  for (let i = 0; i < 3; i++) {
    for (const [off, color] of [
      [-6, 'rgba(63,111,232,.9)'],
      [6, 'rgba(24,190,130,.9)'],
    ] as [number, string][]) {
      const p = document.createElementNS(SVGNS, 'path');
      let d: string;
      if (T) {
        const x = 360 + off;
        d = `M${x} ${pos[i].y + 118} C ${x} ${pos[i].y + 140}, ${x} ${pos[i + 1].y - 20}, ${x} ${pos[i + 1].y}`;
      } else {
        const y = 250 + off;
        const x1 = pos[i].x + W;
        const x2 = pos[i + 1].x;
        d = `M${x1} ${y} C ${x1 + 20} ${y - 8}, ${x2 - 20} ${y + 8}, ${x2} ${y}`;
      }
      p.setAttribute('d', d);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', color);
      p.setAttribute('stroke-width', '4');
      p.setAttribute('stroke-linecap', 'round');
      // Glow: a wide translucent twin stroke (cheaper and cleaner than a filter).
      const glow = p.cloneNode() as SVGPathElement;
      glow.setAttribute('stroke-width', '14');
      glow.setAttribute('stroke-opacity', '0.18');
      svg.appendChild(glow);
      svg.appendChild(p);
      paths.push(glow, p);
    }
  }
  paths.forEach((p) => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = `${len}`;
    p.style.strokeDashoffset = `${len}`;
  });

  const chips = ['Salarié', 'Indépendant', 'Agence'].map((c, i) =>
    el(stage, 'st-badge st-badge--green', T ? { x: 250 + i * 140, y: 170 + 22, 'font-size': '15px', padding: '6px 12px' } : { x: 70, y: 400 + i * 52 }, c),
  );
  if (T) chips.forEach((c) => (c.style.display = 'none'));
  const docs = ['Programme', 'Devis', 'Convention'].map((d, i) =>
    el(stage, 'st-card', T ? { x: 60 + i * 204, y: 170 * 3 + 130, 'font-size': '16px', padding: '10px 14px' } : { x: 670, y: 400 + i * 56, 'font-size': '16px', padding: '10px 14px' }, d),
  );
  if (T) docs.forEach((d) => (d.style.display = 'none'));
  const warn = el(stage, 'st-badge st-badge--gold', T ? { x: 60, y: 170 * 3 + 290 } : { x: 970, y: 400 }, 'Prise en charge jamais garantie');

  gsap.set([...boxes, ...chips, ...docs, warn], { autoAlpha: 0 });

  const draw = (i: number) => tl.to(paths.slice(i * 4, i * 4 + 4), { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', stagger: 0.1 });
  const show = (b: HTMLElement) => tl.fromTo(b, { autoAlpha: 0, y: 20, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' });

  tl.addLabel('statut').from(title, { y: 20, autoAlpha: 0, duration: 0.7 });
  show(boxes[0]);
  tl.to(chips, { autoAlpha: 1, duration: 0.4, stagger: 0.18 }, '>-0.1')
    .to(chips, { backgroundColor: 'rgba(11,143,99,.55)', duration: 0.25, stagger: { each: 0.35, yoyo: true, repeat: 1 } })
    .to({}, { duration: 0.6 });

  tl.addLabel('financeur');
  draw(0);
  show(boxes[1]);
  tl.to({}, { duration: 1 });

  tl.addLabel('dossier');
  draw(1);
  show(boxes[2]);
  tl.fromTo(docs, { autoAlpha: 0, x: -20, rotation: -6 }, { autoAlpha: 1, x: 0, rotation: 0, duration: 0.5, stagger: 0.18, ease: 'back.out(1.8)' }).to({}, { duration: 1 });

  tl.addLabel('decision');
  draw(2);
  show(boxes[3]);
  tl.fromTo(warn, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' })
    .to({}, { duration: 2 })
    .to([title, svg, ...boxes, ...chips, ...docs, warn], { autoAlpha: 0, duration: 0.6 });

  const end = endCard(stage, L);
  gsap.set(end, { autoAlpha: 0 });
  tl.fromTo(end, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8 }).to({}, { duration: 2 }).to(end, { autoAlpha: 0, duration: 0.5 });
  tl.set(svg, { autoAlpha: 1 });
  tl.set(paths, { strokeDashoffset: (_i: number, t: SVGPathElement) => t.getTotalLength() });

  return {
    tl,
    chapters: [
      { id: 'statut', label: 'Statut' },
      { id: 'financeur', label: 'Financeur' },
      { id: 'dossier', label: 'Dossier' },
      { id: 'decision', label: 'Décision' },
    ],
  };
};
