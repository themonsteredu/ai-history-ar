import { describe, expect, it } from "vitest";
import {
  cleaningIssues,
  cleaningPracticeRows,
  countCorrectCleaningDecisions,
  isCleaningComplete,
} from "./LessonFiveCleaningLab";

const allCorrect = Object.fromEntries(cleaningIssues.map((issue) => [issue.id, issue.answer]));

describe("lesson five cleaning lab", () => {
  it("keeps six unique issues that all point at existing practice rows", () => {
    expect(cleaningIssues).toHaveLength(6);
    expect(new Set(cleaningIssues.map((issue) => issue.id)).size).toBe(6);
    const rowIds = new Set(cleaningPracticeRows.map((row) => row.id));
    for (const issue of cleaningIssues) {
      expect(issue.rowIds.every((rowId) => rowIds.has(rowId))).toBe(true);
      expect(issue.options).toContain(issue.answer);
      expect(issue.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("seeds a duplicate practice row pair for the duplicate issue", () => {
    const duplicate = cleaningIssues.find((issue) => issue.id === "duplicate");
    expect(duplicate?.rowIds).toHaveLength(2);
    const [firstId, secondId] = duplicate?.rowIds ?? [];
    const first = cleaningPracticeRows.find((row) => row.id === firstId);
    const second = cleaningPracticeRows.find((row) => row.id === secondId);
    expect(first && second && { ...first, id: 0 }).toEqual(second && { ...second, id: 0 });
  });

  it("only completes when every issue has the correct decision", () => {
    expect(isCleaningComplete(allCorrect)).toBe(true);
    expect(countCorrectCleaningDecisions(allCorrect)).toBe(6);
    expect(isCleaningComplete({ ...allCorrect, era: "서기 500년대" })).toBe(false);
    expect(isCleaningComplete({})).toBe(false);
    expect(countCorrectCleaningDecisions({ duplicate: "한 행만 남기고 지운다" })).toBe(1);
  });
});
