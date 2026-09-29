// Catalogue des formations individuelles.
// Source : programmes pédagogiques fournis par le propriétaire (F01 V2 du
// 17/09/2026, F02 V1 du 16/09/2026, F03 actualisé le 27/09/2026). Les durées
// affichées sont celles mesurées dans ces documents ; les durées totales sont
// des estimations explicitement présentées comme telles.

import type { Card } from '../config';

export type Theme = 'cadre' | 'deontologie' | 'non-discrimination';

export interface Lesson {
  title: string;
  video: string; // durée vidéo mesurée
}

export interface Course {
  id: string; // ancre URL, ex. #f01 ; sert aussi au visuel public/media/formations/<id>-640|1200.webp
  code: string;
  title: string;
  summary: string;
  cards: Card[];
  themes: Theme[];
  /** Obligation couverte au titre du décret (sur trois années). */
  obligation?: 'déontologie' | 'non-discrimination';
  level: string;
  status: { label: string; tone: 'ok' | 'wip' };
  /** Formation accessible en ligne aujourd'hui (conditionne la mention « Accès immédiat »). */
  online: boolean;
  videoTotal: string;
  /** Durée pédagogique indicative, présentée comme une estimation. */
  duration: string;
  /** Version courte de la durée, pour les encarts. */
  durationShort: string;
  /** Heures indicatives utilisées par le composeur de pack. */
  hours: number;
  /** Prix public TTC affiché (ex. « 49 € TTC ») ; « Sur devis » tant qu'il n'est pas renseigné. */
  price?: string;
  public: string;
  prerequisites: string;
  objectives: string[];
  lessons: Lesson[];
  flow: string;
  evaluation: { title: string; text: string }[];
  methods: string;
  notes: string[];
}

const COMMON_METHODS =
  'Un formateur référent, un professionnel de terrain et une narration, cas fictifs, questions intégrées aux vidéos, quiz à choix unique, dossier à analyser et comparaison avec corrigé. Sous-titres sur les leçons ; textes et consignes disponibles dans la bibliothèque ; interactions utilisables au clavier.';

const COMMON_EVALUATION = [
  { title: 'Quiz de chapitre', text: '12 questions, avec le nombre de bonnes réponses et une explication pour chaque option.' },
  { title: 'Cas pratique', text: 'Un dossier à analyser sur pièces, suivi d’un quiz de 6 questions et d’une comparaison avec le corrigé.' },
  { title: 'Évaluation finale', text: '18 questions, distinctes du quiz de chapitre.' },
];

