// FAQ: the single source for the visible accordions, the category nav and the
// FAQPage JSON-LD. Rendered into faq.html at build time (see vite.config.ts),
// so the page ships complete HTML and the structured data can't drift.
// Answers are plain text; `link` is shown under the answer only.

export type FaqItem = { id: string; q: string; a: string; link?: { href: string; label: string } };
export type FaqCategory = { id: string; title: string; icon: string; items: FaqItem[] };

// 24×24 stroke icons (currentColor).
const ICONS = {
  scale: '<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0L5 7Zm14 0-3 7a3 3 0 0 0 6 0l-3-7Z"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
  screen: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  badge: '<circle cx="12" cy="9" r="6"/><path d="m9 14-2 7 5-3 5 3-2-7"/>',
  file: '<path d="M14 3H6v18h12V7l-4-4Z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  team: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0M15 20a4.5 4.5 0 0 1 6-4.2"/>',
};

export const FAQ: FaqCategory[] = [
  {
    id: 'obligation',
    title: 'Obligation ALUR',
    icon: ICONS.scale,
    items: [
      {
        id: 'q-14h-42h',
        q: 'Dois-je faire 14 h chaque année ou 42 h sur trois ans ?',
        a: 'Le dispositif prévoit 14 heures de formation par an ou 42 heures au cours de trois années consécutives d’exercice. Le choix du parcours dépend notamment de votre situation et de votre échéance de renouvellement.',
      },
      {
        id: 'q-themes',
        q: 'Y a-t-il des thèmes obligatoires ?',
        a: 'Oui. Sur une période de trois années consécutives, la formation continue doit notamment comprendre au moins 2 heures consacrées à la non-discrimination dans l’accès au logement et 2 heures consacrées aux autres règles déontologiques.',
      },
      {
        id: 'q-concernes',
        q: 'Qui est concerné par l’obligation de formation ?',
        a: 'Sont notamment concernés les titulaires de la carte professionnelle, les personnes qui dirigent un établissement, une succursale, une agence ou un bureau, ainsi que les collaborateurs habilités exerçant sous la responsabilité du titulaire.',
      },
      {
        id: 'q-justifier',
        q: 'Quand dois-je justifier mes heures de formation ?',
        a: 'Les justificatifs de formation sont notamment utilisés lors du renouvellement de la carte professionnelle ou selon la situation du collaborateur concerné. Il est donc important de conserver les attestations correspondant aux formations accomplies.',
      },
    ],
  },
  {
    id: 'formations-packs',
    title: 'Formations & packs',
    icon: ICONS.book,
    items: [
      {
        id: 'q-individuelle-pack',
        q: 'Quelle est la différence entre une formation individuelle et un pack ?',
        a: 'Une formation individuelle permet de travailler un thème précis ou de compléter vos heures. Un pack organise plusieurs formations afin de couvrir un objectif de 14 h, 28 h ou 42 h. Les packs sont en ouverture prochaine ; les formations individuelles sont accessibles dès leur mise en ligne.',
        link: { href: './formations.html#parcours', label: 'Trouver mon parcours' },
      },
      {
        id: 'q-duree',
        q: 'Combien de temps dure une formation ?',
        a: 'La durée dépend du contenu de chaque formation. Elle est indiquée clairement sur sa fiche et son programme avant l’inscription. Alurforma propose des formations ciblées et, prochainement, des packs permettant d’organiser vos heures sur une, deux ou trois années.',
      },
      {
        id: 'q-disponibilite',
        q: 'Les formations pour les cartes T, G et S sont-elles toutes disponibles ?',
        a: 'La disponibilité dépend du parcours concerné et est indiquée sur chaque fiche. Les parcours encore en préparation sont signalés « Bientôt disponible ». Lorsqu’une formation est disponible en ligne, son accès est ouvert selon les modalités prévues lors de l’inscription.',
      },
    ],
  },
  {
    id: 'acces',
    title: 'Accès & déroulement',
    icon: ICONS.screen,
    items: [
      {
        id: 'q-distance',
        q: 'La formation se suit-elle à distance, et sur quels appareils ?',
        a: 'Oui. Les formations en ligne se suivent à distance depuis l’espace apprenant, sur ordinateur, tablette ou smartphone.',
      },
      {
        id: 'q-reprendre',
        q: 'Puis-je interrompre ma formation et la reprendre plus tard ?',
        a: 'Oui. Votre progression est enregistrée : vous reprenez la formation là où vous vous êtes arrêté. En cas de difficulté pendant votre parcours, vous pouvez contacter Alurforma.',
      },
    ],
  },
  {
    id: 'evaluations',
    title: 'Évaluations & attestation',
    icon: ICONS.badge,
    items: [
      {
        id: 'q-quiz',
        q: 'Y a-t-il des quiz et des évaluations ?',
        a: 'Selon la formation, le parcours peut comprendre des quiz, des cas pratiques et une évaluation finale afin de vérifier les acquis.',
      },
      {
        id: 'q-seuil',
        q: 'Le seuil de réussite des quiz est-il imposé par la loi ?',
        a: 'Non. Le seuil de réussite est un choix pédagogique d’Alurforma ; il n’est pas fixé par la réglementation.',
      },
      {
        id: 'q-attestation',
        q: 'Quand est délivrée mon attestation ?',
        a: 'L’attestation est délivrée dès la validation du parcours, selon les conditions prévues pour la formation. Elle mentionne notamment les objectifs, le contenu, la durée et la date de réalisation.',
      },
      {
        id: 'q-cci',
        q: 'La formation est-elle « certifiée » ou « reconnue » par la CCI ?',
        a: 'La CCI ne « certifie » pas une formation ALUR. Les justificatifs de formation sont examinés dans le cadre du contrôle de l’obligation de formation, notamment lors du renouvellement de la carte professionnelle.',
      },
    ],
  },
  {
    id: 'financement',
    title: 'Financement',
    icon: ICONS.file,
    items: [
      {
        id: 'q-financee',
        q: 'Ma formation peut-elle être financée ?',
        a: 'Selon votre statut, votre entreprise et votre situation, une prise en charge peut être possible auprès d’un OPCO ou d’un autre organisme financeur. Chaque financeur applique ses propres critères, budgets, plafonds et calendriers.',
      },
      {
        id: 'q-demarches',
        q: 'Alurforma peut-il s’occuper des démarches administratives de financement ?',
        a: 'Oui. Selon le dispositif concerné, Alurforma peut vous accompagner dans la constitution du dossier et prendre en charge tout ou partie des démarches administratives liées à la formation : préparation des documents, constitution du dossier et suivi administratif. Vous vous concentrez sur votre activité et votre formation. La décision de financement reste celle de l’organisme financeur.',
        link: { href: './financement.html', label: 'Comprendre la démarche' },
      },
      {
        id: 'q-organisme',
        q: 'Alurforma est-il un organisme de formation certifié ?',
        a: 'Oui. Alurforma, marque déposée de SUMMITWISE (SIRET 944 811 819 00019), est un organisme de formation certifié Qualiopi au titre de la catégorie d’action « actions de formation ». Sa déclaration d’activité est enregistrée sous le numéro 11922912592 ; cet enregistrement ne vaut pas agrément de l’État.',
      },
    ],
  },
  {
    id: 'equipes',
    title: 'Agences & équipes',
    icon: ICONS.team,
    items: [
      {
        id: 'q-collaborateurs',
        q: 'Puis-je inscrire plusieurs collaborateurs ?',
        a: 'Oui. L’offre Agences & Réseaux permet d’organiser les formations de plusieurs collaborateurs dans un environnement centralisé.',
      },
      {
        id: 'q-suivi-equipe',
        q: 'Puis-je suivre la progression de mon équipe ?',
        a: 'Oui. L’espace entreprise permet au dirigeant ou au responsable de suivre les parcours, les heures et la progression des collaborateurs, d’affecter les formations adaptées et de centraliser les attestations.',
        link: { href: './entreprises.html', label: 'Découvrir l’offre Entreprises' },
      },
    ],
  },
];

