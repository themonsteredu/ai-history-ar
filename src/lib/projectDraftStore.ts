import { readResilientStorage } from './resilientStorage';

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('임시 저장을 지원하지 않는 브라우저입니다.')); return; }
    const request = indexedDB.open('moa-history-project-drafts', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('다른 수업 창을 닫은 뒤 다시 열어 주세요.'));
  });
}
export async function loadProjectDraft(key: string): Promise<string | null> {
  try {
    const db = await database();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readonly');
      const request = tx.objectStore('drafts').get(key);
      let result: string | null = null;
      request.onsuccess = () => { result = typeof request.result === 'string' ? request.result : readResilientStorage(key); };
      tx.oncomplete = () => { db.close(); resolve(result); };
      tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
    });
  } catch { return readResilientStorage(key); }
}
const pending = new Map<string, Promise<void>>();
export function saveProjectDraft(key: string, text: string): Promise<void> {
  const next = (pending.get(key) || Promise.resolve()).catch(() => {}).then(() => writeDraft(key, text));
  pending.set(key, next);
  void next.finally(() => { if (pending.get(key) === next) pending.delete(key); }).catch(() => {});
  return next;
}
async function writeDraft(key: string, text: string) {
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('drafts', 'readwrite');
    tx.objectStore('drafts').put(text, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = tx.onabort = () => { db.close(); reject(tx.error || new Error('임시 저장 공간이 부족합니다.')); };
  });
}
