import { useCallback, useEffect, useRef, useState } from 'react';
import { readDraft, writeDraft, type OpenItem } from './api';

interface Stored<T> { key: string; data: T; base: number; dirty: boolean }
export type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';
const CONFLICT = '다른 태블릿에서 먼저 저장했어요. 어느 쪽을 남길지 골라 주세요.';
/** Longest wait between automatic saves while the network keeps failing. */
export const RETRY_CAP = 20_000;
/** Wait before the next automatic save: the usual pause, then twice as long after each failure in a row (2.5 s, 5 s, 10 s, 20 s…), so a room of tablets does not flood weak Wi-Fi. */
export const retryDelay = (failures: number, delay = 2500) => Math.min(delay * 2 ** Math.max(0, failures - 1), Math.max(delay, RETRY_CAP));

/**
 * One editable item (a card, a check record, a teacher set) kept on the tablet and saved to the class.
 * Typing marks it dirty and it saves itself shortly after; a newer save from another tablet is adopted
 * when nothing here is unsaved, and otherwise the group chooses which one to keep.
 */
export function useSyncedDraft<T>(options: {
  draftKey: string; server?: OpenItem<T>; blank: () => T; check: (value: unknown) => value is T;
  save: (data: T, expectedVersion: number) => Promise<{ version: number }>; canSave?: (data: T) => boolean; delay?: number;
}) {
  const { draftKey, server, blank, check, save, canSave, delay = 2500 } = options;
  function initial(): { stored: Stored<T>; conflict: boolean } {
    const isStored = (value: unknown): value is Omit<Stored<T>, 'key'> => !!value && typeof value === 'object' && check((value as Stored<T>).data) && Number.isInteger((value as Stored<T>).base) && typeof (value as Stored<T>).dirty === 'boolean';
    const kept = readDraft(draftKey, isStored);
    const fromServer = server && { key: draftKey, data: server.data, base: server.version, dirty: false };
    if (!kept) return { stored: fromServer || { key: draftKey, data: blank(), base: 0, dirty: false }, conflict: false };
    if (fromServer && fromServer.base > kept.base) return kept.dirty ? { stored: { ...kept, key: draftKey }, conflict: true } : { stored: fromServer, conflict: false };
    return { stored: { ...kept, key: draftKey }, conflict: false };
  }
  const [stored, setStored] = useState<Stored<T>>(() => initial().stored);
  const [state, setState] = useState<SaveState>('idle');
  const [message, setMessage] = useState('');
  const [savedAt, setSavedAt] = useState('');
  const latest = useRef(stored); latest.current = stored;
  const keyRef = useRef(draftKey); keyRef.current = draftKey;
  const saving = useRef(false);
  const failures = useRef(0);
  const keep = (next: Stored<T>) => { const { key, ...value } = next; writeDraft(key, value); };

  // A different item (another class, group or card) starts from its own draft.
  if (stored.key !== draftKey) {
    const next = initial();
    setStored(next.stored); setState(next.conflict ? 'conflict' : 'idle'); setMessage(next.conflict ? CONFLICT : '');
  }

  useEffect(() => {
    const current = latest.current;
    if (!server || current.key !== draftKey || server.version <= current.base) return;
    if (!current.dirty) { const next = { key: draftKey, data: server.data, base: server.version, dirty: false }; setStored(next); keep(next); }
    else { setState('conflict'); setMessage(CONFLICT); }
  }, [server?.version, draftKey]);

  const update = useCallback((change: (data: T) => T) => {
    setStored(current => { const next = { ...current, data: change(current.data), dirty: true }; keep(next); return next; });
    setState(current => current === 'conflict' ? current : 'idle');
  }, []);

  const saveNow = useCallback(async (force = false) => {
    const current = latest.current;
    if (saving.current || current.key !== keyRef.current || (!force && (!current.dirty || state === 'conflict'))) return;
    if (canSave && !canSave(current.data)) return;
    saving.current = true; setState('saving'); setMessage('');
    try {
      const base = force && server ? Math.max(server.version, current.base) : current.base;
      const result = await save(current.data, base);
      failures.current = 0;
      const now = latest.current;
      // If the screen moved to another item while saving, only that saved item's own draft is updated.
      const next = now.key === current.key ? { ...now, base: result.version, dirty: now.data !== current.data } : { ...current, base: result.version, dirty: false };
      keep(next);
      if (now.key === current.key) { setStored(next); setState('saved'); setSavedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })); }
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status !== 409) failures.current++;
      if (latest.current.key !== current.key) return;
      if (status === 409) { setState('conflict'); setMessage(CONFLICT); }
      else { setState('error'); setMessage(error instanceof Error ? error.message : '저장하지 못했어요. 쓴 내용은 이 기기에 남아 있어요.'); }
    } finally { saving.current = false; }
  }, [canSave, save, server, state]);

  // The page re-renders on every class poll (and saveNow changes with it); that must not keep pushing a
  // planned retry back, so its time is set only by an edit or a save result.
  const plan = useRef<{ stored: Stored<T>; state: SaveState; failures: number; at: number }>(undefined);
  useEffect(() => {
    if (!stored.dirty || state === 'conflict' || state === 'saving') return;
    const last = plan.current;
    const at = last && last.stored === stored && last.state === state && last.failures === failures.current ? last.at : Date.now() + retryDelay(failures.current, delay);
    plan.current = { stored, state, failures: failures.current, at };
    const timer = window.setTimeout(() => { void saveNow(); }, Math.max(0, at - Date.now()));
    return () => clearTimeout(timer);
  }, [stored, state, delay, saveNow]);
  // Back online: save what is waiting now instead of sitting out the rest of the pause.
  useEffect(() => {
    const retry = () => { void saveNow(); };
    window.addEventListener('online', retry); return () => window.removeEventListener('online', retry);
  }, [saveNow]);

  /** Conflict choices: take what the other tablet saved, or save ours over it. */
  const takeServer = useCallback(() => {
    if (!server) return;
    const next = { key: keyRef.current, data: server.data, base: server.version, dirty: false }; setStored(next); keep(next); setState('idle'); setMessage('');
  }, [server]);
  const keepMine = useCallback(() => { void saveNow(true); }, [saveNow]);

  return { data: stored.data, dirty: stored.dirty, version: stored.base, update, saveNow, state, message, savedAt, takeServer, keepMine };
}

export function saveLabel(state: SaveState, dirty: boolean, savedAt: string) {
  if (state === 'saving') return '저장하는 중…';
  if (state === 'error') return '저장 못 함 · 저절로 다시 저장해요';
  if (state === 'conflict') return '다른 태블릿과 겹침';
  if (dirty) return '바뀐 내용 저장 대기';
  return savedAt ? `우리 반에 저장됨 · ${savedAt}` : '저장됨';
}
