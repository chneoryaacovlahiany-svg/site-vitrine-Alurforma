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
  /** Provisional phone line given by the owner (« en attendant »). */
  phone: { display: '07 57 99 08 89', href: '+33757990889' },
  /** Registered office (extrait RNE / Kbis). */
  address: '1 rue du Débarcadère, 92700 Colombes',
  /**
   * Endpoint receiving contact requests as JSON (public/api/contact.php on
   * the OVH hosting — contract in docs/contact-api.md). Same origin, so the
   * CSP connect-src 'self' already allows it.
   */
  formEndpoint: '/api/contact.php' as string | null,
  /**
   * Hosts where that endpoint exists. Anywhere else (previews, local files)
   * the form falls back to a pre-filled e-mail and says so.
   */
  formEndpointHosts: ['alurforma.fr', 'www.alurforma.fr'],
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
