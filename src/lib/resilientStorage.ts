const memoryStorage = new Map<string, string>();

function browserStorage(kind: "localStorage" | "sessionStorage") {
  try { return window[kind]; } catch { return null; }
}

function safeGet(storage: Storage | null, key: string) {
  try { return storage?.getItem(key) ?? null; } catch { return null; }
}

function safeSet(storage: Storage | null, key: string, value: string) {
  try {
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemove(storage: Storage | null, key: string) {
  try { storage?.removeItem(key); } catch {}
}

export function readResilientStorage(key: string) {
  return memoryStorage.get(key)
    ?? safeGet(browserStorage("sessionStorage"), key)
    ?? safeGet(browserStorage("localStorage"), key)
    ?? null;
}

export function writeResilientStorage(key: string, value: string) {
  memoryStorage.set(key, value);
  const session = browserStorage("sessionStorage");
  const local = browserStorage("localStorage");
  if (!safeSet(session, key, value)) safeRemove(session, key);
  if (!safeSet(local, key, value)) safeRemove(local, key);
}

export function removeResilientStorage(key: string) {
  memoryStorage.delete(key);
  safeRemove(browserStorage("localStorage"), key);
  safeRemove(browserStorage("sessionStorage"), key);
}
