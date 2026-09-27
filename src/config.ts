// Single source of truth for everything that must be confirmed by the owner
// before a public launch. Nothing here is invented as a fact: values marked
// TODO in README.md must be validated.

export const CONFIG = {
  /** Public LMS login URL (« Espace apprenant »). */
  lmsUrl: 'https://alurforma.fr/',
  /** Contact address used by the request form. TO CONFIRM. */
  email: 'contact@alurforma.fr',
  /**
   * Optional HTTPS endpoint receiving the form as JSON (e.g. your CRM or a
   * serverless function). When null, the form opens a pre-filled e-mail.
   */
  formEndpoint: null as string | null,
};

export type Card = 'T' | 'G' | 'S';

/** Commercial availability per professional card — never overstate it. */
export const AVAILABILITY: Record<Card, { label: string; open: boolean }> = {
  T: { label: 'Programme publié', open: true },
  G: { label: 'Programme conçu — production en cours', open: false },
  S: { label: 'Programme conçu — production en cours', open: false },
};

export const CARD_NAMES: Record<Card, string> = {
  T: 'Transaction',
  G: 'Gestion immobilière',
  S: 'Syndic de copropriété',
};
