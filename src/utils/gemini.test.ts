import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AI_MODEL_CATALOG,
  GEMINI_API_KEY_STORAGE,
  buildGeminiPayload,
  clearLiveGeminiModelsCache,
  getEffectiveGeminiModels,
  getGeminiApiKey,
  mergeLiveGeminiModels,
  normalizeGeminiModelId,
  setGeminiApiKey,
  syncGeminiModels,
  testGeminiApiKey,
} from './gemini.ts';

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

test('AI_MODEL_CATALOG includes all Gemini 4 and rolling Flash models', () => {
  const ids = AI_MODEL_CATALOG.map((m) => m.id);
  for (const required of [
    'gemini-4-hydrogen',
    'gemini-4-carbon',
    'gemini-4-argon',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
  ]) {
    assert.ok(ids.includes(required), `Missing model in catalog: ${required}`);
  }
  assert.equal(normalizeGeminiModelId('gemini-2.0-flash'), 'gemini-4-hydrogen');
  assert.equal(normalizeGeminiModelId('gemini-4-carbon'), 'gemini-4-carbon');
});

test('buildGeminiPayload omits deprecated sampling params on Gemini 4 and scopes XHIGH to hydrogen', () => {
  const hydrogen = buildGeminiPayload('Explain osmosis', 'gemini-4-hydrogen', {
    thinkingLevel: 'XHIGH',
  });
  assert.equal(hydrogen.generationConfig?.temperature, undefined);
  assert.equal(hydrogen.generationConfig?.thinkingConfig?.thinkingLevel, 'XHIGH');

  const carbon = buildGeminiPayload('Solve integral', 'gemini-4-carbon', {
    thinkingLevel: 'XHIGH',
  });
  assert.equal(carbon.generationConfig?.temperature, undefined);
  assert.equal(carbon.generationConfig?.thinkingConfig?.thinkingLevel, 'HIGH');

  const lite = buildGeminiPayload('Summarize notes', 'gemini-3.5-flash-lite', {
    jsonMode: true,
  });
  assert.equal(lite.generationConfig?.temperature, 0.7);
  assert.equal(lite.generationConfig?.responseMimeType, 'application/json');
});

test('mergeLiveGeminiModels automatically adds newly released Google models and updates New badges', () => {
  const res = mergeLiveGeminiModels(
    [
      {
        name: 'models/gemini-4-hydrogen',
        displayName: 'Gemini 4 Hydrogen',
        description: 'Stable general availability balanced model',
        supportedGenerationMethods: ['generateContent'],
      },
      {
        name: 'models/gemini-4-carbon',
        displayName: 'Gemini 4 Carbon',
        description: 'Deepest reasoning',
        supportedGenerationMethods: ['generateContent'],
      },
      {
        name: 'models/gemini-5-alpha',
        displayName: 'Gemini 5 Alpha',
        description: 'Newest frontier generation model',
        supportedGenerationMethods: ['generateContent'],
      },
      {
        name: 'models/text-embedding-004',
        displayName: 'Text Embedding',
        supportedGenerationMethods: ['embedContent'],
      },
    ],
    {},
    1700000000000
  );

  assert.ok(res.addedIds.includes('gemini-5-alpha'));
  const alpha = res.models.find((m) => m.id === 'gemini-5-alpha');
  assert.ok(alpha, 'New model should be added automatically');
  assert.equal(alpha?.badge, 'new');
  assert.equal(alpha?.series, 'gemini-5');

  // Google removed newness and shipped Gemini 5 Alpha -> Hydrogen should lose static "new" badge
  const hydrogen = res.models.find((m) => m.id === 'gemini-4-hydrogen');
  assert.equal(hydrogen?.badge, undefined);

  // Excluded non-generateContent / legacy models and pruned missing models
  assert.equal(res.models.find((m) => m.id === 'text-embedding-004'), undefined);
  assert.ok(res.removedIds.includes('gemini-4-argon'));
});

test('syncGeminiModels fetches Google API catalog and persists dynamic model updates', async () => {
  localStorage.clear();
  clearLiveGeminiModelsCache();

  const origFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    ({
      ok: true,
      json: async () => ({
        models: [
          {
            name: 'models/gemini-4-hydrogen',
            displayName: 'Gemini 4 Hydrogen',
            description: 'Stable balanced intelligence model',
            supportedGenerationMethods: ['generateContent'],
          },
          {
            name: 'models/gemini-4.5-flash',
            displayName: 'Gemini 4.5 Flash',
            description: 'Brand new ultra-fast model',
            supportedGenerationMethods: ['generateContent'],
          },
        ],
      }),
    } as any)) as typeof fetch;

  try {
    const syncRes = await syncGeminiModels('AIzaSyFakeTestKey12345678901234567890', { force: true });
    assert.equal(syncRes.synced, true);
    const effective = getEffectiveGeminiModels();
    assert.ok(effective.some((m) => m.id === 'gemini-4.5-flash' && m.badge === 'new'));
    assert.equal(effective.find((m) => m.id === 'gemini-4-hydrogen')?.badge, undefined);
  } finally {
    globalThis.fetch = origFetch;
  }
});
