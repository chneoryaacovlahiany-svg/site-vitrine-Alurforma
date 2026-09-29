// Entreprises page: an agency dashboard assembling itself (illustrative data).

import { gsap } from 'gsap';
import { el, endCard, type Builder } from './player';

const TEAM: [string, string, number, string, string][] = [
  ['Collaborateur A', 'T', 36, 'À jour', 'ok'],
  ['Collaborateur B', 'T', 21, 'En cours', 'info'],
  ['Collaborateur C', 'T', 7, 'À planifier', 'warn'],
  ['Collaborateur D', 'G', 42, 'Complet', 'ok'],
  ['Collaborateur E', 'T', 28, 'En cours', 'info'],
];
const PILL: Record<string, string> = {
  ok: 'background:#e7f7f0;color:#06734f',
  info: 'background:#e6edff;color:#1e3fa8',
  warn: 'background:#fdecea;color:#b42318',
};

export const buildAgence: Builder = (stage, L) => {
  const tl = gsap.timeline();
  const T = L.tall;
  const title = el(stage, 'st-title', { x: T ? 40 : 70, y: 50, 'white-space': T ? 'normal' : 'nowrap', w: T ? 640 : undefined }, 'Votre équipe, <em>d’un seul regard.</em>');
  const px = T ? 30 : 470;
  const py = T ? 200 : 130;
  const pw = T ? 660 : 750;
  const rowH = T ? 76 : 70;
  const panel = el(stage, 'st-panel', { x: px, y: py, w: pw, h: 60 + TEAM.length * rowH + 20, overflow: 'hidden' });
  const head = el(panel, 'st-row', { x: 0, y: 0, w: pw, h: 56, 'font-size': '14px', 'letter-spacing': '.1em', color: 'rgba(255,255,255,.5)' }, '<span>COLLABORATEUR</span><span>CARTE</span><span>CYCLE 42 H</span><span>STATUT</span>');
  head.style.position = 'absolute';
  const rows = TEAM.map(([n, c, h, s, k], i) => {
    const r = el(panel, 'st-row', { x: 0, y: 60 + i * rowH, w: pw, h: rowH }, `<span>${n}</span><span>${c}</span><span style="display:flex;align-items:center;gap:14px"><span class="st-meter" style="flex:1"><i style="transform:scaleX(0)"></i></span><b data-h style="font-weight:600;min-width:58px">0 h</b></span><span class="st-pill" style="${PILL[k]};opacity:0">${s}</span>`);
    r.style.position = 'absolute';
    return { r, h, meter: r.querySelector<HTMLElement>('.st-meter i')!, label: r.querySelector<HTMLElement>('[data-h]')!, pill: r.querySelector<HTMLElement>('.st-pill')! };
  });

  const toastY = T ? 700 : 330;
  const toast = el(stage, 'st-card', { x: T ? 30 : 70, y: toastY, w: T ? 660 : 360, 'white-space': 'normal', 'border-color': 'rgba(245,158,11,.6)' }, '<small>Alerte échéance</small><b>Collaborateur C</b><span style="font-size:17px;color:rgba(255,255,255,.75)">Carte à renouveler dans 3 mois · 35 h restantes</span>');
  const assign = el(stage, 'st-badge st-badge--green', { x: T ? 30 : 70, y: toastY + (T ? 150 : 160) }, '✓ Formations affectées');
  const folder = el(stage, 'st-card', { x: T ? 30 : 70, y: T ? 700 : 330, w: T ? 660 : 360, 'white-space': 'normal' }, '<small>Justificatifs</small><b>Export des attestations</b><span data-n style="font-size:17px;color:#7fd8b5">0 document prêt</span>');
  const need = el(stage, 'st-card', { x: T ? 30 : 70, y: toastY, w: T ? 660 : 360, 'white-space': 'normal', 'border-color': 'rgba(127,216,181,.6)' }, '<small>Besoin identifié</small><b>Collaborateur B</b><span style="font-size:17px;color:rgba(255,255,255,.75)">Déontologie : à compléter</span><span style="display:block;margin-top:14px;font-size:14px;letter-spacing:.08em;color:#7fd8b5">PARCOURS RECOMMANDÉ</span><span style="font-size:17px;color:#fff">Déontologie et conduite professionnelle · ≈ 2 h</span>');
  // Tall layout: the button sits in the card's top-right corner to stay on screen.
  const affect = el(stage, 'st-badge st-badge--action', T ? { x: 356, y: toastY + 20 } : { x: 70, y: toastY + 245 }, 'Affecter la formation →');
  const docs = rows.map((_, i) => el(stage, 'st-doc', { x: px + pw - 120, y: py + 70 + i * rowH, w: 34, h: 44, 'border-radius': '4px' }));
  gsap.set([toast, assign, need, affect, folder, ...docs], { autoAlpha: 0 });

  // 1. team
  tl.addLabel('equipe')
    .from(title, { y: 20, autoAlpha: 0, duration: 0.7, ease: 'power3.out' })
    .from(panel, { rotationX: 28, rotationY: T ? 0 : -14, y: 60, autoAlpha: 0, transformPerspective: 1400, duration: 1.2, ease: 'power3.out' }, '<0.2')
    .from([head, ...rows.map((r) => r.r)], { x: 40, autoAlpha: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }, '<0.5')
    .to({}, { duration: 0.6 });

  // 2. hours
  tl.addLabel('heures');
  rows.forEach((r, i) => {
    const o = { v: 0 };
    tl.to(r.meter, { scaleX: r.h / 42, duration: 1.1, ease: 'power2.out' }, `heures+=${i * 0.12}`).to(
      o,
      { v: r.h, duration: 1.1, ease: 'power2.out', onUpdate: () => (r.label.textContent = `${Math.round(o.v)} h`) },
      '<',
    );
    tl.to(r.pill, { opacity: 1, duration: 0.3 }, '>-0.2');
  });
  tl.to({}, { duration: 1 });

  // 3. alert
  const c = rows[2];
  tl.addLabel('alerte')
    .add(() => c.r.classList.add('is-alert'))
    .fromTo(toast, { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power3.out' })
    .to(c.r, { backgroundColor: 'rgba(245,158,11,.14)', duration: 0.4, yoyo: true, repeat: 3 }, '<')
    .fromTo(assign, { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, '>0.4')
    .add(() => {
      c.pill.textContent = 'Planifié';
      c.pill.setAttribute('style', PILL.info);
    })
    .to({}, { duration: 1.4 })
    .to([toast, assign], { autoAlpha: 0, duration: 0.4 })
    .add(() => {
      c.r.classList.remove('is-alert');
      c.pill.textContent = 'À planifier';
      c.pill.setAttribute('style', PILL.warn);
    });

  // 4. needs: a need is identified and the matching course assigned.
  const b = rows[1];
  tl.addLabel('besoins')
    .fromTo(need, { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power3.out' })
    .to(b.r, { backgroundColor: 'rgba(127,216,181,.14)', duration: 0.4, yoyo: true, repeat: 3 }, '<')
    .fromTo(affect, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4 }, '>0.2')
    .to(affect, { scale: 0.94, duration: 0.12, yoyo: true, repeat: 1 }, '>0.6')
    .add(() => {
      affect.textContent = '✓ Parcours affecté';
      affect.classList.replace('st-badge--action', 'st-badge--green');
      b.pill.textContent = 'Parcours affecté';
      b.pill.setAttribute('style', PILL.ok);
    })
    .to({}, { duration: 1.4 })
    .to([need, affect], { autoAlpha: 0, duration: 0.4 })
    .add(() => {
      affect.textContent = 'Affecter la formation →';
      affect.classList.replace('st-badge--green', 'st-badge--action');
      b.pill.textContent = 'En cours';
      b.pill.setAttribute('style', PILL.info);
    });

  // 5. proofs
  const n = folder.querySelector<HTMLElement>('[data-n]')!;
  tl.addLabel('export').fromTo(folder, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5 });
  const fx = (T ? 30 + 660 : 70 + 360) - 110;
  const fy = (T ? 700 : 330) + 20;
  docs.forEach((d, i) => {
    tl.fromTo(d, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.25 }, `export+=${0.3 + i * 0.28}`)
      .to(d, { left: fx + i * 8, top: fy, rotation: -8 + i * 4, duration: 0.6, ease: 'power3.inOut' }, '>')
      .add(() => (n.textContent = `${i + 1} document${i ? 's' : ''} prêt${i ? 's' : ''}`), '>');
  });
  tl.to({}, { duration: 1.4 }).to(stage.children, { autoAlpha: 0, duration: 0.6 });

  const end = endCard(stage, L);
  gsap.set(end, { autoAlpha: 0 });
  tl.addLabel('fin').fromTo(end, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8 }).to({}, { duration: 2 }).to(end, { autoAlpha: 0, duration: 0.5 });
  tl.add(() => {
    // Reset for the next loop pass.
    n.textContent = '0 document prêt';
  });

  return {
    tl,
    chapters: [
      { id: 'equipe', label: 'Équipe' },
      { id: 'heures', label: 'Heures' },
      { id: 'alerte', label: 'Échéance' },
      { id: 'besoins', label: 'Besoins' },
      { id: 'export', label: 'Justificatifs' },
    ],
  };
};
