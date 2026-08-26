import { describe, expect, it } from "vitest";
import { averageTrendStep, lastTrendPoint, trendPoints } from "../content/three-kingdoms/trendDataset";
import {
  countForecastProgress,
  forecastScenarios,
  forecastStatements,
  isForecastComplete,
  type ForecastDraft,
} from "./TrendForecastLab";
import {
  countCheckedItems,
  isChecklistComplete,
  museumChecklist,
  visitorQuestions,
} from "./LessonTenMuseumRehearsal";

const completeDraft: ForecastDraft = {
  scenarios: Object.fromEntries(forecastScenarios.map((scenario) => [scenario.id, scenario.answer])),
  judgments: Object.fromEntries(forecastStatements.map((statement) => [statement.id, statement.verdict])),
};

describe("lesson nine forecast lab", () => {
  it("reads the trend starter dataset with rising yearly values", () => {
    expect(trendPoints).toHaveLength(5);
    expect(trendPoints[0]).toEqual({ year: 2021, value: 100 });
    expect(lastTrendPoint).toEqual({ year: 2025, value: 149 });
    expect(averageTrendStep).toBeGreaterThan(0);
  });

  it("keeps every scenario answer inside its options and coherent with the trend", () => {
    const steady = forecastScenarios.find((scenario) => scenario.id === "steady");
    const faster = forecastScenarios.find((scenario) => scenario.id === "faster");
    const stalled = forecastScenarios.find((scenario) => scenario.id === "stalled");
    for (const scenario of forecastScenarios) {
      expect(scenario.options).toContain(scenario.answer);
    }
    expect(steady && faster && faster.answer > steady.answer).toBe(true);
    expect(stalled && stalled.answer <= lastTrendPoint.value).toBe(true);
    expect(forecastStatements.filter((statement) => statement.verdict === "certainty").length).toBeGreaterThanOrEqual(1);
    expect(forecastStatements.filter((statement) => statement.verdict === "prediction").length).toBeGreaterThanOrEqual(1);
  });

  it("only completes when scenarios and judgments are all correct", () => {
    expect(isForecastComplete(completeDraft)).toBe(true);
    expect(countForecastProgress(completeDraft)).toBe(forecastScenarios.length + forecastStatements.length);
    expect(isForecastComplete({ ...completeDraft, scenarios: { ...completeDraft.scenarios, steady: 149 } })).toBe(false);
    expect(isForecastComplete({ scenarios: {}, judgments: {} })).toBe(false);
  });
});

describe("lesson ten museum rehearsal", () => {
  it("keeps six checklist items and eight visitor questions with tips", () => {
    expect(museumChecklist).toHaveLength(6);
    expect(new Set(museumChecklist.map((item) => item.id)).size).toBe(6);
    expect(visitorQuestions).toHaveLength(8);
    for (const item of visitorQuestions) {
      expect(item.question.length).toBeGreaterThan(0);
      expect(item.tip.length).toBeGreaterThan(0);
    }
  });

  it("only completes when every checklist item is checked", () => {
    const allChecked = Object.fromEntries(museumChecklist.map((item) => [item.id, true]));
    expect(isChecklistComplete(allChecked)).toBe(true);
    expect(countCheckedItems(allChecked)).toBe(6);
    expect(isChecklistComplete({ ...allChecked, roles: false })).toBe(false);
    expect(isChecklistComplete({})).toBe(false);
  });
});
