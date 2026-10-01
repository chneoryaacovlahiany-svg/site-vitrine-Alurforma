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
  subject: 'objet',
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
  // One message field, two places: required « Message » with the details for
  // « Autre demande », optional « Ajouter une précision » on the last step
  // otherwise. Moving the node keeps a single name in the payload.
  const messageField = $('[data-message]');
  const msgSlot = { autre: $('[data-msg-slot="autre"]'), confirm: $('[data-msg-slot="confirm"]') };
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

  $('[data-mailto-note]').hidden = !!activeEndpoint();

  // Courses for the financing flow.
  const courseSelect = $<HTMLSelectElement>('[data-course-select]');
  for (const c of COURSES) courseSelect.add(new Option(`${c.code} · ${c.title}${c.online ? '' : ' (bientôt disponible)'}`, c.code));

  // --------------------------------------------------- initial state (URL)
  const params = new URLSearchParams(location.search);
  let ctx = readContext(params);
  const objet = params.get('objet');
  const statut = params.get('statut');
  // Only a context from the URL pre-selects a need: arriving on the bare page,
  // the visitor answers « Que souhaitez-vous faire ? » themselves.
  const intentFromUrl: Intent | null =
    objet === 'entreprise' || objet === 'financement' || objet === 'autre'
      ? objet
      : objet === 'formation' || ctx.kind !== 'none'
        ? 'formation'
        : statut
          ? 'financement'
          : null;
  const radio = (name: string, value: string) => form.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`);
  if (intentFromUrl) radio('intent', intentFromUrl)!.checked = true;
  if (statut && SITUATIONS[statut]) radio('situation', statut)!.checked = true;
  if (ctx.kind === 'gs') radio('card', ctx.card)!.checked = true;
  // A course known from the URL also pre-fills the financing flow.
  const firstCourse = ctx.kind === 'course' || ctx.kind === 'custom' ? ctx.courses[0] : undefined;
  if (firstCourse) courseSelect.value = firstCourse.code;

  /** Empty only on step 1, before the visitor has chosen. */
  const intent = () => (form.elements.namedItem('intent') as RadioNodeList).value as Intent;
  const intentRadios = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="intent"]'));
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
    $('[data-message-label]').innerHTML = i === 'autre' ? 'Message' : 'Ajouter une précision <small>(facultatif)</small>';
    const slot = i === 'autre' ? msgSlot.autre : msgSlot.confirm;
    if (messageField.parentElement !== slot) slot.append(messageField);
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
    if (t.name === 'intent') {
      status.textContent = '';
      intentRadios.forEach((r) => r.removeAttribute('aria-invalid'));
    }
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
    if (names.includes('intent')) {
      status.dataset.tone = 'error';
      status.textContent = 'Choisissez ce que vous souhaitez faire pour continuer.';
      return invalid[0];
    }
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
  const STEP_NAMES = ['Besoin', 'Contact', 'Précisions', 'Confirmation'];
  const head = $('.cwiz__head');
  const stepBtns = Array.from(form.querySelectorAll<HTMLButtonElement>('[data-goto]'));
  const progress = $('[data-progress]');
  const back = $<HTMLButtonElement>('[data-back]');
  const next = $<HTMLButtonElement>('[data-next]');
  const notes = $('[data-notes]');
  const recap = $('[data-recap]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let step = 0;
  let switching = false;

  // A step with nothing to ask for this request (e.g. card G/S already known
  // from the URL) is skipped in both directions.
  const isEmpty = (n: string | number) =>
    !Array.from(steps[Number(n)].querySelectorAll<HTMLInputElement>('input, select, textarea')).some((c) => !c.disabled && c.name !== 'website');
  const landing = (n: number, dir: number) => {
    while (n > 0 && n < LAST && isEmpty(n)) n += dir;
    return n;
  };

  function chrome() {
    head.hidden = step > 0;
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
    // Kept in the layout on step 1 (invisible) so the buttons never move.
    notes.classList.toggle('is-idle', step === 0);
    syncNext();
    if (step === LAST) renderRecap();
  }

  // « Continuer » stays visibly inactive until a need is chosen; a click still
  // explains why instead of doing nothing.
  function syncNext() {
    if (step === 0 && !intent()) next.setAttribute('aria-disabled', 'true');
    else next.removeAttribute('aria-disabled');
  }
  form.addEventListener('change', syncNext);

  function goTo(n: number, animate = true) {
    n = landing(n, n > step ? 1 : -1);
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
      // Line the stepper up just under the sticky header, so the whole step
      // (and its buttons) is in view whatever the scroll position was.
      const clear = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72) + 8;
      const top = form.getBoundingClientRect().top - clear;
      if (Math.abs(top) > 4) window.scrollBy({ top, behavior: reduced ? 'auto' : 'smooth' });
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

  // Summary shown before sending: grouped, only what the visitor filled in.
  function renderRecap() {
    const i = intent();
    const live = (n: string) => form.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${n}"]:not(:disabled)`);
    const val = (n: string) => (live(n) ? value(n) : '');
    const opt = (n: string) => {
      const el = live(n);
      return el instanceof HTMLSelectElement && el.value ? (el.selectedOptions[0]?.text ?? '') : '';
    };
    const picked = (n: string) =>
      Array.from(form.querySelectorAll<HTMLInputElement>(`input[name="${n}"]:checked:not(:disabled)`)).map((c) => c.parentElement!.textContent!.trim());
    const codes = (list: string[]) => list.map((t) => t.split(' · ')[0]);
    const s = summary(i);
    // [label, lines, step to edit]
    type Group = [string, string[], number?];
    const callback = (form.elements.namedItem('callback') as HTMLInputElement).checked;
    const groups: Group[] = [
      ['Votre besoin', [INTENT_LABEL[i]], 0],
      ['Contact', [val('name'), val('company'), [val('email'), val('phone')].filter(Boolean).join(' · '), callback ? 'Rappel demandé' : ''], 1],
    ];
    const details: Group[] = [];
    if (i === 'formation') {
      const card = val('card');
      details.push([
        'Votre parcours',
        [
          ctx.kind !== 'none' ? s.text : '',
          card === '?' ? 'Carte à préciser' : card ? `Carte ${card}` : '',
          ctx.kind === 'none' ? opt('need') : '',
          val('renewal') && `Échéance : ${val('renewal')}`,
        ],
      ]);
    } else if (i === 'entreprise') {
      const cards = codes(picked('cards'));
      const team = opt('team_size');
      details.push(
        ['Équipe', [team && `${team} collaborateurs`, cards.length ? `Carte${cards.length > 1 ? 's' : ''} ${cards.join(cards.length > 2 ? ', ' : ' et ')}` : '']],
        ['Objectif', [opt('b2b_need')]],
      );
    } else if (i === 'financement') {
      const known = val('funder_known');
      details.push(
        ['Situation', [picked('situation').join(''), val('fund_people') && `${val('fund_people')} personne(s) à former`]],
        ['Formation', [opt('fund_course')]],
        ['Financeur', [known === 'oui' ? `Connu${val('funder_name') ? ` : ${val('funder_name')}` : ''}` : known === 'non' ? 'Non connu' : 'Je ne sais pas']],
      );
    } else {
      const msg = val('message');
      details.push(['Votre demande', [val('subject'), msg.length > 160 ? `${msg.slice(0, 160)}…` : msg]]);
    }
    // « Modifier » once for the details, on the first group that shows.
    const shown = details.filter(([, lines]) => lines.some(Boolean));
    if (shown.length && !isEmpty(2)) shown[0][2] = 2;
    groups.push(...shown);
    const html = groups
      .filter(([, lines]) => lines.some(Boolean))
      .map(
        ([label, lines, at]) =>
          `<div class="crecap__group${label === 'Contact' ? ' crecap__group--tall' : ''}"><dt>${esc(label)}${
            at !== undefined ? `<button type="button" class="crecap__edit" data-recap-goto="${at}" aria-label="Modifier : ${esc(label.toLowerCase())}">Modifier</button>` : ''
          }</dt>${lines
            .filter(Boolean)
            .map((l) => `<dd${l === 'Rappel demandé' ? ' class="crecap__flag"' : ''}>${esc(l)}</dd>`)
            .join('')}</div>`,
      )
      .join('');
    const out = `<dl>${html}</dl>`;
    // Only touch the DOM when the content changed, so a click on « Modifier »
    // is never lost to a re-render triggered by the blur of the field above.
    if (out !== lastRecap) recap.innerHTML = lastRecap = out;
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
    syncNext();
    intentRadios[0].focus();
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
