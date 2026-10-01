import { CONFIG, CARD_NAMES, type Card } from '../config';
import { COURSES, type Course } from '../catalog/courses';
import { activeEndpoint, mailtoHref, newRequestId, sendRequest, type ContactRequest, type RequestType } from './contact-request';

/**
 * Contact page: one form that adapts to what the visitor wants to do.
 * Four intents (formation, entreprise, financement, autre) and, for
 * formation, a context read from the URL (course, pack, custom pack, card
 * G/S) shown in a « Votre demande » banner. Fields that don't apply are
 * hidden *and* disabled, so they are neither validated nor sent; shared
 * fields (name, e-mail, phone) keep their value when the intent changes.
 */

type Intent = 'formation' | 'entreprise' | 'financement' | 'autre';
type Ctx =
  | { kind: 'none' }
  | { kind: 'course'; courses: Course[] }
  | { kind: 'pack'; hours: 14 | 28 | 42 }
  | { kind: 'custom'; hours: number; courses: Course[] }
  | { kind: 'gs'; card: 'G' | 'S' };

const PACK_SUB: Record<14 | 28 | 42, string> = { 14: 'Une année', 28: 'Deux années', 42: 'Cycle de trois années' };
const INTENT_LABEL: Record<Intent, string> = {
  formation: 'Trouver une formation',
  entreprise: 'Former mon équipe',
  financement: 'Étudier un financement',
  autre: 'Autre demande',
};
const FIELD_LABEL: Record<string, string> = {
  name: 'nom et prénom',
  email: 'e-mail',
  company: 'entreprise / agence',
  situation: 'votre situation',
  message: 'message',
  phone: 'téléphone',
};
const SITUATIONS: Record<string, string> = { salarie: 'Salarié', independant: 'Indépendant / dirigeant', entreprise: 'Entreprise / agence / réseau' };
const NEEDS: Record<string, string> = {
  'formation-precise': 'Une formation précise',
  'completer-heures': 'Compléter mes heures',
  '14h': '14 h',
  '28h': '28 h',
  '42h': '42 h',
  'ne-sait-pas': 'Je ne sais pas encore',
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const byCode = (code: string) => COURSES.find((c) => c.code === code.toUpperCase());

function readContext(params: URLSearchParams): Ctx {
  const objet = params.get('objet');
  if (objet === 'carte-g' || objet === 'carte-s') return { kind: 'gs', card: objet === 'carte-g' ? 'G' : 'S' };
  const courses = (params.get('f') ?? '')
    .split(',')
    .map((c) => byCode(c.trim()))
    .filter((c): c is Course => !!c);
  const pack = params.get('pack')?.match(/^(pack|sur-mesure)-(\d+)$/);
  if (pack?.[1] === 'pack' && ['14', '28', '42'].includes(pack[2])) return { kind: 'pack', hours: Number(pack[2]) as 14 | 28 | 42 };
  if (pack?.[1] === 'sur-mesure') return { kind: 'custom', hours: Number(pack[2]), courses };
  if (courses.length) return { kind: 'course', courses };
  return { kind: 'none' };
}

export function initForm(form: HTMLFormElement) {
  const $ = <T extends Element = HTMLElement>(sel: string) => form.querySelector<T>(sel)!;
  const page = form.parentElement!;
  const status = $('[data-form-status]');
  const submit = $<HTMLButtonElement>('[data-submit]');
  const banner = page.querySelector<HTMLElement>('[data-context]')!;
  const success = page.querySelector<HTMLElement>('[data-success]')!;
  const cardSoon = $('[data-card-soon]');
  const message = $<HTMLTextAreaElement>('textarea[name="message"]');
  const phone = $<HTMLInputElement>('input[name="phone"]');
  const shown = Array.from(form.querySelectorAll<HTMLElement>('[data-for]'));
  const controls = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea')).filter(
    (c) => c.name !== 'website',
  );

  // Screen-reader announcement when the form adapts to a new intent.
  const live = document.createElement('p');
  live.className = 'sr-only';
  live.setAttribute('aria-live', 'polite');
  form.append(live);

  // Direct e-mail channel, shown only once confirmed.
  const direct = document.querySelector<HTMLAnchorElement>('[data-direct-email]');
  if (direct && CONFIG.emailConfirmed) {
    direct.href = `mailto:${CONFIG.email}`;
    direct.querySelector('[data-email-text]')!.textContent = CONFIG.email;
    direct.hidden = false;
  }
  $('[data-mailto-note]').hidden = !!activeEndpoint();

  // Courses for the financing flow.
  const courseSelect = $<HTMLSelectElement>('[data-course-select]');
  for (const c of COURSES) courseSelect.add(new Option(`${c.code} · ${c.title}${c.online ? '' : ' (bientôt disponible)'}`, c.code));

  // --------------------------------------------------- initial state (URL)
  const params = new URLSearchParams(location.search);
  let ctx = readContext(params);
  const objet = params.get('objet');
  const statut = params.get('statut');
  const intentFromUrl: Intent =
    objet === 'entreprise' || objet === 'financement' || objet === 'autre'
      ? objet
      : objet === 'formation' || ctx.kind !== 'none'
        ? 'formation'
        : statut
          ? 'financement'
          : 'formation';
  const radio = (name: string, value: string) => form.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`);
  radio('intent', intentFromUrl)!.checked = true;
  if (statut && SITUATIONS[statut]) radio('situation', statut)!.checked = true;
  if (ctx.kind === 'gs') radio('card', ctx.card)!.checked = true;
  // A course known from the URL also pre-fills the financing flow.
  const firstCourse = ctx.kind === 'course' || ctx.kind === 'custom' ? ctx.courses[0] : undefined;
  if (firstCourse) courseSelect.value = firstCourse.code;

  const intent = () => (form.elements.namedItem('intent') as RadioNodeList).value as Intent;
  const value = (name: string) => {
    const el = form.elements.namedItem(name) as HTMLInputElement | RadioNodeList | null;
    return el ? String(el.value ?? '').trim() : '';
  };
  const checkedCard = () => (value('card') || null) as Card | '?' | null;

  // ------------------------------------------------------------- render
  function ctaLabel(i: Intent) {
    if (i === 'entreprise') return 'Demander une présentation';
    if (i === 'financement') return 'Étudier ma situation';
    if (i === 'autre') return 'Envoyer ma demande';
    switch (ctx.kind) {
      case 'gs':
        return 'Être prévenu de l’ouverture';
      case 'course':
        return ctx.courses.every((c) => c.online) ? 'Demander des informations' : 'Être prévenu de l’ouverture';
      case 'pack':
        return 'Être informé de l’ouverture';
      case 'custom':
        return 'Demander un devis pour ce parcours';
      default: {
        const card = checkedCard();
        return card === 'G' || card === 'S' ? 'Être prévenu de l’ouverture' : 'Demander mon orientation';
      }
    }
  }

  function renderBanner(i: Intent) {
    if (i !== 'formation' || ctx.kind === 'none') {
      banner.hidden = true;
      banner.innerHTML = '';
      return;
    }
    let title = '';
    let sub = '';
    let badge = '';
    if (ctx.kind === 'course') {
      title = ctx.courses.map((c) => `<span>${c.code}</span> ${esc(c.title)}`).join('<br />');
      badge = ctx.courses.every((c) => c.online) ? 'Disponible' : ctx.courses.length > 1 ? 'Disponibilité selon la formation' : 'Bientôt disponible';
    } else if (ctx.kind === 'pack') {
      title = `Pack Carte Pro · ${ctx.hours} h`;
      sub = PACK_SUB[ctx.hours];
      badge = 'Ouverture prochaine';
    } else if (ctx.kind === 'custom') {
      title = `Parcours sur mesure · objectif ${ctx.hours} h`;
      sub = ctx.courses.map((c) => `${c.code} · ${esc(c.title)}`).join('<br />');
    } else {
      title = `Carte ${ctx.card} — ${CARD_NAMES[ctx.card]}`;
      badge = 'Bientôt disponible';
    }
    banner.innerHTML = `<div><p class="creq__eyebrow">Votre demande</p><p class="creq__title">${title}</p>${sub ? `<p class="creq__sub">${sub}</p>` : ''}${
      badge ? `<span class="creq__badge${badge === 'Disponible' ? ' is-ok' : ''}">${badge}</span>` : ''
    }</div><button type="button" class="creq__edit" data-ctx-edit>Modifier</button>`;
    banner.hidden = false;
  }

  function render(announce = false) {
    const i = intent();
    const tokens = new Set<string>([i]);
    if (i === 'formation') {
      const sub = ctx.kind === 'gs' ? 'gs' : ctx.kind === 'none' ? 'free' : 'ctx';
      tokens.add(`formation-${sub}`);
      if (sub !== 'gs') tokens.add('formation-std');
    }
    if (i === 'financement') {
      if (value('situation') === 'entreprise') tokens.add('fin-ent');
      if (value('funder_known') === 'oui') tokens.add('funder-yes');
    }
    for (const el of shown) el.hidden = !el.dataset.for!.split(' ').some((t) => tokens.has(t));
    for (const c of controls) {
      if (c.name === 'intent') continue;
      c.disabled = !!c.closest('[data-for][hidden]');
    }

    $('[data-email-label]').textContent = i === 'entreprise' ? 'E-mail professionnel' : 'E-mail';
    message.required = i === 'autre';
    $('[data-message-label]').innerHTML = i === 'autre' ? 'Message' : 'Message <small>(facultatif)</small>';
    phone.required = (form.elements.namedItem('callback') as HTMLInputElement).checked;

    const card = checkedCard();
    const soon = tokens.has('formation-free') && (card === 'G' || card === 'S');
    cardSoon.hidden = !soon;
    if (soon) cardSoon.textContent = `Les formations carte ${card} — ${CARD_NAMES[card as Card].toLowerCase()} — sont bientôt disponibles : nous vous préviendrons de leur ouverture.`;

    renderBanner(i);
    submit.textContent = ctaLabel(i);
    if (announce) live.textContent = `Formulaire adapté : ${INTENT_LABEL[i]}.`;
  }

  form.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === 'intent') status.textContent = '';
    render(t.name === 'intent');
    if (step === LAST) renderRecap();
  });
  banner.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('[data-ctx-edit]')) return;
    ctx = { kind: 'none' };
    history.replaceState(null, '', `${location.pathname}?objet=formation`);
    render();
    form.querySelector<HTMLInputElement>('input[name="intent"]:checked')?.focus();
  });
  controls.forEach((c) => c.addEventListener('input', () => c.removeAttribute('aria-invalid')));
  render();

  // ------------------------------------------------------------ payload
  function summary(i: Intent): { type: RequestType; text: string } {
    if (i === 'entreprise') return { type: 'entreprise', text: 'Offre Agences & Réseaux' };
    if (i === 'financement') {
      const c = byCode(value('fund_course'));
      return { type: 'financement', text: `Étude de financement${c ? ` — ${c.code} · ${c.title}` : ''}` };
    }
    if (i === 'autre') return { type: 'autre', text: value('subject') || 'Autre demande' };
    switch (ctx.kind) {
      case 'course':
        return { type: 'formation_course', text: ctx.courses.map((c) => `${c.code} · ${c.title}`).join(' ; ') };
      case 'pack':
        return { type: 'pack', text: `Pack Carte Pro · ${ctx.hours} h` };
      case 'custom':
        return { type: 'custom_pack', text: `Parcours sur mesure · objectif ${ctx.hours} h (${ctx.courses.map((c) => c.code).join(', ')})` };
      case 'gs':
        return { type: 'card_waitlist', text: `Carte ${ctx.card} — ${CARD_NAMES[ctx.card]} · ouverture` };
      default: {
        const card = checkedCard();
        if (card === 'G' || card === 'S') return { type: 'card_waitlist', text: `Carte ${card} — ${CARD_NAMES[card]} · ouverture` };
        return { type: 'formation', text: 'Trouver une formation' };
      }
    }
  }

  let requestId = newRequestId();
  function payload(): ContactRequest {
    const i = intent();
    const fd = new FormData(form);
    const get = (k: string) => {
      const v = String(fd.get(k) ?? '').trim();
      return v ? v : null;
    };
    const optionText = (k: string) => {
      const sel = form.elements.namedItem(k) as HTMLSelectElement | null;
      return sel && !sel.disabled ? (sel.selectedOptions[0]?.text ?? null) : null;
    };
    const s = summary(i);
    const now = new Date().toISOString();
    const callback = fd.get('callback') === 'on';
    const cards =
      i === 'entreprise' ? (fd.getAll('cards') as string[]) : ctx.kind === 'gs' ? [ctx.card] : get('card') && get('card') !== '?' ? [get('card')!] : [];
    const courseCodes =
      i === 'financement' ? (get('fund_course') ? [get('fund_course')!] : []) : i === 'formation' && (ctx.kind === 'course' || ctx.kind === 'custom') ? ctx.courses.map((c) => c.code) : [];
    let ref: string | null = null;
    try {
      const r = document.referrer ? new URL(document.referrer) : null;
      if (r && r.origin === location.origin) ref = r.pathname + r.hash;
    } catch {
      ref = null;
    }
    return {
      request_id: requestId,
      request_type: s.type,
      contact_type: i === 'entreprise' || (i === 'financement' && get('situation') === 'entreprise') ? 'professional' : 'unknown',
      name: get('name') ?? '',
      email: get('email') ?? '',
      phone: get('phone'),
      company: get('company'),
      professional_card: cards,
      renewal_date: get('renewal'),
      need: i === 'entreprise' ? optionText('b2b_need') : get('need') ? NEEDS[get('need')!] ?? null : null,
      course_codes: courseCodes,
      pack: i === 'formation' && ctx.kind === 'pack' ? `pack-${ctx.hours}` : i === 'formation' && ctx.kind === 'custom' ? `sur-mesure-${ctx.hours}` : null,
      funding_status: get('situation') ? SITUATIONS[get('situation')!] : null,
      funding_body_known: get('funder_known'),
      funding_body: get('funder_name'),
      team_size: optionText('team_size') ?? get('fund_people'),
      subject: get('subject'),
      message: get('message'),
      summary: s.text,
      source_page: 'contact',
      source_url: location.href,
      source_referrer: ref,
      created_at: now,
      callback_requested: callback,
      callback_requested_at: callback ? now : null,
      callback_scope: callback ? s.text : null,
      callback_proof_text: callback ? $('[data-callback-text]').textContent!.trim() : null,
      privacy_notice_version: CONFIG.privacyNoticeVersion,
    };
  }

  // ------------------------------------------------------------- submit
  function validate(scope?: HTMLElement) {
    const invalid: (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[] = [];
    for (const c of controls) {
      if (c.disabled || !c.willValidate || (scope && !scope.contains(c))) continue;
      const ok = c.checkValidity();
      c.setAttribute('aria-invalid', String(!ok));
      if (!ok) invalid.push(c);
    }
    if (!invalid.length) return null;
    const names = [...new Set(invalid.map((c) => c.name))];
    const emailBad = invalid.some((c) => c.name === 'email' && (c as HTMLInputElement).validity.typeMismatch);
    const phoneMissing = names.includes('phone');
    const missing = names.filter((n) => !(n === 'email' && emailBad) && n !== 'phone').map((n) => FIELD_LABEL[n] ?? n);
    const parts = [
      missing.length ? `Merci de compléter : ${missing.join(', ')}.` : '',
      emailBad ? 'L’adresse e-mail ne semble pas valide.' : '',
      phoneMissing ? 'Indiquez un numéro de téléphone pour être rappelé.' : '',
    ];
    status.dataset.tone = 'error';
    status.textContent = parts.filter(Boolean).join(' ');
    return invalid[0];
  }

  // ------------------------------------------------------------- wizard
  // One step visible at a time; « Continuer » validates the current step only.
  const steps = Array.from(form.querySelectorAll<HTMLElement>('[data-step]'));
  const LAST = steps.length - 1;
  const STEP_NAMES = ['Votre besoin', 'Vos coordonnées', 'Votre demande'];
  const stepBtns = Array.from(form.querySelectorAll<HTMLButtonElement>('[data-goto]'));
  const progress = $('[data-progress]');
  const back = $<HTMLButtonElement>('[data-back]');
  const next = $<HTMLButtonElement>('[data-next]');
  const notes = $('[data-notes]');
  const recap = $('[data-recap]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let step = 0;
  let switching = false;

  function chrome() {
    stepBtns.forEach((b, n) => {
      const li = b.parentElement!;
      li.classList.toggle('is-done', n < step);
      li.classList.toggle('is-current', n === step);
      if (n === step) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
      b.disabled = n > step;
    });
    progress.style.width = `${((step + 1) / steps.length) * 100}%`;
    back.hidden = step === 0;
    next.hidden = step === LAST;
    submit.hidden = step !== LAST;
    notes.hidden = step === 0;
    if (step === LAST) renderRecap();
  }

  function goTo(n: number, animate = true) {
    if (n === step || switching || n < 0 || n > LAST) return;
    const from = steps[step];
    const to = steps[n];
    const dir = n > step ? 1 : -1;
    status.textContent = '';
    const show = () => {
      from.hidden = true;
      to.hidden = false;
      step = n;
      chrome();
      if (animate && !reduced)
        to.animate([{ opacity: 0, transform: `translateX(${24 * dir}px)` }, { opacity: 1, transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.22,1,.36,1)' });
      // Keep the stepper clear of the sticky header.
      const clear = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72) + 16;
      const top = form.getBoundingClientRect().top - clear;
      if (top < 0) window.scrollBy({ top, behavior: reduced ? 'auto' : 'smooth' });
      to.querySelector<HTMLElement>('.cstep__title')?.focus({ preventScroll: true });
      live.textContent = `Étape ${n + 1} sur ${steps.length} : ${STEP_NAMES[n]}.`;
      switching = false;
    };
    if (!animate || reduced) return show();
    switching = true;
    from.animate([{ opacity: 1 }, { opacity: 0, transform: `translateX(${-16 * dir}px)` }], { duration: 160, easing: 'ease-in' }).finished.then(show, show);
  }

  next.addEventListener('click', () => {
    const bad = validate(steps[step]);
    if (bad) return bad.focus();
    goTo(step + 1);
  });
  back.addEventListener('click', () => goTo(step - 1));
  stepBtns.forEach((b, n) => b.addEventListener('click', () => n < step && goTo(n)));
  recap.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-recap-goto]');
    if (t) goTo(Number(t.dataset.recapGoto));
  });

  // Summary shown before sending: what the visitor is about to send.
  function renderRecap() {
    const i = intent();
    const live = (n: string) => form.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${n}"]:not(:disabled)`);
    const val = (n: string) => (live(n) ? value(n) : '');
    const opt = (n: string) => {
      const el = live(n);
      return el instanceof HTMLSelectElement ? (el.selectedOptions[0]?.text ?? '') : '';
    };
    const picked = (n: string) =>
      Array.from(form.querySelectorAll<HTMLInputElement>(`input[name="${n}"]:checked:not(:disabled)`))
        .map((c) => c.parentElement!.textContent!.trim())
        .join(', ');
    const rows: [string, string][] = [];
    const s = summary(i);
    if (i === 'formation') {
      if (ctx.kind !== 'none') rows.push(['Objet', s.text]);
      rows.push(['Carte', picked('card')], ['Besoin', opt('need')], ['Échéance', val('renewal')]);
    } else if (i === 'entreprise') {
      rows.push(['Entreprise', val('company')], ['Collaborateurs', opt('team_size')], ['Besoin principal', opt('b2b_need')], ['Cartes', picked('cards')]);
    } else if (i === 'financement') {
      const funder = picked('funder_known');
      rows.push(
        ['Situation', picked('situation')],
        ['Formation', opt('fund_course')],
        ['Personnes à former', val('fund_people')],
        ['Financeur connu', funder + (val('funder_name') ? ` (${val('funder_name')})` : '')],
      );
    } else {
      rows.push(['Objet', val('subject')]);
    }
    const msg = val('message');
    if (msg) rows.push(['Message', msg.length > 140 ? `${msg.slice(0, 140)}…` : msg]);
    const contact = [val('name'), val('email'), val('phone')].filter(Boolean).join(' · ');
    const callback = (form.elements.namedItem('callback') as HTMLInputElement).checked;
    const dl = (pairs: [string, string][]) =>
      pairs
        .filter(([, v]) => v)
        .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
        .join('');
    const html = `<p class="crecap__title">Récapitulatif de votre demande</p>
      <div class="crecap__group"><dl>${dl([['Besoin', INTENT_LABEL[i]]])}</dl><button type="button" class="crecap__edit" data-recap-goto="0">Modifier</button></div>
      <div class="crecap__group"><dl>${dl([
        ['Contact', contact],
        ['Rappel', callback ? 'Oui, au sujet de cette demande' : ''],
      ])}</dl><button type="button" class="crecap__edit" data-recap-goto="1">Modifier</button></div>
      ${rows.some(([, v]) => v) ? `<div class="crecap__group"><dl>${dl(rows)}</dl></div>` : ''}`;
    // Only touch the DOM when the content changed, so a click on « Modifier »
    // is never lost to a re-render triggered by the blur of the field above.
    if (html !== lastRecap) recap.innerHTML = lastRecap = html;
  }
  let lastRecap = '';
  form.addEventListener('input', () => step === LAST && renderRecap());
  chrome();

  function showSuccess(req: ContactRequest, reference: string | null) {
    success.innerHTML = `<p class="csuccess__kicker">✓ Demande transmise</p>
      <h2>Merci, votre demande est entre nos mains.</h2>
      <p>Nous avons bien reçu votre demande concernant&nbsp;:</p>
      <p class="csuccess__what">${esc(req.summary)}</p>
      ${reference ? `<p class="csuccess__ref">Référence : <b>${esc(reference)}</b></p>` : ''}
      ${req.callback_requested ? '<p>Vous avez demandé à être rappelé au sujet de cette demande.</p>' : ''}
      <button type="button" class="btn btn--dark" data-again>Faire une autre demande</button>`;
    form.hidden = true;
    banner.hidden = true;
    success.hidden = false;
    success.focus();
  }
  success.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('[data-again]')) return;
    form.reset();
    ctx = { kind: 'none' };
    requestId = newRequestId();
    status.textContent = '';
    success.hidden = true;
    form.hidden = false;
    render();
    goTo(0, false);
    form.querySelector<HTMLInputElement>('input[name="intent"]:checked')?.focus();
  });

  let sending = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;
    // Honeypot: real visitors never see this field.
    if (value('website')) return;
    if (step < LAST) return next.click();
    const bad = validate();
    if (bad) {
      const at = steps.findIndex((st) => st.contains(bad));
      if (at !== -1 && at !== step) {
        const msg = status.textContent;
        goTo(at, false);
        status.dataset.tone = 'error';
        status.textContent = msg;
      }
      return bad.focus();
    }
    const req = payload();

    if (!activeEndpoint()) {
      window.location.href = mailtoHref(req);
      status.dataset.tone = 'info';
      status.textContent = 'Votre messagerie s’ouvre avec votre demande pré-remplie : elle nous parviendra une fois l’e-mail envoyé.';
      return;
    }

    sending = true;
    const label = submit.textContent;
    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    submit.textContent = 'Envoi en cours…';
    status.textContent = '';
    const res = await sendRequest(req);
    sending = false;
    submit.disabled = false;
    submit.removeAttribute('aria-busy');
    submit.textContent = label;
    if (res.ok) {
      showSuccess(req, res.reference);
      requestId = newRequestId();
      return;
    }
    // Same request_id on retry: the server can deduplicate.
    status.dataset.tone = 'error';
    status.innerHTML = `L’envoi n’a pas abouti. Vous pouvez réessayer ou nous écrire à <a href="${esc(mailtoHref(req))}">${esc(CONFIG.email)}</a>.`;
  });
}
