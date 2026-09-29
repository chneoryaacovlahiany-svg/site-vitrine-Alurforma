// Formations page: filterable catalogue, course detail sheet and pack composer.

import { CARD_NAMES } from '../config';
import { COURSES, THEME_LABELS, type Course } from '../catalog/courses';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const selected = new Set<string>();
const listeners: (() => void)[] = [];
const notify = () => listeners.forEach((f) => f());

function toggleSelected(id: string) {
  if (selected.has(id)) selected.delete(id);
  else selected.add(id);
  notify();
}

function cardsLabel(c: Course) {
  return c.cards.length === 3 ? 'Toutes cartes' : c.cards.map((k) => `Carte ${k}`).join(' · ');
}

// ---------------------------------------------------------------- cards --

/** Course visual (16:9, title and logo baked in, so the alt text stays empty). */
function visual(c: Course, cls: string, sizes: string, eager = false) {
  const base = `${import.meta.env.BASE_URL}media/formations/${c.id}`;
  return `<img class="${cls}" src="${base}-640.webp" srcset="${base}-640.webp 640w, ${base}-1200.webp 1200w" sizes="${sizes}" width="640" height="360" alt="" ${eager ? '' : 'loading="lazy" '}decoding="async" />`;
}

function courseCard(c: Course) {
  const inPack = selected.has(c.id);
  return `<article class="course-card" data-id="${c.id}">
    ${visual(c, 'course-card__img', '(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 380px')}
    <div class="course-card__top">
      <div class="course-card__badges"><span class="badge">${cardsLabel(c)}</span>${c.obligation ? `<span class="badge badge--gold">Thème exigé sur 3 ans</span>` : ''}</div>
      <p class="course-card__code">${c.code}</p>
      <h3>${esc(c.title)}</h3>
      <span class="status status--${c.status.tone}">${esc(c.status.label)}</span>
    </div>
    <div class="course-card__body">
      <p>${esc(c.summary)}</p>
      <ul class="course-card__meta">
        <li><b>${c.videoTotal}</b><span>de vidéo</span></li>
        <li><b>${c.lessons.length} leçons</b><span>1 chapitre</span></li>
        <li><b>${esc(THEME_LABELS[c.themes[0]])}</b><span>thème</span></li>
        <li><b>${esc(c.level.split(' · ')[0])}</b><span>niveau</span></li>
      </ul>
      <div class="course-card__btns">
        <button type="button" class="btn btn--dark" data-open="${c.id}">Voir la fiche</button>
        <button type="button" class="btn btn--ghost" data-add="${c.id}" aria-pressed="${inPack}">${inPack ? '✓ Dans mon pack' : '+ Ajouter à mon pack'}</button>
      </div>
    </div>
  </article>`;
}

