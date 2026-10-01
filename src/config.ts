// Single source of truth for everything that must be confirmed by the owner
// before a public launch. Nothing here is invented as a fact: values marked
// TODO in README.md must be validated.

export const CONFIG = {
  /** Public LMS login URL (« Espace apprenant »). */
  lmsUrl: 'https://alurforma.fr/',
  /** Contact address (confirmed by the owner, Google Workspace on alurforma.fr). */
  email: 'contact@alurforma.fr',
  /** Shown as an official channel on the Contact page only when true. */
  emailConfirmed: true,
  /**
   * HTTPS endpoint receiving contact requests as JSON (CRM or serverless
   * function — contract in docs/contact-api.md). While null, the form falls
   * back to a pre-filled e-mail and says so; it never claims a request was
   * received. Remember to allow the endpoint in the CSP (connect-src).
   */
  formEndpoint: null as string | null,
  /** Version of the privacy notice shown under the form, sent with each request. */
  privacyNoticeVersion: '2026-10-01',
};

export type Card = 'T' | 'G' | 'S';

/** Commercial availability per professional card — never overstate it. */
export const AVAILABILITY: Record<Card, { label: string; open: boolean }> = {
  T: { label: 'Disponible', open: true },
  G: { label: 'Bientôt disponible', open: false },
  S: { label: 'Bientôt disponible', open: false },
};

export const CARD_NAMES: Record<Card, string> = {
  T: 'Transaction',
  G: 'Gestion immobilière',
  S: 'Syndic de copropriété',
};
