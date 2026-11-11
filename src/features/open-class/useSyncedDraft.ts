import { useCallback, useEffect, useRef, useState } from 'react';
import { readDraft, writeDraft, type OpenItem } from './api';
import { mergeDraftData, sameContent } from './draftMerge';
export { sameContent } from './draftMerge';

export interface Stored<T> { key: string; data: T; base: number; dirty: boolean; baseData?: T }
export type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';
const CONFLICT = '다른 태블릿에서 먼저 저장했어요. 어느 쪽을 남길지 골라 주세요.';
/** Longest wait between automatic saves while the network keeps failing. */
export const RETRY_CAP = 20_000;
/** Wait before the next automatic save: the usual pause, then twice as long after each failure in a row (2.5 s, 5 s, 10 s, 20 s…), so a room of tablets does not flood weak Wi-Fi. */
export const retryDelay = (failures: number, delay = 2500) => Math.min(delay * 2 ** Math.max(0, failures - 1), Math.max(delay, RETRY_CAP));
/** Continuous typing still reaches the teacher; failed requests retain their retry backoff. */
export const nextSaveAt = (now: number, failures: number, delay: number, dirtySince?: number, maxWait?: number) =>
  Math.min(now + retryDelay(failures, delay), failures === 0 && dirtySince !== undefined && maxWait !== undefined ? dirtySince + maxWait : Infinity);
/**
 * A newer class version that holds what this tablet has, or sent since its last confirmed save, is this tablet's own
 * save whose answer was lost (cut off on slow Wi-Fi), not another tablet's: carry on from it instead of asking which to keep.
 */
