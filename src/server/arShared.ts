import { isStudioProject } from '../features/ar-studio/project';
import { cheomseongdaeModel } from '../content/three-kingdoms/arModels';

export interface ArSharedConfig { url: string; key: string; fetch?: typeof fetch }
const MAX_BODY = 4_200_000;
const CODE = /^[a-z0-9]{4,12}$/;
const TOKEN = /^[a-f0-9]{64}$/;
const allowedOrigins = new Set(['https://ai-history-ar.vercel.app', 'https://ai-history-ar-themonsteredu.vercel.app', 'https://ai-history-ar-git-main-themonsteredu.vercel.app']);
const json = (value: unknown, status = 200, origin = '') => Response.json(value, { status, headers: {
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Vary': 'Origin',
  ...(allowedOrigins.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
} });
class RequestError extends Error { constructor(public status: number, message: string) { super(message); } }
async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new RequestError(415, 'JSON 요청만 사용할 수 있어요.');
  if (Number(request.headers.get('content-length')) > MAX_BODY) throw new RequestError(413, '작품은 4MB 이하, 녹음은 각각 30초 이내로 준비해 주세요.');
  const reader = request.body?.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  if (!reader) throw new RequestError(400, '입력 내용을 확인해 주세요.');
  for (;;) {
    const { value, done } = await reader.read(); if (done) break;
    size += value.length;
    if (size > MAX_BODY) { await reader.cancel(); throw new RequestError(413, '작품은 4MB 이하, 녹음은 각각 30초 이내로 준비해 주세요.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  chunks.forEach(chunk => { bytes.set(chunk, offset); offset += chunk.length; });
  try {
    const value = JSON.parse(new TextDecoder().decode(bytes));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new RequestError(400, '입력 내용을 확인해 주세요.'); }
}
async function hash(token: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))), n => n.toString(16).padStart(2, '0')).join('');
}

