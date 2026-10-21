import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StudioApiError } from '../ar-studio/api';
import { clearRequestedExampleDrafts, joinOpenLesson, latestLoads, loadState, NO_ANSWER, OPEN_API_TIMEOUT, saveCard } from './api';
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
    fetch.mockResolvedValueOnce(json({ error: '다른 태블릿이 먼저 저장했어요.' }, 409));
    expect(await failure(saveCard('5252', 'token', newCard(1), 2))).toMatchObject({ status: 409, message: '다른 태블릿이 먼저 저장했어요.' });
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


describe('requested example cleanup', () => {
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
