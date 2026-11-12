import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StudioApiError } from '../ar-studio/api';
import { assignGroupArtifact, clearRequestedExampleDrafts, forgetOpenSession, joinOpenLesson, latestLoads, loadState, NO_ANSWER, OPEN_API_TIMEOUT, readDraft, saveCard } from './api';
import { newCard } from './model';

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
/** A request that never answers, like a stalled school Wi-Fi; it only ends when its signal aborts. */
const hanging = (_url: unknown, init?: RequestInit) => new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('The user aborted a request.', 'AbortError'))));
const failure = (promise: Promise<unknown>) => promise.then(() => { throw new Error('should have failed'); }, (error: unknown) => error as StudioApiError);

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('open lesson requests on slow or missing internet', () => {
  it('gives up a save that gets no answer and says the writing is safe on the tablet', async () => {
    vi.stubGlobal('fetch', vi.fn(hanging));
    const result = failure(saveCard('5252', 'token', newCard(1), 0));
    await vi.advanceTimersByTimeAsync(OPEN_API_TIMEOUT - 1);
    let settled = false; void result.then(() => { settled = true; });
    await Promise.resolve(); expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    const error = await result;
    expect(error).toBeInstanceOf(StudioApiError);
    expect(error.status).toBe(NO_ANSWER);
    expect(error.message).toBe('인터넷이 느려서 아직 저장하지 못했어요. 쓴 내용은 이 태블릿에 남아 있어요.');
  });

  it('does not take a reply cut off by the timeout for an empty class', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_url: unknown, init?: RequestInit) => ({ ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }),
      json: () => hanging(_url, init) }) as unknown as Response));
    const result = failure(loadState('5252', 'token'));
    await vi.advanceTimersByTimeAsync(OPEN_API_TIMEOUT);
    const error = await result;
    expect(error.status).toBe(NO_ANSWER);
    expect(error.message).toContain('인터넷이 느려서 우리 반 카드를 새로 받지 못했어요.');
  });

  it('turns the browser’s English offline error into Korean', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    const save = await failure(saveCard('5252', 'token', newCard(1), 0));
    expect(save.status).toBe(NO_ANSWER);
    expect(save.message).toBe('인터넷이 잘 안 돼서 아직 저장하지 못했어요. 쓴 내용은 이 태블릿에 남아 있어요.');
    const read = await failure(loadState('5252', 'token'));
    expect(read.message).toBe('인터넷이 잘 안 돼서 우리 반 카드를 새로 받지 못했어요. 잠시 뒤 저절로 다시 받아요.');
    const join = await failure(joinOpenLesson('5252', '하늘', 1));
    expect(join.status).toBe(NO_ANSWER);
    expect(join.message).not.toMatch(/fetch/i);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps server answers as they were, including conflicts and lost entries', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    fetch.mockResolvedValueOnce(json({ saved: true, version: 3 }));
    await expect(saveCard('5252', 'token', newCard(1), 2)).resolves.toEqual({ saved: true, version: 3 });
    expect(vi.getTimerCount()).toBe(0);
    expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    expect(fetch.mock.calls[0][1].cache).toBe('no-store');
    fetch.mockResolvedValueOnce(json({ error: '다른 태블릿이 먼저 저장했어요.' }, 409));
    expect(await failure(saveCard('5252', 'token', newCard(1), 2))).toMatchObject({ status: 409, message: '다른 태블릿이 먼저 저장했어요.' });
    const shared = newCard(1, 3);
    fetch.mockResolvedValueOnce(json({ error: '충돌', version: 4, data: shared }, 409));
    expect(await failure(saveCard('5252', 'token', newCard(1), 2))).toMatchObject({ status: 409, current: { version: 4, data: shared } });
    fetch.mockResolvedValueOnce(json({ error: '입장 정보가 없어요.' }, 401));
    expect((await failure(loadState('5252', 'token'))).status).toBe(401);
    fetch.mockResolvedValueOnce(new Response('<html></html>', { status: 200, headers: { 'content-type': 'text/html' } }));
    expect(await failure(loadState('5252', 'token'))).toMatchObject({ status: 200, message: '저장 서버에 연결하지 못했어요. 쓴 내용은 이 기기에 남아 있어요.' });
    fetch.mockResolvedValueOnce(json({ items: [{ kind: 'card', key: '1', version: 1, data: newCard(1), updatedAt: '' }] }));
    expect((await loadState('5252', 'token')).cards).toHaveLength(1);
  });
});

