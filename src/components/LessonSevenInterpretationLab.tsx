import { useEffect, useState } from "react";
import { countRowsBy } from "../content/three-kingdoms/heritageDataset";
import { HeritageBarChart } from "./HeritageBarChart";

const LESSON_SEVEN_READING_KEY = "ai-history:three-kingdoms:lesson-7-reading:v1";

export type InterpretationVerdict = "visible" | "unknown";

export interface InterpretationStatement {
  id: string;
  text: string;
  verdict: InterpretationVerdict;
  explanation: string;
}

export const interpretationStatements: readonly InterpretationStatement[] = [
  { id: "equal", text: "우리 학급 자료에서 백제와 신라의 자료 수가 같다.", verdict: "visible", explanation: "막대 길이를 비교하면 20건으로 같음을 바로 읽을 수 있습니다." },
  { id: "half", text: "고구려 자료 수는 신라 자료 수의 절반이다.", verdict: "visible", explanation: "10건과 20건이므로 그래프에서 바로 확인됩니다." },
  { id: "different", text: "나라마다 모은 자료 수가 다르다.", verdict: "visible", explanation: "막대 길이가 두 종류로 나뉜 것이 그래프에 보입니다." },
  { id: "more-relics", text: "신라가 고구려보다 유물을 더 많이 만들었다.", verdict: "unknown", explanation: "자료 수와 그 시대에 만든 유물 수는 다른 이야기입니다. 그래프는 우리가 모은 자료만 셉니다." },
  { id: "gaya-weak", text: "가야 자료가 적은 까닭은 가야가 약한 나라였기 때문이다.", verdict: "unknown", explanation: "백제·신라는 담당 유산이 두 개, 고구려·가야는 한 개라 자료 수가 다를 뿐입니다. 모은 방법을 알아야 까닭을 말할 수 있습니다." },
  { id: "richest", text: "삼국시대에는 백제가 가장 부유했다.", verdict: "unknown", explanation: "자료 수 그래프에는 나라의 부유함에 대한 정보가 없습니다." },
] as const;

export function countCorrectInterpretations(decisions: Record<string, InterpretationVerdict>) {
  return interpretationStatements.filter((statement) => decisions[statement.id] === statement.verdict).length;
}

export function isInterpretationComplete(decisions: Record<string, InterpretationVerdict>) {
  return countCorrectInterpretations(decisions) === interpretationStatements.length;
}

function readInterpretationDecisions(): Record<string, InterpretationVerdict> {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LESSON_SEVEN_READING_KEY) ?? "{}") as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).filter(([key, value]) =>
        interpretationStatements.some((statement) => statement.id === key) && (value === "visible" || value === "unknown"),
      ),
    ) as Record<string, InterpretationVerdict>;
  } catch {
    return {};
  }
}

const kingdomData = countRowsBy((row) => row.kingdom);

export function LessonSevenInterpretationLab({ onSaved }: { onSaved: () => void }) {
  const [decisions, setDecisions] = useState<Record<string, InterpretationVerdict>>(readInterpretationDecisions);
  const [saved, setSaved] = useState(() => isInterpretationComplete(readInterpretationDecisions()));
  const correctCount = countCorrectInterpretations(decisions);
  const complete = isInterpretationComplete(decisions);

  useEffect(() => {
    window.localStorage.setItem(LESSON_SEVEN_READING_KEY, JSON.stringify(decisions));
  }, [decisions]);

  function decide(statementId: string, verdict: InterpretationVerdict) {
    setDecisions((current) => ({ ...current, [statementId]: verdict }));
  }

  function saveResult() {
    if (!complete) return;
    setSaved(true);
    onSaved();
  }

  return (
    <div className="interpretation-lab" data-testid="lesson-7-interpretation">
      <section className="core-mission" aria-label="활동 방법">
        <span>웹앱이 하는 일</span>
        <strong>같은 그래프를 보고, 문장마다 ‘그래프에서 보인다’와 ‘그래프만으로는 모른다’를 구분합니다.</strong>
        <p>여기서 나눈 기준으로 CODAP의 우리 모둠 그래프를 해석합니다.</p>
      </section>

      <header className="chart-studio__progress" aria-live="polite">
        <div><span>해석 연습 진행</span><strong>문장 {interpretationStatements.length}개 중 {correctCount}개 정확히 구분</strong></div>
        <div aria-hidden="true" className="cleaning-lab__progress-track">
          {interpretationStatements.map((statement) => <i className={decisions[statement.id] === statement.verdict ? "is-done" : ""} key={statement.id} />)}
        </div>
      </header>

      <HeritageBarChart caption="우리 학급이 모은 자료 60건 기준 · 단위: 자료 수(건)" data={kingdomData} title="학급 자료 60건의 나라별 자료 수" />

      <div className="data-judgments">
        {interpretationStatements.map((statement, index) => {
          const selected = decisions[statement.id];
          const state = selected ? (selected === statement.verdict ? "correct" : "wrong") : "idle";
          return (
            <article data-state={state} data-testid={`interpretation-${statement.id}`} key={statement.id}>
              <div>
                <span>문장 {index + 1}</span>
                <strong>{statement.text}</strong>
                <small>{state === "correct" ? statement.explanation : state === "wrong" ? "다시 생각해 보세요. 그래프가 실제로 센 것이 무엇인지 떠올려 보세요." : "막대의 길이에서 읽을 수 있는 내용인지 판단하세요."}</small>
              </div>
              <div role="group" aria-label={`${statement.text} 판단`}>
                <button aria-pressed={selected === "visible"} onClick={() => decide(statement.id, "visible")} type="button">그래프에서 보인다</button>
                <button aria-pressed={selected === "unknown"} onClick={() => decide(statement.id, "unknown")} type="button">그래프만으로는 모른다</button>
              </div>
            </article>
          );
        })}
      </div>

      <section className={complete ? "cleaning-lab__result is-complete" : "cleaning-lab__result"} aria-live="polite">
        <div><span>오늘 남길 결과</span><h5>우리 모둠 해석 문장</h5></div>
        {complete ? (
          <div className="cleaning-lab__result-card">
            <span>보이는 점 3개 · 모르는 점 3개 구분 완료</span>
            <p>“그래프에서 자료 수의 차이는 보이지만, 그 까닭과 그 시대의 실제 모습은 그래프만으로 알 수 없다.”</p>
            <div className="cleaning-lab__result-actions">
              {!saved ? <button className="button button--primary" onClick={saveResult} type="button">해석 기록 저장</button> : <strong role="status">저장 완료! CODAP 그래프에도 같은 기준을 적용하세요.</strong>}
            </div>
          </div>
        ) : (
          <p>여섯 문장을 모두 정확히 구분하면 우리 모둠 해석 문장이 완성됩니다.</p>
        )}
      </section>
    </div>
  );
}
