import { studioApi, StudioApiError, type StudioSession } from '../ar-studio/api';
import type { GroupCard, TeacherSet, Verification } from './model';

export interface OpenItem<T> { key: string; version: number; data: T; updatedAt: string }
export interface OpenState { cards: OpenItem<GroupCard>[]; checks: OpenItem<Verification>[]; teacher: OpenItem<TeacherSet>[] }
interface RawState { items: ({ kind: 'card' | 'verify' | 'teacher' } & OpenItem<unknown>)[] }

async function openApi<T>(path: string, token: string, body?: unknown): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}api/open-lesson${path}`, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin',
    headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const value = await response.json().catch(() => ({}));
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new StudioApiError(value.error || '저장 서버에 연결하지 못했어요. 쓴 내용은 이 기기에 남아 있어요.', response.status);
  return value as T;
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
  const session = await studioApi<StudioSession>('/join', undefined, { code, name, group });
  try { localStorage.setItem(sessionKey(session.code), JSON.stringify(session)); } catch { /* kept for this visit */ }
  return session;
}

/** Drafts stay on the tablet so nothing typed is lost when the network drops mid-lesson. */
export function readDraft<T>(key: string, check: (value: unknown) => value is T): T | undefined {
  try { const value = JSON.parse(localStorage.getItem(`history-ar-open-draft:${key}`) || 'null'); return check(value) ? value : undefined; } catch { return undefined; }
}
export function writeDraft(key: string, value: unknown) { try { localStorage.setItem(`history-ar-open-draft:${key}`, JSON.stringify(value)); } catch { /* still in memory */ } }

export function itemVersion<T>(items: readonly OpenItem<T>[], key: string) { return items.find(item => item.key === key)?.version || 0; }
