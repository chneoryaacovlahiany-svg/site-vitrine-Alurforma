import { AVAILABILITY, CARD_NAMES, type Card } from '../config';

// "Trouver mon parcours": two questions, then an honest orientation — what is
// open today (courses à la carte), and what opens soon (the packs).

type Need = 1 | 14 | 28 | 42;

const NEEDS: Record<Need, { big: string; title: string; text: string; years?: number }> = {
  1: {
    big: 'À la carte',
    title: 'Une formation ciblée',
    text: 'Choisissez un thème précis pour compléter vos heures ou renforcer votre pratique. Chaque formation donne lieu à une attestation, disponible dès validation du parcours.',
  },
  14: { big: '14 h', title: 'Pack 1 année', text: '14 h de formations pour votre année ALUR, avec le suivi de vos heures dans l’espace apprenant.', years: 1 },
  28: { big: '28 h', title: 'Pack 2 années', text: 'Deux années planifiées à 14 h par année.', years: 2 },
  42: {
    big: '42 h',
    title: 'Cycle complet',
    text: 'Votre parcours ALUR sur trois années consécutives, avec le suivi de la déontologie et de la non-discrimination.',
    years: 3,
  },
};

function render(card: Card, need: Need): string {
  const av = AVAILABILITY[card];
  const n = NEEDS[need];
  const packOpen = false; // Packs: « Ouverture prochaine ».
  const open = av.open && (need === 1 || packOpen);
  const label = !av.open ? av.label : need === 1 ? 'Disponible' : 'Ouverture prochaine';
  const status = `<span class="status ${open ? 'status--ok' : 'status--wip'}">${label}</span>`;
  const head = `<div class="result__head"><span class="result__hours">${n.big}</span>${status}</div><h3 class="result__title">${n.title} — carte ${card}</h3>`;
  const note = '<p class="result__text" style="font-size:14px;margin-top:16px">Aucun paiement sur cette page : le tarif TTC et les modalités d’accès vous sont confirmés par écrit avant toute inscription.</p>';

  if (!av.open) {
    return `${head}
      <p class="result__text">Les formations ${CARD_NAMES[card].toLowerCase()} ne sont pas encore ouvertes. Nous pouvons vous prévenir dès l’ouverture. La formation F03 (non-discrimination) concerne déjà toutes les cartes.</p>
      <div class="result__foot" style="margin-top:24px"><a class="btn btn--primary" href="./contact.html?objet=carte-${card.toLowerCase()}">Être prévenu de l’ouverture</a><a class="btn btn--glass" href="./formations.html#f03">Voir la formation F03</a></div>`;
  }

  if (need === 1) {
    return `${head}<p class="result__text">${n.text}</p><div style="height:20px"></div>
      <div class="result__foot">
        <a class="btn btn--primary" href="#individuelles">Voir les formations</a>
        <a class="btn btn--glass" href="./contact.html?objet=formation">Demander mon inscription</a>
      </div>${note}`;
  }

  const years = `<ul class="result__list">${Array.from({ length: n.years! }, (_, i) => `<li><span class="code">A${i + 1}</span><span>Année ${i + 1} · 14 h</span></li>`).join('')}</ul>`;
  return `${head}<p class="result__text">${n.text}</p>${years}
    <p class="result__text" style="margin-top:14px">Les packs ouvrent prochainement. En attendant, suivez les formations déjà disponibles à la carte, ou laissez-nous vos coordonnées.</p>
    <div class="result__foot">
      <a class="btn btn--primary" href="./contact.html?objet=formation&amp;pack=pack-${need}">Être informé de l’ouverture</a>
      <a class="btn btn--glass" href="#individuelles">Voir les formations disponibles</a>
    </div>${note}`;
}

export function initConfigurator(form: HTMLElement, out: HTMLElement) {
  const update = () => {
    const fd = new FormData(form as HTMLFormElement);
    const card = (fd.get('card') as Card) ?? 'T';
    const need = Number(fd.get('hours') ?? 1) as Need;
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
