import { ARTIFACTS } from './artifacts';

export type Ox = 'O' | 'X';
export type Decision = 'adopt' | 'revise' | 'exclude';
export interface CardPoint { id: string; x: number; y: number; title: string; text: string }
export interface OxQuestion { id: string; statement: string; answer: Ox; explanation: string; pointId: string }
export interface GroupCard { version: 1; group: number; artifactId: number; members: string; points: CardPoint[]; questions: OxQuestion[] }
export interface TeacherSet { version: 1; artifactId: number; questions: OxQuestion[] }
/** The fill-in-the-blank parts of a question to Gemini. The page joins them; students write each part. */
export interface PromptParts { role: string; situation: string; style: string }
export interface VerifyItem {
  questionId: string; source: 'student' | 'teacher';
  solved: Ox | ''; why: string; curious: string; asked: boolean; aiAnswer: string;
  decision: Decision | ''; revised: string; revisedAnswer: Ox | ''; reason: string; explanation: string;
}
export interface Verification { version: 1; verifier: number; target: number; parts: PromptParts; items: VerifyItem[] }

export const MIN_POINTS = 2, MAX_POINTS = 6, MIN_QUESTIONS = 2, MAX_QUESTIONS = 5, MAX_TEACHER_QUESTIONS = 5;
export const DECISIONS: { id: Decision; label: string; help: string }[] = [
  { id: 'adopt', label: '채택', help: '문제와 정답이 맞고 근거도 있어요.' },
  { id: 'revise', label: '직접 수정', help: '틀리거나 애매해서 우리가 고쳐요.' },
  { id: 'exclude', label: '제외', help: '근거를 찾을 수 없어서 빼요.' },
];
export const decisionLabel = (id: Decision | '') => DECISIONS.find(item => item.id === id)?.label || '판단 전';