export function createArSharedHandler(config: ArSharedConfig) {
  const fetcher = config.fetch || fetch;
  // Short-lived, bounded abuse protection; classroom capacity is also enforced atomically in Postgres.
  const joins = new Map<string, { start: number; count: number }>();
  const numericRequests = new Map<string, { start: number; count: number }>();
  async function rpc(name: string, payload: Record<string, unknown>) {
    const response = await fetcher(`${config.url}/rest/v1/rpc/${name}`, { method: 'POST', signal: AbortSignal.timeout(20_000),
      headers: { 'Content-Type': 'application/json', apikey: config.key, Authorization: `Bearer ${config.key}` }, body: JSON.stringify(payload) });
    if (!response.ok) throw new RequestError(503, '공유 서버에 연결하지 못했어요. 현재 작업은 그대로 두고 다시 시도해 주세요.');
    const value = await response.json();
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new RequestError(503, '공유 서버 응답을 확인하지 못했어요.');
    return value;
  }
  async function numericRoom(code: string, request: Request) {
    const key = request.headers.get('x-forwarded-for') || 'shared', now = Date.now();
    if (numericRequests.size > 1000) numericRequests.clear();
    const limit = numericRequests.get(key);
    if (limit && now - limit.start < 60_000) { if (++limit.count > 180) throw new RequestError(429, '수업코드 저장 요청이 많아요. 잠시 뒤 다시 시도해 주세요.'); }
    else numericRequests.set(key, { start: now, count: 1 });
    return rpc('history_ar_create_numeric_room', { p_code: code });
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
      const path = url.pathname.replace(/^.*\/(?:history-ar|api\/ar-studio)/, '') || '/';
      if (path === '/health' && request.method === 'GET') return json({ status: config.url && config.key ? 'ready' : 'unconfigured', mode: 'shared' }, config.url && config.key ? 200 : 503, origin);
      if (!['GET', 'POST'].includes(request.method)) throw new RequestError(405, '지원하지 않는 요청입니다.');
      if (!config.url || !config.key) throw new RequestError(503, '공유 저장 서버 연결을 확인해 주세요.');
      const input = request.method === 'POST' ? await readBody(request) : {};
      if (path === '/classrooms' && request.method === 'POST') {
        const number = typeof input.code === 'string' ? input.code.trim() : '';
        if (!/^[0-9]{4,12}$/.test(number)) throw new RequestError(400, '숫자 수업코드는 4~12자리로 입력해 주세요.');
        const { _status, ...result } = await numericRoom(number, request);
        return json(result, _status || 200, origin);
      }
      let action = ''; let code = ''; let token = request.headers.get('authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1] || '';
      const payload: Record<string, unknown> = {};
      const joining = path === '/join' && request.method === 'POST';
      if (joining) {
        code = typeof input.code === 'string' ? input.code.trim().toLowerCase() : '';
        if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 30 || !Number.isInteger(input.group) || Number(input.group) < 1 || Number(input.group) > 6) throw new RequestError(400, '이름과 1~6모둠 중 내 모둠을 확인해 주세요.');
        const now = Date.now(); const key = `${code}:${request.headers.get('x-forwarded-for') || 'shared'}`;
        if (joins.size > 1000) joins.clear();
        const limit = joins.get(key);
        if (limit && now - limit.start < 60_000) { if (++limit.count > 90) throw new RequestError(429, '입장 요청이 많아요. 잠시 뒤 다시 시도해 주세요.'); }
        else joins.set(key, { start: now, count: 1 });
        token = Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join('');
        action = 'join'; payload.name = input.name.trim(); payload.group = input.group;
      } else {
        const match = path.match(/^\/rooms\/([a-z0-9]{4,12})(?:\/(.*))?$/);
        if (!match) throw new RequestError(404, '수업허브에서 수업을 열고 참여 코드로 입장해 주세요.');
        code = match[1]; const tail = match[2] || '';
        if (!TOKEN.test(token)) throw new RequestError(401, '수업코드로 먼저 입장해 주세요.');
        if (!tail && request.method === 'GET') action = 'room';
        else if (tail === 'answers') {
          action = request.method === 'GET' ? 'answers-get' : 'answers-save';
          if (request.method === 'POST') Object.assign(payload, { answers: input.answers, role: input.role, reflection: input.reflection, questionVersion: input.questionVersion });
        } else {
          const work = tail.match(/^works\/([1-6])$/);
          if (!work) throw new RequestError(403, '수업 열기·마감은 기존 수업허브에서 관리해 주세요.');
          payload.group = Number(work[1]);
          action = request.method === 'GET' ? (url.searchParams.get('draft') === '1' ? 'draft-get' : 'work-get') : 'work-save';
          if (request.method === 'POST') {
            if (!isStudioProject(input.project) || input.project.group !== payload.group || !Number.isInteger(input.expectedVersion) || Number(input.expectedVersion) < 0) throw new RequestError(400, '작품 형식과 저장본 번호를 확인해 주세요.');
            const project = input.project;
            if (project.ar.model?.asset === 'cheomseongdae-nsm-2015') {
              const original = cheomseongdaeModel(); project.ar.model = { ...original, rotation: project.ar.model.rotation };
            }
            payload.project = project; payload.expectedVersion = input.expectedVersion;
            payload.questions = project.questions.filter(q => q.prompt.trim() && q.options.every(o => o.trim()) && new Set(q.options.map(o => o.trim())).size === 3);
          }
        }
      }
      if (!CODE.test(code)) throw new RequestError(400, '수업코드는 영문과 숫자 4~12자로 입력해 주세요.');
      if (joining && /^[0-9]{4,12}$/.test(code)) {
        const { _status, ...result } = await numericRoom(code, request);
        if (_status) return json(result, _status, origin);
      }
      const value = await rpc('history_ar_dispatch', { p_action: action, p_code: code, p_token_hash: await hash(token), p_payload: payload });
      const { _status, ...result } = value;
      return json(joining && !_status ? { ...result, token } : result, _status || 200, origin);
    } catch (error) {
      return json({ error: error instanceof RequestError ? error.message : '공유 저장을 완료하지 못했어요. 현재 작업을 보관하고 다시 시도해 주세요.' }, error instanceof RequestError ? error.status : 503, origin);
    }
  };
}