export const COURSES: Course[] = [
  {
    id: 'f01',
    code: 'F01',
    durationShort: '≈ 1 h 45',
    online: true,
    title: 'Cadre de la transaction et rôle de chacun',
    summary: 'Identifier l’activité et le cadre professionnel, distinguer statuts, habilitations et pouvoirs, vérifier la mission avant d’agir.',
    cards: ['T'],
    themes: ['cadre'],
    level: 'Débutant · consolidation',
    status: { label: 'Version enrichie en préparation', tone: 'wip' },
    videoTotal: '47 min 52 s',
    duration: '≈ 1 h 40 à 1 h 50 (version actuelle)',
    hours: 2,
    public: 'Professionnels et collaborateurs intervenant en transaction immobilière, débutants ou en consolidation de pratique.',
    prerequisites: 'Aucun diplôme requis. Compréhension du français écrit et oral ; savoir utiliser un navigateur, lire une vidéo et saisir une réponse.',
    objectives: [
      'Identifier l’activité et le cadre professionnel.',
      'Distinguer les statuts, habilitations et pouvoirs.',
      'Vérifier la mission et les pièces avant d’agir.',
    ],
    lessons: [
      { title: 'Identifier l’activité et le cadre professionnel', video: '14 min 45 s' },
      { title: 'Distinguer les statuts, habilitations et pouvoirs', video: '17 min 30 s' },
      { title: 'Vérifier la mission et les pièces avant d’agir', video: '15 min 37 s' },
    ],
    flow: 'Un chapitre, trois leçons : les vidéos et leurs supports, puis le quiz de chapitre, le cas final, le quiz du cas et l’évaluation finale. Le cas se travaille sur les pièces du dossier.',
    evaluation: COMMON_EVALUATION,
    methods: COMMON_METHODS,
    notes: [
      'Une version enrichie est en préparation, avec un objectif de 1 h 30 de vidéos (durée estimée alors : 2 h 20 à 2 h 30).',
      'Cette formation ne confère ni carte ni habilitation professionnelle.',
    ],
  },
  {
    id: 'f02',
    code: 'F02',
    durationShort: '≈ 2 h',
    online: false,
    title: 'Déontologie et conduite professionnelle',
    summary: 'Relier les principes déontologiques aux actes quotidiens, gérer un conflit d’intérêts et répondre à une pression commerciale.',
    cards: ['T'],
    themes: ['deontologie'],
    obligation: 'déontologie',
    level: 'Débutant · consolidation',
    status: { label: 'Vidéos réalisées — mise en ligne à venir', tone: 'wip' },
    videoTotal: '48 min 23 s',
    duration: '≈ 1 h 55 à 2 h 25',
    hours: 2,
    public: 'Professionnels et collaborateurs intervenant en transaction immobilière, débutants ou en consolidation de pratique.',
    prerequisites: 'Aucun diplôme requis. Compréhension du français écrit et oral ; savoir utiliser un navigateur, lire une vidéo et saisir une réponse.',
    objectives: [
      'Relier les principes déontologiques aux actes quotidiens.',
      'Identifier un conflit d’intérêts et expliquer sa position.',
      'Répondre à une pression commerciale avec professionnalisme.',
    ],
    lessons: [
      { title: 'Relier les principes déontologiques aux actes quotidiens', video: '15 min 51 s' },
      { title: 'Identifier un conflit d’intérêts et expliquer sa position', video: '16 min 01 s' },
      { title: 'Répondre à une pression commerciale avec professionnalisme', video: '16 min 31 s' },
    ],
    flow: 'Un chapitre, trois leçons : les vidéos et leurs supports, puis le quiz de chapitre, le cas final, le quiz du cas et l’évaluation finale. Le cas se travaille sur les pièces du dossier.',
    evaluation: COMMON_EVALUATION,
    methods: COMMON_METHODS,
    notes: [
      'Durée totale estimée selon le temps consacré aux activités ; l’objectif de 2 h est un objectif d’organisation, pas une durée individuelle attestée.',
      'Cette formation ne confère ni carte ni habilitation professionnelle.',
    ],
  },
  {
    id: 'f03',
    code: 'F03',
    durationShort: '≈ 2 h',
    online: false,
    title: 'Prévenir et traiter les discriminations',
    summary: 'Repérer les situations à risque, rédiger des annonces et examiner les candidatures sans discriminer, répondre à une consigne discriminatoire et traiter une alerte.',
    cards: ['T', 'G', 'S'],
    themes: ['non-discrimination'],
    obligation: 'non-discrimination',
    level: 'Tous niveaux',
    status: { label: 'Vidéos réalisées — évaluations en cours', tone: 'wip' },
    videoTotal: '1 h 35 min 48 s',
    duration: 'Cible : 2 h (durée complète à établir)',
    hours: 2,
    public: 'Professionnels immobiliers, dirigeants et collaborateurs.',
    prerequisites: 'Connaître l’activité et le rôle de chacun (voir F01).',
    objectives: [
      'Prévenir les discriminations dans l’accès au logement.',
      'Examiner les candidatures sans discriminer.',
      'Répondre à une consigne discriminatoire.',
      'Traiter une alerte avec un suivi des corrections.',
    ],
    lessons: [
      { title: 'Repérer les critères et les situations à risque', video: '12 min 36 s' },
      { title: 'Rédiger des annonces et conduire des échanges sans discriminer', video: '19 min 54 s' },
      { title: 'Examiner les pièces et comparer les dossiers sans discriminer', video: '20 min 06 s' },
      { title: 'Répondre à une consigne discriminatoire et documenter la suite', video: '21 min 12 s' },
      { title: 'Traiter une alerte et améliorer les pratiques', video: '21 min 59 s' },
    ],
    flow: 'Un chapitre, cinq leçons en vidéo. Le quiz de chapitre, le cas final, son quiz et l’évaluation sont en cours de rédaction.',
    evaluation: [
      { title: 'Quiz de leçon', text: 'Un quiz facultatif de 6 questions par leçon (rédigés).' },
      { title: 'Évaluations principales', text: 'Quiz de chapitre, cas final et évaluation : en cours de rédaction.' },
    ],
    methods: COMMON_METHODS,
    notes: ['La durée pédagogique complète sera établie avec les évaluations et les essais apprenants.'],
  },
];

export const THEME_LABELS: Record<Theme, string> = {
  cadre: 'Cadre juridique',
  deontologie: 'Déontologie',
  'non-discrimination': 'Non-discrimination',
};
