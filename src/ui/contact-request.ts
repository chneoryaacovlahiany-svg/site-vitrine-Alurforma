import { CONFIG } from '../config';

/**
 * Contact request: the structured payload sent to the CRM / API, and its
 * transport. The contract is documented in docs/contact-api.md; the server
 * stays the source of truth (it re-validates, re-timestamps and rate-limits).
 *
 * Phone rules: giving a number is not consent to telephone prospecting. A
 * callback request is a separate, unticked box, scoped to this request, and
 * travels with the exact text the visitor saw. No marketing consent is
 * collected on this form.
 */

export type RequestType =
  | 'formation'
  | 'formation_course'
  | 'pack'
  | 'custom_pack'
  | 'card_waitlist'
  | 'entreprise'
  | 'financement'
  | 'autre';

export interface ContactRequest {
  request_id: string;
  request_type: RequestType;
  /** Never inferred from the e-mail domain: only from what the visitor chose. */
  contact_type: 'consumer' | 'professional' | 'unknown';
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  professional_card: string[];
  renewal_date: string | null;
  need: string | null;
  course_codes: string[];
  pack: string | null;
  funding_status: string | null;
  funding_body_known: string | null;
  funding_body: string | null;
  team_size: string | null;
  subject: string | null;
  message: string | null;
  /** Human-readable summary of what the request is about. */
  summary: string;

  source_page: string;
  source_url: string;
  /** Path of the page the visitor came from (same site only), if any. */
  source_referrer: string | null;
  created_at: string;

  callback_requested: boolean;
  callback_requested_at: string | null;
  callback_scope: string | null;
  callback_proof_text: string | null;

  privacy_notice_version: string;
}

export type SendResult = { ok: true; reference: string | null } | { ok: false };

export function newRequestId() {
  return crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** POST to the endpoint. Only an HTTP 2xx counts as received. */
export async function sendRequest(req: ContactRequest): Promise<SendResult> {
  if (!CONFIG.formEndpoint) return { ok: false };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(CONFIG.formEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': req.request_id },
      body: JSON.stringify(req),
      signal: ctrl.signal,
    });
    if (!res.ok) return { ok: false };
    // A reference is shown only if the backend returns one.
    const data = (await res.json().catch(() => null)) as { reference?: unknown } | null;
    return { ok: true, reference: typeof data?.reference === 'string' ? data.reference : null };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}

/** Pre-filled e-mail: the fallback while no endpoint exists, or after a failure. */
export function mailtoHref(req: ContactRequest) {
  const lines = [
    `Demande : ${req.summary}`,
    `Nom : ${req.name}`,
    `E-mail : ${req.email}`,
    req.phone && `Téléphone : ${req.phone}`,
    req.company && `Entreprise : ${req.company}`,
    req.professional_card.length ? `Carte(s) : ${req.professional_card.join(', ')}` : null,
    req.need && `Besoin : ${req.need}`,
    req.renewal_date && `Échéance de renouvellement : ${req.renewal_date}`,
    req.team_size && `Collaborateurs / personnes : ${req.team_size}`,
    req.funding_status && `Situation : ${req.funding_status}`,
    req.funding_body_known && `Organisme financeur connu : ${req.funding_body_known}${req.funding_body ? ` (${req.funding_body})` : ''}`,
    req.subject && `Objet : ${req.subject}`,
    req.message && `\n${req.message}`,
    '',
    req.callback_requested ? `☑ ${req.callback_proof_text}` : 'Pas de demande de rappel.',
    `Référence technique : ${req.request_id}`,
  ];
  const body = lines.filter((l): l is string => typeof l === 'string').join('\n');
  return `mailto:${CONFIG.email}?subject=${encodeURIComponent(`[Alurforma] ${req.summary}`)}&body=${encodeURIComponent(body)}`;
}