// French typography: no line break before ? ! : ; » or after «.
const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/ ([?!:;»])/g, '&nbsp;$1')
    .replace(/« /g, '«&nbsp;');
const icon = (paths: string) =>
  `<svg class="faq__ico" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const num = (i: number) => String(i + 1).padStart(2, '0');

export function renderFaqNav() {
  return FAQ.map((c, i) => `<a href="#${c.id}"><span>${num(i)}</span>${esc(c.title)}</a>`).join('\n');
}

export function renderFaqList() {
  return FAQ.map(
    (c, i) => `<section class="faq__cat" aria-labelledby="${c.id}">
  <h2 id="${c.id}" class="faq__group">${icon(c.icon)}<span class="faq__num">${num(i)}</span>${esc(c.title)}</h2>
  ${c.items
    .map(
      (it) =>
        `<details id="${it.id}"><summary>${esc(it.q)}</summary><div class="faq__a"><p>${esc(it.a)}</p>${
          it.link ? `<a class="link" href="${it.link.href}">${esc(it.link.label)} →</a>` : ''
        }</div></details>`,
    )
    .join('\n  ')}
</section>`,
  ).join('\n');
}

export function renderFaqJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.flatMap((c) => c.items).map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
  return `<script type="application/ld+json">${JSON.stringify(data, null, 2).replace(/</g, '\\u003c')}</script>`;
}
