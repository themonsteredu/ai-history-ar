import { isGroupCard, isTeacherSet, isVerification } from '../features/open-class/model';

export interface OpenLessonConfig { url: string; key: string; teacherPin: string; fetch?: typeof fetch }
const MAX_BODY = 130_000;
const TOKEN = /^[a-f0-9]{64}$/;
const allowedOrigins = new Set(['https://ai-history-ar.vercel.app', 'https://ai-history-ar-themonsteredu.vercel.app', 'https://ai-history-ar-git-main-themonsteredu.vercel.app']);
const json = (value: unknown, status = 200, origin = '') => Response.json(value, { status, headers: {
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Vary': 'Origin',
  ...(allowedOrigins.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
} });
class RequestError extends Error { constructor(public status: number, message: string) { super(message); } }
async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new RequestError(415, 'JSON 요청만 사용할 수 있어요.');
  const raw = await request.text();
  if (raw.length > MAX_BODY) throw new RequestError(413, '저장할 내용이 너무 길어요. 설명을 조금 줄여 주세요.');
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new RequestError(400, '입력 내용을 확인해 주세요.'); }
}
async function hash(token: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))), n => n.toString(16).padStart(2, '0')).join('');
}

/** Joseon open lesson API. Students join through the existing /api/ar-studio/join; this only reads and saves the lesson's items. */
export function createOpenLessonHandler(config: OpenLessonConfig) {
  const fetcher = config.fetch || fetch;
  const writes = new Map<string, { start: number; count: number }>();
  async function rpc(payload: Record<string, unknown>) {
    const response = await fetcher(`${config.url}/rest/v1/rpc/history_ar_open_dispatch`, { method: 'POST', signal: AbortSignal.timeout(20_000),
      headers: { 'Content-Type': 'application/json', apikey: config.key, Authorization: `Bearer ${config.key}` }, body: JSON.stringify(payload) });
    if (!response.ok) throw new RequestError(503, '저장 서버에 연결하지 못했어요. 쓴 내용은 이 기기에 남아 있으니 다시 눌러 주세요.');
    const value = await response.json();
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new RequestError(503, '저장 서버 응답을 확인하지 못했어요.');
    return value as Record<string, unknown>;
  }
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('origin') || '';
    try {
      if (origin && !allowedOrigins.has(origin)) throw new RequestError(403, '수업 사이트에서 다시 열어 주세요.');
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: {
        'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type', 'Access-Control-Max-Age': '600', 'Vary': 'Origin',
      } });
      const url = new URL(request.url);
      const path = url.pathname.replace(/^.*\/(?:history-ar-open|api\/open-lesson)/, '') || '/';
      if (path === '/health' && request.method === 'GET') return json({ status: config.url && config.key ? 'ready' : 'unconfigured' }, config.url && config.key ? 200 : 503, origin);
      if (!['GET', 'POST'].includes(request.method)) throw new RequestError(405, '지원하지 않는 요청입니다.');
      if (!config.url || !config.key) throw new RequestError(503, '저장 서버 연결을 확인해 주세요.');
      const match = path.match(/^\/rooms\/([a-z0-9]{4,12})(?:\/(card|verify\/([1-6])|teacher\/([1-6])))?$/);
      if (!match) throw new RequestError(404, '수업 경로를 찾지 못했어요.');
      const token = request.headers.get('authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1] || '';
      if (!TOKEN.test(token)) throw new RequestError(401, '수업코드로 먼저 입장해 주세요.');
      const code = match[1], tail = match[2];
      const base = { p_code: code, p_token_hash: await hash(token) };
      if (!tail) {
        if (request.method !== 'GET') throw new RequestError(405, '지원하지 않는 요청입니다.');
        const { _status, ...result } = await rpc({ ...base, p_action: 'state', p_payload: {} });
        return json(result, Number(_status) || 200, origin);
      }
      if (request.method !== 'POST') throw new RequestError(405, '지원하지 않는 요청입니다.');
      const now = Date.now(), limitKey = `${code}:${request.headers.get('x-forwarded-for') || 'shared'}`;
      if (writes.size > 1000) writes.clear();
      const limit = writes.get(limitKey);
      if (limit && now - limit.start < 60_000) { if (++limit.count > 240) throw new RequestError(429, '저장 요청이 많아요. 잠시 뒤 다시 눌러 주세요.'); }
      else writes.set(limitKey, { start: now, count: 1 });
      const input = await readBody(request);
      if (!Number.isInteger(input.expectedVersion) || Number(input.expectedVersion) < 0) throw new RequestError(400, '저장본 번호를 확인해 주세요.');
      let kind = '', key = '';
      if (tail === 'card') {
        if (!isGroupCard(input.data)) throw new RequestError(400, '카드 내용의 길이와 형식을 확인해 주세요.');
        kind = 'card'; key = String(input.data.group);
      } else if (match[3]) {
        if (!isVerification(input.data) || input.data.target !== Number(match[3])) throw new RequestError(400, '검증 기록의 길이와 형식을 확인해 주세요.');
        kind = 'verify'; key = `${input.data.verifier}:${input.data.target}`;
      } else {
        // The same PIN that opens the teacher pages; the database trusts teacher writes only from this handler.
        if (typeof input.pin !== 'string' || !config.teacherPin || input.pin !== config.teacherPin) throw new RequestError(403, '선생님 PIN을 확인해 주세요.');
        if (!isTeacherSet(input.data) || input.data.artifactId !== Number(match[4])) throw new RequestError(400, '선생님 문제의 길이와 형식을 확인해 주세요.');
        kind = 'teacher'; key = String(input.data.artifactId);
      }
      const { _status, ...result } = await rpc({ ...base, p_action: 'save', p_payload: { kind, key, expectedVersion: input.expectedVersion, data: input.data } });
      return json(result, Number(_status) || 200, origin);
    } catch (error) {
      return json({ error: error instanceof RequestError ? error.message : '저장을 마치지 못했어요. 다시 눌러 주세요.' }, error instanceof RequestError ? error.status : 503, origin);
    }
  };
}
