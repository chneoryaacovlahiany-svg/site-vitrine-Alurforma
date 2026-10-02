// Re-applies the visitor's accessibility preferences (src/ui/a11y.ts) before
// first paint, so the page never flashes in the default style. Local only.
(function () {
  try {
    var saved = JSON.parse(localStorage.getItem('alurforma:a11y') || 'null');
    var attrs = saved && saved.version === 1 && saved.attrs;
    if (!attrs) return;
    var root = document.documentElement;
    for (var k in attrs) {
      if (/^[a-z]+$/.test(k) && /^[a-z]+$/.test(attrs[k])) root.setAttribute('data-a11y-' + k, attrs[k]);
    }
  } catch (e) {
    /* storage unavailable: defaults */
  }
})();
