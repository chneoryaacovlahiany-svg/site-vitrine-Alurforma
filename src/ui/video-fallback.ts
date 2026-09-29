// Some static hosts serve videos without HTTP range support. iOS Safari then
// refuses to play them (the player stays at 00:00). When a video fails to load
// its metadata, download the file in one piece and play it from a blob URL.

const blobs = new Map<string, Promise<string>>();

async function download(url: string, onProgress?: (ratio: number) => void): Promise<string> {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  const total = Number(res.headers.get('content-length')) || 0;
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (total) onProgress?.(received / total);
  }
  return URL.createObjectURL(new Blob(chunks as BlobPart[], { type: 'video/mp4' }));
}

function blobUrl(url: string, onProgress?: (ratio: number) => void) {
  let p = blobs.get(url);
  if (!p) {
    p = download(url, onProgress);
    p.catch(() => blobs.delete(url));
    blobs.set(url, p);
  }
  return p;
}

/** The MP4 the element would use: `data-fallback-src` (lighter file) or the first MP4 <source>. */
function fallbackSource(v: HTMLVideoElement) {
  if (v.dataset.fallbackSrc) return new URL(v.dataset.fallbackSrc, location.href).href;
  const s = v.querySelector<HTMLSourceElement>('source[type="video/mp4"]:last-of-type');
  return s ? s.src : v.currentSrc;
}

interface Options {
  /** Wait this long for metadata before switching to the download path. */
  timeout?: number;
  onProgress?: (ratio: number) => void;
  onFallback?: () => void;
  onReady?: (autoplayed: boolean) => void;
}

/**
 * Watch a video that has just been asked to play; if it cannot load its
 * metadata, download it and play it from memory. Returns a cancel function.
 */
export function watchPlayback(v: HTMLVideoElement, opts: Options = {}) {
  if (v.src.startsWith('blob:') || v.readyState >= 1) return () => undefined;
  let done = false;
  const cleanup = () => {
    done = true;
    window.clearTimeout(timer);
    v.removeEventListener('loadedmetadata', cleanup);
    v.removeEventListener('error', fail, true);
  };
  const fail = () => {
    if (done) return;
    cleanup();
    opts.onFallback?.();
    blobUrl(fallbackSource(v), opts.onProgress)
      .then((src) => {
        v.src = src;
        return v.play().then(
          () => opts.onReady?.(true),
          () => opts.onReady?.(false),
        );
      })
      .catch(() => opts.onReady?.(false));
  };
  const timer = window.setTimeout(() => v.readyState < 1 && fail(), opts.timeout ?? 5000);
  v.addEventListener('loadedmetadata', cleanup);
  // Errors on <source> children do not bubble: listen in the capture phase.
  v.addEventListener('error', fail, true);
  return cleanup;
}
