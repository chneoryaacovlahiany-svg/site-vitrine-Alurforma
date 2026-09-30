// Financement page: pick a situation, see the circuit — who may fund, what
// Alurforma prepares, what it can handle, and who decides (always the funder).

type Sit = 'salarie' | 'independant' | 'entreprise';

const CIRCUIT: Record<Sit, { label: string; who: string; handle: string[] }> = {
  salarie: {
    label: 'Salarié',
    who: 'Votre employeur, qui peut financer la formation et, selon sa situation, solliciter son OPCO.',
    handle: ['Constitution du dossier', 'Transmission des éléments lorsque cela est possible', 'Suivi administratif', 'Réponse aux demandes relatives à la formation'],
  },
  independant: {
    label: 'Indépendant / dirigeant',
    who: 'Le fonds de formation ou le dispositif dont vous relevez, selon votre activité et votre statut.',
    handle: ['Identification de la démarche', 'Constitution du dossier avec vous', 'Vérification des pièces avant dépôt', 'Réponse aux demandes relatives à la formation'],
  },
  entreprise: {
    label: 'Entreprise / agence / réseau',
    who: 'L’entreprise et, selon sa situation, son OPCO ou un autre organisme financeur applicable.',
    handle: ['Centralisation des besoins de l’équipe', 'Constitution du dossier', 'Transmission des éléments lorsque cela est possible', 'Suivi administratif et réponses aux demandes'],
  },
};
const PREPARE = ['Programme', 'Devis', 'Convention ou contrat', 'Pièces liées à la formation'];

const list = (items: string[]) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;

function render(sit: Sit) {
  const c = CIRCUIT[sit];
  return `<p class="fcircuit__title">Votre circuit · ${c.label}</p>
    <div class="fcircuit__grid">
      <div><em>Interlocuteur potentiel</em><p>${c.who}</p></div>
      <div><em>Alurforma prépare</em>${list(PREPARE)}</div>
      <div><em>Alurforma peut accompagner</em>${list(c.handle)}</div>
      <div class="fcircuit__decide"><em>Le financeur décide</em><p>L’accord, le montant et les délais de prise en charge dépendent exclusivement des règles du financeur.</p></div>
    </div>
    <a class="btn btn--primary btn--lg" href="./contact.html?objet=financement&amp;statut=${sit}">Étudier ma situation</a>`;
}

export function initFunding(root: HTMLElement, out: HTMLElement) {
  const cards = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-sit]'));
  const select = (b: HTMLButtonElement, animate = true) => {
    cards.forEach((c) => c.setAttribute('aria-checked', String(c === b)));
    out.innerHTML = render(b.dataset.sit as Sit);
    if (animate) out.animate?.([{ opacity: 0.4, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' });
  };
  cards.forEach((c, i) => {
    c.addEventListener('click', () => select(c));
    // Radio-group keyboard pattern: arrows move the choice.
    c.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const n = cards[(i + d + cards.length) % cards.length];
      n.focus();
      select(n);
    });
  });
  select(cards.find((c) => c.getAttribute('aria-checked') === 'true') ?? cards[0], false);
}