function initFilters(form: HTMLFormElement, grid: HTMLElement, count: HTMLElement) {
  const render = () => {
    const fd = new FormData(form);
    const q = norm(String(fd.get('q') ?? '').trim());
    const card = String(fd.get('card') ?? '');
    const theme = String(fd.get('theme') ?? '');
    const onlyObligation = fd.get('obligation') !== null;
    const list = COURSES.filter((c) => {
      if (card && !c.cards.includes(card as Course['cards'][number])) return false;
      if (theme && !c.themes.includes(theme as Course['themes'][number])) return false;
      if (onlyObligation && !c.obligation) return false;
      if (q) {
        const hay = norm([c.code, c.title, c.summary, ...c.objectives, ...c.lessons.map((l) => l.title)].join(' '));
        if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    });
    grid.innerHTML = list.length
      ? list.map(courseCard).join('')
      : `<div class="course-empty"><p><strong>Aucune formation ne correspond.</strong></p><p>${card === 'G' || card === 'S' ? `Les formations spécifiques à la carte ${card} (${CARD_NAMES[card as 'G' | 'S'].toLowerCase()}) sont en production.` : 'Essayez d’élargir les filtres.'}</p></div>`;
    count.textContent = `${list.length} formation${list.length > 1 ? 's' : ''} sur ${COURSES.length}`;
  };
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  listeners.push(render);
  render();
}

// --------------------------------------------------------------- detail --

function detail(c: Course) {
  const inPack = selected.has(c.id);
  return `
  <button class="course-modal__close" type="button" data-close aria-label="Fermer la fiche">×</button>
  <header class="sheet-hero">
    <div class="sheet-hero__main">
      <div class="course-card__badges"><span class="badge">${cardsLabel(c)}</span><span class="badge">${esc(c.level)}</span>${c.obligation ? '<span class="badge badge--gold">Thème exigé sur 3 ans</span>' : ''}</div>
      <p class="course-card__code">${c.code} · Formation individuelle</p>
      <h2 id="course-modal-title">${esc(c.title)}</h2>
      <p class="sheet-hero__lead">${esc(c.summary)}</p>
      <ul class="sheet-stats">
        <li><b>${c.videoTotal}</b><span>de vidéo mesurée</span></li>
        <li><b>${c.lessons.length} leçons</b><span>1 chapitre</span></li>
        <li><b>${cardsLabel(c)}</b><span>public visé</span></li>
        <li><b>Attestation</b><span>de formation</span></li>
      </ul>
    </div>
    <aside class="sheet-offer">
      ${visual(c, 'sheet-offer__img', '(max-width: 1000px) 92vw, 400px', true)}
      <span class="status status--${c.status.tone}">${esc(c.status.label)}</span>
      <p class="sheet-offer__price">Sur devis</p>
      <ul class="ticks">
        <li>${c.videoTotal} de vidéos · ${c.lessons.length} leçons</li>
        <li>Quiz, cas pratique et évaluation</li>
        <li>Accès ordinateur, tablette, smartphone</li>
        <li>Attestation à l’issue du parcours accompli</li>
      </ul>
      <a class="btn btn--primary" href="./contact.html?objet=formation&amp;f=${c.code}">Demander un devis</a>
      <button class="btn btn--ghost" type="button" data-add="${c.id}" aria-pressed="${inPack}">${inPack ? '✓ Dans mon pack' : '+ Ajouter à mon pack'}</button>
    </aside>
  </header>
  <div class="sheet-body">
    <div class="sheet-main">
      <section><h3>Objectifs de la formation</h3><ul class="sheet-objectives">${c.objectives.map((o) => `<li>${esc(o)}</li>`).join('')}</ul></section>
      <section><h3>Programme</h3><ol class="sheet-lessons">${c.lessons.map((l, i) => `<li><span class="sheet-lessons__n">${i + 1}</span><span class="sheet-lessons__t">${esc(l.title)}</span><span class="sheet-lessons__d">Vidéo ${l.video}</span></li>`).join('')}</ol><p class="sheet-note">${esc(c.flow)}</p></section>
      <section><h3>Modalités d’évaluation</h3><div class="sheet-evals">${c.evaluation.map((e) => `<div><b>${esc(e.title)}</b><p>${esc(e.text)}</p></div>`).join('')}</div></section>
      <section><h3>Méthodes et supports</h3><p>${esc(c.methods)}</p></section>
      <section><h3>À l’issue de la formation</h3><p>Une attestation de formation mentionnant les objectifs, le contenu, la durée et la date de réalisation est délivrée à l’issue du parcours accompli.</p></section>
    </div>
    <aside class="sheet-side">
      <div class="sheet-info">
        <h3>Informations pratiques</h3>
        <dl>
          <div><dt>Tarif</dt><dd>Sur devis</dd></div>
          <div><dt>Vidéos</dt><dd>${c.videoTotal}</dd></div>
          <div><dt>Durée estimée</dt><dd>${esc(c.duration)}</dd></div>
          <div><dt>Leçons</dt><dd>${c.lessons.length}</dd></div>
          <div><dt>Format</dt><dd>100 % en ligne</dd></div>
          <div><dt>Support</dt><dd>PC, tablette, mobile</dd></div>
          <div><dt>Niveau</dt><dd>${esc(c.level)}</dd></div>
          <div><dt>Cartes</dt><dd>${c.cards.join(', ')}</dd></div>
          <div><dt>Langue</dt><dd>Français</dd></div>
        </dl>
      </div>
      <div class="sheet-box"><h4>Public</h4><p>${esc(c.public)}</p><h4>Prérequis</h4><p>${esc(c.prerequisites)}</p></div>
      ${c.obligation ? `<div class="sheet-box sheet-box--gold"><h4>Obligation de formation</h4><p>Sur trois années consécutives, la formation continue inclut au moins 2 h consacrées à la ${c.obligation}. Cette formation traite ce thème.</p></div>` : ''}
      ${c.notes.length ? `<div class="sheet-box sheet-box--note"><h4>À savoir</h4>${c.notes.map((n) => `<p>${esc(n)}</p>`).join('')}</div>` : ''}
    </aside>
  </div>`;
}

function initDetail(modal: HTMLDialogElement, selectTab: (id: string) => void) {
  const body = modal.querySelector<HTMLElement>('[data-course-body]')!;
  let current: Course | null = null;
  const open = (id: string, push = true) => {
    const c = COURSES.find((x) => x.id === id);
    if (!c) return;
    current = c;
    body.innerHTML = detail(c);
    if (!modal.open) modal.showModal();
    body.scrollTop = 0;
    if (push) history.replaceState(null, '', `#${c.id}`);
  };
  const close = () => {
    modal.close();
  };
  modal.addEventListener('close', () => {
    current = null;
    history.replaceState(null, '', '#individuelles');
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal || (e.target as Element).closest('[data-close]')) close();
  });
  listeners.push(() => {
    if (current && modal.open) {
      const y = body.scrollTop;
      body.innerHTML = detail(current);
      body.scrollTop = y;
    }
  });
  document.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-open]');
    if (b) open(b.dataset.open!);
  });
  const fromHash = () => {
    const id = location.hash.slice(1);
    if (COURSES.some((c) => c.id === id)) {
      selectTab('individuelles');
      open(id, false);
    }
  };
  fromHash();
  window.addEventListener('hashchange', fromHash);
}

