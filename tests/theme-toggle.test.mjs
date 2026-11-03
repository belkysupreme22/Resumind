import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { act, createElement } from 'react';
import { JSDOM } from 'jsdom';
import { transformWithEsbuild } from 'vite';
import { useThemeStore } from '../app/lib/theme.ts';

// Run the actual component with the project's TSX transformer and real React.
const source = await readFile(new URL('../app/components/ThemeToggle.tsx', import.meta.url), 'utf8');
let { code } = await transformWithEsbuild(source, 'ThemeToggle.tsx', { loader: 'tsx', format: 'esm', jsx: 'automatic' });
for (const specifier of ['react', 'react/jsx-runtime', 'lucide-react']) {
  code = code.replaceAll(JSON.stringify(specifier), JSON.stringify(import.meta.resolve(specifier)));
}
code = code.replaceAll('"~/lib/theme"', JSON.stringify(new URL('../app/lib/theme.ts', import.meta.url).href));
const { default: ThemeToggle } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

async function mount(t) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div><button id="outside">Outside</button></body></html>', { url: 'https://resumind.test' });
  const { window } = dom;
  const replacements = { window, document: window.document, Node: window.Node, HTMLElement: window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true };
  const previous = new Map(Object.keys(replacements).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(replacements)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  window.matchMedia = () => ({ matches: true });
  window.document.documentElement.dataset.theme = 'dark';
  useThemeStore.setState({ preference: 'dark' });
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(window.document.getElementById('root'));
  t.after(async () => {
    await act(() => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
    useThemeStore.setState({ preference: 'system' });
  });
  await act(() => root.render(createElement(ThemeToggle)));
  const details = window.document.querySelector('details');
  const summary = window.document.querySelector('summary');
  const light = [...window.document.querySelectorAll('button')].find((button) => button.textContent === 'Light');
  await act(() => { details.open = true; summary.focus(); });
  return { window, details, summary, light, outside: window.document.getElementById('outside') };
}

test('Safari pointer selection survives blur with no focused button, then applies and saves Light', async (t) => {
  const { window, details, summary, light } = await mount(t);
  await act(() => {
    light.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true }));
    summary.dispatchEvent(new window.FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
  });
  // In Safari, hiding the details here removes the mouse-up/click target.
  assert.equal(details.open, true);
  await act(() => light.click());
  assert.equal(window.document.documentElement.dataset.theme, 'light');
  assert.equal(window.localStorage.getItem('resumind-theme'), 'light');
  assert.equal(light.getAttribute('aria-pressed'), 'true');
  assert.equal(details.open, false);
  assert.equal(window.document.activeElement, summary);
});

test('an outside pointer closes the theme options without requiring a focus change', async (t) => {
  const { window, details, outside } = await mount(t);
  await act(() => { outside.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true })); });
  assert.equal(details.open, false);
});

test('keyboard focus leaving the switcher still closes its options', async (t) => {
  const { window, details, summary, outside } = await mount(t);
  await act(() => { summary.dispatchEvent(new window.FocusEvent('focusout', { bubbles: true, relatedTarget: outside })); });
  assert.equal(details.open, false);
});

test('Escape closes the theme options and returns focus to the trigger', async (t) => {
  const { window, details, summary, light } = await mount(t);
  await act(() => {
    light.focus();
    light.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
  assert.equal(details.open, false);
  assert.equal(window.document.activeElement, summary);
});
