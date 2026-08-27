const API_CACHE_PREFIX = 'sree_manju_cache_';
const TEMP_PREFIXES = ['sree_manju_cache_', 'sree_manju_temp_'];

export function clearApplicationCache({ reload = true } = {}) {
  // Remove only application-managed cache/temp keys. Auth/session data is preserved.
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (key && TEMP_PREFIXES.some((prefix) => key.startsWith(prefix))) localStorage.removeItem(key);
  }

  for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
    const key = sessionStorage.key(i);
    if (key && TEMP_PREFIXES.some((prefix) => key.startsWith(prefix))) sessionStorage.removeItem(key);
  }

  if ('caches' in window) {
    window.caches.keys().then((names) => Promise.all(
      names.map((name) => name.startsWith(API_CACHE_PREFIX) ? window.caches.delete(name) : Promise.resolve(false))
    )).catch(() => undefined);
  }

  window.dispatchEvent(new CustomEvent('pharmacy:cache-cleared'));
  if (reload) window.location.reload();
}

export function clearApiCacheWithoutReload() {
  return clearApplicationCache({ reload: false });
}
