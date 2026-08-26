import { useEffect, useState } from "react";
import {
  lastTrendPoint,
  trendMeasureLabel,
  trendPoints,
} from "../content/three-kingdoms/trendDataset";

const LESSON_NINE_FORECAST_KEY = "ai-history:three-kingdoms:lesson-9-forecast:v1";
const FORECAST_YEAR = 2026;

export interface ForecastScenario {
  id: string;
  label: string;
  question: string;
  options: readonly number[];
  answer: number;
  explanation: string;
}

export const forecastScenarios: readonly ForecastScenario[] = [
  {
    id: "steady",
    label: "흐름 그대로",
    question: "해마다 늘던 폭(약 12)이 그대로 이어진다면 2026년 값은 얼마쯤일까요?",
    options: [149, 161, 190],
    answer: 161,
    explanation: "149에서 지금까지의 평균 폭만큼 더한 값입니다. 149는 멈춘 경우, 190은 흐름보다 훨씬 큰 값입니다.",
  },
  {
    id: "faster",
    label: "더 빨라질 때",
    question: "지금까지 가장 컸던 폭(16)보다 더 크게 늘어난다면 어느 값이 어울릴까요?",
    options: [158, 170, 149],
    answer: 170,
    explanation: "149에서 16보다 큰 폭으로 늘어난 값입니다. 158은 오히려 흐름보다 느린 경우입니다.",
  },
  {
    id: "stalled",
    label: "멈추거나 줄어들 때",
    question: "새로운 일이 생겨 흐름이 멈추거나 줄어든다면 어느 값이 어울릴까요?",
    options: [148, 165, 180],
    answer: 148,
    explanation: "지금 값(149)과 비슷하거나 살짝 줄어든 값입니다. 예측에는 이런 시나리오도 함께 준비합니다.",
  },
] as const;

export type ForecastVerdict = "prediction" | "certainty";

export interface ForecastStatement {
  id: string;
  text: string;
  verdict: ForecastVerdict;
  explanation: string;
}

export const forecastStatements: readonly ForecastStatement[] = [
  { id: "possible", text: "지금까지의 흐름이 이어진다면 2026년에도 늘어날 가능성이 있다.", verdict: "prediction", explanation: "‘흐름이 이어진다면’이라는 가정과 ‘가능성’이라는 말이 자료의 범위를 지킵니다." },
  { id: "certain", text: "2026년 값은 반드시 161이 된다.", verdict: "certainty", explanation: "예측값은 가정에서 나온 숫자일 뿐, ‘반드시’라고 말할 수 없습니다." },
  { id: "change", text: "새로운 일이 생기면 세 시나리오와 전혀 다른 값이 될 수도 있다.", verdict: "prediction", explanation: "예측의 한계를 함께 말하는 것이 좋은 예측입니다." },
] as const;

export interface ForecastDraft {
  scenarios: Record<string, number>;
  judgments: Record<string, ForecastVerdict>;
}

export function isForecastComplete(draft: ForecastDraft) {
  const scenariosDone = forecastScenarios.every((scenario) => draft.scenarios[scenario.id] === scenario.answer);
  const judgmentsDone = forecastStatements.every((statement) => draft.judgments[statement.id] === statement.verdict);
  return scenariosDone && judgmentsDone;
}

export function countForecastProgress(draft: ForecastDraft) {
  return (
    forecastScenarios.filter((scenario) => draft.scenarios[scenario.id] === scenario.answer).length +
    forecastStatements.filter((statement) => draft.judgments[statement.id] === statement.verdict).length
  );
}

const emptyDraft: ForecastDraft = { scenarios: {}, judgments: {} };

function readForecastDraft(): ForecastDraft {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LESSON_NINE_FORECAST_KEY) ?? "{}") as Partial<ForecastDraft>;
    const scenarios = parsed.scenarios && typeof parsed.scenarios === "object"
      ? Object.fromEntries(Object.entries(parsed.scenarios).filter(([key, value]) => forecastScenarios.some((scenario) => scenario.id === key && typeof value === "number" && scenario.options.includes(value))))
      : {};
    const judgments = parsed.judgments && typeof parsed.judgments === "object"
      ? Object.fromEntries(Object.entries(parsed.judgments).filter(([key, value]) => forecastStatements.some((statement) => statement.id === key) && (value === "prediction" || value === "certainty")))
      : {};
    return { scenarios, judgments } as ForecastDraft;
  } catch {
    return emptyDraft;
  }
}

