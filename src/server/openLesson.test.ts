import { describe, expect, it, vi } from 'vitest';
import { createOpenLessonHandler } from './openLesson';
import { newCard, newPoint, newSelfVerification, newVerification } from '../features/open-class/model';

const token = 'b'.repeat(64);
function request(path: string, body?: unknown, headers: Record<string, string> = {}) {
  return new Request(`https://ai-history-ar.vercel.app/api/open-lesson${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
function setup(value: unknown = { saved: true, version: 1 }) {
  const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json(value));
  const handler = createOpenLessonHandler({ url: 'https://database.example', key: 'server-only-secret', teacherPin: '3035', fetch: fetcher });
  return { handler, fetcher, sent: () => JSON.parse(String(fetcher.mock.calls.at(-1)?.[1]?.body)) };
}
const card = () => ({ ...newCard(3, 2), points: [newPoint([0, .5, .2])] });

describe('open lesson Edge API', () => {
  it('reads the class state with the hashed member token only', async () => {
    const api = setup({ code: '5252', items: [] });
    const response = await api.handler(request('/rooms/5252'));
    expect(response.status).toBe(200);
    expect(api.fetcher.mock.calls[0][0]).toBe('https://database.example/rest/v1/rpc/history_ar_open_dispatch');
    const sent = api.sent();
    expect(sent.p_action).toBe('state'); expect(sent.p_code).toBe('5252');
    expect(sent.p_token_hash).toMatch(/^[a-f0-9]{64}$/); expect(sent.p_token_hash).not.toBe(token);
  });
  it('saves a valid card under its own group', async () => {
    const api = setup();
    const response = await api.handler(request('/rooms/5252/card', { data: card(), expectedVersion: 0 }));
    expect(response.status).toBe(200);
    expect(api.sent().p_payload).toMatchObject({ kind: 'card', key: '3', expectedVersion: 0 });
  });
  it('refuses malformed cards and checks before touching the database', async () => {
    const api = setup();
    expect((await api.handler(request('/rooms/5252/card', { data: { ...card(), group: 9 }, expectedVersion: 0 }))).status).toBe(400);
    expect((await api.handler(request('/rooms/5252/card', { data: card() }))).status).toBe(400);
    expect((await api.handler(request('/rooms/5252/verify/2', { data: newVerification(1, 3), expectedVersion: 0 }))).status).toBe(400);
    expect((await api.handler(request('/rooms/5252/card', { data: card(), expectedVersion: 0 }, { authorization: '' }))).status).toBe(401);
    expect(api.fetcher).not.toHaveBeenCalled();
  });
  it('keys a check by the checking and the checked group', async () => {
    const api = setup();
    expect((await api.handler(request('/rooms/5252/verify/3', { data: newVerification(1, 3), expectedVersion: 2 }))).status).toBe(200);
    expect(api.sent().p_payload).toMatchObject({ kind: 'verify', key: '1:3', expectedVersion: 2 });
  });
  it('allows explicitly marked own-group AI checks while rejecting unmarked self checks', async () => {
    const api = setup();
    expect((await api.handler(request('/rooms/5252/verify/2', {data:newSelfVerification(2),expectedVersion:0}))).status).toBe(200);
    expect(api.sent().p_payload).toMatchObject({kind:'verify',key:'2:2'});
    expect((await api.handler(request('/rooms/5252/verify/2', {data:newVerification(2,2),expectedVersion:0}))).status).toBe(400);
  });
  it('preserves Goryeo lesson tags when saving the prepared card and three AI drafts', async () => {
    const api = setup();
    const goryeoCard = { ...newCard(2, 3), lesson: 'goryeo-open-v2' };
    expect((await api.handler(request('/rooms/8912345/card', { data: goryeoCard, expectedVersion: 0 }))).status).toBe(200);
    expect(api.sent().p_payload.data.lesson).toBe('goryeo-open-v2');
    const check = { ...newSelfVerification(2), lesson: 'goryeo-open-v2' };
    expect((await api.handler(request('/rooms/8912345/verify/2', { data: check, expectedVersion: 0 }))).status).toBe(200);
    expect(api.sent().p_payload.data).toMatchObject({ lesson: 'goryeo-open-v2', selfQuestions: expect.arrayContaining(check.selfQuestions!) });
  });
  it('lets only the teacher PIN save teacher questions', async () => {
    const api = setup();
    const data = { version: 1, artifactId: 4, questions: [] };
    expect((await api.handler(request('/rooms/5252/teacher/4', { data, expectedVersion: 0, pin: '0000' }))).status).toBe(403);
    expect((await api.handler(request('/rooms/5252/teacher/4', { data, expectedVersion: 0 }))).status).toBe(403);
    expect(api.fetcher).not.toHaveBeenCalled();
    expect((await api.handler(request('/rooms/5252/teacher/4', { data, expectedVersion: 0, pin: '3035' }))).status).toBe(200);
    expect(api.sent().p_payload).toMatchObject({ kind: 'teacher', key: '4' });
    expect(api.sent().p_payload.pin).toBeUndefined();
  });
  it('requires the teacher PIN before assigning an artifact and never forwards the PIN', async () => {
    const api = setup();
    const body = { artifactId: 2, expectedVersion: 0, lesson: 'goryeo-open-v2' };
    expect((await api.handler(request('/rooms/895252/assignment/4', body))).status).toBe(403);
    expect((await api.handler(request('/rooms/895252/assignment/4', { ...body, pin: 'wrong' }))).status).toBe(403);
    expect(api.fetcher).not.toHaveBeenCalled();
    expect((await api.handler(request('/rooms/895252/assignment/4', { ...body, pin: '3035' }))).status).toBe(200);
    expect(api.sent()).toMatchObject({ p_action: 'assign', p_code: '895252', p_payload: { key: '4', artifactId: 2, expectedVersion: 0, lesson: 'goryeo-open-v2' } });
    expect(api.sent().p_payload.pin).toBeUndefined();
    expect(api.sent().p_payload.data).toBeUndefined();
  });
  it('rejects malformed assignments before touching the database', async () => {
    const api = setup();
    for (const patch of [{ artifactId: 0 }, { artifactId: 7 }, { artifactId: 1.5 }, { artifactId: '2' }, { expectedVersion: -1 }, { lesson: 'other' }]) {
      expect((await api.handler(request('/rooms/5252/assignment/1', { pin: '3035', artifactId: 1, expectedVersion: 0, ...patch }))).status).toBe(400);
    }
    expect(api.fetcher).not.toHaveBeenCalled();
  });
  it('does not bypass an already assigned card or a version conflict', async () => {
    const api = setup({ _status: 409, error: '이미 배정된 유물입니다.', version: 17 });
    const response = await api.handler(request('/rooms/5252/assignment/1', { pin: '3035', artifactId: 2, expectedVersion: 16 }));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: '이미 배정된 유물입니다.', version: 17 });
  });
  it('passes database refusals through with their status', async () => {
    const api = setup({ _status: 409, error: '다른 태블릿에서 먼저 저장했어요.' });
    const response = await api.handler(request('/rooms/5252/card', { data: card(), expectedVersion: 0 }));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: '다른 태블릿에서 먼저 저장했어요.' });
  });
  it('refuses other sites', async () => {
    const api = setup();
    expect((await api.handler(request('/rooms/5252', undefined, { origin: 'https://example.com' }))).status).toBe(403);
  });
});
