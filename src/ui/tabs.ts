/** Accessible tabs (WAI-ARIA pattern with roving tabindex and arrow keys). */
export function initTabs(list: HTMLElement) {
  const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const select = (tab: HTMLButtonElement, focus = false) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls')!);
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
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
}
