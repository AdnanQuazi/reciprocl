export const THEME_STORAGE_KEY = 'reciprocl.theme-preference';

const validPreferences = new Set(['light', 'dark', 'system']);

export function isThemePreference(value) {
  return validPreferences.has(value);
}

export function readThemePreference(storage) {
  try {
    const saved = (storage ?? window.localStorage).getItem(THEME_STORAGE_KEY);
    return isThemePreference(saved) ? saved : 'system';
  } catch {
    return 'system';
  }
}

export function saveThemePreference(preference, storage) {
  try {
    (storage ?? window.localStorage).setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Theme switching remains available when storage is blocked.
  }
}

export function resolveTheme(preference, systemIsDark) {
  return preference === 'system' ? (systemIsDark ? 'dark' : 'light') : preference;
}
