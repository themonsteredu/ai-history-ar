import { useEffect, useRef, useState } from "react";

const LESSON_TEN_CHECKLIST_KEY = "ai-history:three-kingdoms:lesson-10-museum:v1";
const REHEARSAL_SECONDS = 30;

export interface MuseumChecklistItem {
  id: string;
  label: string;
  detail: string;
}

export const museumChecklist: readonly MuseumChecklistItem[] = [
  { id: "card", label: "AR 표적 카드", detail: "인쇄한 카드 또는 카드 화면을 부스에 준비했다." },
  { id: "chart", label: "그래프 자료", detail: "축과 제목이 보이는 그래프 PNG나 출력물을 준비했다." },
  { id: "qr", label: "QR 대체 경로", detail: "카메라 인식이 안 될 때 보여 줄 QR·링크를 준비했다." },
  { id: "script", label: "30초 해설 대본", detail: "근거 → 유추 → 예측 → 아직 모름 순서로 대본을 완성했다." },
  { id: "mission", label: "관람객 미션", detail: "관람객이 직접 해 볼 고르기·찾기·확대 미션을 정했다." },
  { id: "roles", label: "역할 분담", detail: "도슨트·기록·안내 역할을 나누고 교대 순서를 정했다." },
] as const;

export interface VisitorQuestion {
  question: string;
  tip: string;
}

export const visitorQuestions: readonly VisitorQuestion[] = [
  { question: "이 그래프에서 무엇을 알 수 있나요?", tip: "막대나 점이 보여 주는 것까지만 말합니다." },
  { question: "그 사실은 어떻게 확인했나요?", tip: "출처 기관과 자료 종류를 함께 말합니다." },
  { question: "아직 모르는 것은 무엇인가요?", tip: "판단 보류로 남긴 내용을 자신 있게 말합니다." },
  { question: "이 유산은 왜 중요하다고 생각하나요?", tip: "자료에서 확인한 가치와 내 생각을 구분해 말합니다." },
  { question: "AI가 틀렸던 내용은 무엇이었나요?", tip: "2차시에서 찾은 오류와 바로잡은 근거를 말합니다." },
  { question: "그래프만 보고 단정하면 안 되는 것은 무엇인가요?", tip: "7차시의 ‘그래프만으로는 모른다’ 문장을 떠올립니다." },
  { question: "앞으로는 어떻게 될 것 같나요?", tip: "9차시 예측 문장을 ‘가능성이 있다’로 말합니다." },
  { question: "자료는 몇 건이나 모았나요?", tip: "자료 수와 모은 방법을 함께 소개합니다." },
] as const;

export function countCheckedItems(checked: Record<string, boolean>) {
  return museumChecklist.filter((item) => checked[item.id]).length;
}

export function isChecklistComplete(checked: Record<string, boolean>) {
  return countCheckedItems(checked) === museumChecklist.length;
}

function readChecklist(): Record<string, boolean> {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LESSON_TEN_CHECKLIST_KEY) ?? "{}") as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).filter(([key, value]) => museumChecklist.some((item) => item.id === key) && typeof value === "boolean"),
    ) as Record<string, boolean>;
  } catch {
    return {};
  }
}

function RehearsalTimer() {
  const [secondsLeft, setSecondsLeft] = useState(REHEARSAL_SECONDS);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  function start() {
    setSecondsLeft(REHEARSAL_SECONDS);
    setRunning(true);
  }

  function reset() {
    setRunning(false);
    setSecondsLeft(REHEARSAL_SECONDS);
  }

  return (
    <div className={secondsLeft === 0 ? "rehearsal-timer is-finished" : "rehearsal-timer"}>
      <div>
        <span>30초 해설 연습</span>
        <strong aria-live="polite">{secondsLeft === 0 ? "시간 끝! 핵심만 남았나요?" : `${secondsLeft}초`}</strong>
      </div>
      <div>
        <button className="button button--primary" onClick={start} type="button">{running ? "다시 시작" : "타이머 시작"}</button>
        <button className="button button--outline" onClick={reset} type="button">초기화</button>
      </div>
    </div>
  );
}

