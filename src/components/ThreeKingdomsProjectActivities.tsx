import { lazy, Suspense, useEffect, useState } from "react";
import {
  heritageResearchCases,
  verificationCases,
  type EvidenceFact,
  type QuizVerdict,
} from "../content/three-kingdoms/webActivities";

const TrackedHeritageAr = lazy(() => import("./TrackedHeritageAr"));
const imageRoot = `${import.meta.env.BASE_URL}images/heritage/three-kingdoms`;
const researchStorageKey = "moa-history-ar:three-kingdoms:lesson-4:v1";
const verificationStorageKey = "moa-history-ar:three-kingdoms:lesson-6:v1";

type ResearchProgress = Record<string, { evidenceIds: string[]; completed: boolean }>;

function readResearchProgress(): ResearchProgress {
  try {
    return JSON.parse(window.localStorage.getItem(researchStorageKey) ?? "{}") as ResearchProgress;
  } catch {
    return {};
  }
}

function ResearchEvidenceExplorer() {
  const [selectedCaseId, setSelectedCaseId] = useState(1);
  const [openedSourceId, setOpenedSourceId] = useState("m1-record");
  const [progress, setProgress] = useState<ResearchProgress>(readResearchProgress);
  const [savedMessage, setSavedMessage] = useState("");
  const selectedCase = heritageResearchCases[selectedCaseId - 1];
  const selectedProgress = progress[String(selectedCaseId)] ?? { evidenceIds: [], completed: false };
  const allFacts = selectedCase.sources.flatMap((source) => source.facts);
  const collectedFacts = allFacts.filter((fact) => selectedProgress.evidenceIds.includes(fact.id));
  const confirmedCount = collectedFacts.filter((fact) => fact.kind === "confirmed").length;
  const cautionCount = collectedFacts.filter((fact) => fact.kind === "caution").length;
  const ready = confirmedCount >= 2 && cautionCount >= 1;

  useEffect(() => {
    window.localStorage.setItem(researchStorageKey, JSON.stringify(progress));
  }, [progress]);

  function selectCase(caseId: number) {
    const nextCase = heritageResearchCases[caseId - 1];
    setSelectedCaseId(caseId);
    setOpenedSourceId(nextCase.sources[0].id);
    setSavedMessage("");
  }

  function toggleEvidence(fact: EvidenceFact) {
    setProgress((current) => {
      const caseProgress = current[String(selectedCaseId)] ?? { evidenceIds: [], completed: false };
      const exists = caseProgress.evidenceIds.includes(fact.id);
      return {
        ...current,
        [String(selectedCaseId)]: {
          evidenceIds: exists
            ? caseProgress.evidenceIds.filter((id) => id !== fact.id)
            : [...caseProgress.evidenceIds, fact.id],
          completed: false,
        },
      };
    });
    setSavedMessage("");
  }

  function saveResearch() {
    if (!ready) return;
    setProgress((current) => ({
      ...current,
      [String(selectedCaseId)]: { ...selectedProgress, completed: true },
    }));
    setSavedMessage(`${selectedCase.heritage} 근거 꾸러미를 이 기기에 저장했습니다.`);
  }

  return (
    <div className="web-tool project-activity research-lab" data-testid="lesson-4-research">
      <section className="core-mission" aria-label="활동 방법">
        <span>웹앱이 하는 일</span>
        <strong>공식 자료를 비교하고 필요한 근거만 모읍니다.</strong>
        <p>근거를 자기 말로 바꾸어 쓰는 일은 학생 활동지에서 합니다.</p>
      </section>

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
            <small>{progress[String(item.id)]?.completed ? "조사 완료" : "자료 3개"}</small>
          </button>
        ))}
      </nav>

      <section className="research-case-hero">
        <img alt={`${selectedCase.heritage} 조사 사진`} src={`${imageRoot}/${selectedCase.image}`} />
        <div>
          <span>{selectedCase.category} · 모둠 조사실</span>
          <h3>{selectedCase.heritage}</h3>
          <p>{selectedCase.question}</p>
          <ul>
            <li className={confirmedCount >= 2 ? "is-complete" : ""}>확인된 사실 {confirmedCount} / 2</li>
            <li className={cautionCount >= 1 ? "is-complete" : ""}>단정하면 안 되는 점 {cautionCount} / 1</li>
          </ul>
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
                  <div className="research-fact-list">
                    {source.facts.map((fact) => {
                      const selected = selectedProgress.evidenceIds.includes(fact.id);
                      return (
                        <button
                          aria-pressed={selected}
                          className={fact.kind === "caution" ? "is-caution" : ""}
                          key={fact.id}
                          onClick={() => toggleEvidence(fact)}
                          type="button"
                        >
                          <span>{fact.kind === "confirmed" ? "확인된 사실" : "판단 보류"}</span>
                          <strong>{fact.text}</strong>
                          <small>{selected ? "근거 꾸러미에서 빼기" : "+ 근거 꾸러미에 담기"}</small>
                        </button>
                      );
                    })}
                  </div>
                  <a href={source.href} rel="noreferrer" target="_blank">{source.institution} 원문 확인 ↗</a>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <aside className="evidence-tray" aria-live="polite">
        <header>
          <div><span>우리 모둠 근거 꾸러미</span><h3>{collectedFacts.length > 0 ? `${collectedFacts.length}개를 골랐습니다` : "자료에서 근거를 골라 주세요"}</h3></div>
          <button className="button button--primary" disabled={!ready} onClick={saveResearch} type="button">조사 완료 저장</button>
        </header>
        {collectedFacts.length > 0 ? (
          <ol>{collectedFacts.map((fact) => <li className={fact.kind === "caution" ? "is-caution" : ""} key={fact.id}><span>{fact.kind === "confirmed" ? "확인" : "보류"}</span>{fact.text}</li>)}</ol>
        ) : <p>자료 카드의 문장을 눌러 담으세요. 확인 2개와 보류 1개가 필요합니다.</p>}
        {savedMessage ? <strong className="project-save-message">{savedMessage}</strong> : null}
      </aside>
    </div>
  );
}

function CameraArActivity() {
  return (
    <div className="web-tool project-activity" data-testid="lesson-5-ar">
      <section className="core-mission" aria-label="활동 방법">
        <span>웹앱이 하는 일</span>
        <strong>카메라가 유물 카드를 찾으면 화면에 AR 표시와 핵심 설명을 띄웁니다.</strong>
        <p>카메라 영상은 이 기기에서만 처리하며 저장하거나 전송하지 않습니다.</p>
      </section>
      <Suspense fallback={<div className="ar-loading" role="status">카메라 AR 도구를 준비하고 있습니다…</div>}>
        <TrackedHeritageAr />
      </Suspense>
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
  if (lessonId === 4) return <ResearchEvidenceExplorer />;
  if (lessonId === 5) return <CameraArActivity />;
  return <VerificationArena />;
}
