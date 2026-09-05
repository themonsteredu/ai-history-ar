import { describe, expect, it, vi } from "vitest";
import { buildLessonOneCareerLogEvent } from "./careerLog";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe("Career Log lesson one event", () => {
  it("uses a random global student UUID and reuses the same source event for retries", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-05T01:30:00.000Z"));
    const local = new MemoryStorage();
    const session = new MemoryStorage();
    const input = {
      group: 1,
      heritageId: 1,
      heritage: "무령왕릉",
      observation: "아치 모양의 벽돌 입구가 보인다.",
      question: "무령왕릉의 재료와 발견 장소는 어떤 관계가 있을까?",
      clues: ["아치 모양의 벽돌 입구"],
      dataFields: ["재료", "발견 장소"],
    };

    const first = buildLessonOneCareerLogEvent(input, local, session);
    const retry = buildLessonOneCareerLogEvent(input, local, session);

    expect(first.student_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(first.student_id).toBe(retry.student_id);
    expect(first.session_id).toBe(retry.session_id);
    expect(first.source_event_id).toBe(retry.source_event_id);
    expect(first.occurred_at).toBe("2026-09-05T01:30:00.000Z");
    expect(first).not.toHaveProperty("student_name");
    expect(first).not.toHaveProperty("school_code");
    vi.useRealTimers();
  });
});
