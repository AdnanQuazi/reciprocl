import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  THEME_STORAGE_KEY,
  isThemePreference,
  readThemePreference,
  resolveTheme,
  saveThemePreference,
} from './theme.ts';

test('only light, dark, and system are valid preferences', () => {
  for (const preference of ['light', 'dark', 'system']) {
    assert.equal(isThemePreference(preference), true);
  }
  for (const preference of [null, '', 'auto', 'DARK']) {
    assert.equal(isThemePreference(preference), false);
  }
});

test('stored preferences restore; missing or invalid values default to system', () => {
  for (const saved of ['light', 'dark', 'system', null, 'auto']) {
    const storage = {
      getItem(key: string) {
        assert.equal(key, THEME_STORAGE_KEY);
        return saved;
      },
    };
    assert.equal(readThemePreference(storage), isThemePreference(saved) ? saved : 'system');
  }
});

test('storage failures do not prevent choosing or reading a theme', () => {
  const blocked = {
    getItem() { throw new Error('Storage blocked'); },
    setItem() { throw new Error('Storage blocked'); },
  };
  assert.equal(readThemePreference(blocked), 'system');
  assert.doesNotThrow(() => saveThemePreference('dark', blocked));
});

test('saving uses the application-specific key', () => {
  const saved: Array<[string, string]> = [];
  saveThemePreference('light', {
    setItem(key: string, value: string) { saved.push([key, value]); },
  });
  assert.deepEqual(saved, [[THEME_STORAGE_KEY, 'light']]);
});

test('system follows the operating system while explicit preferences stay fixed', () => {
  assert.equal(resolveTheme('system', false), 'light');
  assert.equal(resolveTheme('system', true), 'dark');
  for (const systemDark of [false, true]) {
    assert.equal(resolveTheme('light', systemDark), 'light');
    assert.equal(resolveTheme('dark', systemDark), 'dark');
  }
});
