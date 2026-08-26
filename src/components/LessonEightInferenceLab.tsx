import { useEffect, useState } from "react";

const LESSON_EIGHT_INFERENCE_KEY = "ai-history:three-kingdoms:lesson-8-inference:v1";

export type InferenceVerdict = "reasonable" | "overreach";

export interface InferenceStatement {
  id: string;
  text: string;
  verdict: InferenceVerdict;
  explanation: string;
}

export interface InferenceMission {
  id: string;
  heritage: string;
  evidence: readonly [string, string];
  statements: readonly InferenceStatement[];
}

export const inferenceMissions: readonly InferenceMission[] = [
  {
    id: "muryeong",
    heritage: "무령왕릉",
    evidence: ["무덤에서 중국 도자기가 나왔다", "관은 일본산 나무로 만들었다"],
    statements: [
      { id: "muryeong-exchange", text: "백제는 중국·일본과 교류했을 가능성이 있다.", verdict: "reasonable", explanation: "다른 지역의 물건 두 가지가 근거이므로 ‘가능성이 있다’까지 말할 수 있습니다." },
      { id: "muryeong-everyone", text: "백제 사람 모두가 외국 물건을 쓰며 살았다.", verdict: "overreach", explanation: "왕릉 하나의 유물을 모든 사람의 생활로 넓히면 지나친 단정입니다." },
      { id: "muryeong-rule", text: "백제가 중국과 일본을 다스렸다.", verdict: "overreach", explanation: "물건이 오간 것과 다스린 것은 전혀 다른 이야기입니다." },
    ],
  },
  {
    id: "gaya",
    heritage: "가야 고분군",
    evidence: ["고분군이 영남 여러 지역에 나뉘어 있다", "대형 무덤에서 철제 갑옷과 덩이쇠가 나왔다"],
    statements: [
      { id: "gaya-iron", text: "가야 세력들은 철을 다루는 기술이 뛰어났을 가능성이 있다.", verdict: "reasonable", explanation: "철제 유물이 근거이므로 가능성으로 말할 수 있습니다." },
      { id: "gaya-regions", text: "여러 지역에 힘 있는 세력이 각각 있었을 가능성이 있다.", verdict: "reasonable", explanation: "지역마다 큰 고분군이 있다는 근거와 이어집니다." },
      { id: "gaya-one-king", text: "가야는 한 명의 왕이 모든 지역을 다스렸다.", verdict: "overreach", explanation: "근거는 오히려 여러 세력을 보여 주므로 이 문장은 단정입니다." },
    ],
  },
  {
    id: "crown",
    heritage: "신라 금관",
    evidence: ["금관은 왕릉급 무덤에서 나왔다", "얇은 금판과 장식으로 만들어 약하다"],
    statements: [
      { id: "crown-ritual", text: "금관은 의례나 장례에서 쓰였을 가능성이 있다.", verdict: "reasonable", explanation: "약한 구조와 무덤 출토라는 근거의 범위 안에 있는 유추입니다." },
      { id: "crown-power", text: "금관은 무덤 주인의 힘을 보여 주는 물건일 가능성이 있다.", verdict: "reasonable", explanation: "왕릉급 무덤에서만 나온다는 근거와 이어집니다." },
      { id: "crown-daily", text: "신라 왕은 금관을 매일 쓰고 생활했다.", verdict: "overreach", explanation: "약한 구조라는 근거와 어긋나며, 매일 썼다는 자료도 없습니다." },
    ],
  },
] as const;

export const inferenceStatementCount = inferenceMissions.reduce((count, mission) => count + mission.statements.length, 0);

export function countCorrectInferences(decisions: Record<string, InferenceVerdict>) {
  return inferenceMissions.flatMap((mission) => mission.statements).filter((statement) => decisions[statement.id] === statement.verdict).length;
}

export function isInferenceComplete(decisions: Record<string, InferenceVerdict>) {
  return countCorrectInferences(decisions) === inferenceStatementCount;
}

function readInferenceDecisions(): Record<string, InferenceVerdict> {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LESSON_EIGHT_INFERENCE_KEY) ?? "{}") as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).filter(([key, value]) =>
        inferenceMissions.some((mission) => mission.statements.some((statement) => statement.id === key)) && (value === "reasonable" || value === "overreach"),
      ),
    ) as Record<string, InferenceVerdict>;
  } catch {
    return {};
  }
}

