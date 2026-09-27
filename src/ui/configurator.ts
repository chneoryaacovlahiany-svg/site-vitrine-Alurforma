import { AVAILABILITY, CARD_NAMES, type Card } from '../config';
import { T_COURSES } from './catalog';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

function list(items: [string, string][], note?: (i: number) => string) {
  return `<ul class="result__list">${items
    .map(([c, t], i) => `<li><span class="code">${c}</span><span>${esc(t)}${note ? ` <small>· ${note(i)}</small>` : ''}</span></li>`)
    .join('')}</ul>`;
}

function render(card: Card, hours: 7 | 14 | 42): string {
  const av = AVAILABILITY[card];
  const status = `<span class="status ${av.open ? 'status--ok' : 'status--wip'}">${av.label}</span>`;
  const head = (title: string) =>
    `<div class="result__head"><span class="result__hours">${hours} h</span>${status}</div><h3 class="result__title">${title}</h3>`;

  if (!av.open) {
    return `${head(`Carte ${card} · ${CARD_NAMES[card]}`)}
      <p class="result__text">Ce catalogue n’est pas encore accessible dans l’espace apprenant : aucune inscription n’est ouverte. Nous pouvons vous prévenir dès l’ouverture.</p>
      <div class="result__foot" style="margin-top:24px"><a class="btn btn--primary" href="#contact" data-subject="Être prévenu — carte ${card}">Être prévenu de l’ouverture</a></div>`;
  }

  let body = '';
  if (hours === 7) {
    body = `<p class="result__text">Une formation de 7 h, au choix parmi les six thématiques de la carte T.</p>${list(T_COURSES.slice(0, 3))}
      <p class="result__text" style="margin-top:-10px;margin-bottom:24px">… et trois autres au catalogue.</p>`;
  } else if (hours === 14) {
    body = `<p class="result__text">Deux formations de 7 h couvrent vos 14 h de l’année. Si elle n’a pas encore été suivie sur votre cycle, T01 traite la non-discrimination et la déontologie.</p>${list(
      [T_COURSES[0], ['+1', 'Une formation au choix parmi T02 à T06']],
    )}`;
  } else {
    body = `<p class="result__text">Six formations de 7 h réparties sur trois années consécutives. Exemple de répartition :</p>${list(
      T_COURSES,
      (i) => `année ${Math.floor(i / 2) + 1}`,
    )}`;
  }
  return `${head(hours === 7 ? 'Formation individuelle' : hours === 14 ? 'Pack annuel' : 'Cycle triennal')}${body}
    <div class="result__foot">
      <a class="btn btn--primary" href="#contact" data-subject="Trouver mon parcours">Demander mon inscription</a>
      <a class="btn btn--glass" href="#formations">Voir les fiches</a>
    </div>
    <p class="result__text" style="font-size:14px;margin-top:16px">Aucun paiement en ligne sur cette page : le tarif TTC et les modalités d’accès vous sont confirmés par écrit avant toute inscription.</p>`;
}

export function initConfigurator(form: HTMLFormElement | HTMLElement, out: HTMLElement) {
  const update = () => {
    const fd = new FormData(form as HTMLFormElement);
    const card = (fd.get('card') as Card) ?? 'T';
    const hours = Number(fd.get('hours') ?? 14) as 7 | 14 | 42;
    out.innerHTML = render(card, hours);
    out.animate?.([{ opacity: 0.4, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' });
  };
  form.addEventListener('change', update);
  update();
}
