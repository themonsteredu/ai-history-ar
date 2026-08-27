import { threeKingdomsGroups } from "../content/three-kingdoms/groups";
import { cleaningIssues, countCorrectCleaningDecisions } from "../components/LessonFiveCleaningLab";
import { CHARTS_TO_COMPLETE, chartStudioConfigs, countHonestTitleSelections } from "../components/LessonSixChartStudio";
import { countCorrectInterpretations, interpretationStatements, type InterpretationVerdict } from "../components/LessonSevenInterpretationLab";
import { countCorrectInferences, inferenceStatementCount, type InferenceVerdict } from "../components/LessonEightInferenceLab";
import { countForecastProgress, forecastScenarios, forecastStatements, type ForecastDraft } from "../components/TrendForecastLab";
import { countCheckedItems, museumChecklist } from "../components/LessonTenMuseumRehearsal";

// 각 차시 웹 활동이 이 기기에 저장하는 localStorage 키와 같아야 합니다.
const LESSON_KEYS = {
  question: "ai-history:three-kingdoms:lesson-1-question:v1",
  schema: "ai-history:three-kingdoms:lesson-2-schema:v1",
  cleaning: "ai-history:three-kingdoms:lesson-5-cleaning:v1",
  charts: "ai-history:three-kingdoms:lesson-6-charts:v1",
  reading: "ai-history:three-kingdoms:lesson-7-reading:v1",
  inference: "ai-history:three-kingdoms:lesson-8-inference:v1",
  forecast: "ai-history:three-kingdoms:lesson-9-forecast:v1",
  museum: "ai-history:three-kingdoms:lesson-10-museum:v1",
} as const;

export const GROUP_CHOICE_KEY = "ai-history:three-kingdoms:record-group:v1";

export type RecordStatus = "완료" | "진행 중" | "기록 없음";

export interface GroupRecordEntry {
  lessonId: number;
  title: string;
  status: RecordStatus;
  lines: string[];
}

export interface GroupRecord {
  version: 1;
  era: "three-kingdoms";
  group: number;
  entries: GroupRecordEntry[];
  raw: Record<string, unknown>;
}

type RecordStorage = Pick<Storage, "getItem">;

