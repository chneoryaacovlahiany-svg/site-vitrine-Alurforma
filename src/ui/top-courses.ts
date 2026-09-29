// Home page: the individual courses "à la une", built from the same catalogue
// data as the Formations page so both always say the same thing.

import { COURSES, THEME_LABELS, type Course } from '../catalog/courses';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

function card(c: Course) {
  const base = `${import.meta.env.BASE_URL}media/formations/${c.id}`;
  const cards = c.cards.length === 3 ? 'Toutes cartes' : c.cards.map((k) => `Carte ${k}`).join(' · ');
  return `<a class="tcard" href="./formations.html#${c.id}">
    <div class="tcard__media">
    <img class="tcard__img" src="${base}-640.webp" srcset="${base}-640.webp 640w, ${base}-1200.webp 1200w" sizes="(max-width: 760px) 92vw, 380px" width="640" height="360" alt="" loading="lazy" decoding="async" />
    ${c.obligation ? '<span class="tcard__req">Thème exigé sur 3 ans</span>' : ''}
    </div>
    <div class="tcard__body">
      <p class="tcard__meta"><span class="tcard__code">${c.code}</span><span>${esc(THEME_LABELS[c.themes[0]])}</span></p>
      <h3>${esc(c.title)}</h3>
      <p class="tcard__text">${esc(c.summary)}</p>
      <ul class="tcard__facts">
        <li><span>Durée</span><b>${esc(c.durationShort)}</b></li>
        <li><span>Public</span><b>${cards}</b></li>
        <li><span>Accès</span><b>${c.online ? 'Immédiat' : 'Dès la mise en ligne'}</b></li>
      </ul>
      <span class="tcard__link">Voir la fiche <i aria-hidden="true">→</i></span>
    </div>
  </a>`;
}

export function renderTopCourses(root: HTMLElement, count = 3) {
  root.innerHTML = COURSES.slice(0, count).map(card).join('');
}
