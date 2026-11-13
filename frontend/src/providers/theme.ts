export const THEME_STORAGE_KEY = 'reciprocl.theme-preference';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
const validPreferences: ReadonlySet<string> = new Set(['light', 'dark', 'system']);

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && validPreferences.has(value);
}

export function readThemePreference(storage?: Pick<Storage, 'getItem'>): ThemePreference {
  try {
    const saved = (storage ?? window.localStorage).getItem(THEME_STORAGE_KEY);
    return isThemePreference(saved) ? saved : 'system';
  } catch {
    return 'system';
  }
}

export function saveThemePreference(
  preference: ThemePreference,
  storage?: Pick<Storage, 'setItem'>,
): void {
  try {
    (storage ?? window.localStorage).setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Theme switching remains available when storage is blocked.
  }
}

export function resolveTheme(
  preference: ThemePreference,
  systemIsDark: boolean,
): ResolvedTheme {
  return preference === 'system' ? (systemIsDark ? 'dark' : 'light') : preference;
}
