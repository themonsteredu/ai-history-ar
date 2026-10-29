import { StudioApiError, type StudioSession } from '../ar-studio/api';
import { loadState, saveCheck, OPEN_API_TIMEOUT } from '../open-class/api';
import { emptyLessonNotes, emptyParts, isVerification, type Verification, type VerifyItem } from '../open-class/model';
import { artifacts } from './data';
import type { GroupSubmission } from './GroupPresentation';

/** The visible practice code is intentionally separate from the existing Joseon lesson room. */
export const GORYEO_ENTRY_CODE = '12345';
export const GORYEO_ROOM_CODE = '92780112345';
const SCHEMA = 'goryeo-group-submission-v1';
const keyForGroup = (group: number) => `history-ar-goryeo-session:${group}`;
export type RecordRow = { choice?: string; response?: string; responseChoice?: string; check?: string; evidence?: string; correction?: string };
export type Records = Record<string, RecordRow>;
const validGroup = (group: number) => Number.isInteger(group) && group >= 1 && group <= 6;

export function readGoryeoSession(group: number): StudioSession | undefined {
  if (!validGroup(group)) return undefined;
  try {
    const entry = JSON.parse(localStorage.getItem(keyForGroup(group)) || 'null');
    return entry?.code === GORYEO_ROOM_CODE && entry.group === group && typeof entry.token === 'string' && typeof entry.memberId === 'string' ? entry : undefined;
  } catch { return undefined; }
}
export function forgetGoryeoSession(group: number) {
  try { localStorage.removeItem(keyForGroup(group)); } catch { /* storage may be unavailable */ }
}

