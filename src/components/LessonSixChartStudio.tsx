import { useEffect, useState } from "react";
import {
  countRowsBy,
  foldSmallCategories,
  regionGroup,
  type ChartDatum,
} from "../content/three-kingdoms/heritageDataset";
import { HeritageBarChart } from "./HeritageBarChart";

const LESSON_SIX_CHART_KEY = "ai-history:three-kingdoms:lesson-6-charts:v1";
export const CHARTS_TO_COMPLETE = 3;

export interface ChartTitleOption {
  text: string;
  honest: boolean;
  note: string;
}

export interface ChartStudioConfig {
  id: string;
  pickerLabel: string;
  question: string;
  data: ChartDatum[];
  titleOptions: readonly ChartTitleOption[];
}

const chartCaption = "우리 학급이 모은 자료 60건 기준 · 단위: 자료 수(건)";

export const chartStudioConfigs: readonly ChartStudioConfig[] = [
  {
    id: "kingdom",
    pickerLabel: "나라별",
    question: "나라별로 자료가 몇 건씩 모였을까?",
    data: countRowsBy((row) => row.kingdom),
    titleOptions: [
      { text: "학급 자료 60건의 나라별 자료 수", honest: true, note: "그래프가 실제로 센 것(우리 자료의 수)만 말하는 제목입니다." },
      { text: "삼국시대 나라별 힘의 순위", honest: false, note: "자료 수는 나라의 힘이 아니라 우리 학급이 모은 양입니다." },
      { text: "나라별로 만들어진 유물 전체 개수", honest: false, note: "우리 자료 60건이지 그 시대 유물 전체가 아닙니다." },
    ],
  },
  {
    id: "sourceType",
    pickerLabel: "자료 종류별",
    question: "어떤 종류의 자료가 많이 모였을까?",
    data: foldSmallCategories(countRowsBy((row) => row.sourceType), 7, "그 밖의 종류"),
    titleOptions: [
      { text: "학급 자료의 종류별 자료 수", honest: true, note: "센 것은 자료의 종류별 개수입니다." },
      { text: "삼국시대에 만든 물건 전체 목록", honest: false, note: "우리 자료에 있는 종류만 보일 뿐 전체 목록이 아닙니다." },
      { text: "가장 귀한 유물의 순위", honest: false, note: "개수는 귀한 정도를 말해 주지 않습니다." },
    ],
  },
  {
    id: "region",
    pickerLabel: "지역별",
    question: "자료 속 유산은 어느 지역과 관련이 많을까?",
    data: countRowsBy((row) => regionGroup(row.region)),
    titleOptions: [
      { text: "학급 자료의 발견·출토 지역별 자료 수", honest: true, note: "지역별로 우리 자료를 센 것입니다." },
      { text: "삼국시대 사람들이 많이 살던 지역", honest: false, note: "발견 지역과 사람이 살던 곳은 다른 이야기입니다." },
      { text: "우리나라에서 유물이 가장 많은 지역", honest: false, note: "학급 자료 60건만 센 것이라 전체를 말할 수 없습니다." },
    ],
  },
  {
    id: "status",
    pickerLabel: "검증 상태별",
    question: "확인된 자료와 보류한 자료는 얼마나 될까?",
    data: countRowsBy((row) => row.status),
    titleOptions: [
      { text: "학급 자료의 검증 상태별 자료 수", honest: true, note: "확인됨·판단 보류·주의의 개수를 센 것입니다." },
      { text: "역사학자들이 아직 모르는 것의 개수", honest: false, note: "우리 자료의 상태이지 학계 전체의 목록이 아닙니다." },
      { text: "우리 학급이 틀린 자료의 개수", honest: false, note: "판단 보류는 틀린 것이 아니라 아직 확정하지 않은 것입니다." },
    ],
  },
  {
    id: "era",
    pickerLabel: "시기 범위별",
    question: "자료들은 어느 시기 범위에 몰려 있을까?",
    data: countRowsBy((row) => row.era),
    titleOptions: [
      { text: "학급 자료의 시기 범위별 자료 수", honest: true, note: "시기 표기별로 자료를 센 것입니다." },
      { text: "세기별로 만들어진 유물의 전체 수", honest: false, note: "우리 자료의 수이지 유물 전체 수가 아닙니다." },
      { text: "삼국시대에서 가장 중요한 세기", honest: false, note: "자료가 많다고 그 시기가 더 중요한 것은 아닙니다." },
    ],
  },
];

export function countHonestTitleSelections(selections: Record<string, string>) {
  return chartStudioConfigs.filter((config) => {
    const chosen = config.titleOptions.find((option) => option.text === selections[config.id]);
    return chosen?.honest === true;
  }).length;
}

export function isChartStudioComplete(selections: Record<string, string>) {
  return countHonestTitleSelections(selections) >= CHARTS_TO_COMPLETE;
}

function readChartSelections(): Record<string, string> {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LESSON_SIX_CHART_KEY) ?? "{}") as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).filter(([key, value]) =>
        chartStudioConfigs.some((config) => config.id === key && typeof value === "string" && config.titleOptions.some((option) => option.text === value)),
      ),
    ) as Record<string, string>;
  } catch {
    return {};
  }
}

