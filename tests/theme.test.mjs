import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { initializeTheme, themeBootstrap, useThemeStore } from '../app/lib/theme.ts';

function browser(t, { saved = null, dark = false, blocked = false } = {}) {
  const previous = { window: globalThis.window, document: globalThis.document };
  const listeners = new Set();
  const dataset = {};
  const media = {
    matches: dark,
    addEventListener: (_, listener) => listeners.add(listener),
    removeEventListener: (_, listener) => listeners.delete(listener),
  };
  const storage = new Map(saved === null ? [] : [['resumind-theme', saved]]);
  const localStorage = {
    getItem: (key) => { if (blocked) throw Error('Storage blocked'); return storage.get(key) ?? null; },
    setItem: (key, value) => { if (blocked) throw Error('Storage blocked'); storage.set(key, value); },
  };
  globalThis.document = { documentElement: { dataset } };
  globalThis.window = { localStorage, matchMedia: () => media };
  useThemeStore.setState({ preference: 'system' });
  t.after(() => {
    for (const key of ['window', 'document']) {
      if (previous[key] === undefined) delete globalThis[key];
      else globalThis[key] = previous[key];
    }
    useThemeStore.setState({ preference: 'system' });
  });
  return { dataset, storage, listeners, media, localStorage,
    changeSystem: (dark) => { media.matches = dark; for (const listener of listeners) listener(); },
  };
}

test('saved themes initialize correctly and an explicit choice persists across reinitialization', (t) => {
  const { dataset, storage } = browser(t, { saved: 'dark', dark: false });
  const cleanup = initializeTheme();
  assert.equal(dataset.theme, 'dark');
  assert.equal(useThemeStore.getState().preference, 'dark');
  useThemeStore.getState().setPreference('light');
  assert.equal(storage.get('resumind-theme'), 'light');
  assert.equal(dataset.theme, 'light');
  cleanup();
  const stop = initializeTheme();
  assert.equal(useThemeStore.getState().preference, 'light');
  assert.equal(dataset.theme, 'light');
  stop();
});

test('system mode follows OS changes while an explicit theme remains selected', (t) => {
  const { dataset, changeSystem, listeners } = browser(t);
  const cleanup = initializeTheme();
  assert.equal(dataset.theme, 'light');
  changeSystem(true);
  assert.equal(dataset.theme, 'dark');
  useThemeStore.getState().setPreference('light');
  changeSystem(true);
  assert.equal(dataset.theme, 'light');
  useThemeStore.getState().setPreference('system');
  assert.equal(dataset.theme, 'dark');
  changeSystem(false);
  assert.equal(dataset.theme, 'light');
  cleanup();
  assert.equal(listeners.size, 0);
});

test('storage restrictions do not prevent choosing a theme', (t) => {
  const { dataset } = browser(t, { blocked: true });
  const cleanup = initializeTheme();
  useThemeStore.getState().setPreference('dark');
  assert.equal(dataset.theme, 'dark');
  assert.equal(dataset.themePreference, 'dark');
  cleanup();
});

test('pre-paint startup and application initialization agree for saved, system, and invalid preferences', (t) => {
  const { dataset, localStorage, media } = browser(t, { dark: true });
  for (const saved of ['light', 'dark', 'system', 'invalid']) {
    localStorage.setItem('resumind-theme', saved);
    runInNewContext(themeBootstrap, { document: globalThis.document, localStorage, matchMedia: () => media });
    const startup = { ...dataset };
    const cleanup = initializeTheme();
    assert.deepEqual(dataset, startup);
    assert.equal(dataset.theme, saved === 'light' ? 'light' : 'dark');
    cleanup();
  }
});
