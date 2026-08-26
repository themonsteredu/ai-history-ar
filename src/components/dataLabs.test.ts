import { describe, expect, it } from "vitest";
import {
  countRowsBy,
  foldSmallCategories,
  heritageDatasetRows,
  regionGroup,
} from "../content/three-kingdoms/heritageDataset";
import {
  CHARTS_TO_COMPLETE,
  chartStudioConfigs,
  countHonestTitleSelections,
  isChartStudioComplete,
} from "./LessonSixChartStudio";
import {
  countCorrectInterpretations,
  interpretationStatements,
  isInterpretationComplete,
} from "./LessonSevenInterpretationLab";
import {
  countCorrectInferences,
  inferenceMissions,
  inferenceStatementCount,
  isInferenceComplete,
} from "./LessonEightInferenceLab";

describe("heritage dataset module", () => {
  it("parses the sixty-row class dataset with numeric years", () => {
    expect(heritageDatasetRows).toHaveLength(60);
    for (const row of heritageDatasetRows) {
      expect(row.heritage.length).toBeGreaterThan(0);
      if (row.exactYear !== null) expect(Number.isInteger(row.exactYear)).toBe(true);
    }
  });

  it("counts kingdoms into the expected chart data", () => {
    const kingdoms = Object.fromEntries(countRowsBy((row) => row.kingdom).map((item) => [item.label, item.value]));
    expect(kingdoms).toEqual({ 백제: 20, 신라: 20, 고구려: 10, 가야: 10 });
  });

  it("groups regions coarsely and folds small categories with a rest bucket", () => {
    const regions = countRowsBy((row) => regionGroup(row.region));
    expect(regions.reduce((sum, item) => sum + item.value, 0)).toBe(60);
    expect(regions.map((item) => item.label)).toContain("충청남도");
    const folded = foldSmallCategories(countRowsBy((row) => row.sourceType), 7, "그 밖의 종류");
    expect(folded).toHaveLength(8);
    expect(folded.at(-1)?.label).toBe("그 밖의 종류");
    expect(folded.reduce((sum, item) => sum + item.value, 0)).toBe(60);
  });
});

describe("lesson six chart studio", () => {
  it("gives every chart exactly one honest title and non-empty data", () => {
    expect(chartStudioConfigs).toHaveLength(5);
    for (const config of chartStudioConfigs) {
      expect(config.titleOptions.filter((option) => option.honest)).toHaveLength(1);
      expect(config.data.length).toBeGreaterThanOrEqual(2);
      expect(config.data.every((item) => item.value > 0)).toBe(true);
    }
  });

  it("completes after three honest titles", () => {
    const honest = Object.fromEntries(
      chartStudioConfigs.slice(0, CHARTS_TO_COMPLETE).map((config) => [config.id, config.titleOptions.find((option) => option.honest)?.text ?? ""]),
    );
    expect(countHonestTitleSelections(honest)).toBe(CHARTS_TO_COMPLETE);
    expect(isChartStudioComplete(honest)).toBe(true);
    const dishonest = { ...honest, [chartStudioConfigs[0].id]: chartStudioConfigs[0].titleOptions.find((option) => !option.honest)?.text ?? "" };
    expect(isChartStudioComplete(dishonest)).toBe(false);
  });
});

describe("lesson seven interpretation lab", () => {
  it("balances visible and unknown statements", () => {
    expect(interpretationStatements).toHaveLength(6);
    expect(interpretationStatements.filter((statement) => statement.verdict === "visible")).toHaveLength(3);
    expect(interpretationStatements.filter((statement) => statement.verdict === "unknown")).toHaveLength(3);
    expect(new Set(interpretationStatements.map((statement) => statement.id)).size).toBe(6);
  });

  it("only completes when every statement is classified correctly", () => {
    const allCorrect = Object.fromEntries(interpretationStatements.map((statement) => [statement.id, statement.verdict]));
    expect(isInterpretationComplete(allCorrect)).toBe(true);
    expect(countCorrectInterpretations({ [interpretationStatements[0].id]: interpretationStatements[0].verdict })).toBe(1);
    expect(isInterpretationComplete({})).toBe(false);
  });
});

describe("lesson eight inference lab", () => {
  it("mixes reasonable inferences and overreach in every mission", () => {
    expect(inferenceMissions).toHaveLength(3);
    expect(inferenceStatementCount).toBe(9);
    const ids = inferenceMissions.flatMap((mission) => mission.statements.map((statement) => statement.id));
    expect(new Set(ids).size).toBe(9);
    for (const mission of inferenceMissions) {
      expect(mission.evidence).toHaveLength(2);
      expect(mission.statements.some((statement) => statement.verdict === "reasonable")).toBe(true);
      expect(mission.statements.some((statement) => statement.verdict === "overreach")).toBe(true);
    }
  });

  it("only completes when all nine statements are judged correctly", () => {
    const allCorrect = Object.fromEntries(inferenceMissions.flatMap((mission) => mission.statements.map((statement) => [statement.id, statement.verdict])));
    expect(isInferenceComplete(allCorrect)).toBe(true);
    expect(countCorrectInferences(allCorrect)).toBe(9);
    const firstStatement = inferenceMissions[0].statements[0];
    expect(isInferenceComplete({ ...allCorrect, [firstStatement.id]: firstStatement.verdict === "reasonable" ? "overreach" : "reasonable" })).toBe(false);
  });
});