function readJson(storage: RecordStorage, key: string): Record<string, unknown> | null {
  try {
    const stored = storage.getItem(key);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function statusFor(done: number, total: number): RecordStatus {
  if (done <= 0) return "기록 없음";
  return done >= total ? "완료" : "진행 중";
}

export function readSavedGroup(storage: RecordStorage): number {
  const chosen = Number(storage.getItem(GROUP_CHOICE_KEY) ?? "");
  if (Number.isInteger(chosen) && chosen >= 1 && chosen <= 6) return chosen;
  const questionDraft = readJson(storage, LESSON_KEYS.question);
  const draftGroup = Number(questionDraft?.group ?? 0);
  return Number.isInteger(draftGroup) && draftGroup >= 1 && draftGroup <= 6 ? draftGroup : 0;
}

export function collectGroupRecord(storage: RecordStorage, group: number): GroupRecord {
  const entries: GroupRecordEntry[] = [];
  const raw: Record<string, unknown> = {};

  const question = readJson(storage, LESSON_KEYS.question);
  if (question) raw.lesson1 = question;
  const questionText = typeof question?.question === "string" ? question.question.trim() : "";
  const heritageId = Number(question?.heritageId ?? 0);
  const heritageName = threeKingdomsGroups.find((item) => item.id === heritageId)?.heritage ?? "";
  entries.push({
    lessonId: 1,
    title: "데이터 질문 만들기",
    status: questionText.length > 0 ? "완료" : "기록 없음",
    lines: questionText.length > 0
      ? [heritageName ? `담당 유산: ${heritageName}` : "", `모둠 질문: “${questionText}”`].filter(Boolean)
      : ["웹앱 질문 카드가 아직 저장되지 않았습니다."],
  });

  const schema = readJson(storage, LESSON_KEYS.schema);
  if (schema) raw.lesson2 = schema;
  const fieldCount = Array.isArray(schema?.fields) ? schema.fields.length : 0;
  entries.push({
    lessonId: 2,
    title: "학급 데이터 약속",
    status: statusFor(fieldCount, 8),
    lines: fieldCount > 0 ? [`공통 항목 ${fieldCount}개 선택`] : ["데이터 설계 카드가 아직 저장되지 않았습니다."],
  });

  const cleaning = readJson(storage, LESSON_KEYS.cleaning) ?? {};
  raw.lesson5 = cleaning;
  const cleaningDone = countCorrectCleaningDecisions(cleaning as Record<string, string>);
  entries.push({
    lessonId: 5,
    title: "데이터 정제 연습",
    status: statusFor(cleaningDone, cleaningIssues.length),
    lines: [`문제 ${cleaningIssues.length}개 중 ${cleaningDone}개 해결`],
  });

  const charts = readJson(storage, LESSON_KEYS.charts) ?? {};
  raw.lesson6 = charts;
  const honestCharts = countHonestTitleSelections(charts as Record<string, string>);
  const honestChartNames = chartStudioConfigs
    .filter((config) => config.titleOptions.find((option) => option.text === (charts as Record<string, string>)[config.id])?.honest)
    .map((config) => config.pickerLabel);
  entries.push({
    lessonId: 6,
    title: "그래프와 정직한 제목",
    status: statusFor(honestCharts, CHARTS_TO_COMPLETE),
    lines: honestCharts > 0 ? [`정직한 제목의 그래프 ${honestCharts}개: ${honestChartNames.join(", ")}`] : [`목표 ${CHARTS_TO_COMPLETE}개 중 0개`],
  });

  const reading = readJson(storage, LESSON_KEYS.reading) ?? {};
  raw.lesson7 = reading;
  const readingDone = countCorrectInterpretations(reading as Record<string, InterpretationVerdict>);
  entries.push({
    lessonId: 7,
    title: "보이는 점·모르는 점",
    status: statusFor(readingDone, interpretationStatements.length),
    lines: [`문장 ${interpretationStatements.length}개 중 ${readingDone}개 정확히 구분`],
  });

  const inference = readJson(storage, LESSON_KEYS.inference) ?? {};
  raw.lesson8 = inference;
  const inferenceDone = countCorrectInferences(inference as Record<string, InferenceVerdict>);
  entries.push({
    lessonId: 8,
    title: "근거 2개 → 유추 1개",
    status: statusFor(inferenceDone, inferenceStatementCount),
    lines: [`유추 문장 ${inferenceStatementCount}개 중 ${inferenceDone}개 정확히 판단`],
  });

  const forecast = readJson(storage, LESSON_KEYS.forecast);
  const forecastDraft: ForecastDraft = {
    scenarios: (forecast?.scenarios as Record<string, number> | undefined) ?? {},
    judgments: (forecast?.judgments as ForecastDraft["judgments"] | undefined) ?? {},
  };
  raw.lesson9 = forecastDraft;
  const forecastTotal = forecastScenarios.length + forecastStatements.length;
  const forecastDone = countForecastProgress(forecastDraft);
  entries.push({
    lessonId: 9,
    title: "미래 예측 연습",
    status: statusFor(forecastDone, forecastTotal),
    lines: [`시나리오·예측 문장 ${forecastTotal}단계 중 ${forecastDone}단계 완료`],
  });

  const museum = readJson(storage, LESSON_KEYS.museum) ?? {};
  raw.lesson10 = museum;
  const museumDone = countCheckedItems(museum as Record<string, boolean>);
  entries.push({
    lessonId: 10,
    title: "박물관 부스 준비",
    status: statusFor(museumDone, museumChecklist.length),
    lines: [`준비물 ${museumChecklist.length}가지 중 ${museumDone}가지 완료`],
  });

  return { version: 1, era: "three-kingdoms", group, entries, raw };
}

export function groupRecordFileName(record: GroupRecord, exportedAt: Date) {
  const year = exportedAt.getFullYear();
  const month = String(exportedAt.getMonth() + 1).padStart(2, "0");
  const day = String(exportedAt.getDate()).padStart(2, "0");
  return `${record.group}모둠-웹활동기록-${year}${month}${day}.json`;
}

export function serializeGroupRecord(record: GroupRecord, exportedAt: Date) {
  return JSON.stringify({ ...record, exportedAt: exportedAt.toISOString() }, null, 2);
}
