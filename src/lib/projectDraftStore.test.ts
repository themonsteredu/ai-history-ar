import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadProjectDraft, saveProjectDraft } from './projectDraftStore';

vi.mock('./resilientStorage', () => ({ readResilientStorage: () => null }));

const values = new Map<string, string>();
let failNextWrite = false;

// IndexedDB opens and requests complete asynchronously, including when a
// second screen opens a connection before a queued write has started.
const indexedDB = {
  open() {
    const request: { result: unknown; onsuccess?: () => void } = {
      result: {
        close() {},
        transaction() {
          const tx: { oncomplete?: () => void; onerror?: () => void; error?: Error; objectStore: () => unknown } = {
            objectStore: () => ({
              put(text: string, key: string) {
                queueMicrotask(() => {
                  if (failNextWrite) { failNextWrite = false; tx.error = new Error('Storage full'); tx.onerror?.(); return; }
                  values.set(key, text); tx.oncomplete?.();
                });
              },
              get(key: string) {
                const read: { result?: string; onsuccess?: () => void } = {};
                queueMicrotask(() => { read.result = values.get(key); read.onsuccess?.(); tx.oncomplete?.(); });
                return read;
              },
            }),
          };
          return tx;
        },
      },
    };
    queueMicrotask(() => request.onsuccess?.());
    return request;
  },
};

beforeEach(() => { values.clear(); failNextWrite = false; vi.stubGlobal('window', { indexedDB }); vi.stubGlobal('indexedDB', indexedDB); });
afterEach(() => vi.unstubAllGlobals());

describe('student draft handoff between screens', () => {
  it('restores the latest recording when the activity is immediately reopened', async () => {
    values.set('group-1', 'previous recording');
    const first = saveProjectDraft('group-1', 'first recording');
    const latest = saveProjectDraft('group-1', 'latest recording');
    const reopened = loadProjectDraft('group-1');
    await Promise.all([first, latest]);
    expect(await reopened).toBe('latest recording');
  });
  it('still restores the previous draft after a failed save and accepts a later retry', async () => {
    values.set('group-2', 'saved recording'); failNextWrite = true;
    const failed = saveProjectDraft('group-2', 'unsaved recording');
    const reopened = loadProjectDraft('group-2');
    await expect(failed).rejects.toThrow('Storage full');
    expect(await reopened).toBe('saved recording');
    await saveProjectDraft('group-2', 'retried recording');
    expect(await loadProjectDraft('group-2')).toBe('retried recording');
  });
});
