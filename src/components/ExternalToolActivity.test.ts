import { describe, expect, it } from "vitest";
import {
  isLessonOneQuestionComplete,
  normalizeLessonOneQuestion,
  type LessonOneQuestionDraft,
} from "./ExternalToolActivity";

const completeDraft: LessonOneQuestionDraft = {
  group: 2,
  heritageId: 3,
  clues: ["가운데 난 네모난 창"],
  dataFields: ["시기", "모양"],
  observation: "돌을 층층이 쌓았고 가운데 네모난 창이 보인다.",
  question: "첨성대의 모양은 만들어진 시기와 어떤 관계가 있을까",
  savedAt: 0,
};

describe("lesson one question workshop", () => {
  it("requires a group, visual clue, data field, observation, and question", () => {
    expect(isLessonOneQuestionComplete(completeDraft)).toBe(true);
    expect(isLessonOneQuestionComplete({ ...completeDraft, dataFields: [] })).toBe(false);
    expect(isLessonOneQuestionComplete({ ...completeDraft, question: "짧은 질문" })).toBe(false);
  });

  it("normalizes the saved question to one question mark", () => {
    expect(normalizeLessonOneQuestion("어떤 관계가 있을까  ")).toBe("어떤 관계가 있을까?");
    expect(normalizeLessonOneQuestion("어떤 관계가 있을까???")).toBe("어떤 관계가 있을까?");
  });
});
