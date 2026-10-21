import { studioApi, StudioApiError, type StudioSession } from '../ar-studio/api';
import type { GroupCard, TeacherSet, Verification } from './model';

export interface OpenItem<T> { key: string; version: number; data: T; updatedAt: string }
export interface OpenState { cards: OpenItem<GroupCard>[]; checks: OpenItem<Verification>[]; teacher: OpenItem<TeacherSet>[] }
interface RawState { items: ({ kind: 'card' | 'verify' | 'teacher' } & OpenItem<unknown>)[] }

/** School Wi-Fi can stall a request for minutes; after this long it is given up and tried again later. */
export const OPEN_API_TIMEOUT = 15_000;
/** Status of a request that never got an answer (offline, cut off or too slow), so 401/403/409 handling stays as it is. */
export const NO_ANSWER = 0;
const noAnswer = (save: boolean, slow: boolean) => new StudioApiError(save
  ? `인터넷이 ${slow ? '느려서' : '잘 안 돼서'} 아직 저장하지 못했어요. 쓴 내용은 이 태블릿에 남아 있어요.`
  : `인터넷이 ${slow ? '느려서' : '잘 안 돼서'} 우리 반 카드를 새로 받지 못했어요. 잠시 뒤 저절로 다시 받아요.`, NO_ANSWER);

async function openApi<T>(path: string, token: string, body?: unknown): Promise<T> {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), OPEN_API_TIMEOUT);
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}api/open-lesson${path}`, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', signal: controller.signal,
      headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
    const value = await response.json().catch(() => ({}));
    // A body cut off by the timeout must not pass for an empty answer.
    if (controller.signal.aborted) throw noAnswer(body !== undefined, true);
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new StudioApiError(value.error || '저장 서버에 연결하지 못했어요. 쓴 내용은 이 기기에 남아 있어요.', response.status);
    return value as T;
  } catch (error) {
    // The browser's own wording ('Failed to fetch', 'The user aborted a request') is English and means nothing to a student.
    throw error instanceof StudioApiError ? error : noAnswer(body !== undefined, controller.signal.aborted);
  } finally { clearTimeout(timer); }
}

export type Loaded<T> = { ok: true; value: T } | { ok: false; error: unknown };
/**
 * Keeps class polling calm on slow Wi-Fi: a call made while the last load is still running is skipped
 * (unless that one has hung past `staleAfter`), and an answer is handed back only when no later-started
 * load has been shown yet, so an old reply never replaces a newer one. Skipped or outdated calls give undefined.
 */
export function latestLoads(staleAfter = 30_000, now = () => Date.now()) {
  let started = 0, shown = 0, busyUntil = 0;
  return async <T>(load: () => Promise<T>): Promise<Loaded<T> | undefined> => {
    if (now() < busyUntil) return;
    const ticket = ++started; busyUntil = now() + staleAfter;
    let result: Loaded<T>;
    try { result = { ok: true, value: await load() }; } catch (error) { result = { ok: false, error }; }
    if (ticket === started) busyUntil = 0;
    if (ticket < shown) return;
    shown = ticket; return result;
  };
}

export async function loadState(code: string, token: string): Promise<OpenState> {
  const { items = [] } = await openApi<RawState>(`/rooms/${code}`, token);
  const pick = <T,>(kind: string) => items.filter(item => item.kind === kind) as unknown as OpenItem<T>[];
  return { cards: pick<GroupCard>('card'), checks: pick<Verification>('verify'), teacher: pick<TeacherSet>('teacher') };
}
export const saveCard = (code: string, token: string, data: GroupCard, expectedVersion: number) =>
  openApi<{ saved: true; version: number }>(`/rooms/${code}/card`, token, { data, expectedVersion });
export const saveCheck = (code: string, token: string, data: Verification, expectedVersion: number) =>
  openApi<{ saved: true; version: number }>(`/rooms/${code}/verify/${data.target}`, token, { data, expectedVersion });
export const saveTeacherSet = (code: string, token: string, data: TeacherSet, expectedVersion: number, pin: string) =>
  openApi<{ saved: true; version: number }>(`/rooms/${code}/teacher/${data.artifactId}`, token, { data, expectedVersion, pin });

// The open lesson keeps its own entry so a tablet used for the Three Kingdoms lesson is not mixed up with it.
const sessionKey = (code: string) => `history-ar-open-session:${code}`;
export function readOpenSession(code: string): StudioSession | undefined {
  try { const value = JSON.parse(localStorage.getItem(sessionKey(code)) || 'null'); return value?.code === code && typeof value.token === 'string' ? value : undefined; } catch { return undefined; }
}
export function forgetOpenSession(code: string) { try { localStorage.removeItem(sessionKey(code)); } catch { /* nothing kept */ } }
export async function joinOpenLesson(code: string, name: string, group: number) {
  const session = await studioApi<StudioSession>('/join', undefined, { code, name, group }).catch((error: unknown) => {
    throw error instanceof StudioApiError ? error : new StudioApiError('인터넷이 잘 안 돼서 수업에 들어가지 못했어요. 인터넷이 되는지 확인해 주세요.', NO_ANSWER);
  });
  try { localStorage.setItem(sessionKey(session.code), JSON.stringify(session)); } catch { /* kept for this visit */ }
  return session;
}

/** One-time cleanup requested by the teacher for the example lesson, 2026-10-21.
 * Keep the room and entry session; only remove its old open-lesson drafts.
 */
export function clearRequestedExampleDrafts(key: string) {
  if (!key.startsWith('12345:')) return;
  const marker = 'history-ar-open-reset:12345:2026-10-21';
  try {
    if (localStorage.getItem(marker)) return;
    const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i));
    for (const storedKey of keys) {
      if (storedKey?.startsWith('history-ar-open-draft:12345:')) localStorage.removeItem(storedKey);
    }
    localStorage.setItem(marker, 'done');
  } catch { /* Storage unavailable: there is no readable persisted draft to restore. */ }
}

/** Drafts stay on the tablet so nothing typed is lost when the network drops mid-lesson. */
export function readDraft<T>(key: string, check: (value: unknown) => value is T): T | undefined {
  clearRequestedExampleDrafts(key);
  try { const value = JSON.parse(localStorage.getItem(`history-ar-open-draft:${key}`) || 'null'); return check(value) ? value : undefined; } catch { return undefined; }
}
export function writeDraft(key: string, value: unknown) { try { localStorage.setItem(`history-ar-open-draft:${key}`, JSON.stringify(value)); } catch { /* still in memory */ } }

export function itemVersion<T>(items: readonly OpenItem<T>[], key: string) { return items.find(item => item.key === key)?.version || 0; }