export function LessonTenMuseumRehearsal({ onSaved }: { onSaved: () => void }) {
  const [checked, setChecked] = useState<Record<string, boolean>>(readChecklist);
  const [questionIndex, setQuestionIndex] = useState<number | null>(null);
  const [saved, setSaved] = useState(() => isChecklistComplete(readChecklist()));
  const checkedCount = countCheckedItems(checked);
  const complete = isChecklistComplete(checked);
  const activeQuestion = questionIndex === null ? null : visitorQuestions[questionIndex];

  useEffect(() => {
    window.localStorage.setItem(LESSON_TEN_CHECKLIST_KEY, JSON.stringify(checked));
  }, [checked]);

  function toggleItem(itemId: string) {
    setChecked((current) => ({ ...current, [itemId]: !current[itemId] }));
  }

  function drawQuestion() {
    setQuestionIndex((current) => {
      if (visitorQuestions.length === 1) return 0;
      let next = Math.floor(Math.random() * visitorQuestions.length);
      while (next === current) next = Math.floor(Math.random() * visitorQuestions.length);
      return next;
    });
  }

  function saveResult() {
    if (!complete) return;
    setSaved(true);
    onSaved();
  }

  return (
    <div className="museum-rehearsal" data-testid="lesson-10-rehearsal">
      <section className="core-mission" aria-label="활동 방법">
        <span>박물관 열기 전 마지막 점검</span>
        <strong>부스 준비 여섯 가지를 점검하고, 관람객 질문으로 30초 해설을 연습합니다.</strong>
        <p>질문 카드는 무작위로 나옵니다. 어떤 질문이 나와도 근거로 답할 수 있으면 준비 완료입니다.</p>
      </section>

      <header className="chart-studio__progress" aria-live="polite">
        <div><span>부스 준비 점검</span><strong>{museumChecklist.length}가지 중 {checkedCount}가지 준비 완료</strong></div>
        <div aria-hidden="true" className="cleaning-lab__progress-track">
          {museumChecklist.map((item) => <i className={checked[item.id] ? "is-done" : ""} key={item.id} />)}
        </div>
      </header>

      <div className="museum-rehearsal__checklist" role="group" aria-label="부스 준비 체크리스트">
        {museumChecklist.map((item) => (
          <button aria-pressed={Boolean(checked[item.id])} data-testid={`museum-check-${item.id}`} key={item.id} onClick={() => toggleItem(item.id)} type="button">
            <span aria-hidden="true">{checked[item.id] ? "✓" : ""}</span>
            <div><strong>{item.label}</strong><small>{item.detail}</small></div>
          </button>
        ))}
      </div>

      <section className="museum-rehearsal__practice" aria-label="관람객 질문 연습">
        <div className="visitor-question-card">
          <div>
            <span>관람객 질문 카드</span>
            {activeQuestion ? (
              <>
                <strong data-testid="visitor-question">{activeQuestion.question}</strong>
                <small>{activeQuestion.tip}</small>
              </>
            ) : (
              <>
                <strong>버튼을 눌러 질문을 뽑으세요</strong>
                <small>관람객이 실제로 물어볼 만한 질문 {visitorQuestions.length}가지가 준비되어 있습니다.</small>
              </>
            )}
          </div>
          <button className="button button--primary" onClick={drawQuestion} type="button">질문 뽑기</button>
        </div>
        <RehearsalTimer />
      </section>

      <section className={complete ? "cleaning-lab__result is-complete" : "cleaning-lab__result"} aria-live="polite">
        <div><span>개관 준비</span><h5>우리 모둠 부스 준비 상태</h5></div>
        {complete ? (
          <div className="cleaning-lab__result-card">
            <span>여섯 가지 준비 완료 · 개관할 수 있습니다</span>
            <p>AR이 멈춰도 그래프와 QR 대체 경로로 해설을 이어 갈 수 있는지 마지막으로 확인하세요.</p>
            <div className="cleaning-lab__result-actions">
              {!saved ? <button className="button button--primary" onClick={saveResult} type="button">준비 완료 저장</button> : <strong role="status">저장 완료! AR 데이터 박물관을 여세요.</strong>}
            </div>
          </div>
        ) : (
          <p>여섯 가지를 모두 준비하면 개관 준비가 끝납니다. 부족한 항목은 모둠이 나눠 맡으세요.</p>
        )}
      </section>
    </div>
  );
}
