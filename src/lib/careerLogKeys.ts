const LESSON_TWO_KEY_PREFIX = "moa-history-ar:three-kingdoms:lesson-2:judgement:v1";
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function lessonTwoStorageKey(boardCode: string, studentId: string) {
  const code = boardCode.trim().toLowerCase();
  const student = studentId.trim().toLowerCase();
  if (/^[a-z0-9]{4,10}$/.test(code) && UUID_V4_RE.test(student)) {
    return `${LESSON_TWO_KEY_PREFIX}:${code}:${student}`;
  }
  return `${LESSON_TWO_KEY_PREFIX}:standalone`;
}
