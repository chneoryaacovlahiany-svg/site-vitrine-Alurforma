/** Accessible tabs (WAI-ARIA pattern with roving tabindex and arrow keys). */
export function initTabs(list: HTMLElement, opts: { syncHash?: boolean } = {}) {
  const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panelId = (t: HTMLButtonElement) => t.getAttribute('aria-controls')!;
  const select = (tab: HTMLButtonElement, focus = false) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(panelId(t));
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
    if (opts.syncHash) history.replaceState(null, '', `#${panelId(tab)}`);
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      const k = e.key;
      let n = -1;
      if (k === 'ArrowRight') n = (i + 1) % tabs.length;
      if (k === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      if (k === 'Home') n = 0;
      if (k === 'End') n = tabs.length - 1;
      if (n >= 0) {
        e.preventDefault();
        select(tabs[n], true);
      }
    });
  });
  const byPanel = (id: string) => tabs.find((t) => panelId(t) === id);
  return {
    has: (id: string) => !!byPanel(id),
    select: (id: string) => {
      const t = byPanel(id);
      if (t) select(t);
    },
  };
}