describe('latestLoads', () => {
  const later = <T,>() => { let resolve!: (value: T) => void, reject!: (error: unknown) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };

  it('skips a tick while the last load is still running', async () => {
    const latest = latestLoads(), first = later<number>(), load = vi.fn(() => first.promise);
    const running = latest(load);
    await expect(latest(load)).resolves.toBeUndefined();
    expect(load).toHaveBeenCalledTimes(1);
    first.resolve(1);
    await expect(running).resolves.toEqual({ ok: true, value: 1 });
    await expect(latest(async () => 2)).resolves.toEqual({ ok: true, value: 2 });
  });

  it('starts again past a hung load and never lets its late reply replace a newer one', async () => {
    let now = 0;
    const latest = latestLoads(30_000, () => now), old = later<string>(), newer = later<string>();
    const oldRun = latest(() => old.promise);
    now = 29_999; await expect(latest(async () => 'skipped')).resolves.toBeUndefined();
    now = 30_000; const newRun = latest(() => newer.promise);
    newer.resolve('new');
    await expect(newRun).resolves.toEqual({ ok: true, value: 'new' });
    old.resolve('old');
    await expect(oldRun).resolves.toBeUndefined();
    // Once the newer one finished, the next tick runs right away.
    await expect(latest(async () => 'next')).resolves.toEqual({ ok: true, value: 'next' });
  });

  it('hands back a failure only when nothing newer was shown', async () => {
    let now = 0;
    const latest = latestLoads(10, () => now), old = later<string>(), newer = later<string>();
    const oldRun = latest(() => old.promise);
    now = 10; const newRun = latest(() => newer.promise);
    old.reject(new Error('offline'));
    await expect(oldRun).resolves.toMatchObject({ ok: false, error: new Error('offline') });
    newer.resolve('new');
    await expect(newRun).resolves.toEqual({ ok: true, value: 'new' });
    const late = later<string>(); now = 20;
    const lateRun = latest(() => late.promise); now = 30;
    await latest(async () => 'fresh');
    late.reject(new Error('timeout'));
    await expect(lateRun).resolves.toBeUndefined();
  });
});

describe('teacher artifact allocation', () => {
  it.each([undefined, 'goryeo-open-v2'])('sends only the initial assignment and expected version (%s)', async lesson => {
    const fetch = vi.fn().mockResolvedValueOnce(json({ saved: true, version: 3 }));
    vi.stubGlobal('fetch', fetch);
    await expect(assignGroupArtifact('1234', 'teacher-token', 2, 3, 2, 'teacher-pin', lesson)).resolves.toEqual({ saved: true, version: 3 });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, request] = fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/open-lesson\/rooms\/1234\/assignment\/2$/);
    expect(request.method).toBe('POST');
    expect(request.headers.Authorization).toBe('Bearer teacher-token');
    expect(JSON.parse(request.body)).toEqual({ artifactId: 3, expectedVersion: 2, pin: 'teacher-pin', ...(lesson ? { lesson } : {}) });
  });
});

describe('existing local work', () => {
  it.each(['12345', '123456'])('restores current work even without an old cleanup marker in room %s', code => {
    const card = { ...newCard(1, 1), members: '오늘 작성한 학생 이름' };
    const values = new Map<string, string>([
      [`history-ar-open-draft:${code}:card:1`, JSON.stringify(card)],
      [`history-ar-open-draft:${code}:verify:1:2`, 'existing verification'],
    ]);
    const removeItem = vi.fn((key: string) => values.delete(key));
    const setItem = vi.fn((key: string, value: string) => values.set(key, value));
    vi.stubGlobal('localStorage', { get length() { return values.size; }, key: (i: number) => [...values.keys()][i] ?? null,
      getItem: (key: string) => values.get(key) ?? null, setItem, removeItem });
    expect(readDraft(`${code}:card:1`, (value): value is typeof card => !!value && typeof value === 'object' && 'members' in value)).toEqual(card);
    expect(values.size).toBe(2);
    expect(removeItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });
});


describe('requested example cleanup', () => {
  it('clears the requested Joseon test room once without touching Goryeo or entry sessions', () => {
    const values = new Map<string, string>([
      ['history-ar-open-draft:123456:card:1', 'old card'],
      ['history-ar-open-draft:123456:verify:1:1', 'old check'],
      ['history-ar-open-draft:123456:teacher:1', 'old teacher set'],
      ['history-ar-open-draft:89123456:card:1', 'Goryeo card'],
      ['history-ar-open-draft:1234567:card:1', 'another room'],
      ['history-ar-open-session:123456', 'entry'],
    ]);
    vi.stubGlobal('localStorage', { get length() { return values.size; }, key: (i: number) => [...values.keys()][i] ?? null,
      getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) });
    clearRequestedExampleDrafts('123456:card:1');
    expect(values.has('history-ar-open-draft:123456:card:1')).toBe(false);
    expect(values.has('history-ar-open-draft:123456:verify:1:1')).toBe(false);
    expect(values.has('history-ar-open-draft:123456:teacher:1')).toBe(false);
    expect(values.get('history-ar-open-draft:89123456:card:1')).toBe('Goryeo card');
    expect(values.get('history-ar-open-draft:1234567:card:1')).toBe('another room');
    expect(values.get('history-ar-open-session:123456')).toBe('entry');
    values.set('history-ar-open-draft:123456:card:1', 'new card');
    clearRequestedExampleDrafts('123456:verify:1:1');
    expect(values.get('history-ar-open-draft:123456:card:1')).toBe('new card');
  });

  it('clears only code 12345 once and preserves newly written work and other rooms', () => {
    const values = new Map<string, string>([
      ['history-ar-open-draft:12345:card:1', 'old card'],
      ['history-ar-open-draft:12345:verify:1:2', 'old check'],
      ['history-ar-open-draft:12345:teacher:1', 'old teacher set'],
      ['history-ar-open-draft:123456:card:1', 'another room'],
      ['history-ar-open-session:12345', 'entry'],
    ]);
    vi.stubGlobal('localStorage', { get length() { return values.size; }, key: (i: number) => [...values.keys()][i] ?? null,
      getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) });
    clearRequestedExampleDrafts('9999:card:1');
    expect(values.size).toBe(5);
    clearRequestedExampleDrafts('12345:card:1');
    expect(values.has('history-ar-open-draft:12345:card:1')).toBe(false);
    expect(values.has('history-ar-open-draft:12345:verify:1:2')).toBe(false);
    expect(values.has('history-ar-open-draft:12345:teacher:1')).toBe(false);
    expect(values.get('history-ar-open-draft:123456:card:1')).toBe('another room');
    expect(values.get('history-ar-open-session:12345')).toBe('entry');
    values.set('history-ar-open-draft:12345:card:1', 'new card');
    clearRequestedExampleDrafts('12345:card:1');
    expect(values.get('history-ar-open-draft:12345:card:1')).toBe('new card');
  });
});


