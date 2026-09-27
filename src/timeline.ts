// Scroll timeline shared by the DOM (chapters rail, captions) and the WebGL
// scene. Kept free of any three.js import so it ships in the main bundle.

export interface Chapter {
  id: string;
  label: string;
  at: number; // timeline position (0..1) the rail jumps to
  pillar: number; // index into PILLARS
}

export const PILLARS = [
  { kicker: 'Ouverture', title: 'Votre espace, prêt à reprendre.', body: 'L’apprenant retrouve son parcours, sa carte professionnelle et l’état exact de son obligation dès la connexion.' },
  { kicker: '01 · Comprendre', title: 'Des vidéos courtes, incarnées.', body: 'Maître Laurent pose le cadre, séquence par séquence. Le temps passé est comptabilisé et la reprise se fait à la seconde près.' },
  { kicker: '02 · Décider', title: 'Des cas concrets, pas du par-cœur.', body: 'Avec Sarah, l’apprenant tranche des situations d’agence réelles et reçoit une correction argumentée : Vérifier, Délimiter, Tracer.' },
  { kicker: '03 · Suivre', title: 'L’obligation ALUR, lisible d’un coup d’œil.', body: '14 h par an ou 42 h sur trois années consécutives, dont 2 h de non-discrimination et 2 h de déontologie : chaque heure est tracée.' },
  { kicker: '04 · Continuer', title: 'Le même parcours, dans la poche.', body: 'Sur smartphone, la progression, la vidéo et le quiz reprennent exactement là où l’ordinateur s’est arrêté.' },
  { kicker: '05 · Documenter', title: 'Une attestation justifiable.', body: 'À l’issue d’un parcours accompli, une attestation mentionnant objectifs, contenu, durée et date de réalisation est délivrée.' },
] as const;

export const CHAPTERS: Chapter[] = [
  { id: 'open', label: 'Ouverture', at: 0.06, pillar: 0 },
  { id: 'home', label: 'Accueil LMS', at: 0.235, pillar: 0 },
  { id: 'video', label: 'Leçon vidéo', at: 0.325, pillar: 1 },
  { id: 'quiz', label: 'Cas pratique', at: 0.425, pillar: 2 },
  { id: 'progress', label: 'Progression', at: 0.535, pillar: 3 },
  { id: 'phone', label: 'Smartphone', at: 0.665, pillar: 4 },
  { id: 'm-progress', label: 'Suivi mobile', at: 0.735, pillar: 4 },
  { id: 'm-video', label: 'Reprise vidéo', at: 0.8, pillar: 4 },
  { id: 'm-quiz', label: 'Quiz validé', at: 0.865, pillar: 4 },
  { id: 'attestation', label: 'Attestation', at: 0.96, pillar: 5 },
];

/** Chapter active at timeline position t. */
export function chapterAt(t: number): number {
  let idx = 0;
  const bounds = CHAPTERS.map((c, i) => (i === 0 ? 0 : (CHAPTERS[i - 1].at + c.at) / 2));
  for (let i = 0; i < bounds.length; i++) if (t >= bounds[i]) idx = i;
  return idx;
}