export function LessonEightInferenceLab({ onSaved }: { onSaved: () => void }) {
  const [decisions, setDecisions] = useState<Record<string, InferenceVerdict>>(readInferenceDecisions);
  const [saved, setSaved] = useState(() => isInferenceComplete(readInferenceDecisions()));
  const [missionIndex, setMissionIndex] = useState(0);
  const mission = inferenceMissions[missionIndex];
  const correctCount = countCorrectInferences(decisions);
  const complete = isInferenceComplete(decisions);

  useEffect(() => {
    window.localStorage.setItem(LESSON_EIGHT_INFERENCE_KEY, JSON.stringify(decisions));
  }, [decisions]);

  function decide(statementId: string, verdict: InferenceVerdict) {
    setDecisions((current) => ({ ...current, [statementId]: verdict }));
  }

  function saveResult() {
    if (!complete) return;
    setSaved(true);
    onSaved();
  }

  return (
    <div className="inference-lab" data-testid="lesson-8-inference">
      <section className="core-mission" aria-label="활동 방법">
        <span>웹앱이 하는 일</span>
        <strong>근거 두 개를 읽고, 유추 문장이 ‘가능한 유추’인지 ‘지나친 단정’인지 판단합니다.</strong>
        <p>여기서 연습한 ‘근거 2개 → 유추 1개’ 규칙으로 CODAP 관계 그래프를 해석합니다.</p>
      </section>

      <header className="chart-studio__progress" aria-live="polite">
        <div><span>유추 연습 진행</span><strong>문장 {inferenceStatementCount}개 중 {correctCount}개 정확히 판단</strong></div>
        <div aria-hidden="true" className="cleaning-lab__progress-track">
          {inferenceMissions.flatMap((item) => item.statements).map((statement) => <i className={decisions[statement.id] === statement.verdict ? "is-done" : ""} key={statement.id} />)}
        </div>
      </header>

      <div className="chart-studio__picker" role="group" aria-label="유추 미션 선택">
        {inferenceMissions.map((item, index) => {
          const done = item.statements.every((statement) => decisions[statement.id] === statement.verdict);
          return (
            <button aria-pressed={missionIndex === index} key={item.id} onClick={() => setMissionIndex(index)} type="button">
              {item.heritage}{done ? " ✓" : ""}
            </button>
          );
        })}
      </div>

      <section className="inference-lab__evidence" aria-label="이번 미션의 근거">
        <span>근거 2개 · {mission.heritage}</span>
        <ol>
          {mission.evidence.map((item, index) => <li key={item}><strong>근거 {index + 1}</strong><p>{item}</p></li>)}
        </ol>
        <p>이 두 근거가 보여 주는 범위 안에서만 유추할 수 있습니다.</p>
      </section>

      <div className="data-judgments">
        {mission.statements.map((statement) => {
          const selected = decisions[statement.id];
          const state = selected ? (selected === statement.verdict ? "correct" : "wrong") : "idle";
          return (
            <article data-state={state} data-testid={`inference-${statement.id}`} key={statement.id}>
              <div>
                <span>{state === "correct" ? "판단 완료" : "유추 문장"}</span>
                <strong>{statement.text}</strong>
                <small>{state === "correct" ? statement.explanation : state === "wrong" ? "다시 생각해 보세요. 근거 두 개가 말하는 범위를 넘었는지 살펴보세요." : "근거가 보여 주는 범위 안의 문장인지 판단하세요."}</small>
              </div>
              <div role="group" aria-label={`${statement.text} 판단`}>
                <button aria-pressed={selected === "reasonable"} onClick={() => decide(statement.id, "reasonable")} type="button">가능한 유추</button>
                <button aria-pressed={selected === "overreach"} onClick={() => decide(statement.id, "overreach")} type="button">지나친 단정</button>
              </div>
            </article>
          );
        })}
      </div>

      <section className={complete ? "cleaning-lab__result is-complete" : "cleaning-lab__result"} aria-live="polite">
        <div><span>오늘 남길 결과</span><h5>우리 모둠 유추 문장틀</h5></div>
        {complete ? (
          <div className="cleaning-lab__result-card">
            <span>세 미션 아홉 문장 판단 완료</span>
            <p>“근거 1과 근거 2를 보면, ___했을 가능성이 있다. 하지만 ___까지는 알 수 없다.” — 이 문장틀로 우리 모둠 유추를 활동지에 씁니다.</p>
            <div className="cleaning-lab__result-actions">
              {!saved ? <button className="button button--primary" onClick={saveResult} type="button">유추 기록 저장</button> : <strong role="status">저장 완료! CODAP에서 우리 모둠 근거 2개를 직접 찾아보세요.</strong>}
            </div>
          </div>
        ) : (
          <p>세 미션의 아홉 문장을 모두 정확히 판단하면 유추 문장틀이 완성됩니다.</p>
        )}
      </section>
    </div>
  );
}
