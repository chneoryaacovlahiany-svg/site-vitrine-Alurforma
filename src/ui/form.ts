import { CONFIG } from '../config';

/**
 * Contact / quote form. Validates client-side, then either POSTs JSON to
 * CONFIG.formEndpoint or opens the visitor's mail client with a pre-filled
 * message. It never pretends a request was stored when it was not.
 */
export function initForm(form: HTMLFormElement) {
  const status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const subject = form.querySelector<HTMLSelectElement>('[data-subject-select]')!;

  // Pre-select the subject from ?objet=… (links from other pages).
  const objet = new URLSearchParams(location.search).get('objet');
  if (objet && Array.from(subject.options).some((o) => o.value === objet)) subject.value = objet;
  // Pre-fill the message with the chosen formation(s) or pack.
  const params = new URLSearchParams(location.search);
  const pack = params.get('pack');
  const codes = params.get('f');
  const message = form.querySelector<HTMLTextAreaElement>('textarea[name="message"]');
  if (message && !message.value && (pack || codes)) {
    const lines: string[] = [];
    if (pack) {
      const m = pack.match(/^(pack|sur-mesure)-(\d+)$/);
      if (m) lines.push(m[1] === 'pack' ? `Je souhaite un devis pour le pack ${m[2]} h.` : `Je souhaite un devis pour un pack sur mesure (objectif ${m[2]} h).`);
    }
    if (codes) {
      const list = codes.split(',').filter((c) => /^F\d{2}$/.test(c));
      if (list.length) lines.push(`${pack ? 'Formations choisies' : 'Formation'} : ${list.join(', ')}.`);
    }
    if (lines.length) message.value = `${lines.join('\n')}\n\nMa carte professionnelle : \nMon échéance de renouvellement : `;
  }

  const fields = Array.from(form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea'));
  fields.forEach((f) => f.addEventListener('input', () => f.removeAttribute('aria-invalid')));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let firstInvalid: HTMLElement | null = null;
    for (const f of fields) {
      const ok = f.checkValidity();
      f.setAttribute('aria-invalid', String(!ok));
      if (!ok && !firstInvalid) firstInvalid = f;
    }
    if (firstInvalid) {
      status.textContent = 'Merci de compléter les champs obligatoires et d’accepter l’utilisation de vos informations.';
      firstInvalid.focus();
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    data.subject = subject.selectedOptions[0]?.text ?? data.subject;
    delete data.consent;

    if (CONFIG.formEndpoint) {
      status.textContent = 'Envoi en cours…';
      try {
        const res = await fetch(CONFIG.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        status.textContent = 'Merci, votre demande a bien été transmise. Nous vous répondons par e-mail.';
      } catch {
        status.textContent = `L’envoi n’a pas abouti. Vous pouvez nous écrire directement à ${CONFIG.email}.`;
      }
      return;
    }

    const body = [
      `Nom : ${data.name}`,
      `E-mail : ${data.email}`,
      data.phone ? `Téléphone : ${data.phone}` : '',
      '',
      data.message,
    ]
      .filter((l, i) => l !== '' || i === 3)
      .join('\n');
    const href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(`[Alurforma] ${data.subject}`)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
    status.textContent = 'Votre messagerie s’ouvre avec la demande pré-remplie : il ne reste qu’à l’envoyer.';
  });
}
