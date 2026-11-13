import test from 'node:test';
import assert from 'node:assert/strict';
import { getDefaultState, DEFAULT_WIDGETS, getSystemPreferredTheme } from './storage.ts';

test('getDefaultState initializes default state with system theme and gemini-3.8-flash', () => {
  const state = getDefaultState();
  assert.equal(state.settings.model, 'gemini-3.8-flash');
  assert.equal(state.settings.provider, 'gemini');
  assert.ok(['light', 'dark', 'black'].includes(state.settings.theme));
  assert.equal(state.categories.length, 0);
  assert.equal(state.settings.dashboard.length, DEFAULT_WIDGETS.length);
  assert.equal(state.lifetimeFocusSeconds, 0);
});

test('DEFAULT_WIDGETS includes essential dashboard widgets', () => {
  const ids = DEFAULT_WIDGETS.map((w) => w.id);
  assert.ok(ids.includes('pomodoro'));
  assert.ok(ids.includes('stats'));
  assert.ok(ids.includes('aiUsage'));
  assert.ok(ids.includes('goals'));
  assert.ok(ids.includes('streak'));
  assert.ok(ids.includes('actions'));
});

test('getSystemPreferredTheme returns valid theme without throwing', () => {
  const theme = getSystemPreferredTheme();
  assert.ok(theme === 'light' || theme === 'dark' || theme === 'black');
});
