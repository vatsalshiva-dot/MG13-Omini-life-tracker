const APP_KEY = 'omnilife_app_v1';

export function saveApp(data: any) {
  try { localStorage.setItem(APP_KEY, JSON.stringify(data)); } catch {}
}
export function loadApp<T>(defaults: T): T {
  try {
    const raw = localStorage.getItem(APP_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {}
  return defaults;
}
export function clearApp() { localStorage.removeItem(APP_KEY); }
