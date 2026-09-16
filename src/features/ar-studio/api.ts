import type { StudioProject } from './project';
export interface StudioSession { token: string; memberId: string; code: string; group: number; name: string }
export interface PublicQuestion { id: string; group: number; prompt: string; options: string[]; pointId: string }
export interface GalleryWork { group: number; heritageId: number; title: string; version: number; updatedAt: string }
export interface Classroom { code: string; mode?: 'shared'; questionVersion?: string; phase: 'making' | 'visiting' | 'quiz' | 'review'; gallery: GalleryWork[]; questions?: PublicQuestion[]; hasGraph?: boolean; teacher?: boolean; canEdit?: boolean }
export interface QuizResult { submitted: boolean; questions?: PublicQuestion[]; questionVersion?: string; score?: number; total?: number; details?: { id: string; chosen: number; answer: number; correct: boolean; pointId: string; group: number }[] }
export class StudioApiError extends Error { constructor(message: string, public status: number) { super(message); } }
export async function studioApi<T>(path: string, token?: string, body?: unknown, method?: string): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}api/ar-studio${path}`, { method: method || (body === undefined ? 'GET' : 'POST'), credentials: 'same-origin', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const value = await response.json().catch(() => ({}));
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new StudioApiError(value.error || '수업 저장 서버에 연결하지 못했어요. 작업은 이 기기에 보관됩니다.', response.status);
  return value as T;
}
export const sessionKey = (code: string) => `history-ar-studio-session:${code}`;
export function readStudioSession(code: string): StudioSession | undefined {
  try { const value = JSON.parse(localStorage.getItem(sessionKey(code)) || 'null'); return value?.code === code && typeof value.token === 'string' ? value : undefined; } catch { return undefined; }
}
export const sessionHistoryKey = (code: string) => `history-ar-studio-sessions:${code}`;
/** Only the entry that first shared may change a group's work, so a replaced entry is kept to fall back on. */
export function readStudioSessions(code: string): StudioSession[] {
  try {
    const value = JSON.parse(localStorage.getItem(sessionHistoryKey(code)) || '[]');
    return Array.isArray(value) ? value.filter(item => item?.code === code && typeof item.token === 'string' && typeof item.memberId === 'string') : [];
  } catch { return []; }
}
export function keepStudioSession(session: StudioSession) {
  try {
    const previous = readStudioSession(session.code);
    if (previous && previous.memberId !== session.memberId) {
      const kept = [previous, ...readStudioSessions(session.code).filter(item => item.memberId !== previous.memberId)].slice(0, 5);
      localStorage.setItem(sessionHistoryKey(session.code), JSON.stringify(kept));
    }
    localStorage.setItem(sessionKey(session.code), JSON.stringify(session));
  } catch { /* session remains in memory */ }
}
export type { StudioProject };
