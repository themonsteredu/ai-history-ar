// Classroom tokens are random and bound to a member; teacher reads also require
// the same teacher PIN used by the existing open-lesson teacher endpoint.
const url = Deno.env.get('SUPABASE_URL') || '';
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const teacherPin = Deno.env.get('OPEN_LESSON_TEACHER_PIN') || '3035';
const limit = 1_600_000;
const allowed = new Set(['https://ai-history-ar.vercel.app', 'https://ai-history-ar-themonsteredu.vercel.app', 'https://ai-history-ar-git-main-themonsteredu.vercel.app']);
const failures = new Map<string, { start: number; count: number }>();
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
async function read(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new Error('입력 내용을 확인해 주세요.');
  const reader = request.body?.getReader(); if (!reader) throw new Error('입력 내용을 확인해 주세요.');
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > limit) { await reader.cancel(); throw new Error('공유할 내용이 너무 커요.'); } chunks.push(value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
Deno.serve(async request => {
  try {
    const origin = request.headers.get('origin') || '';
    if (origin && !allowed.has(origin) && !/^https:\/\/ai-history-ar-[a-z0-9-]+-themonsteredu\.vercel\.app$/.test(origin)) return json({ error: '수업 사이트에서 다시 열어 주세요.' }, 403);
    const path = new URL(request.url).pathname.replace(/^.*\/(?:history-ar-course|api\/course-work)/, '');
    if (path === '/health' && request.method === 'GET') return json({ status: url && key ? 'ready' : 'unconfigured' }, url && key ? 200 : 503);
    const match = path.match(/^\/rooms\/([a-z0-9]{4,12})\/(three-kingdoms|joseon)\/([1-6])$/);
    const token = request.headers.get('authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
    if (!match || !token) return json({ error: '수업에 먼저 입장해 주세요.' }, 401);
    if (!url || !key) return json({ error: '공유 서버를 확인해 주세요.' }, 503);
    const action = request.method === 'GET' ? 'teacher' : request.method === 'POST' ? 'save' : '';
    if (!action) return json({ error: '지원하지 않는 요청이에요.' }, 405);
    if (action === 'teacher') {
      const ip = request.headers.get('x-forwarded-for') || 'shared'; const now = Date.now();
      const prior = failures.get(ip); if (prior && now - prior.start < 60_000 && prior.count >= 15) return json({ error: '잠시 뒤 다시 시도해 주세요.' }, 429);
      if (request.headers.get('x-teacher-pin') !== teacherPin) {
        if (failures.size > 1000) failures.clear(); failures.set(ip, prior && now - prior.start < 60_000 ? { ...prior, count: prior.count + 1 } : { start: now, count: 1 });
        return json({ error: '교사 확인 정보를 확인해 주세요.' }, 403);
      }
    }
    const data = action === 'save' ? await read(request) : {};
    if (action === 'save' && (!data || typeof data !== 'object' || Array.isArray(data) || !['note', 'data', 'ar'].includes(data.kind))) return json({ error: '공유할 내용을 확인해 주세요.' }, 400);
    const tokenHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))), n => n.toString(16).padStart(2, '0')).join('');
    const response = await fetch(`${url}/rest/v1/rpc/history_ar_course_progress`, { method: 'POST', signal: AbortSignal.timeout(20_000), headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` }, body: JSON.stringify({ p_action: action, p_code: match[1], p_token_hash: tokenHash, p_era: match[2], p_lesson: Number(match[3]), p_data: data }) });
    if (!response.ok) return json({ error: '공유 서버에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요.' }, 503);
    const result = await response.json(); const { _status, ...body } = result; return json(body, _status || 200);
  } catch { return json({ error: '공유하지 못했어요. 이 기기의 작업은 그대로 보관됩니다.' }, 503); }
});