export async function joinGoryeoRoom(code: string, group: number): Promise<StudioSession> {
  if (code.trim() !== GORYEO_ENTRY_CODE || !validGroup(group)) throw new Error('입장 코드와 1~6모둠을 확인해 주세요.');
  const prior = readGoryeoSession(group);
  if (prior) return prior;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPEN_API_TIMEOUT);
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}api/ar-studio/join`, {
      method: 'POST', credentials: 'same-origin', signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: GORYEO_ROOM_CODE, name: `${group}모둠`, group }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new StudioApiError(result.error || '입장하지 못했어요. 다시 시도해 주세요.', response.status);
    if (controller.signal.aborted) throw new Error('인터넷 연결이 느려 입장하지 못했어요. 다시 시도해 주세요.');
    if (result.code !== GORYEO_ROOM_CODE || result.group !== group || typeof result.token !== 'string' || typeof result.memberId !== 'string') throw new Error('입장 정보를 확인하지 못했어요. 다시 시도해 주세요.');
    try { localStorage.setItem(keyForGroup(group), JSON.stringify(result)); } catch { /* kept in memory */ }
    return result as StudioSession;
  } catch (error) {
    if (error instanceof StudioApiError) throw error;
    throw new Error('인터넷 연결을 확인하고 다시 입장해 주세요.');
  } finally { clearTimeout(timer); }
}

const sampleQuestions = [0, 1].map(i => ({ id: `goryeo-placeholder-${i}`, statement: '', answer: 'O' as const, explanation: '', pointId: '' }));
const byKey = new Map<string, { artifact: typeof artifacts[number]; question: typeof artifacts[number]['questions'][number]; index: number }>(artifacts.filter(a => a.id !== 'buddha').flatMap(a => a.questions.map((q, index) => [`${a.id}-${index}`, { artifact: a, question: q, index }] as const)));
const decisionFor = (check: string | undefined): VerifyItem['decision'] => check === '맞는 설명' ? 'adopt' : check === '틀린 설명' ? 'revise' : check === '확인 필요' ? 'exclude' : '';
const checkFor = (decision: VerifyItem['decision']) => decision === 'adopt' ? '맞는 설명' : decision === 'revise' ? '틀린 설명' : decision === 'exclude' ? '확인 필요' : '';

/** Map every filled verification to the existing API format without silently cutting text. */
export function recordsToVerification(group: number, records: Records): Verification {
  if (!validGroup(group)) throw new Error('모둠을 다시 선택해 주세요.');
  const reflection = records.reflection?.evidence || '';
  if (reflection.length > 600) throw new Error('오늘 알게 된 점은 600자 이내로 적어 주세요. 작성한 내용은 지워지지 않았어요.');
  const items: VerifyItem[] = [];
  for (const [id] of byKey) {
    const row = records[id];
    if (!row || ![row.check, row.evidence, row.correction].some(v => typeof v === 'string' && v.trim())) continue;
    if (row.check && !['맞는 설명', '틀린 설명', '확인 필요'].includes(row.check)) throw new Error('자료와 비교한 판단을 다시 선택해 주세요.');
    if ((row.evidence || '').length > 400) throw new Error('근거 자료 내용은 문항마다 400자 이내로 적어 주세요. 작성한 내용은 지워지지 않았어요.');
    if ((row.correction || '').length > 200) throw new Error('바르게 고친 내용은 문항마다 200자 이내로 적어 주세요. 작성한 내용은 지워지지 않았어요.');
    if ((row.response || '').length > 800) throw new Error('로봇 답변이 너무 길어 제출할 수 없어요.');
    if (row.choice && !['O', 'X'].includes(row.choice)) throw new Error('OX 답을 다시 선택해 주세요.');
    if (row.responseChoice && !['O', 'X'].includes(row.responseChoice)) throw new Error('로봇 답변의 OX를 확인해 주세요.');
    items.push({ questionId: id, source: 'student', solved: row.choice === 'O' || row.choice === 'X' ? row.choice : '', why: '', curious: row.responseChoice || '', asked: !!row.response, aiAnswer: row.response || '', decision: decisionFor(row.check), revised: row.correction || '', revisedAnswer: '', reason: row.evidence || '', explanation: '' });
  }
  if (!items.length) throw new Error('제출할 판단이나 근거, 고친 내용을 한 가지 이상 적어 주세요.');
  const result: Verification = { version: 1, mode: 'self', verifier: group, target: group, selfQuestions: sampleQuestions, parts: { ...emptyParts(), role: SCHEMA }, items, notes: { ...emptyLessonNotes(), learned: reflection } };
  if (!isVerification(result)) throw new Error('제출할 내용의 형식을 확인해 주세요.');
  return result;
}

export function verificationToRecords(value: Verification): Records {
  const rows: Records = {};
  for (const item of value.items) {
    if (!byKey.has(item.questionId)) continue;
    rows[item.questionId] = { choice: item.solved || undefined, response: item.aiAnswer || undefined, responseChoice: item.curious || undefined, check: checkFor(item.decision) || undefined, evidence: item.reason || undefined, correction: item.revised || undefined };
  }
  if (value.notes?.learned) rows.reflection = { evidence: value.notes.learned };
  return rows;
}

export function verificationToSubmission(value: Verification, updatedAt: string): GroupSubmission {
  return { group: value.verifier, submittedAt: updatedAt, reflection: value.notes?.learned || '', entries: value.items.flatMap(item => {
    const info = byKey.get(item.questionId);
    if (!info) return [];
    return [{ artifactId: info.artifact.id, artifactName: info.artifact.short, questionIndex: info.index, statement: info.question.statement, choice: item.solved, robotAnswer: item.aiAnswer, judgment: checkFor(item.decision), evidence: item.reason, correction: item.revised }];
  }) };
}
const ours = (value: Verification) => isVerification(value) && value.mode === 'self' && value.verifier === value.target && value.parts.role === SCHEMA;

export async function loadGoryeoRoom(session: StudioSession) {
  if (session.code !== GORYEO_ROOM_CODE || !validGroup(session.group)) throw new Error('모둠 입장 정보가 올바르지 않아요.');
  try {
    const state = await loadState(GORYEO_ROOM_CODE, session.token);
    const own = state.checks.find(item => item.key === `${session.group}:${session.group}`);
    if (own && !ours(own.data)) throw new Error('기존 모둠 기록의 형식이 달라 안전하게 불러올 수 없어요.');
    return { submissions: state.checks.filter(item => ours(item.data)).map(item => verificationToSubmission(item.data, item.updatedAt)), version: own?.version || 0, records: own ? verificationToRecords(own.data) : {} };
  } catch (error) {
    if (error instanceof StudioApiError && (error.status === 401 || (error.status === 403 && error.message.includes('입장 정보')))) { forgetGoryeoSession(session.group); throw new StudioApiError('입장 시간이 만료됐어요. 다시 입장해 주세요.', 401); }
    throw error;
  }
}
export async function submitGoryeoRecords(session: StudioSession, records: Records, expectedVersion: number) {
  if (session.code !== GORYEO_ROOM_CODE || !validGroup(session.group) || !Number.isInteger(expectedVersion) || expectedVersion < 0) throw new Error('모둠 입장 정보와 불러온 기록을 확인해 주세요.');
  const verification = recordsToVerification(session.group, records);
  try { return await saveCheck(GORYEO_ROOM_CODE, session.token, verification, expectedVersion); }
  catch (error) {
    if (error instanceof StudioApiError && error.status === 409) throw new StudioApiError('다른 기기에서 모둠 기록을 변경했어요. 내용을 복사해 둔 뒤 다시 불러와 확인해 주세요.', 409);
    if (error instanceof StudioApiError && (error.status === 401 || (error.status === 403 && error.message.includes('입장 정보')))) { forgetGoryeoSession(session.group); throw new StudioApiError('입장 시간이 만료됐어요. 다시 입장해 주세요.', 401); }
    throw error;
  }
}


