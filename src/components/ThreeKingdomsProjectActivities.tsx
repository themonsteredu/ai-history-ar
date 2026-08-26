import { lazy, Suspense, useState } from "react";
import {
  heritageResearchCases,
  verificationCases,
  type QuizVerdict,
} from "../content/three-kingdoms/webActivities";

const TrackedHeritageAr = lazy(() => import("./TrackedHeritageAr"));
const imageRoot = `${import.meta.env.BASE_URL}images/heritage/three-kingdoms`;
const verificationStorageKey = "moa-history-ar:three-kingdoms:lesson-6:v1";

const researchChecklist = ["제작 시기", "주체·목적", "유산의 가치", "현재 상태", "AI 오류 바로잡기", "아직 모름", "출처"] as const;

export function LessonFourResearchHub() {
  const [selectedCaseId, setSelectedCaseId] = useState(1);
  const [openedSourceId, setOpenedSourceId] = useState("m1-record");
  const selectedCase = heritageResearchCases[selectedCaseId - 1];

  function selectCase(caseId: number) {
    const nextCase = heritageResearchCases[caseId - 1];
    setSelectedCaseId(caseId);
    setOpenedSourceId(nextCase.sources[0].id);
  }

  return (
    <div className="project-activity research-lab" data-testid="lesson-4-research">
      <nav aria-label="조사할 문화유산" className="project-case-tabs">
        {heritageResearchCases.map((item) => (
          <button
            aria-pressed={selectedCaseId === item.id}
            key={item.id}
            onClick={() => selectCase(item.id)}
            type="button"
          >
            <span>{item.category}</span>
            <strong>{item.heritage}</strong>
            <small>{item.id}모둠 · 공식 자료 3개</small>
          </button>
        ))}
      </nav>

      <section className="research-case-hero">
        <img alt={`${selectedCase.heritage} 조사 사진`} src={`${imageRoot}/${selectedCase.image}`} />
        <div>
          <span>{selectedCase.category} · {selectedCaseId}모둠 조사실</span>
          <h3>{selectedCase.heritage}</h3>
          <p>{selectedCase.question}</p>
          <ul>{researchChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </section>

      <div className="research-source-list">
        {selectedCase.sources.map((source) => {
          const isOpen = openedSourceId === source.id;
          return (
            <article className={isOpen ? "research-source-card is-open" : "research-source-card"} key={source.id}>
              <button className="research-source-card__title" onClick={() => setOpenedSourceId(isOpen ? "" : source.id)} type="button">
                <span>{source.label}</span>
                <strong>{source.title}</strong>
                <small>{source.institution} · {isOpen ? "자료 접기" : "자료 읽기"}</small>
              </button>
              {isOpen ? (
                <div className="research-source-card__body">
                  <p className="research-read-guide"><strong>읽기 임무</strong>{source.readGuide}</p>
                  <div className="research-fact-list research-fact-list--readonly">
                    {source.facts.map((fact) => (
                      <article className={fact.kind === "caution" ? "is-caution" : ""} key={fact.id}>
                        <span>{fact.kind === "confirmed" ? "확인할 근거" : "아직 모름에 남길 점"}</span>
                        <strong>{fact.text}</strong>
                      </article>
                    ))}
                  </div>
                  <a href={source.href} rel="noreferrer" target="_blank">{source.institution} 원문 확인 ↗</a>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

const arExperiencePoints = [
  ["등장 요소", "카드를 찾은 뒤 무엇이 가장 먼저 나타나는가"],
  ["움직임", "시선이 유산의 핵심 특징으로 자연스럽게 이동하는가"],
  ["한 문장 해설", "4차시에서 확인한 사실을 짧고 정확하게 말하는가"],
  ["관람객 행동", "고르기·찾기·확대처럼 직접 할 일이 있는가"],
] as const;

export function LessonFiveArStudio() {
  return (
    <div className="web-tool project-activity ar-lesson-studio" data-testid="lesson-5-ar">
      <section className="core-mission" aria-label="활동 방법">
        <span>5차시 AR 체험</span>
        <strong>담당 유산을 비추고, 어떤 표현이 역사를 더 잘 이해하게 하는지 살펴보세요.</strong>
        <p>카메라가 어려우면 ‘카메라 없이 체험’을 눌러 같은 장면을 확인할 수 있습니다.</p>
      </section>
      <Suspense fallback={<div className="ar-loading" role="status">카메라 AR 도구를 준비하고 있습니다…</div>}>
        <TrackedHeritageAr />
      </Suspense>
      <section className="ar-experience-brief" aria-labelledby="ar-experience-brief-title">
        <div><span>체험 뒤 활동지에 기록</span><h3 id="ar-experience-brief-title">우리 모둠 AR은 네 가지를 정합니다</h3></div>
        <ol>{arExperiencePoints.map(([title, description]) => <li key={title}><strong>{title}</strong><span>{description}</span></li>)}</ol>
      </section>
    </div>
  );
}

const verdicts: readonly QuizVerdict[] = ["확인됨", "틀림", "판단 보류"];
const reasons = ["공식 자료의 기록", "유물·사진의 특징", "자료가 부족한 부분"] as const;
const verificationBankCount = verificationCases.reduce((count, item) => count + item.questions.length, 0);

interface VerificationResult {
  questionId: string;
  correct: boolean;
  reason: string;
}

function readVerificationHistory(): Record<string, { score: number; finishedAt: string }> {
  try {
    return JSON.parse(window.localStorage.getItem(verificationStorageKey) ?? "{}") as Record<string, { score: number; finishedAt: string }>;
  } catch {
    return {};
  }
}

function VerificationArena() {
  const [selectedCaseId, setSelectedCaseId] = useState(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [verdict, setVerdict] = useState<QuizVerdict | "">("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [history, setHistory] = useState(readVerificationHistory);
  const selectedCase = verificationCases[selectedCaseId - 1];
  const question = selectedCase.questions[questionIndex];
  const finished = results.length === selectedCase.questions.length;
  const score = results.filter((result) => result.correct).length;

  function chooseCase(caseId: number) {
    setSelectedCaseId(caseId);
    setQuestionIndex(0);
    setVerdict("");
    setReason("");
    setSubmitted(false);
    setRevealed(false);
    setResults([]);
  }

  function submitVerdict() {
    if (!verdict || !reason) return;
    setSubmitted(true);
  }

  function revealAnswer() {
    if (!submitted) return;
    setRevealed(true);
  }

  function moveNext() {
    if (!revealed || !verdict) return;
    const nextResults = [...results, { questionId: question.id, correct: verdict === question.verdict, reason }];
    setResults(nextResults);
    setVerdict("");
    setReason("");
    setSubmitted(false);
    setRevealed(false);
    if (questionIndex < selectedCase.questions.length - 1) {
      setQuestionIndex((current) => current + 1);
      return;
    }
    const finalScore = nextResults.filter((result) => result.correct).length;
    const nextHistory = { ...history, [String(selectedCaseId)]: { score: finalScore, finishedAt: new Date().toISOString() } };
    setHistory(nextHistory);
    window.localStorage.setItem(verificationStorageKey, JSON.stringify(nextHistory));
  }

  function restart() {
    setQuestionIndex(0);
    setVerdict("");
    setReason("");
    setSubmitted(false);
    setRevealed(false);
    setResults([]);
  }

  return (
    <div className="web-tool project-activity verification-arena" data-testid="lesson-6-verification">
      <section className="core-mission" aria-label="활동 방법">
        <span>웹앱이 하는 일 · 전체 문제 은행 {verificationBankCount}문항</span>
        <strong>우리 유산의 5문항을 판정하고, 판정 근거를 고릅니다.</strong>
        <p>학생들의 선택을 먼저 받은 뒤 교사가 ‘정답 공개’를 누릅니다.</p>
      </section>

      <nav aria-label="검증할 문화유산" className="project-case-tabs verification-case-tabs">
        {verificationCases.map((item) => (
          <button aria-pressed={selectedCaseId === item.id} key={item.id} onClick={() => chooseCase(item.id)} type="button">
            <span>{item.id}모둠</span>
            <strong>{item.heritage}</strong>
            <small>{history[String(item.id)] ? `최고 ${history[String(item.id)].score}/5` : "5문항"}</small>
          </button>
        ))}
      </nav>

      {finished ? (
        <section className={score >= 4 ? "verification-finish is-passed" : "verification-finish"}>
          <span>{selectedCase.heritage} 검증 결과</span>
          <strong>{score} / 5</strong>
          <h3>{score >= 4 ? "근거 지킴이 배지 획득!" : "자료를 다시 읽고 한 번 더 도전하세요."}</h3>
          <p>정답 수뿐 아니라 모든 문항에서 근거의 종류를 골랐습니다.</p>
          <button className="button button--primary" onClick={restart} type="button">다시 도전</button>
        </section>
      ) : (
        <>
          <section className="verification-question-card">
            <header>
              <div><span>{selectedCase.heritage}</span><strong>문항 {questionIndex + 1} / {selectedCase.questions.length}</strong></div>
              <div aria-label="문항 진행률" className="verification-progress">{selectedCase.questions.map((item, index) => <i className={index <= questionIndex ? "is-active" : ""} key={item.id} />)}</div>
            </header>
            <blockquote>“{question.statement}”</blockquote>
          </section>

          <fieldset className="verification-choice-panel" disabled={submitted}>
            <legend>1. 이 문장을 판정하세요</legend>
            <div>{verdicts.map((item) => <button aria-pressed={verdict === item} key={item} onClick={() => setVerdict(item)} type="button">{item}</button>)}</div>
          </fieldset>

          <fieldset className="verification-choice-panel verification-reason-panel" disabled={submitted}>
            <legend>2. 가장 먼저 확인할 근거를 고르세요</legend>
            <div>{reasons.map((item) => <button aria-pressed={reason === item} key={item} onClick={() => setReason(item)} type="button">{item}</button>)}</div>
          </fieldset>

          {!submitted ? (
            <div className="core-submit-row">
              <p>판정과 근거를 모두 고르면 제출할 수 있습니다.</p>
              <button className="button button--primary" disabled={!verdict || !reason} onClick={submitVerdict} type="button">우리 모둠 판정 제출</button>
            </div>
          ) : !revealed ? (
            <div className="teacher-reveal">
              <div><span>학생 판정 접수 완료</span><strong>아직 정답은 보이지 않습니다.</strong><p>모둠의 까닭을 들은 뒤 교사가 공개하세요.</p></div>
              <button data-testid="lesson-6-reveal" onClick={revealAnswer} type="button">교사 정답 공개</button>
            </div>
          ) : (
            <div className={verdict === question.verdict ? "verification-answer is-correct" : "verification-answer"}>
              <div><span>정답</span><strong>{question.verdict}</strong></div>
              <p>{question.explanation}</p>
              <small>우리 모둠이 먼저 고른 근거: {reason}</small>
              <a href={selectedCase.sourceHref} rel="noreferrer" target="_blank">{selectedCase.sourceLabel} 원문 ↗</a>
              <button className="button button--primary" onClick={moveNext} type="button">{questionIndex === 4 ? "결과 보기" : "다음 문항"}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function ThreeKingdomsProjectActivity({ lessonId }: { lessonId: number }) {
  if (lessonId === 4) return <LessonFourResearchHub />;
  if (lessonId === 5) return <LessonFiveArStudio />;
  return <VerificationArena />;
}
