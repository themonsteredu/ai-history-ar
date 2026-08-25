import { describe, expect, it } from "vitest";
import {
  buildLessonTwoRelationQuestion,
  isLessonOneQuestionComplete,
  isLessonTwoSchemaComplete,
  normalizeLessonOneQuestion,
  type LessonOneQuestionDraft,
  type LessonTwoSchemaDraft,
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

const completeSchemaDraft: LessonTwoSchemaDraft = {
  group: 2,
  fields: ["heritage_name", "kingdom", "era_range", "exact_year", "discovery_region", "source_type", "verified_fact", "source"],
  normalizations: {
    region: "경상북도 경주",
    era: "6세기",
    kingdom: "신라",
  },
  relationFields: ["discovery_region", "source_type"],
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

describe("lesson two schema workshop", () => {
  it("requires every common field, normalized value, and a two-field relation", () => {
    expect(isLessonTwoSchemaComplete(completeSchemaDraft)).toBe(true);
    expect(isLessonTwoSchemaComplete({
      ...completeSchemaDraft,
      fields: completeSchemaDraft.fields.filter((field) => field !== "exact_year"),
    })).toBe(false);
    expect(isLessonTwoSchemaComplete({
      ...completeSchemaDraft,
      normalizations: { ...completeSchemaDraft.normalizations, era: "서기 500년대" },
    })).toBe(false);
    expect(isLessonTwoSchemaComplete({ ...completeSchemaDraft, relationFields: ["source_type"] })).toBe(false);
  });

  it("builds a natural Korean comparison question from two fields", () => {
    expect(buildLessonTwoRelationQuestion(["discovery_region", "source_type"]))
      .toBe("발견 지역에 따라 자료 종류는 어떻게 다를까?");
    expect(buildLessonTwoRelationQuestion([])).toBe("비교할 항목 두 개를 선택하세요.");
  });
});
