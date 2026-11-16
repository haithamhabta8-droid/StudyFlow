import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CUSTOM_BROWSER_FONT_STACK,
  DEFAULT_APP_FONT_STACK,
  resolveAdaptiveFontStack,
} from './font.ts';

test('resolveAdaptiveFontStack uses system-ui-first stack when sans-serif matches stock Arial', () => {
  const stack = resolveAdaptiveFontStack((family) => {
    if (family === 'sans-serif') return 1420;
    if (family.includes('Arial')) return 1420;
    return 1500;
  });
  assert.equal(stack, DEFAULT_APP_FONT_STACK);
  assert.ok(stack.startsWith('system-ui'));
});

test('resolveAdaptiveFontStack prioritizes browser sans-serif when customized away from stock defaults', () => {
  const stack = resolveAdaptiveFontStack((family) => {
    if (family === 'sans-serif') return 1685;
    return 1420;
  });
  assert.equal(stack, CUSTOM_BROWSER_FONT_STACK);
  assert.ok(stack.startsWith('sans-serif'));
});
