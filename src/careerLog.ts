const CAREER_LOG_ENDPOINT = "https://hub.moakit.ai/api/career-log/records";
const STUDENT_ID_KEY = "moakit:career-log:student-id:v1";
const SESSION_ID_KEY = "moakit:career-log:history-ai:session-id:v1";
const LESSON_ONE_EVENT_KEY = "moakit:career-log:history-ai:three-kingdoms:lesson-1:event:v1";

export interface LessonOneCareerLogInput {
  group: number;
  heritageId: number;
  heritage: string;
  observation: string;
  question: string;
  clues: string[];
  dataFields: string[];
}

interface StoredEvent {
  id: string;
  occurredAt: string;
}

function storedUuid(storage: Storage, key: string) {
  const current = storage.getItem(key);
  if (current) return current;
  const created = crypto.randomUUID();
  storage.setItem(key, created);
  return created;
}

function storedEvent(storage: Storage): StoredEvent {
  try {
    const current = JSON.parse(storage.getItem(LESSON_ONE_EVENT_KEY) ?? "null") as StoredEvent | null;
    if (current?.id && current.occurredAt) return current;
  } catch {
    // 손상된 현재 세션 값은 새 완료 이벤트로 교체합니다.
  }
  const created = { id: crypto.randomUUID(), occurredAt: new Date().toISOString() };
  storage.setItem(LESSON_ONE_EVENT_KEY, JSON.stringify(created));
  return created;
}

export function buildLessonOneCareerLogEvent(
  input: LessonOneCareerLogInput,
  local: Storage,
  session: Storage,
) {
  const event = storedEvent(session);
  return {
    student_id: storedUuid(local, STUDENT_ID_KEY),
    session_id: storedUuid(session, SESSION_ID_KEY),
    source_event_id: event.id,
    occurred_at: event.occurredAt,
    group: input.group,
    heritage_id: input.heritageId,
    heritage: input.heritage,
    observation: input.observation,
    question: input.question,
    clues: input.clues,
    data_fields: input.dataFields,
  };
}

export async function recordLessonOneCompletion(input: LessonOneCareerLogInput) {
  const response = await fetch(CAREER_LOG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    body: JSON.stringify(buildLessonOneCareerLogEvent(input, window.localStorage, window.sessionStorage)),
  });
  if (!response.ok) throw new Error(`Career Log request failed: ${response.status}`);
  return response.json() as Promise<{ ok: true; record_id: string; student_id: string; duplicate: boolean }>;
}
