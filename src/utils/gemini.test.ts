import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getGeminiApiKey, setGeminiApiKey, testGeminiApiKey, GEMINI_API_KEY_STORAGE } from './gemini.ts';

// Mock localStorage for node test runner
const mockStorage: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (k: string) => mockStorage[k] || null,
  setItem: (k: string, v: string) => {
    mockStorage[k] = v;
  },
  removeItem: (k: string) => {
    delete mockStorage[k];
  },
  clear: () => {
    for (const key in mockStorage) delete mockStorage[key];
  },
  length: 0,
  key: () => null,
};

test('getGeminiApiKey returns empty string when none set', () => {
  localStorage.clear();
  assert.equal(getGeminiApiKey(), '');
});

test('setGeminiApiKey stores and retrieves key correctly', () => {
  setGeminiApiKey('AIzaSyTest123456');
  assert.equal(getGeminiApiKey(), 'AIzaSyTest123456');
  assert.equal(localStorage.getItem(GEMINI_API_KEY_STORAGE), 'AIzaSyTest123456');

  setGeminiApiKey('');
  assert.equal(getGeminiApiKey(), '');
});

test('testGeminiApiKey rejects empty key', async () => {
  const result = await testGeminiApiKey('');
  assert.equal(result.success, false);
  assert.match(result.error || '', /Please enter an API key/i);
});
