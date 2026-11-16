import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDefaultState,
  DEFAULT_WIDGETS,
  DASHBOARD_PRESETS,
  getSystemPreferredTheme,
  clearAllLocalStorageAndCookies,
  importAppState,
} from './storage.ts';

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

test('getDefaultState initializes default state with system theme and gemini-4-hydrogen', () => {
  const state = getDefaultState();
  assert.equal(state.settings.model, 'gemini-4-hydrogen');
  assert.equal(state.settings.provider, 'gemini');
  assert.ok(['light', 'dark', 'black'].includes(state.settings.theme));
  assert.equal(state.categories.length, 0);
  assert.equal(state.settings.dashboard.length, DEFAULT_WIDGETS.length);
  assert.equal(state.lifetimeFocusSeconds, 0);
});

test('DEFAULT_WIDGETS uses 3-tier asymmetric Bento structure covering all 12 widgets', () => {
  const ids = DEFAULT_WIDGETS.map((w) => w.id);
  assert.ok(ids.includes('pomodoro'));
  assert.ok(ids.includes('stats'));
  assert.ok(ids.includes('aiUsage'));
  assert.ok(ids.includes('goals'));
  assert.ok(ids.includes('streak'));
  assert.ok(ids.includes('actions'));

  const colsMap: Record<string, number> = {
    quarter: 3,
    third: 4,
    half: 6,
    'two-thirds': 8,
    full: 12,
  };
  const totalCols = DEFAULT_WIDGETS.reduce((sum, w) => sum + (colsMap[w.size] || 0), 0);
  assert.equal(totalCols % 12, 0);
  assert.equal(DASHBOARD_PRESETS.classic.length, DEFAULT_WIDGETS.length);
  assert.equal(DASHBOARD_PRESETS.compact.length, DEFAULT_WIDGETS.length);
  assert.equal(DASHBOARD_PRESETS.fourColumn.length, DEFAULT_WIDGETS.length);
  assert.ok(DASHBOARD_PRESETS.fourColumn.every((w) => w.size === 'quarter'));
});

test('getSystemPreferredTheme returns valid theme without throwing', () => {
  const theme = getSystemPreferredTheme();
  assert.ok(theme === 'light' || theme === 'dark' || theme === 'black');
});

test('clearAllLocalStorageAndCookies clears localStorage, sessionStorage, and expires all cookies', () => {
  const ls = createMemoryStorage();
  const ss = createMemoryStorage();
  ls.setItem('studyFlow_v14', '{"test":true}');
  ls.setItem('gemini_api_key', 'AIzaSyMockKey');
  ls.setItem('studyflow_cookie_consent', 'all');
  ss.setItem('studyflow_google_token', 'tok_123');

  const cookieJar = new Map<string, string>([
    ['studyflow_meta', 'encoded'],
    ['other_cookie', 'val'],
  ]);
  const mockDoc = {
    get cookie() {
      return Array.from(cookieJar.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
    },
    set cookie(assignment: string) {
      const nameVal = assignment.split(';')[0] || '';
      const eqIdx = nameVal.indexOf('=');
      if (eqIdx === -1) return;
      const name = nameVal.slice(0, eqIdx).trim();
      const val = nameVal.slice(eqIdx + 1).trim();
      if (assignment.includes('1970') || val === '') {
        cookieJar.delete(name);
      } else {
        cookieJar.set(name, val);
      }
    },
  };

  (globalThis as any).localStorage = ls;
  (globalThis as any).sessionStorage = ss;
  (globalThis as any).document = mockDoc;

  clearAllLocalStorageAndCookies();

  assert.equal(ls.length, 0);
  assert.equal(ss.length, 0);
  assert.equal(mockDoc.cookie, '');
});

test('importAppState preserves study cards, decks, and metrics from exported JSON', () => {
  const ls = createMemoryStorage();
  (globalThis as any).localStorage = ls;
  (globalThis as any).document = { cookie: '' };

  const sample = {
    ...getDefaultState(),
    categories: [
      {
        id: 'cat-1',
        name: 'Biology',
        color: '#22c55e',
        decks: [
          {
            id: 'deck-1',
            name: 'Cells',
            created: 1000,
            cards: [{ id: 'c1', q: 'ATP?', a: 'Energy currency', status: 'learning' }],
          },
        ],
        tasks: [],
        exams: [],
        grades: [],
        quizzes: [],
        notes: [],
        sessions: [{ id: 's1', minutes: 25, ts: 2000 }],
        log: [2000],
      },
    ],
    studiedDates: ['2026-11-10', '2026-11-11'],
    lifetimeFocusSeconds: 1500,
    lastCalendarSync: 9999,
  };

  const imported = importAppState(JSON.stringify(sample));
  assert.ok(imported);
  assert.equal(imported!.categories[0].decks[0].cards[0].q, 'ATP?');
  assert.deepEqual(imported!.studiedDates, ['2026-11-10', '2026-11-11']);
  assert.equal(imported!.lifetimeFocusSeconds, 1500);
  assert.equal(imported!.lastCalendarSync, 9999);
});
