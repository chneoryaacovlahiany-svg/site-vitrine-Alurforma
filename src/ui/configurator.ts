import { AVAILABILITY, CARD_NAMES, type Card } from '../config';

type Need = 1 | 14 | 28 | 42;

const NEEDS: Record<Need, { title: string; text: string; years?: number }> = {
  1: { title: 'Formation individuelle', text: 'Une formation de 1 h à 12 h, sur la thématique de votre choix : idéal pour compléter vos heures ou approfondir un sujet.' },
  14: { title: 'Pack annuel · 14 h', text: 'Des formations au choix jusqu’à 14 h pour couvrir une année d’obligation.', years: 1 },
  28: { title: 'Pack deux ans · 28 h', text: 'Des formations au choix jusqu’à 28 h, réparties sur deux années.', years: 2 },
  42: { title: 'Cycle complet · 42 h', text: 'L’intégralité du cycle de trois années consécutives, avec le suivi des 2 h de non-discrimination et des 2 h de déontologie.', years: 3 },
};

function render(card: Card, need: Need): string {
  const av = AVAILABILITY[card];
  const n = NEEDS[need];
  const status = `<span class="status ${av.open ? 'status--ok' : 'status--wip'}">${av.label}</span>`;
  const big = need === 1 ? '1–12 h' : `${need} h`;
  const head = `<div class="result__head"><span class="result__hours">${big}</span>${status}</div><h3 class="result__title">${n.title} — carte ${card}</h3>`;

  if (!av.open) {
    return `${head}
      <p class="result__text">Le catalogue ${CARD_NAMES[card].toLowerCase()} n’est pas encore accessible dans l’espace apprenant : aucune inscription n’est ouverte. Nous pouvons vous prévenir dès l’ouverture.</p>
      <div class="result__foot" style="margin-top:24px"><a class="btn btn--primary" href="./contact.html?objet=carte-${card.toLowerCase()}">Être prévenu de l’ouverture</a></div>`;
  }

  const years = n.years
    ? `<ul class="result__list">${Array.from({ length: n.years }, (_, i) => `<li><span class="code">A${i + 1}</span><span>Année ${i + 1} · 14 h de formations au choix</span></li>`).join('')}</ul>`
    : '<div style="height:24px"></div>';
  return `${head}<p class="result__text">${n.text}</p>${years}
    <div class="result__foot">
      <a class="btn btn--primary" href="./contact.html?objet=formation">Demander mon inscription</a>
      <a class="btn btn--glass" href="./formations.html#${need === 1 ? 'individuelles' : 'packs'}">Voir le détail</a>
    </div>
    <p class="result__text" style="font-size:14px;margin-top:16px">Aucun paiement sur cette page : le tarif TTC et les modalités d’accès vous sont confirmés par écrit avant toute inscription.</p>`;
}

export function initConfigurator(form: HTMLElement, out: HTMLElement) {
  const update = () => {
    const fd = new FormData(form as HTMLFormElement);
    const card = (fd.get('card') as Card) ?? 'T';
    const need = Number(fd.get('hours') ?? 14) as Need;
    out.innerHTML = render(card, need);
    out.animate?.([{ opacity: 0.4, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' });
  };
  form.addEventListener('change', update);
  document.addEventListener('preset-hours', (e) => {
    const v = (e as CustomEvent<string>).detail;
    const input = form.querySelector<HTMLInputElement>(`input[name="hours"][value="${v}"]`);
    if (input) {
      input.checked = true;
      update();
    }
  });
  update();
}
