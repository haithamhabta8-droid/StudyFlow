import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteGoogleAccountDataAndRevoke } from './googleDrive.ts';

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

test('deleteGoogleAccountDataAndRevoke deletes all Drive backup files, calls Google revoke endpoint, and clears stored token', async () => {
  const ls = createMemoryStorage();
  const ss = createMemoryStorage();
  ls.setItem('studyflow_google_token', 'ya29.test_token_123');
  ss.setItem('studyflow_google_token', 'ya29.test_token_123');
  (globalThis as any).localStorage = ls;
  (globalThis as any).sessionStorage = ss;

  let gisRevokedToken: string | null = null;
  (globalThis as any).window = {
    google: {
      accounts: {
        oauth2: {
          revoke(token: string, done?: () => void) {
            gisRevokedToken = token;
            if (done) done();
          },
        },
      },
    },
  };

  const calls: Array<{ url: string; method: string; body?: string; auth?: string }> = [];
  const originalFetch = globalThis.fetch;
  (globalThis as any).fetch = async (url: string, init?: RequestInit) => {
    const method = init?.method || 'GET';
    const headers = (init?.headers || {}) as Record<string, string>;
    calls.push({
      url,
      method,
      body: typeof init?.body === 'string' ? init.body : undefined,
      auth: headers.Authorization,
    });

    if (url.includes('/drive/v3/files?') && method === 'GET') {
      return new Response(
        JSON.stringify({
          files: [
            { id: 'file_1', name: 'studyflow_backup.json' },
            { id: 'file_2', name: 'studyflow_backup.json' },
          ],
        }),
        { status: 200 }
      );
    }

    return new Response('', { status: 200 });
  };

  try {
    await deleteGoogleAccountDataAndRevoke('ya29.test_token_123');

    assert.equal(calls.length, 4);
    assert.ok(calls[0].url.includes('spaces=appDataFolder'));
    assert.equal(calls[0].auth, 'Bearer ya29.test_token_123');

    assert.equal(calls[1].url, 'https://www.googleapis.com/drive/v3/files/file_1');
    assert.equal(calls[1].method, 'DELETE');
    assert.equal(calls[2].url, 'https://www.googleapis.com/drive/v3/files/file_2');
    assert.equal(calls[2].method, 'DELETE');

    assert.equal(calls[3].url, 'https://oauth2.googleapis.com/revoke');
    assert.equal(calls[3].method, 'POST');
    assert.equal(calls[3].body, 'token=ya29.test_token_123');

    assert.equal(gisRevokedToken, 'ya29.test_token_123');
    assert.equal(ls.getItem('studyflow_google_token'), null);
    assert.equal(ss.getItem('studyflow_google_token'), null);
  } finally {
    globalThis.fetch = originalFetch;
    delete (globalThis as any).window;
  }
});