const CHART_WIDTH = 640;
const CHART_HEIGHT = 230;
const PLOT_LEFT = 52;
const PLOT_RIGHT = 600;
const PLOT_TOP = 16;
const PLOT_BOTTOM = 196;
const VALUE_MIN = 90;
const VALUE_MAX = 190;

function xForYear(year: number) {
  const firstYear = trendPoints[0].year;
  return PLOT_LEFT + ((year - firstYear) / (FORECAST_YEAR - firstYear)) * (PLOT_RIGHT - PLOT_LEFT);
}

function yForValue(value: number) {
  return PLOT_BOTTOM - ((value - VALUE_MIN) / (VALUE_MAX - VALUE_MIN)) * (PLOT_BOTTOM - PLOT_TOP);
}

function TrendChart({ scenarios }: { scenarios: Record<string, number> }) {
  const linePath = trendPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${xForYear(point.year)} ${yForValue(point.value)}`).join(" ");
  const gridValues = [100, 130, 160, 190];

  return (
    <figure className="heritage-chart trend-chart">
      <figcaption>
        <strong>{trendMeasureLabel}의 변화와 2026년 세 시나리오</strong>
        <span>수업용 모의 데이터 · 실제 통계가 아닙니다</span>
      </figcaption>
      <svg preserveAspectRatio="xMidYMid meet" role="img" aria-label="연도별 추세와 예측 시나리오 그래프" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
        {gridValues.map((value) => (
          <g key={value}>
            <line className="heritage-chart__grid" x1={PLOT_LEFT} x2={PLOT_RIGHT} y1={yForValue(value)} y2={yForValue(value)} />
            <text className="heritage-chart__tick" textAnchor="end" x={PLOT_LEFT - 8} y={yForValue(value) + 4}>{value}</text>
          </g>
        ))}
        {[...trendPoints.map((point) => point.year), FORECAST_YEAR].map((year) => (
          <text className="heritage-chart__tick" key={year} textAnchor="middle" x={xForYear(year)} y={PLOT_BOTTOM + 20}>{year}</text>
        ))}
        <line className="heritage-chart__axis" x1={PLOT_LEFT} x2={PLOT_RIGHT} y1={PLOT_BOTTOM} y2={PLOT_BOTTOM} />
        <path className="trend-chart__line" d={linePath} />
        {trendPoints.map((point) => (
          <g key={point.year}>
            <title>{`${point.year}년 · ${point.value}`}</title>
            <circle className="trend-chart__dot" cx={xForYear(point.year)} cy={yForValue(point.value)} r={4.5} />
          </g>
        ))}
        <text className="heritage-chart__value" textAnchor="middle" x={xForYear(lastTrendPoint.year)} y={yForValue(lastTrendPoint.value) - 10}>{lastTrendPoint.value}</text>
        {forecastScenarios.map((scenario) => {
          const chosen = scenarios[scenario.id];
          if (chosen !== scenario.answer) return null;
          return (
            <g key={scenario.id}>
              <title>{`${scenario.label} · ${scenario.answer}`}</title>
              <line
                className="trend-chart__forecast-line"
                x1={xForYear(lastTrendPoint.year)}
                x2={xForYear(FORECAST_YEAR)}
                y1={yForValue(lastTrendPoint.value)}
                y2={yForValue(scenario.answer)}
              />
              <circle className="trend-chart__forecast-dot" cx={xForYear(FORECAST_YEAR)} cy={yForValue(scenario.answer)} r={4.5} />
              <text className="trend-chart__forecast-label" textAnchor="start" x={xForYear(FORECAST_YEAR) + 8} y={yForValue(scenario.answer) + 4}>{scenario.answer}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

export function TrendForecastLab({ onSaved }: { onSaved?: () => void }) {
  const [draft, setDraft] = useState<ForecastDraft>(readForecastDraft);
  const [saved, setSaved] = useState(() => isForecastComplete(readForecastDraft()));
  const progress = countForecastProgress(draft);
  const totalSteps = forecastScenarios.length + forecastStatements.length;
  const complete = isForecastComplete(draft);

  useEffect(() => {
    window.localStorage.setItem(LESSON_NINE_FORECAST_KEY, JSON.stringify(draft));
  }, [draft]);

  function chooseScenario(scenarioId: string, value: number) {
    setDraft((current) => ({ ...current, scenarios: { ...current.scenarios, [scenarioId]: value } }));
  }

  function judge(statementId: string, verdict: ForecastVerdict) {
    setDraft((current) => ({ ...current, judgments: { ...current.judgments, [statementId]: verdict } }));
  }

  function saveResult() {
    if (!complete) return;
    setSaved(true);
    onSaved?.();
  }

  return (
    <div className="forecast-lab" data-testid="lesson-9-forecast">
      <section className="core-mission" aria-label="활동 방법">
        <span>웹앱이 하는 일</span>
        <strong>연도별 흐름을 읽고, 2026년의 세 가지 시나리오를 만들어 봅니다.</strong>
        <p>완성한 예측 문장은 30초 도슨트 해설의 마지막 문장으로 사용합니다.</p>
      </section>

      <header className="chart-studio__progress" aria-live="polite">
        <div><span>예측 연습 진행</span><strong>단계 {totalSteps}개 중 {progress}개 완료</strong></div>
        <div aria-hidden="true" className="cleaning-lab__progress-track">
          {forecastScenarios.map((scenario) => <i className={draft.scenarios[scenario.id] === scenario.answer ? "is-done" : ""} key={scenario.id} />)}
          {forecastStatements.map((statement) => <i className={draft.judgments[statement.id] === statement.verdict ? "is-done" : ""} key={statement.id} />)}
        </div>
      </header>

      <TrendChart scenarios={draft.scenarios} />

      <div className="data-judgments">
        {forecastScenarios.map((scenario) => {
          const chosen = draft.scenarios[scenario.id];
          const state = chosen === undefined ? "idle" : chosen === scenario.answer ? "correct" : "wrong";
          return (
            <article data-state={state} data-testid={`forecast-scenario-${scenario.id}`} key={scenario.id}>
              <div>
                <span>시나리오 · {scenario.label}</span>
                <strong>{scenario.question}</strong>
                <small>{state === "correct" ? scenario.explanation : state === "wrong" ? "다시 생각해 보세요. 해마다 얼마나 늘었는지 그래프에서 확인하세요." : "그래프의 증가 폭을 근거로 고르세요."}</small>
              </div>
              <div role="group" aria-label={`${scenario.label} 2026년 값 선택`}>
                {scenario.options.map((option) => (
                  <button aria-pressed={chosen === option} key={option} onClick={() => chooseScenario(scenario.id, option)} type="button">{option}</button>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <div className="data-judgments">
        {forecastStatements.map((statement) => {
          const selected = draft.judgments[statement.id];
          const state = selected ? (selected === statement.verdict ? "correct" : "wrong") : "idle";
          return (
            <article data-state={state} data-testid={`forecast-statement-${statement.id}`} key={statement.id}>
              <div>
                <span>예측 문장 점검</span>
                <strong>{statement.text}</strong>
                <small>{state === "correct" ? statement.explanation : state === "wrong" ? "다시 생각해 보세요. 가정과 ‘가능성’이라는 말이 있는지 살펴보세요." : "좋은 예측 문장인지, 지나친 단정인지 판단하세요."}</small>
              </div>
              <div role="group" aria-label={`${statement.text} 판단`}>
                <button aria-pressed={selected === "prediction"} onClick={() => judge(statement.id, "prediction")} type="button">가능한 예측</button>
                <button aria-pressed={selected === "certainty"} onClick={() => judge(statement.id, "certainty")} type="button">지나친 단정</button>
              </div>
            </article>
          );
        })}
      </div>

      <section className={complete ? "cleaning-lab__result is-complete" : "cleaning-lab__result"} aria-live="polite">
        <div><span>오늘 남길 결과</span><h5>해설에 넣을 예측 한 문장</h5></div>
        {complete ? (
          <div className="cleaning-lab__result-card">
            <span>세 시나리오와 예측 문장 점검 완료</span>
            <p>“지금까지의 흐름이 이어진다면 ___할 가능성이 있습니다. 다만 새로운 일이 생기면 달라질 수 있습니다.” — 이 문장으로 30초 해설을 마무리합니다.</p>
            <div className="cleaning-lab__result-actions">
              {!saved ? <button className="button button--primary" onClick={saveResult} type="button">예측 기록 저장</button> : <strong role="status">저장 완료! 예측 문장을 도슨트 대본에 옮겨 쓰세요.</strong>}
            </div>
          </div>
        ) : (
          <p>세 시나리오의 값을 고르고 예측 문장 세 개를 점검하면 해설용 문장틀이 완성됩니다.</p>
        )}
      </section>
    </div>
  );
}