const uid = () => (globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`).slice(0, 36);
export const newPoint = (x: number, y: number): CardPoint => ({ id: uid(), x, y, title: '', text: '' });
export const newQuestion = (): OxQuestion => ({ id: uid(), statement: '', answer: 'O', explanation: '', pointId: '' });
export const newCard = (group: number, artifactId = 0): GroupCard => ({ version: 1, group, artifactId, members: '', points: [], questions: [newQuestion(), newQuestion()] });
export const newTeacherSet = (artifactId: number): TeacherSet => ({ version: 1, artifactId, questions: [] });
export const emptyParts = (): PromptParts => ({ role: '', situation: '', style: '' });
export const newVerifyItem = (questionId: string, source: VerifyItem['source']): VerifyItem => ({ questionId, source, solved: '', why: '', curious: '', asked: false, aiAnswer: '', decision: '', revised: '', revisedAnswer: '', reason: '', explanation: '' });
export const newVerification = (verifier: number, target: number): Verification => ({ version: 1, verifier, target, parts: emptyParts(), items: [] });

// ---- shape checks shared by the page and the Edge handler ----
const text = (v: unknown, max: number) => typeof v === 'string' && v.length <= max;
const id = (v: unknown) => typeof v === 'string' && v.length > 0 && v.length <= 40;
const group = (v: unknown) => Number.isInteger(v) && Number(v) >= 1 && Number(v) <= 6;
const ox = (v: unknown) => v === 'O' || v === 'X';
const unit = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
const artifact = (v: unknown) => ARTIFACTS.some(item => item.id === v);
function isQuestion(q: unknown): q is OxQuestion {
  const v = q as OxQuestion;
  return !!v && typeof v === 'object' && id(v.id) && text(v.statement, 200) && ox(v.answer) && text(v.explanation, 400) && typeof v.pointId === 'string' && v.pointId.length <= 40;
}
const uniqueIds = (list: { id: string }[]) => new Set(list.map(item => item.id)).size === list.length;

export function isGroupCard(value: unknown): value is GroupCard {
  const v = value as GroupCard;
  return !!v && typeof v === 'object' && v.version === 1 && group(v.group) && (v.artifactId === 0 || artifact(v.artifactId)) && text(v.members, 100) &&
    Array.isArray(v.points) && v.points.length <= MAX_POINTS && uniqueIds(v.points) &&
    v.points.every(p => p && id(p.id) && unit(p.x) && unit(p.y) && text(p.title, 40) && text(p.text, 400)) &&
    Array.isArray(v.questions) && v.questions.length <= MAX_QUESTIONS && uniqueIds(v.questions) && v.questions.every(isQuestion);
}
export function isTeacherSet(value: unknown): value is TeacherSet {
  const v = value as TeacherSet;
  return !!v && typeof v === 'object' && v.version === 1 && artifact(v.artifactId) && Array.isArray(v.questions) &&
    v.questions.length <= MAX_TEACHER_QUESTIONS && uniqueIds(v.questions) && v.questions.every(isQuestion);
}
export function isVerification(value: unknown): value is Verification {
  const v = value as Verification, p = v?.parts;
  return !!v && typeof v === 'object' && v.version === 1 && group(v.verifier) && group(v.target) && v.verifier !== v.target &&
    !!p && typeof p === 'object' && text(p.role, 200) && text(p.situation, 300) && text(p.style, 200) &&
    Array.isArray(v.items) && v.items.length <= MAX_QUESTIONS + MAX_TEACHER_QUESTIONS && new Set(v.items.map(i => i?.questionId)).size === v.items.length &&
    v.items.every(i => i && id(i.questionId) && (i.source === 'student' || i.source === 'teacher') && (i.solved === '' || ox(i.solved)) && text(i.why, 300) && text(i.curious, 300) &&
      typeof i.asked === 'boolean' && text(i.aiAnswer, 800) && (i.decision === '' || DECISIONS.some(d => d.id === i.decision)) &&
      text(i.revised, 200) && (i.revisedAnswer === '' || ox(i.revisedAnswer)) && text(i.reason, 400) && text(i.explanation, 600));
}

// ---- readiness ----
export const readyQuestions = (questions: readonly OxQuestion[]) => questions.filter(q => q.statement.trim());
export function cardProblems(card: GroupCard) {
  const problems: string[] = [];
  if (!card.artifactId) problems.push('우리 모둠 유물을 골라 주세요.');
  const written = card.points.filter(p => p.title.trim() && p.text.trim());
  if (written.length < MIN_POINTS) problems.push(`유물 사진에 설명 점을 ${MIN_POINTS}개 이상 찍고 제목·설명을 써 주세요.`);
  card.points.forEach((p, i) => { if (!p.title.trim() || !p.text.trim()) problems.push(`${i + 1}번 점의 제목과 설명을 채워 주세요.`); });
  const ready = readyQuestions(card.questions);
  if (ready.length < MIN_QUESTIONS) problems.push(`OX 문제를 ${MIN_QUESTIONS}개 이상 만들어 주세요.`);
  card.questions.forEach((q, i) => { if (q.statement.trim() && !q.explanation.trim()) problems.push(`${i + 1}번 문제의 정답 이유를 써 주세요.`); });
  return problems;
}

/** Everything a checking group has to look at on one card: the group's own questions, then the teacher's for that artifact. */
export interface CheckQuestion extends OxQuestion { source: 'student' | 'teacher' }
export function questionsToCheck(card: GroupCard | undefined, teacher: TeacherSet | undefined): CheckQuestion[] {
  if (!card) return [];
  return [
    ...readyQuestions(card.questions).map(q => ({ ...q, source: 'student' as const })),
    ...(teacher && teacher.artifactId === card.artifactId ? readyQuestions(teacher.questions).map(q => ({ ...q, source: 'teacher' as const })) : []),
  ];
}
/** Keeps work already written, adds rows for new questions, and drops rows for questions that were deleted. */
export function syncItems(verification: Verification, questions: readonly CheckQuestion[]): Verification {
  const items = questions.map(q => verification.items.find(item => item.questionId === q.id) || newVerifyItem(q.id, q.source));
  return { ...verification, items };
}
export const itemDone = (item: VerifyItem) => !!item.solved && !!item.decision && !!item.reason.trim() && !!item.explanation.trim() && (item.decision !== 'revise' || (!!item.revised.trim() && !!item.revisedAnswer));
export function verifyProgress(verification: Verification | undefined, total: number) {
  const items = verification?.items || [];
  const count = (decision: Decision) => items.filter(item => item.decision === decision).length;
  return { total, solved: items.filter(i => i.solved).length, asked: items.filter(i => i.asked || i.aiAnswer.trim()).length, done: items.filter(itemDone).length, adopt: count('adopt'), revise: count('revise'), exclude: count('exclude') };
}

// ---- the question to Gemini ----
export const GEMINI_URL = 'https://gemini.google.com/app';
export const PROMPT_FIELDS: { key: keyof PromptParts; label: string; help: string; example: string; max: number }[] = [
  { key: 'role', label: '역할 정하기', help: 'AI에게 어떤 사람이 되어 달라고 할까요?', example: '예: 조선시대 과학 유물을 잘 아는 박물관 선생님', max: 200 },
  { key: 'situation', label: '우리 상황 알려 주기', help: '우리가 지금 무엇을 하고 있는지 써요.', example: '예: 다른 모둠이 만든 OX 문제가 맞는지 확인하고 있어', max: 300 },
  { key: 'style', label: '답하는 방법 부탁하기', help: '어떻게 대답해 주면 좋을지 써요.', example: '예: 초등학생이 알기 쉽게 세 문장으로, 근거와 함께', max: 200 },
];
export interface PromptQuestion { artifact: string; statement: string; solved: Ox | ''; why: string; curious: string; card: readonly CardPoint[] }
// 받침이 있으면 '이야', 없으면 '야' (선생님이야 · 과학자야).
const ya = (word: string) => { const code = word.charCodeAt(word.length - 1) - 0xac00; return code >= 0 && code <= 11171 && code % 28 === 0 ? '야' : '이야'; };
/** Joins what students wrote into labelled lines. Nothing is invented: empty parts are simply left out. */
export function buildPrompt(parts: PromptParts, q: PromptQuestion) {
  const lines: string[] = [];
  const role = parts.role.trim().replace(/[.!]+$/, '');
  if (role) lines.push(`[역할] 너는 지금부터 ${role}${/[가-힣]$/.test(role) ? ya(role) : '이야'}.`);
  if (parts.situation.trim()) lines.push(`[상황] ${parts.situation.trim()}`);
  const facts = q.card.filter(p => p.title.trim() || p.text.trim()).map(p => `- ${p.title.trim()}: ${p.text.trim()}`);
  if (facts.length) lines.push(`[친구들 카드에 적힌 ${q.artifact} 설명]`, ...facts);
  lines.push(`[확인할 OX 문제] "${q.statement.trim()}"`);
  if (q.solved) lines.push(`[우리 모둠 생각] 우리는 ${q.solved}라고 생각해.${q.why.trim() ? ` 왜냐하면 ${q.why.trim()}` : ''}`);
  if (q.curious.trim()) lines.push(`[더 궁금한 점] ${q.curious.trim()}`);
  lines.push('[부탁] 이 문장이 맞으면 O, 틀리면 X라고 먼저 말해 줘. 그다음 그렇게 생각한 근거를 알려 줘. 틀리거나 애매하면 어떻게 고치면 좋을지도 알려 줘.');
  if (parts.style.trim()) lines.push(`[답하는 방법] ${parts.style.trim()}`);
  return lines.join('\n');
}
export const missingParts = (parts: PromptParts) => PROMPT_FIELDS.filter(f => !parts[f.key].trim()).map(f => f.label);