export function LessonSixChartStudio({ onSaved }: { onSaved: () => void }) {
  const [selections, setSelections] = useState<Record<string, string>>(readChartSelections);
  const [activeId, setActiveId] = useState(chartStudioConfigs[0].id);
  const [saved, setSaved] = useState(() => isChartStudioComplete(readChartSelections()));
  const activeConfig = chartStudioConfigs.find((config) => config.id === activeId) ?? chartStudioConfigs[0];
  const honestCount = countHonestTitleSelections(selections);
  const complete = isChartStudioComplete(selections);
  const chosenOption = activeConfig.titleOptions.find((option) => option.text === selections[activeConfig.id]);
  const chartTitle = chosenOption?.honest ? chosenOption.text : activeConfig.question;

  useEffect(() => {
    window.localStorage.setItem(LESSON_SIX_CHART_KEY, JSON.stringify(selections));
  }, [selections]);

  function chooseTitle(option: ChartTitleOption) {
    setSelections((current) => ({ ...current, [activeConfig.id]: option.text }));
  }

  function saveResult() {
    if (!complete) return;
    setSaved(true);
    onSaved();
  }

  return (
    <div className="chart-studio" data-testid="lesson-6-chart-studio">
      <section className="core-mission" aria-label="활동 방법">
        <span>웹앱이 하는 일</span>
        <strong>학급 데이터 60건으로 그래프를 만들고, 그래프가 말하는 만큼만 담은 제목을 고릅니다.</strong>
        <p>여기서 축과 제목의 감을 익힌 뒤, CODAP에서 우리 모둠 그래프를 직접 만듭니다.</p>
      </section>

      <header className="chart-studio__progress" aria-live="polite">
        <div><span>그래프 완성 진행</span><strong>정직한 제목을 단 그래프 {honestCount}개 / 목표 {CHARTS_TO_COMPLETE}개</strong></div>
        <div aria-hidden="true" className="cleaning-lab__progress-track">
          {chartStudioConfigs.map((config) => {
            const done = config.titleOptions.find((option) => option.text === selections[config.id])?.honest === true;
            return <i className={done ? "is-done" : ""} key={config.id} />;
          })}
        </div>
      </header>

      <div className="chart-studio__picker" role="group" aria-label="세어 볼 항목 선택">
        {chartStudioConfigs.map((config) => {
          const done = config.titleOptions.find((option) => option.text === selections[config.id])?.honest === true;
          return (
            <button aria-pressed={activeId === config.id} key={config.id} onClick={() => setActiveId(config.id)} type="button">
              {config.pickerLabel}{done ? " ✓" : ""}
            </button>
          );
        })}
      </div>

      <HeritageBarChart caption={chartCaption} data={activeConfig.data} title={chartTitle} />

      <section className="chart-studio__titles" aria-label="그래프 제목 고르기">
        <div><span>제목 고르기</span><strong>이 그래프가 실제로 보여 주는 것만 담은 제목은 무엇일까요?</strong></div>
        <div className="data-judgments">
          {activeConfig.titleOptions.map((option) => {
            const selected = selections[activeConfig.id] === option.text;
            const state = selected ? (option.honest ? "correct" : "wrong") : "idle";
            return (
              <article data-state={state} key={option.text}>
                <div>
                  <span>{state === "correct" ? "정직한 제목" : state === "wrong" ? "다시 생각해 보세요" : "제목 후보"}</span>
                  <strong>{option.text}</strong>
                  <small>{selected ? option.note : "그래프가 센 것과 제목이 말하는 것을 비교해 보세요."}</small>
                </div>
                <div role="group" aria-label={`${option.text} 선택`}>
                  <button aria-pressed={selected} onClick={() => chooseTitle(option)} type="button">{selected ? "선택함" : "이 제목 선택"}</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={complete ? "cleaning-lab__result is-complete" : "cleaning-lab__result"} aria-live="polite">
        <div><span>오늘 남길 결과</span><h5>우리 모둠 그래프 카드</h5></div>
        {complete ? (
          <div className="cleaning-lab__result-card">
            <span>정직한 제목의 그래프 {honestCount}개 완성</span>
            <ul>
              {chartStudioConfigs
                .filter((config) => config.titleOptions.find((option) => option.text === selections[config.id])?.honest)
                .map((config) => <li key={config.id}>{config.pickerLabel} 그래프</li>)}
            </ul>
            <p>그래프 제목은 자료가 보여 주는 범위까지만 말합니다. CODAP에서도 같은 규칙으로 제목을 붙이세요.</p>
            <div className="cleaning-lab__result-actions">
              {!saved ? <button className="button button--primary" onClick={saveResult} type="button">그래프 기록 저장</button> : <strong role="status">저장 완료! 아래에서 CODAP 실전 그래프를 시작하세요.</strong>}
            </div>
          </div>
        ) : (
          <p>다섯 그래프 가운데 세 개 이상에 정직한 제목을 붙이면 저장할 수 있습니다.</p>
        )}
      </section>
    </div>
  );
}
