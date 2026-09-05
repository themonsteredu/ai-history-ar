const memoryStorage = new Map<string, string>();

function browserStorage(kind: "localStorage" | "sessionStorage") {
  try { return window[kind]; } catch { return null; }
}

function safeGet(storage: Storage | null, key: string) {
  try { return storage?.getItem(key) ?? null; } catch { return null; }
}

function safeSet(storage: Storage | null, key: string, value: string) {
  try { storage?.setItem(key, value); } catch {}
}

function safeRemove(storage: Storage | null, key: string) {
  try { storage?.removeItem(key); } catch {}
}

export function readResilientStorage(key: string) {
  return safeGet(browserStorage("localStorage"), key)
    ?? safeGet(browserStorage("sessionStorage"), key)
    ?? memoryStorage.get(key)
    ?? null;
}

export function writeResilientStorage(key: string, value: string) {
  memoryStorage.set(key, value);
  safeSet(browserStorage("localStorage"), key, value);
  safeSet(browserStorage("sessionStorage"), key, value);
}

export function removeResilientStorage(key: string) {
  memoryStorage.delete(key);
  safeRemove(browserStorage("localStorage"), key);
  safeRemove(browserStorage("sessionStorage"), key);
}
