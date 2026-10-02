/**
 * Accessibility comfort panel (same settings and attribute names as the LMS
 * module, `data-a11y-*` on <html>).
 *
 * It is a comfort tool on top of the site's native accessibility (semantic
 * HTML, labels, contrast, focus, prefers-reduced-motion), never a claim of
 * conformity. Preferences stay in this browser (localStorage), nothing is
 * sent anywhere. public/a11y-boot.js re-applies them before first paint.
 */

type FontSize = 'sm' | 'md' | 'lg' | 'xl';
interface Settings {
  contrast: boolean;
  font: FontSize;
  dyslexia: boolean;
  line: boolean;
  letter: boolean;
  motion: boolean;
  links: boolean;
  focus: boolean;
}
type Toggle = Exclude<keyof Settings, 'font'>;

const KEY = 'alurforma:a11y';
const POS_KEY = 'alurforma:a11y-pos';
const VERSION = 1;
const DEFAULTS: Settings = { contrast: false, font: 'md', dyslexia: false, line: false, letter: false, motion: false, links: false, focus: false };
const SIZES: { value: FontSize; label: string; px: number }[] = [
  { value: 'sm', label: 'A−', px: 14 },
  { value: 'md', label: 'A', px: 16 },
  { value: 'lg', label: 'A+', px: 18 },
  { value: 'xl', label: 'A++', px: 20 },
];
const GROUPS: { title: string; items: { key: Toggle; label: string; hint: string }[] }[] = [
  { title: 'Affichage', items: [{ key: 'contrast', label: 'Contraste renforcé', hint: 'Textes plus foncés, gris plus marqués.' }] },
  {
    title: 'Lecture et confort',
    items: [
      { key: 'dyslexia', label: 'Police adaptée dyslexie', hint: 'Police OpenDyslexic sur tout le site.' },
      { key: 'line', label: 'Interlignage aéré', hint: 'Plus d’espace entre les lignes.' },
      { key: 'letter', label: 'Espacement des lettres élargi', hint: 'Facilite le suivi des mots.' },
    ],
  },
  {
    title: 'Mouvement et navigation',
    items: [
      { key: 'motion', label: 'Réduire les animations', hint: 'Coupe transitions, apparitions et vidéos automatiques.' },
      { key: 'links', label: 'Souligner les liens', hint: 'Tous les liens de texte sont soulignés.' },
      { key: 'focus', label: 'Focus clavier renforcé', hint: 'Contour très visible sur l’élément sélectionné.' },
    ],
  },
];

const osReduced = matchMedia('(prefers-reduced-motion: reduce)');

function load(): Settings {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { version?: number; settings?: Record<string, unknown> } | null;
    if (raw?.version !== VERSION || !raw.settings) return { ...DEFAULTS };
    const s = raw.settings;
    const out = { ...DEFAULTS };
    for (const k of Object.keys(DEFAULTS) as (keyof Settings)[]) {
      if (k === 'font') out.font = SIZES.some((z) => z.value === s.font) ? (s.font as FontSize) : 'md';
      else if (typeof s[k] === 'boolean') out[k] = s[k] as boolean;
    }
    return out;
  } catch {
    return { ...DEFAULTS };
  }
}

/** Attribute values, also what a11y-boot.js re-applies before first paint. */
function attrs(s: Settings): Record<string, string> {
  return {
    contrast: s.contrast ? 'on' : 'off',
    font: s.font,
    dyslexia: s.dyslexia ? 'on' : 'off',
    line: s.line ? 'relaxed' : 'normal',
    letter: s.letter ? 'wide' : 'normal',
    motion: s.motion ? 'reduce' : 'normal',
    links: s.links ? 'underline' : 'normal',
    focus: s.focus ? 'strong' : 'normal',
  };
}

function apply(s: Settings) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(attrs(s))) root.setAttribute(`data-a11y-${k}`, v);
  // The dyslexia font (~60 kB) is only downloaded once someone asks for it.
  if (s.dyslexia) void Promise.all([import('@fontsource/opendyslexic/400.css'), import('@fontsource/opendyslexic/700.css')]);
  document.dispatchEvent(new CustomEvent('a11y:change', { detail: { reducedMotion: s.motion || osReduced.matches } }));
}

