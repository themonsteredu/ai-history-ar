import type { EraId } from "../types/curriculum";
const LESSON_TWO_KEY_PREFIX = "moa-history-ar:three-kingdoms:lesson-2:judgement:v1";
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function lessonTwoStorageKey(boardCode: string, studentId: string, eraId: EraId = "three-kingdoms") {
  const prefix = eraId === "joseon" ? LESSON_TWO_KEY_PREFIX.replace("three-kingdoms", "joseon") : LESSON_TWO_KEY_PREFIX;
  const code = boardCode.trim().toLowerCase();
  const student = studentId.trim().toLowerCase();
  if (/^[a-z0-9]{4,10}$/.test(code) && UUID_V4_RE.test(student)) {
    return `${prefix}:${code}:${student}`;
  }
  return `${prefix}:standalone`;
}