export function ownNewerVersion<T>(now: Stored<T>, server: OpenItem<T>, sent: readonly { key: string; data: T }[]): Stored<T> | undefined {
  const same = sameContent(server.data, now.data);
  if (same || sent.some(item => item.key === now.key && sameContent(server.data, item.data))) return { ...now, base: server.version, baseData: server.data, dirty: !same };
}
/** Reconcile against the last shared snapshot, retaining both edits when they do not overlap. */
export function reconcileDraft<T>(current: Stored<T>, server: OpenItem<T>, sent: readonly {key:string;data:T}[] = []): Stored<T> | undefined {
  if (server.version < current.base) return current;
  const shared = { key: current.key, data: server.data, base: server.version, baseData: server.data, dirty: false };
  if (!current.dirty) return shared;
  const own = ownNewerVersion(current, server, sent);
  if (own) return own;
  if (server.version === current.base) return { ...current, baseData: server.data };
  if (current.baseData === undefined) return;
  const merged = mergeDraftData(current.baseData, current.data, server.data);
  if (merged.ok) return { ...shared, data: merged.data, dirty: !sameContent(merged.data, server.data) };
}
const stamp = () => new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export function useSyncedDraft<T>(options: {
  draftKey: string; server?: OpenItem<T>; blank: () => T; check: (value: unknown) => value is T;
  save: (data: T, expectedVersion: number) => Promise<{ version: number }>; canSave?: (data: T) => boolean; delay?: number; maxWait?: number;
}) {
  const { draftKey, server, blank, check, save, canSave, delay = 800, maxWait = 3000 } = options;
  function initial(): { stored: Stored<T>; conflict: boolean } {
    const isStored = (value: unknown): value is Omit<Stored<T>, 'key'> => !!value && typeof value === 'object' && check((value as Stored<T>).data) && Number.isInteger((value as Stored<T>).base) && typeof (value as Stored<T>).dirty === 'boolean';
    const kept = readDraft(draftKey, isStored);
    const data = kept?.data ?? server?.data ?? blank();
    const stored: Stored<T> = kept ? { ...kept, key: draftKey } : { key: draftKey, data, base: server?.version ?? 0, baseData: data, dirty: false };
    if (!server) return { stored, conflict: false };
    const merged = reconcileDraft(stored, server);
    return merged && check(merged.data) ? { stored: merged, conflict: false } : { stored, conflict: true };
  }
  const [first] = useState(initial);
  const [stored, setStored] = useState<Stored<T>>(first.stored);
  const [state, setState] = useState<SaveState>(first.conflict ? 'conflict' : 'idle');
  const [message, setMessage] = useState(first.conflict ? CONFLICT : '');
  const [savedAt, setSavedAt] = useState('');
  const latest = useRef(stored);
  const keyRef = useRef(draftKey); keyRef.current = draftKey;
  const saving = useRef(false);
  const failures = useRef(0);
  const dirtySince = useRef<number | undefined>(stored.dirty ? Date.now() : undefined);
  const sent = useRef<{ key: string; data: T }[]>([]);
  const remote = useRef<{ key: string; item: OpenItem<T> } | undefined>(undefined);
  const hydrated = useRef(false);
  const keep = (next: Stored<T>) => { const { key, ...value } = next; writeDraft(key, value); };
  const commit = useCallback((next: Stored<T>) => { latest.current = next; setStored(next); keep(next); }, []);

  if (stored.key !== draftKey) {
    const next = initial();
    latest.current = next.stored; remote.current = undefined; hydrated.current = false; sent.current = []; failures.current = 0;
    dirtySince.current = next.stored.dirty ? Date.now() : undefined;
    setStored(next.stored); setState(next.conflict ? 'conflict' : 'idle'); setMessage(next.conflict ? CONFLICT : ''); setSavedAt('');
  }

  const receive = useCallback((item: OpenItem<T>) => {
    const current = latest.current;
    if (current.key !== keyRef.current || !check(item.data)) return;
    const firstLoad = !hydrated.current;
    hydrated.current = true;
    if (item.version < current.base) {
      // On reload, a classroom may have been reset. A clean local cache is never more authoritative than that first fresh read.
      if (firstLoad) {
        remote.current = { key: current.key, item };
        if (current.dirty) { setState('conflict'); setMessage(CONFLICT); }
        else { commit({ key: current.key, data: item.data, base: item.version, baseData: item.data, dirty: false }); setState('saved'); setSavedAt(stamp()); }
      }
      return;
    }
    remote.current = { key: current.key, item };
    if (item.version === current.base && current.baseData !== undefined && (current.dirty || sameContent(item.data, current.data))) return;
    const next = reconcileDraft(current, item, sent.current);
    if (!next || !check(next.data)) { setState('conflict'); setMessage(CONFLICT); return; }
    if (!sameContent(next, current)) commit(next);
    if (!saving.current) { setState(next.dirty ? 'idle' : 'saved'); setMessage(''); }
    if (!next.dirty) setSavedAt(stamp());
  }, [check, commit]);

  useEffect(() => { if (server) receive(server); }, [server, draftKey, receive]);

  const update = useCallback((change: (data: T) => T) => {
    const current = latest.current;
    const data = change(current.data);
    if (sameContent(data, current.data)) return;
    dirtySince.current ??= Date.now();
    commit({ ...current, data, dirty: true });
    setState(currentState => currentState === 'conflict' ? currentState : 'idle');
  }, [commit]);

  // Ordinary manual saves obey the same version check as autosave. Only the explicit conflict choice may overwrite.
  const saveNow = useCallback(async (_manual = false, overwrite = false) => {
    const current = latest.current;
    if (saving.current || current.key !== keyRef.current || !current.dirty || (state === 'conflict' && !overwrite)) return;
    if (canSave && !canSave(current.data)) return;
    dirtySince.current = undefined;
    saving.current = true; setState('saving'); setMessage('');
    sent.current = [...sent.current.slice(-7), { key: current.key, data: current.data }];
    try {
      const shared = remote.current?.key === current.key ? remote.current.item : server;
      const base = overwrite && shared ? shared.version : current.base;
      const result = await save(current.data, base);
      failures.current = 0;
      const now = latest.current;
      if (now.key !== current.key) { keep({ ...current, base: result.version, baseData: current.data, dirty: false }); return; }
      // A poll may already have supplied a newer save. Never rewind its version or clear a real conflict.
      if (now.base <= result.version || (overwrite && base < current.base && now.base === current.base)) {
        const next = { ...now, base: result.version, baseData: current.data, dirty: !sameContent(now.data, current.data) };
        commit(next); setState(next.dirty ? 'idle' : 'saved'); setMessage(''); setSavedAt(stamp());
      }
      saving.current = false;
      if (remote.current?.key === current.key && remote.current.item.version > result.version) receive(remote.current.item);
      sent.current = sent.current.filter(item => item.key !== current.key);
    } catch (error) {
      const failure = error as { status?: number; current?: { data: T; version: number } };
      if (failure.status !== 409) failures.current++;
      const now = latest.current;
      if (now.key !== current.key) return;
      if (now.base !== current.base && (!failure.current || failure.current.version <= now.base)) { setState(now.dirty ? 'idle' : 'saved'); }
      else if (failure.status === 409 && failure.current && check(failure.current.data)) {
        saving.current = false;
        receive({ ...failure.current, key: current.key, updatedAt: '' });
      } else if (now.base !== current.base) { setState(now.dirty ? 'idle' : 'saved'); }
      else if (failure.status === 409) { setState('conflict'); setMessage(CONFLICT); }
      else { setState('error'); setMessage(error instanceof Error ? error.message : '저장하지 못했어요. 쓴 내용은 이 기기에 남아 있어요.'); }
    } finally { saving.current = false; }
  }, [canSave, check, commit, receive, save, server, state]);

  const plan = useRef<{ stored: Stored<T>; state: SaveState; failures: number; at: number }>(undefined);
  useEffect(() => {
    if (!stored.dirty) { dirtySince.current = undefined; return; }
    if (state === 'conflict' || state === 'saving') return;
    dirtySince.current ??= Date.now();
    const last = plan.current;
    const at = last && last.stored === stored && last.state === state && last.failures === failures.current ? last.at : nextSaveAt(Date.now(), failures.current, delay, dirtySince.current, maxWait);
    plan.current = { stored, state, failures: failures.current, at };
    const timer = window.setTimeout(() => { void saveNow(); }, Math.max(0, at - Date.now()));
    return () => clearTimeout(timer);
  }, [stored, state, delay, maxWait, saveNow]);
  useEffect(() => {
    const retry = () => { void saveNow(); };
    window.addEventListener('online', retry); return () => window.removeEventListener('online', retry);
  }, [saveNow]);

  const takeServer = useCallback(() => {
    const item = remote.current?.key === keyRef.current ? remote.current.item : server;
    if (!item) return;
    commit({ key: keyRef.current, data: item.data, base: item.version, baseData: item.data, dirty: false });
    dirtySince.current = undefined; setState('saved'); setMessage(''); setSavedAt(stamp());
  }, [server, commit]);
  const keepMine = useCallback(() => { void saveNow(true, true); }, [saveNow]);

  return { data: stored.data, dirty: stored.dirty, version: stored.base, update, saveNow, state, message, savedAt, takeServer, keepMine };
}

export function saveLabel(state: SaveState, dirty: boolean, savedAt: string) {
  if (state === 'saving') return '저장하는 중…';
  if (state === 'error') return '저장 못 함 · 저절로 다시 저장해요';
  if (state === 'conflict') return '같은 항목을 다르게 수정했어요 · 모둠 저장본을 확인해 주세요';
  if (dirty) return '바뀐 내용 저장 대기';
  return savedAt ? `우리 반에 저장됨 · ${savedAt}` : '저장됨';
}
