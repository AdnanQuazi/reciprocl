import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ThemeContext } from './theme-context';
import { isThemePreference, readThemePreference, resolveTheme, saveThemePreference } from './theme';

const systemThemeQuery = '(prefers-color-scheme: dark)';

function systemIsDark() {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(systemThemeQuery).matches;
}

export default function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(readThemePreference);
  const [systemDark, setSystemDark] = useState(systemIsDark);
  const resolvedTheme = resolveTheme(preference, systemDark);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;

    const media = window.matchMedia(systemThemeQuery);
    const onSystemChange = event => setSystemDark(event.matches);
    media.addEventListener('change', onSystemChange);
    return () => media.removeEventListener('change', onSystemChange);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  const setThemePreference = useCallback(nextPreference => {
    if (!isThemePreference(nextPreference)) {
      throw new TypeError(`Invalid theme preference: ${nextPreference}`);
    }
    saveThemePreference(nextPreference);
    setPreference(nextPreference);
  }, []);

  return (
    <ThemeContext.Provider value={{ preference, resolvedTheme, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}