// ------------------------------------------------------------- composer --

function initComposer(root: HTMLElement, selectPacksTab: (sub: 'packs-prets' | 'packs-composer') => void) {
  const list = root.querySelector<HTMLElement>('[data-composer-courses]')!;
  const summary = root.querySelector<HTMLElement>('[data-composer-summary]')!;
  const targetInputs = Array.from(root.querySelectorAll<HTMLInputElement>('input[name="target"]'));
  const target = () => Number(targetInputs.find((i) => i.checked)?.value ?? 14);

  const render = () => {
    list.innerHTML = COURSES.map((c) => {
      const on = selected.has(c.id);
      return `<li class="${on ? 'is-on' : ''}">
        <div><span class="course-card__code">${c.code}</span><strong>${esc(c.title)}</strong><small>${cardsLabel(c)} · ${c.videoTotal} de vidéo · ≈ ${c.hours} h</small></div>
        <button type="button" class="btn ${on ? 'btn--dark' : 'btn--ghost'}" data-add="${c.id}" aria-pressed="${on}">${on ? '✓ Ajoutée' : 'Ajouter'}</button>
      </li>`;
    }).join('');
    const picks = COURSES.filter((c) => selected.has(c.id));
    const hours = picks.reduce((s, c) => s + c.hours, 0);
    const t = target();
    const ratio = Math.min(1, hours / t);
    const hasDeonto = picks.some((c) => c.obligation === 'déontologie');
    const hasNd = picks.some((c) => c.obligation === 'non-discrimination');
    const codes = picks.map((c) => c.code).join(',');
    summary.innerHTML = `
      <p class="composer__label">Mon pack · objectif ${t} h</p>
      <p class="composer__hours"><b>≈ ${hours} h</b> <span>sur ${t} h</span></p>
      <div class="composer__bar"><i style="transform:scaleX(${ratio})"></i></div>
      <ul class="composer__checks">
        <li class="${hasDeonto ? 'ok' : ''}">Déontologie ${hasDeonto ? 'incluse' : 'à ajouter'}</li>
        <li class="${hasNd ? 'ok' : ''}">Non-discrimination ${hasNd ? 'incluse' : 'à ajouter'}</li>
      </ul>
      ${picks.length ? `<ol class="composer__picked">${picks.map((c) => `<li><span>${c.code}</span>${esc(c.title)}</li>`).join('')}</ol>` : '<p class="composer__empty">Ajoutez des formations depuis la liste.</p>'}
      ${hours < t && picks.length ? `<p class="composer__hint">Il reste environ ${t - hours} h à compléter : le catalogue s’enrichit, nous vous proposerons les formations adaptées dans le devis.</p>` : ''}
      <a class="btn btn--primary ${picks.length ? '' : 'is-disabled'}" ${picks.length ? `href="./contact.html?objet=formation&amp;pack=sur-mesure-${t}&amp;f=${codes}"` : 'aria-disabled="true"'}>Demander un devis pour ce pack</a>
      <p class="composer__small">Durées indicatives : elles seront confirmées dans le devis.</p>`;
  };
  root.addEventListener('change', render);
  listeners.push(render);
  document.addEventListener('click', (e) => {
    const add = (e.target as Element).closest<HTMLElement>('[data-add]');
    if (add) toggleSelected(add.dataset.add!);
    const compose = (e.target as Element).closest<HTMLElement>('[data-compose]');
    if (compose) {
      const v = compose.dataset.compose!;
      const input = targetInputs.find((i) => i.value === v);
      if (input) input.checked = true;
      selectPacksTab('packs-composer');
      render();
    }
  });
  render();
}

export function initCatalog(opts: {
  selectTab: (id: string) => void;
  selectSubTab: (id: string) => void;
}) {
  const filters = document.querySelector<HTMLFormElement>('[data-filters]');
  const grid = document.querySelector<HTMLElement>('[data-course-grid]');
  const count = document.querySelector<HTMLElement>('[data-filter-count]');
  if (filters && grid && count) initFilters(filters, grid, count);
  const modal = document.querySelector<HTMLDialogElement>('[data-course-modal]');
  if (modal) initDetail(modal, opts.selectTab);
  const composer = document.querySelector<HTMLElement>('[data-composer]');
  if (composer) initComposer(composer, (sub) => opts.selectSubTab(sub));
}
