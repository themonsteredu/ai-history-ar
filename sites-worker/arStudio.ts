import { isStudioProject, submissionProblems, type StudioQuestion } from '../src/features/ar-studio/project';

interface Statement { bind(...values: unknown[]): Statement; first<T = Record<string, unknown>>(): Promise<T | null>; all<T = Record<string, unknown>>(): Promise<{ results: T[] }>; run(): Promise<{ meta: { changes: number } }> }
interface Database { prepare(sql: string): Statement }
interface Bucket { get(key: string): Promise<{ text(): Promise<string> } | null>; put(key: string, value: string, options?: unknown): Promise<unknown>; delete(key: string): Promise<unknown> }
export interface StudioEnv { DB?: Database; BUCKET?: Bucket }
interface Room { code: string; owner: string; phase: string; graph_key: string | null }
interface Member { id: string; code: string; group_no: number; name: string; can_edit: number }
interface Work { group_no: number; heritage_id: number; version: number; object_key: string; questions: string; updated_at: string; submitted: number }
interface Answer { answers: string; score: number; total: number }
class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
function fail(status: number, message: string): never { throw new HttpError(status, message); }
const codeValue = (value: unknown) => typeof value === 'string' && /^[a-z0-9]{4,12}$/.test(value) ? value : fail(400, '수업코드는 영문 소문자와 숫자 4~12자로 입력해 주세요.');
const textValue = (value: unknown, max: number) => typeof value === 'string' && value.trim().length > 0 && value.length <= max ? value.trim() : fail(400, '이름·역할·배운 점의 길이와 내용을 확인해 주세요.');
async function body(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) fail(415, 'JSON 요청만 사용할 수 있어요.');
  const reader = request.body?.getReader(); if (!reader) return {};
  let length = 0; const chunks: Uint8Array[] = [];
  for (;;) { const { done, value } = await reader.read(); if (done) break; length += value.length; if (length > 4_200_000) { await reader.cancel(); fail(413, '작품이 너무 커요. 녹음은 각각 30초 이내로 줄여 주세요.'); } chunks.push(value); }
  const bytes = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { const value = JSON.parse(new TextDecoder().decode(bytes)); if (!value || typeof value !== 'object' || Array.isArray(value)) fail(400, '요청 형식을 확인해 주세요.'); return value; } catch { return fail(400, '요청 형식을 확인해 주세요.'); }
}
async function hash(value: string) { const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)); return Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, '0')).join(''); }
function teacherId(request: Request) {
  // These headers are set/overwritten by the Sites dispatcher, never by the app's PIN gate.
  const id = request.headers.get('oai-authenticated-user-id'); if (!id) return fail(401, '전시를 준비하려면 교사 계정으로 연결해 주세요.'); return id;
}
function mustOwn(request: Request, room: Room) { if (teacherId(request) !== room.owner) fail(403, '이 수업의 선생님만 진행 상태와 개인 기록을 확인할 수 있어요.'); }
async function memberOf(request: Request, db: Database, code: string) {
  const token = request.headers.get('authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token) return fail(401, '수업코드로 먼저 입장해 주세요.');
  const member = await db.prepare('SELECT id, code, group_no, name, can_edit FROM ar_members WHERE token_hash = ? AND code = ?').bind(await hash(token), code).first<Member>();
  if (!member) return fail(403, '이 수업의 입장 정보가 아니에요.'); return member;
}
async function workRows(db: Database, code: string) { return (await db.prepare('SELECT group_no, heritage_id, version, object_key, questions, updated_at FROM ar_works WHERE code = ? AND submitted = 1 ORDER BY group_no').bind(code).all<Work>()).results; }
function quizOf(rows: Work[]) {
  return rows.flatMap(row => (JSON.parse(row.questions) as StudioQuestion[]).map(q => ({ ...q, id: `${row.group_no}:${q.id}`, group: row.group_no })));
}
const publicQuestion = ({ answer: _answer, ...question }: ReturnType<typeof quizOf>[number]) => question;
async function roomView(db: Database, bucket: Bucket, room: Room, teacher = false) {
  const rows = await workRows(db, room.code);
  const view: Record<string, unknown> = { code: room.code, phase: room.phase, teacher, gallery: room.phase !== 'making' || teacher ? rows.map(row => ({ group: row.group_no, heritageId: row.heritage_id, title: `유물 전시 · 해설과 문제`, version: row.version, updatedAt: row.updated_at })) : [] };
  if (['quiz', 'review'].includes(room.phase)) view.questions = quizOf(rows).map(publicQuestion);
  if (room.graph_key) view.hasGraph = true;
  return view;
}
async function resultView(db: Database, member: Member, room: Room) {
  const result = await db.prepare('SELECT answers, score, total FROM ar_answers WHERE member_id = ? AND code = ?').bind(member.id, room.code).first<Answer>();
  if (!result) return { submitted: false };
  if (room.phase !== 'review') return { submitted: true };
  return { submitted: true, score: result.score, total: result.total, details: JSON.parse(result.answers) };
}
export async function handleStudio(request: Request, env: StudioEnv): Promise<Response> {
  try {
    const url = new URL(request.url), path = url.pathname.replace(/^.*\/api\/ar-studio/, '');
    if (!['GET', 'POST'].includes(request.method)) return json({ error: '지원하지 않는 요청입니다.' }, 405);
    const origin = request.headers.get('origin');
    if (request.method === 'POST' && origin && origin !== url.origin) fail(403, '수업 사이트에서 다시 시도해 주세요.');
    const db = env.DB, bucket = env.BUCKET;
    if (!db || !bucket) fail(503, '공유 저장 서버를 준비 중이에요. 작업 파일을 보관하고 선생님께 알려 주세요.');
    if (path === '/rooms' && request.method === 'POST') {
      const owner = teacherId(request), data = await body(request), code = codeValue(data.code);
      const room = await db.prepare('SELECT code, owner, phase, graph_key FROM ar_classrooms WHERE code = ?').bind(code).first<Room>();
      if (room) { mustOwn(request, room); return json(await roomView(db, bucket, room, true)); }
      await db.prepare("INSERT OR IGNORE INTO ar_classrooms (code, owner, phase, created_at) VALUES (?, ?, 'making', ?)").bind(code, owner, new Date().toISOString()).run();
      const created = await db.prepare('SELECT code, owner, phase, graph_key FROM ar_classrooms WHERE code = ?').bind(code).first<Room>();
      if (!created) fail(503, '전시관을 만들지 못했어요.'); mustOwn(request, created); return json(await roomView(db, bucket, created, true));
    }
    if (path === '/join' && request.method === 'POST') {
      const data = await body(request), code = codeValue(data.code), name = textValue(data.name, 30);
      if (!Number.isInteger(data.group) || data.group < 1 || data.group > 6) fail(400, '1~6모둠 중 내 모둠을 골라 주세요.');
      const room = await db.prepare('SELECT code FROM ar_classrooms WHERE code = ?').bind(code).first(); if (!room) fail(404, '선생님이 이 코드의 전시관을 먼저 준비해야 해요.');
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join(''), id = crypto.randomUUID();
      const inserted = await db.prepare('INSERT INTO ar_members (id, code, token_hash, name, group_no, created_at) SELECT ?, ?, ?, ?, ?, ? WHERE (SELECT count(*) FROM ar_members WHERE code = ?) < 100').bind(id, code, await hash(token), name, data.group, new Date().toISOString(), code).run();
      if (!inserted.meta.changes) fail(429, '이 수업의 입장 인원을 확인해 주세요. 기존 태블릿에서는 이전 입장으로 이어 할 수 있어요.');
      return json({ token, memberId: id, code, name, group: data.group });
    }
    const match = path.match(/^\/rooms\/([a-z0-9]{4,12})(?:\/(.*))?$/); if (!match) fail(404, '수업 경로를 찾지 못했어요.');
    const code = match[1], action = match[2] || '';
    const room = await db.prepare('SELECT code, owner, phase, graph_key FROM ar_classrooms WHERE code = ?').bind(code).first<Room>(); if (!room) fail(404, '수업코드를 확인해 주세요.');
    if (action === 'teacher' && request.method === 'GET') {
      mustOwn(request, room); const view = await roomView(db, bucket, room, true);
      const reports = (await db.prepare('SELECT m.name, m.group_no AS "group", a.score, a.total, a.role, a.reflection FROM ar_answers a JOIN ar_members m ON m.id = a.member_id WHERE a.code = ? ORDER BY m.group_no, a.created_at').bind(code).all()).results;
      const members = (await db.prepare('SELECT id, name, group_no AS "group", can_edit AS canEdit FROM ar_members WHERE code = ? ORDER BY group_no, created_at').bind(code).all()).results;
      return json({ ...view, reports, members });
    }
    if (action === 'editor' && request.method === 'POST') {
      mustOwn(request, room); if (room.phase !== 'making') fail(409, '제작 중에만 제출 담당을 바꿀 수 있어요.');
      const data = await body(request);
      const selected = await db.prepare('SELECT id, group_no FROM ar_members WHERE id = ? AND code = ?').bind(String(data.memberId || ''), code).first<Member>();
      if (!selected) fail(404, '입장한 학생을 선택해 주세요.');
      await db.prepare("UPDATE ar_members SET can_edit = CASE WHEN id = ? THEN 1 ELSE 0 END WHERE code = ? AND group_no = ? AND EXISTS (SELECT 1 FROM ar_classrooms WHERE code = ? AND phase = 'making')").bind(selected.id, code, selected.group_no, code).run();
      return json({ saved: true });
    }
    if (action === 'phase' && request.method === 'POST') {
      mustOwn(request, room); const data = await body(request);
      const next: Record<string, string> = { making: 'visiting', visiting: 'quiz', quiz: 'review' };
      if (data.phase !== next[room.phase]) fail(409, '제작 → 전시 → 퀴즈 → 정답 공개 순서로 진행해 주세요.');
      if (!(await workRows(db, code)).length) fail(409, '모둠 작품을 한 개 이상 제출한 뒤 시작해 주세요.');
      const result = await db.prepare('UPDATE ar_classrooms SET phase = ? WHERE code = ? AND owner = ? AND phase = ?').bind(data.phase, code, room.owner, room.phase).run();
      if (!result.meta.changes) fail(409, '진행 상태가 바뀌었어요. 다시 확인해 주세요.'); return json({ phase: data.phase });
    }
    if (action === 'graph' && request.method === 'POST') {
      mustOwn(request, room); if (room.phase !== 'making') fail(409, '전시 시작 전까지만 그래프를 바꿀 수 있어요.');
      const data = await body(request);
      if (typeof data.data !== 'string' || data.data.length > 2_000_100 || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(data.data)) fail(400, '1.5MB 이하의 PNG·JPG·WebP 그래프를 골라 주세요.');
      const key = `ar/${code}/graph/${crypto.randomUUID()}`; await bucket.put(key, data.data);
      const result = await db.prepare("UPDATE ar_classrooms SET graph_key = ? WHERE code = ? AND owner = ? AND phase = 'making'").bind(key, code, room.owner).run();
      if (!result.meta.changes) { await bucket.delete(key); fail(409, '전시가 시작되어 그래프를 고정했어요.'); } return json({ saved: true });
    }
    const member = await memberOf(request, db, code);
    if (action === 'graph' && request.method === 'GET') {
      if (!room.graph_key) fail(404, '아직 공통 그래프를 올리지 않았어요.');
      const object = await bucket.get(room.graph_key); if (!object) fail(503, '그래프를 불러오지 못했어요.');
      return json({ data: await object.text() });
    }
    if (action === '' && request.method === 'GET') return json({ ...await roomView(db, bucket, room), canEdit: !!member.can_edit });
    const workMatch = action.match(/^works\/([1-6])$/);
    if (workMatch) {
      const group = Number(workMatch[1]);
      if (request.method === 'GET') {
        const ownDraft = url.searchParams.get('draft') === '1';
        if (ownDraft && room.phase !== 'making') fail(403, '전시 시작 후에는 제작용 정답을 다시 열 수 없어요. 관람 화면을 이용해 주세요.');
        if (ownDraft && !member.can_edit) fail(403, '선생님이 지정한 모둠 제출 담당만 제작 파일을 열 수 있어요.');
        if ((room.phase === 'making' || ownDraft) && group !== member.group_no) fail(403, '제작 중에는 우리 모둠 작품만 열 수 있어요.');
        const row = await db.prepare('SELECT object_key, version, submitted FROM ar_works WHERE code = ? AND group_no = ?').bind(code, group).first<Work>(); if (!row || (!ownDraft && !row.submitted)) fail(404, '아직 이 모둠이 제출한 작품이 없어요.');
        const object = await bucket.get(row.object_key); if (!object) fail(503, '작품 파일을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.');
        const project = JSON.parse(await object.text());
        if (ownDraft) return json({ project, version: row.version });
        return json({ heritageId: project.heritageId, ar: { ...project.ar, question: '', answerId: project.ar.points[0].id }, group, version: row.version });
      }
      if (group !== member.group_no) fail(403, '우리 모둠 작품만 제출할 수 있어요.');
      if (!member.can_edit) fail(403, '선생님이 이 태블릿을 모둠 제출 담당으로 지정해야 해요.');
      if (room.phase !== 'making') fail(409, '전시가 시작되어 제출 작품은 고정되어 있어요.');
      const data = await body(request), project = data.project;
      if (!isStudioProject(project) || project.group !== group) fail(400, '작품 형식을 확인해 주세요.');
      const submitted = data.submit === false ? 0 : 1;
      if (submitted && submissionProblems(project).length) fail(400, '모형·해설 3~4개·문제 2~3개를 모두 확인해 주세요.');
      if (!Number.isInteger(data.expectedVersion) || data.expectedVersion < 0) fail(400, '저장본 번호를 확인해 주세요.');
      const key = `ar/${code}/works/${group}/${crypto.randomUUID()}.json`, version = data.expectedVersion + 1;
      await bucket.put(key, JSON.stringify(project), { httpMetadata: { contentType: 'application/json' } });
      let changed: boolean;
      try {
        const values = [project.heritageId, version, submitted, key, JSON.stringify(project.questions), member.id, new Date().toISOString()];
        const result = data.expectedVersion === 0
          ? await db.prepare("INSERT OR IGNORE INTO ar_works (code, group_no, heritage_id, version, submitted, object_key, questions, updated_by, updated_at) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM ar_classrooms WHERE code = ? AND phase = 'making' AND EXISTS (SELECT 1 FROM ar_members WHERE id = ? AND can_edit = 1))").bind(code, group, ...values, code, member.id).run()
          : await db.prepare("UPDATE ar_works SET heritage_id = ?, version = ?, submitted = ?, object_key = ?, questions = ?, updated_by = ?, updated_at = ? WHERE code = ? AND group_no = ? AND version = ? AND EXISTS (SELECT 1 FROM ar_classrooms WHERE code = ? AND phase = 'making' AND EXISTS (SELECT 1 FROM ar_members WHERE id = ? AND can_edit = 1))").bind(...values, code, group, data.expectedVersion, code, member.id).run();
        changed = result.meta.changes > 0;
      } catch (error) { await bucket.delete(key).catch(() => {}); throw error; }
      if (!changed) { await bucket.delete(key); fail(409, '다른 친구가 먼저 제출했거나 전시가 시작됐어요. 현재 작업을 파일로 보관하고 제출된 모둠 작품을 확인해 주세요.'); }
      return json({ saved: true, version });
    }
    if (action === 'answers') {
      if (request.method === 'GET') return json(await resultView(db, member, room));
      if (room.phase !== 'quiz') fail(409, '선생님이 퀴즈를 진행하는 동안 제출할 수 있어요.');
      const data = await body(request), role = textValue(data.role, 300), reflection = textValue(data.reflection, 1000);
      const questions = quizOf(await workRows(db, code));
      if (!data.answers || typeof data.answers !== 'object' || Array.isArray(data.answers) || Object.keys(data.answers).length !== questions.length || !questions.length || questions.some(q => !Number.isInteger(data.answers[q.id]) || data.answers[q.id] < 0 || data.answers[q.id] > 2)) fail(400, '모든 문제의 답을 하나씩 골라 주세요.');
      const details = questions.map(q => ({ id: q.id, chosen: data.answers[q.id], answer: q.answer, correct: data.answers[q.id] === q.answer, group: q.group, pointId: q.pointId }));
      await db.prepare("INSERT OR IGNORE INTO ar_answers (member_id, code, answers, score, total, role, reflection, created_at) SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM ar_classrooms WHERE code = ? AND phase = 'quiz')").bind(member.id, code, JSON.stringify(details), details.filter(d => d.correct).length, details.length, role, reflection, new Date().toISOString(), code).run();
      const saved = await resultView(db, member, room); if (!saved.submitted) fail(409, '퀴즈가 마감되었어요. 선생님께 알려 주세요.'); return json(saved);
    }
    return json({ error: '수업 경로를 찾지 못했어요.' }, 404);
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    console.error('AR studio request failed', error instanceof Error ? error.name : 'Unknown error');
    return json({ error: '공유 저장을 완료하지 못했어요. 작업을 보관하고 다시 시도해 주세요.' }, 503);
  }
}
