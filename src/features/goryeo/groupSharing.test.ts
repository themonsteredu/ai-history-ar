import { afterEach, describe, expect, it, vi } from 'vitest';
import { isVerification } from '../open-class/model';
import { GORYEO_ROOM_CODE, joinGoryeoRoom, loadGoryeoRoom, readGoryeoSession, recordsToVerification, submitGoryeoRecords, verificationToRecords, verificationToSubmission, type Records } from './groupSharing';

const rows: Records = {
  'tripitaka-1': { choice: 'X', response: 'O예요. 금속판이에요.', responseChoice: 'X', check: '틀린 설명', evidence: '목판에 새겼어요.', correction: '금속판이 아니라 나무판이에요.' },
  'type-0': { choice: 'O', check: '맞는 설명', evidence: '인쇄에 쓰였어요.' },
  'vase-1': { choice: 'O' },
};
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
const storage = () => { const map = new Map<string, string>(); return { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => map.set(key, value), removeItem: (key: string) => map.delete(key) }; };
const session = (group: number) => ({ code: GORYEO_ROOM_CODE, group, memberId: `member-${group}`, token: `token-${group}`, name: `${group}모둠` });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('Goryeo group submissions', () => {
  it('round trips written judgments and source evidence with their own question identity', () => {
    const data = recordsToVerification(2, rows);
    expect(isVerification(data)).toBe(true);
    expect(data.items).toHaveLength(2);
    expect(verificationToRecords(data)).toEqual({ 'tripitaka-1': rows['tripitaka-1'], 'type-0': { ...rows['type-0'], response: undefined, responseChoice: undefined, correction: undefined } });
    const result = verificationToSubmission(data, '2026-10-29T00:00:00Z');
    expect(result.group).toBe(2);
    expect(result.entries.find(item => item.artifactId === 'tripitaka')).toMatchObject({ questionIndex: 1, choice: 'X', judgment: '틀린 설명', robotAnswer: 'O예요. 금속판이에요.', evidence: '목판에 새겼어요.', correction: '금속판이 아니라 나무판이에요.' });
  });
  it('rejects empty, invalid, and overlong entries instead of dropping text', () => {
    expect(() => recordsToVerification(0, rows)).toThrow('모둠');
    expect(() => recordsToVerification(1, { 'type-0': { choice: 'O' } })).toThrow('한 가지 이상');
    expect(() => recordsToVerification(1, { 'type-0': { check: '틀린 설명', evidence: '가'.repeat(401) } })).toThrow('400자');
    expect(() => recordsToVerification(1, { 'type-0': { correction: '가'.repeat(201) } })).toThrow('200자');
    expect(() => recordsToVerification(1, { ...rows, reflection: { evidence: '가'.repeat(601) } })).toThrow('600자');
  });
  it('shares the group reflection and restores it on a different device', () => {
    const reflection = 'AI의 대답을 근거 자료와 비교해야 해요.\n틀릴 수 있기 때문이에요.';
    const data = recordsToVerification(3, { ...rows, reflection: { evidence: reflection } });
    expect(isVerification(data)).toBe(true);
    expect(data.notes?.learned).toBe(reflection);
    expect(verificationToRecords(data).reflection).toEqual({ evidence: reflection });
    expect(verificationToSubmission(data, '2026-10-29T00:00:00Z').reflection).toBe(reflection);
    expect(verificationToSubmission({ ...data, notes: undefined }, '').reflection).toBe('');
  });
  it('keeps a separate session per group, checks the code, and reuses that group session', async () => {
    vi.stubGlobal('localStorage', storage());
    const fetch = vi.fn().mockResolvedValueOnce(json(session(1))).mockResolvedValueOnce(json(session(2)));
    vi.stubGlobal('fetch', fetch);
    await expect(joinGoryeoRoom('wrong', 1)).rejects.toThrow('입장 코드');
    await joinGoryeoRoom('12345', 1); await joinGoryeoRoom('12345', 2); await joinGoryeoRoom('12345', 1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(readGoryeoSession(1)?.token).toBe('token-1'); expect(readGoryeoSession(2)?.token).toBe('token-2');
  });
  it('loads every group but takes the current group version, and does not overwrite stale work', async () => {
    const v1 = recordsToVerification(1, rows), v2 = recordsToVerification(2, rows);
    const fetch = vi.fn().mockResolvedValueOnce(json({ items: [
      { kind: 'verify', key: '1:1', version: 5, data: v1, updatedAt: '2026-10-29T00:00:00Z' },
      { kind: 'verify', key: '2:2', version: 3, data: v2, updatedAt: '2026-10-29T00:00:00Z' },
    ] })).mockResolvedValueOnce(json({ error: 'conflict' }, 409));
    vi.stubGlobal('fetch', fetch); vi.stubGlobal('localStorage', storage());
    const result = await loadGoryeoRoom(session(2));
    expect(result.version).toBe(3); expect(result.submissions).toHaveLength(2);
    await expect(submitGoryeoRecords(session(2), rows, result.version)).rejects.toMatchObject({ status: 409, message: expect.stringContaining('다른 기기') });
    expect(JSON.parse(fetch.mock.calls[1][1].body).expectedVersion).toBe(3);
  });
});
