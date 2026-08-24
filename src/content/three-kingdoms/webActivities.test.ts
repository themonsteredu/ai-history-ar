import { describe, expect, it } from "vitest";
import { heritageResearchCases, verificationCases } from "./webActivities";

describe("three kingdoms project activities", () => {
  it("provides three built-in research sources for all six heritage cases", () => {
    expect(heritageResearchCases).toHaveLength(6);
    for (const researchCase of heritageResearchCases) {
      expect(researchCase.sources).toHaveLength(3);
      expect(researchCase.sources.flatMap((source) => source.facts).filter((fact) => fact.kind === "confirmed").length).toBeGreaterThanOrEqual(2);
      expect(researchCase.sources.flatMap((source) => source.facts).filter((fact) => fact.kind === "caution").length).toBeGreaterThanOrEqual(1);
    }
  });

  it("keeps a 30-question verification bank with five questions per heritage case", () => {
    expect(verificationCases).toHaveLength(6);
    expect(verificationCases.every((item) => item.questions.length === 5)).toBe(true);
    expect(verificationCases.flatMap((item) => item.questions)).toHaveLength(30);
    expect(new Set(verificationCases.flatMap((item) => item.questions).map((question) => question.id)).size).toBe(30);
  });
});
