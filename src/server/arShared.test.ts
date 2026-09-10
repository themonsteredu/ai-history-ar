import { describe, expect, it, vi } from 'vitest';
import { createArSharedHandler } from './arShared';
import { newSampleProject } from '../features/ar-studio/sample';
import { cheomseongdaeModel } from '../content/three-kingdoms/arModels';

const token = 'a'.repeat(64);
function request(path: string, body?: unknown, headers: Record<string, string> = {}) {
  return new Request(`https://ai-history-ar.vercel.app/api/ar-studio${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
function setup(value: unknown = { saved: true, version: 1, shared: true }) {
  const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json(value));
  const handler = createArSharedHandler({ url: 'https://database.example', key: 'server-only-secret', fetch: fetcher });
  return { handler, fetcher, sent: () => JSON.parse(String(fetcher.mock.calls.at(-1)?.[1]?.body)) };
}

describe('shared classroom Edge API', () => {
  it('saves numeric classroom codes without a Hub account or exposing a member token', async () => {
    const api = setup({ code: '001234', saved: true, created: true, mode: 'numeric' });
    const response = await api.handler(request('/classrooms', { code: ' 001234 ' }, { authorization: '' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ code: '001234', saved: true, created: true, mode: 'numeric' });
    expect(api.fetcher.mock.calls[0][0]).toBe('https://database.example/rest/v1/rpc/history_ar_create_numeric_room');
    expect(api.sent()).toEqual({ p_code: '001234' });
  });
  it('rejects invalid classroom numbers before touching the database', async () => {
    const api = setup();
    for (const code of ['123', '1234567890123', 'hub123', 1234, null, '12 34']) {
      expect((await api.handler(request('/classrooms', { code }))).status).toBe(400);
    }
    expect(api.fetcher).not.toHaveBeenCalled();
  });
  it('creates a numeric room before joining, then issues the usual private member token', async () => {
    const api = setup({ code: '001234', group: 1, name: '테스트', memberId: 'member' });
    api.fetcher.mockResolvedValueOnce(Response.json({ code: '001234', saved: true, created: true, mode: 'numeric' }));
    const response = await api.handler(request('/join', { code: '001234', name: '테스트', group: 1 }));
    const value = await response.json();
    expect(response.status).toBe(200); expect(value.token).toMatch(/^[a-f0-9]{64}$/);
    expect(api.fetcher.mock.calls.map(call => call[0])).toEqual([
      'https://database.example/rest/v1/rpc/history_ar_create_numeric_room',
      'https://database.example/rest/v1/rpc/history_ar_dispatch',
    ]);
    expect(api.sent().p_action).toBe('join');
    expect(api.sent().p_token_hash).not.toBe(value.token);
  });
  it('does not join or reopen closed and expired numeric classrooms', async () => {
    for (const status of [403, 409]) {
      const api = setup({ _status: status, error: '다른 번호를 입력해 주세요.' });
      const response = await api.handler(request('/join', { code: '001234', name: '테스트', group: 1 }));
      expect(response.status).toBe(status);
      expect(await response.json()).toEqual({ error: '다른 번호를 입력해 주세요.' });
      expect(api.fetcher).toHaveBeenCalledTimes(1);
    }
  });
  it('limits repeated numeric creation requests without claiming they saved', async () => {
    const api = setup({ code: '001234', saved: true, created: false, mode: 'numeric' });
    for (let n = 0; n < 180; n++) expect((await api.handler(request('/classrooms', { code: '001234' }))).status).toBe(200);
    const response = await api.handler(request('/classrooms', { code: '001234' }));
    expect(response.status).toBe(429); expect((await response.json()).saved).toBeUndefined();
    expect(api.fetcher).toHaveBeenCalledTimes(180);
  });
  it('issues unique student tokens, sending only hashes to the database', async () => {
    const api = setup({ code: 'test01', group: 1, name: '테스트', memberId: 'member' });
    const a = await (await api.handler(request('/join', { code: ' TEST01 ', name: '테스트', group: 1 }))).json();
    const b = await (await api.handler(request('/join', { code: 'test01', name: '테스트', group: 1 }))).json();
    expect(a.token).toMatch(/^[a-f0-9]{64}$/); expect(b.token).not.toBe(a.token);
    expect(api.sent().p_token_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(api.sent().p_token_hash).not.toBe(b.token);
    expect(JSON.stringify(api.sent())).not.toContain(b.token);
    expect(JSON.stringify(a)).not.toContain('server-only-secret');
  });
  it('requires member tokens and never trusts teacher headers or public PINs', async () => {
    const api = setup();
    expect((await api.handler(request('/rooms/test01', undefined, { authorization: '', 'oai-authenticated-user-id': 'teacher' }))).status).toBe(401);
    expect((await api.handler(request('/rooms/test01/teacher'))).status).toBe(403);
    expect((await api.handler(request('/rooms', { code: 'test01', pin: '1234' }))).status).toBe(404);
    expect(api.fetcher).not.toHaveBeenCalled();
  });
  it('shares unfinished projects and publishes only complete questions', async () => {
    const api = setup(); const project = newSampleProject();
    project.questions[1].prompt = ''; project.modelChecked = false;
    project.ar.points[0].narration = { data: 'data:audio/wav;base64,UklGRg==', seconds: 1 };
    expect((await api.handler(request('/rooms/test01/works/1', { project, expectedVersion: 0 }))).status).toBe(200);
    expect(api.sent().p_action).toBe('work-save'); expect(api.sent().p_payload.questions).toHaveLength(1);
    expect(api.sent().p_payload.project.ar.points[0].narration).toEqual(project.ar.points[0].narration);
  });
  it('restores the official model credit at the server boundary', async () => {
    const api = setup(); const project = newSampleProject(); project.ar.model!.credit = 'replaced';
    await api.handler(request('/rooms/test01/works/1', { project, expectedVersion: 0 }));
    expect(api.sent().p_payload.project.ar.model.credit).toBe(cheomseongdaeModel().credit);
  });
  it('rejects malformed joins, foreign group projects and invalid versions before database access', async () => {
    const api = setup();
    for (const body of [{ code: '!', name: 'test', group: 1 }, { code: 'test01', name: ' ', group: 1 }, { code: 'test01', name: 'test', group: 7 }]) {
      expect((await api.handler(request('/join', body))).status).toBe(400);
    }
    for (const [path, body] of [['/rooms/test01/works/2', { project: newSampleProject(), expectedVersion: 0 }], ['/rooms/test01/works/1', { project: {}, expectedVersion: 0 }], ['/rooms/test01/works/1', { project: newSampleProject(), expectedVersion: -1 }]] as const) {
      expect((await api.handler(request(path, body))).status).toBe(400);
    }
    expect(api.fetcher).not.toHaveBeenCalled();
  });
  it('preserves database conflict status without exposing internal response fields', async () => {
    const api = setup({ _status: 409, error: '더 최근 저장본이 있어요.' });
    const response = await api.handler(request('/rooms/test01/works/1', { project: newSampleProject(), expectedVersion: 0 }));
    expect(response.status).toBe(409); expect(await response.json()).toEqual({ error: '더 최근 저장본이 있어요.' });
  });
  it('rejects foreign origins and oversized bodies', async () => {
    const api = setup();
    expect((await api.handler(request('/rooms/test01', undefined, { origin: 'https://foreign.example' }))).status).toBe(403);
    expect((await api.handler(request('/join', {}, { 'content-length': '4200001' }))).status).toBe(413);
    expect(api.fetcher).not.toHaveBeenCalled();
  });
  it('uses identical authenticated actions for rewritten and direct Edge paths', async () => {
    const api = setup();
    await api.handler(new Request('https://database.example/functions/v1/history-ar/rooms/test01/works/1?draft=1', { headers: { authorization: `Bearer ${token}` } }));
    expect(api.sent().p_action).toBe('draft-get');
    await api.handler(request('/rooms/test01/works/1')); expect(api.sent().p_action).toBe('work-get');
  });
  it('binds quiz submission to its question version and hides upstream errors', async () => {
    const api = setup();
    await api.handler(request('/rooms/test01/answers', { answers: { q: 1 }, role: 'test', reflection: 'test', questionVersion: 'version1' }));
    expect(api.sent().p_payload.questionVersion).toBe('version1');
    api.fetcher.mockRejectedValueOnce(new Error('server-only-secret'));
    const response = await api.handler(request('/rooms/test01'));
    expect(response.status).toBe(503); expect(await response.text()).not.toContain('server-only-secret');
  });
  it('reports missing server configuration truthfully', async () => {
    expect((await createArSharedHandler({ url: '', key: '' })(request('/health'))).status).toBe(503);
  });
});