function save(s: Settings) {
  try {
    const isDefault = (Object.keys(DEFAULTS) as (keyof Settings)[]).every((k) => s[k] === DEFAULTS[k]);
    if (isDefault) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify({ version: VERSION, settings: s, attrs: attrs(s) }));
  } catch {
    /* storage unavailable (private mode): settings stay for this page only */
  }
}

const ICON =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="4.5" r="1.8"/><path d="M5 8.5c2.3.7 4.6 1 7 1s4.7-.3 7-1M12 9.5v5M12 14.5l-3 6M12 14.5l3 6"/></svg>';

export function initA11y() {
  let s = load();
  apply(s);

  // ------------------------------------------------------------ tab button
  const tab = document.createElement('button');
  tab.type = 'button';
  tab.className = 'a11y-tab';
  tab.setAttribute('aria-haspopup', 'dialog');
  tab.setAttribute('aria-expanded', 'false');
  tab.setAttribute('aria-controls', 'a11y-panel');
  tab.setAttribute('aria-describedby', 'a11y-tab-hint');
  tab.innerHTML = `<span class="a11y-tab__grip" aria-hidden="true"></span>${ICON}<span class="a11y-tab__label">Accessibilité</span><span class="sr-only" id="a11y-tab-hint">Glisser, ou flèches haut et bas, pour déplacer le bouton.</span>`;

  // --------------------------------------------------------------- panel
  const panel = document.createElement('div');
  panel.className = 'a11y-panel';
  panel.id = 'a11y-panel';
  panel.hidden = true;
  panel.innerHTML = `<div class="a11y-panel__backdrop" data-a11y-close></div>
    <section class="a11y-panel__sheet" role="dialog" aria-modal="true" aria-labelledby="a11y-title" aria-describedby="a11y-sub" tabindex="-1">
      <header class="a11y-panel__head">
        <div><h2 id="a11y-title">Accessibilité</h2><p id="a11y-sub">Réglez l’affichage selon vos préférences.</p></div>
        <button type="button" class="a11y-panel__close" data-a11y-close aria-label="Fermer le panneau d’accessibilité"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
      </header>
      <div class="a11y-panel__body">
        <fieldset class="a11y-group">
          <legend>Taille du texte</legend>
          <div class="a11y-sizes">${SIZES.map(
            (z) => `<label class="a11y-size"><input type="radio" name="a11y-font" value="${z.value}" /><b>${z.label}</b><small>${z.px} px</small></label>`,
          ).join('')}</div>
        </fieldset>
        ${GROUPS.map(
          (g) => `<fieldset class="a11y-group"><legend>${g.title}</legend>${g.items
            .map(
              (it) => `<label class="a11y-switch"><span><b>${it.label}</b><small${it.key === 'motion' ? ' data-a11y-motion-hint' : ''}>${it.hint}</small></span><input type="checkbox" role="switch" data-a11y="${it.key}" /></label>`,
            )
            .join('')}</fieldset>`,
        ).join('')}
        <button type="button" class="a11y-reset" data-a11y-reset>Réinitialiser les réglages</button>
        <p class="a11y-note">Vos réglages restent sur cet appareil, rien n’est envoyé.</p>
        <a class="a11y-more" href="./accessibilite.html">En savoir plus sur l’accessibilité et le handicap</a>
      </div>
    </section>`;
  // The tab comes right after the skip link, so it is reachable early with Tab.
  const skip = document.querySelector('.skip');
  if (skip) skip.after(tab);
  else document.body.prepend(tab);
  document.body.append(panel);

  const sheet = panel.querySelector<HTMLElement>('.a11y-panel__sheet')!;
  const switches = Array.from(panel.querySelectorAll<HTMLInputElement>('[data-a11y]'));
  const sizes = Array.from(panel.querySelectorAll<HTMLInputElement>('input[name="a11y-font"]'));
  const motionHint = panel.querySelector<HTMLElement>('[data-a11y-motion-hint]')!;
  const motionDefault = motionHint.textContent!;

  function sync() {
    for (const sw of switches) sw.checked = s[sw.dataset.a11y as Toggle];
    for (const r of sizes) r.checked = r.value === s.font;
    motionHint.textContent = motionDefault;
    // The device setting already reduces motion: show it, don't fight it.
    if (osReduced.matches) {
      const motion = switches.find((sw) => sw.dataset.a11y === 'motion')!;
      motion.checked = true;
      motion.disabled = true;
      motionHint.textContent = 'Déjà activé par les réglages de votre appareil.';
    }
  }
  sync();

  function set(next: Settings) {
    s = next;
    apply(s);
    save(s);
    sync();
  }
  panel.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === 'a11y-font') set({ ...s, font: t.value as FontSize });
    else if (t.dataset.a11y) {
      set({ ...s, [t.dataset.a11y]: t.checked });
      if (t.dataset.a11y === 'motion' && t.checked) motionHint.textContent = 'Appliqué entièrement au prochain chargement de page.';
    }
  });
  panel.querySelector('[data-a11y-reset]')!.addEventListener('click', () => set({ ...DEFAULTS }));

  // ------------------------------------------------------- open / close
  let lastFocus: HTMLElement | null = null;
  const focusables = () =>
    Array.from(sheet.querySelectorAll<HTMLElement>('button, a[href], input:not([disabled])')).filter((el) => el.offsetParent !== null);

  function open() {
    lastFocus = document.activeElement as HTMLElement | null;
    panel.hidden = false;
    tab.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('a11y-open');
    requestAnimationFrame(() => panel.classList.add('is-open'));
    sheet.focus();
  }
  function close() {
    panel.classList.remove('is-open');
    tab.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('a11y-open');
    const done = () => (panel.hidden = true);
    if (s.motion || osReduced.matches) done();
    else setTimeout(done, 220);
    (lastFocus && document.contains(lastFocus) ? lastFocus : tab).focus();
  }
  panel.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-a11y-close]')) close();
  });
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      // Keep keyboard focus inside the dialog.
      const f = focusables();
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === sheet)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // --------------------------------------------- vertical drag of the tab
  // Click opens; a move beyond a few pixels is a drag and does not open.
  // Position is kept as a share of the viewport height, clamped on screen.
  const MARGIN = 12;
  let ratio = 0.5;
  try {
    const saved = Number(localStorage.getItem(POS_KEY));
    if (saved > 0 && saved < 1) ratio = saved;
  } catch {
    /* ignore */
  }
  function place() {
    const half = tab.offsetHeight / 2;
    const vh = window.innerHeight;
    const y = Math.min(vh - MARGIN - half, Math.max(MARGIN + half + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 0), ratio * vh));
    tab.style.top = `${y}px`;
  }
  function moveTo(y: number) {
    ratio = y / window.innerHeight;
    place();
  }
  function store() {
    try {
      localStorage.setItem(POS_KEY, ratio.toFixed(4));
    } catch {
      /* ignore */
    }
  }
  place();
  window.addEventListener('resize', place);

  let drag: { y0: number; top0: number; moved: boolean } | null = null;
  let justDragged = false;
  tab.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    justDragged = false;
    drag = { y0: e.clientY, top0: tab.getBoundingClientRect().top + tab.offsetHeight / 2, moved: false };
    tab.setPointerCapture(e.pointerId);
  });
  tab.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dy = e.clientY - drag.y0;
    if (!drag.moved && Math.abs(dy) > 4) {
      drag.moved = true;
      tab.classList.add('is-dragging');
    }
    if (drag.moved) moveTo(drag.top0 + dy);
  });
  const endDrag = (e: PointerEvent) => {
    if (!drag) return;
    if (tab.hasPointerCapture(e.pointerId)) tab.releasePointerCapture(e.pointerId);
    if (drag.moved) {
      store();
      justDragged = true; // the click that follows a drag does not open the panel
    }
    tab.classList.remove('is-dragging');
    drag = null;
  };
  tab.addEventListener('pointerup', endDrag);
  tab.addEventListener('pointercancel', endDrag);
  tab.addEventListener('click', () => {
    if (justDragged) justDragged = false;
    else open();
  });
  tab.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const center = tab.getBoundingClientRect().top + tab.offsetHeight / 2;
    moveTo(center + (e.key === 'ArrowUp' ? -1 : 1) * (e.shiftKey ? 96 : 32));
    store();
  });
}
