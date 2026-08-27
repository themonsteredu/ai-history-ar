import { describe, expect, it } from "vitest";
import {
  collectGroupRecord,
  groupRecordFileName,
  readSavedGroup,
  serializeGroupRecord,
} from "./groupRecords";
import { cleaningIssues } from "../components/LessonFiveCleaningLab";
import { interpretationStatements } from "../components/LessonSevenInterpretationLab";

function storageFrom(entries: Record<string, string>): Pick<Storage, "getItem"> {
  return { getItem: (key: string) => entries[key] ?? null };
}

const emptyStorage = storageFrom({});

describe("group records", () => {
  it("reads the saved group, falling back to the lesson one draft", () => {
    expect(readSavedGroup(emptyStorage)).toBe(0);
    expect(readSavedGroup(storageFrom({ "ai-history:three-kingdoms:record-group:v1": "4" }))).toBe(4);
    expect(readSavedGroup(storageFrom({ "ai-history:three-kingdoms:lesson-1-question:v1": JSON.stringify({ group: 2 }) }))).toBe(2);
    expect(readSavedGroup(storageFrom({ "ai-history:three-kingdoms:record-group:v1": "9" }))).toBe(0);
  });

  it("collects one entry per web activity with empty-device statuses", () => {
    const record = collectGroupRecord(emptyStorage, 3);
    expect(record.group).toBe(3);
    expect(record.entries.map((entry) => entry.lessonId)).toEqual([1, 2, 5, 6, 7, 8, 9, 10]);
    expect(record.entries.every((entry) => entry.status === "기록 없음")).toBe(true);
  });

  it("summarizes stored lesson results and marks completed activities", () => {
    const record = collectGroupRecord(storageFrom({
      "ai-history:three-kingdoms:lesson-1-question:v1": JSON.stringify({ group: 3, heritageId: 3, question: "첨성대의 모양은 시기와 어떤 관계가 있을까?" }),
      "ai-history:three-kingdoms:lesson-5-cleaning:v1": JSON.stringify(Object.fromEntries(cleaningIssues.map((issue) => [issue.id, issue.answer]))),
      "ai-history:three-kingdoms:lesson-7-reading:v1": JSON.stringify({ [interpretationStatements[0].id]: interpretationStatements[0].verdict }),
    }), 3);
    const byLesson = Object.fromEntries(record.entries.map((entry) => [entry.lessonId, entry]));
    expect(byLesson[1].status).toBe("완료");
    expect(byLesson[1].lines.join(" ")).toContain("첨성대");
    expect(byLesson[5].status).toBe("완료");
    expect(byLesson[7].status).toBe("진행 중");
    expect(record.raw.lesson5).toBeTruthy();
  });

  it("names and serializes the export with the group and date", () => {
    const record = collectGroupRecord(emptyStorage, 5);
    const exportedAt = new Date(2026, 8, 1, 10, 30);
    expect(groupRecordFileName(record, exportedAt)).toBe("5모둠-웹활동기록-20260901.json");
    const parsed = JSON.parse(serializeGroupRecord(record, exportedAt)) as { group: number; exportedAt: string };
    expect(parsed.group).toBe(5);
    expect(parsed.exportedAt).toContain("2026");
  });
});