describe('classroom re-entry', () => {
  function storage() {
    const items = new Map<string, string>();
    return { getItem: (key: string) => items.get(key) ?? null, setItem: (key: string, value: string) => { items.set(key, value); }, removeItem: (key: string) => { items.delete(key); } };
  }
  const entry = { token: 'token-a', memberId: 'member-a', code: '891234', group: 2, name: '하늘' };
  it('reuses the same device entry after leaving, and creates another for a different group', async () => {
    vi.stubGlobal('localStorage', storage());
    const fetch = vi.fn().mockResolvedValueOnce(json(entry)).mockResolvedValueOnce(json({ items: [] })).mockResolvedValueOnce(json({ ...entry, group: 3, memberId: 'member-b', token: 'token-b' }));
    vi.stubGlobal('fetch', fetch);
    expect(await joinOpenLesson(entry.code, entry.name, entry.group)).toEqual(entry);
    forgetOpenSession(entry.code);
    expect(await joinOpenLesson(entry.code, entry.name, entry.group)).toEqual(entry);
    expect((await joinOpenLesson(entry.code, entry.name, 3)).memberId).toBe('member-b');
    expect(fetch.mock.calls.map(call => String(call[0]).includes('/join'))).toEqual([true, false, true]);
  });
  it('only creates a replacement when the cached entry is no longer valid', async () => {
    vi.stubGlobal('localStorage', storage());
    const fetch = vi.fn().mockResolvedValueOnce(json(entry)).mockResolvedValueOnce(json({ error: '입장 정보 만료' }, 403)).mockResolvedValueOnce(json({ ...entry, memberId: 'member-new', token: 'new' }));
    vi.stubGlobal('fetch', fetch);
    await joinOpenLesson(entry.code, entry.name, entry.group);
    expect((await joinOpenLesson(entry.code, entry.name, entry.group)).memberId).toBe('member-new');
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it('does not create a replacement while offline', async () => {
    vi.stubGlobal('localStorage', storage());
    const fetch = vi.fn().mockResolvedValueOnce(json(entry)).mockRejectedValueOnce(new TypeError('offline'));
    vi.stubGlobal('fetch', fetch);
    await joinOpenLesson(entry.code, entry.name, entry.group);
    expect((await failure(joinOpenLesson(entry.code, entry.name, entry.group))).status).toBe(NO_ANSWER);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('combines overlapping joins for the same entry into one request', async () => {
    vi.stubGlobal('localStorage', storage());
    let resolve!: (response: Response) => void;
    const fetch = vi.fn(() => new Promise<Response>(done => { resolve = done; }));
    vi.stubGlobal('fetch', fetch);
    const first = joinOpenLesson(entry.code, entry.name, entry.group);
    const second = joinOpenLesson(entry.code, entry.name, entry.group);
    expect(fetch).toHaveBeenCalledTimes(1);
    resolve(json(entry));
    expect(await first).toEqual(entry);
    expect(await second).toEqual(entry);
  });
});
