import { useEffect, useState, type FormEvent } from "react";
import type { Lesson } from "../types/curriculum";
import {
  EXTERNAL_TOOL_STORAGE_KEY,
  EXTERNAL_TOOL_UPDATE_EVENT,
  getResolvedExternalTool,
  readExternalToolSettings,
} from "../settings/externalToolSettings";
import { Icon } from "./Icon";
import { ExternalToolFrame } from "./ExternalToolFrame";

const COMPLETION_STORAGE_KEY = "moa-history-ar:external-tool-completion:v1";

const heritageCards = [
  { id: 1, kingdom: "백제", name: "무령왕릉", file: "muryeong-tomb.jpg", clues: ["아치 모양의 벽돌 입구", "반복되는 벽돌무늬", "무덤 주인을 알려 준 지석"] },
  { id: 2, kingdom: "백제", name: "백제 금동대향로", file: "baekje-incense-burner.jpg", clues: ["받침 부분의 용", "산봉우리와 여러 동물", "꼭대기의 봉황"] },
  { id: 3, kingdom: "신라", name: "첨성대", file: "cheomseongdae.jpg", clues: ["돌을 층층이 쌓은 몸통", "가운데 난 네모난 창", "위로 갈수록 달라지는 모양"] },
  { id: 4, kingdom: "신라", name: "신라 금관", file: "silla-crown.jpg", clues: ["나뭇가지 모양 장식", "굽은옥과 둥근 달개", "얇은 금판의 구조"] },
  { id: 5, kingdom: "고구려", name: "고구려 고분벽화", file: "goguryeo-mural.jpg", clues: ["말을 달리는 사람", "활과 사냥 장면", "힘차게 이어지는 선"] },
  { id: 6, kingdom: "가야", name: "가야 고분군", file: "gaya-tombs.jpg", clues: ["능선을 따라 이어진 봉분", "무덤마다 다른 크기", "여러 지역에 나뉜 위치"] },
] as const;

const questionDataFields = ["시기", "지역", "재료", "모양", "발견 장소", "출처"] as const;
const LESSON_ONE_QUESTION_KEY = "ai-history:three-kingdoms:lesson-1-question:v1";

export interface LessonOneQuestionDraft {
  group: number;
  heritageId: number;
  clues: string[];
  dataFields: string[];
  observation: string;
  question: string;
  savedAt: number;
}

export function isLessonOneQuestionComplete(draft: LessonOneQuestionDraft) {
  return draft.group > 0 && draft.clues.length > 0 && draft.dataFields.length > 0 && draft.observation.trim().length >= 5 && draft.question.trim().length >= 10;
}

export function normalizeLessonOneQuestion(question: string) {
  return question.trim().replace(/\?*$/, "?");
}

const emptyQuestionDraft: LessonOneQuestionDraft = {
  group: 0,
  heritageId: 1,
  clues: [],
  dataFields: [],
  observation: "",
  question: "",
  savedAt: 0,
};

function readLessonOneQuestion(): LessonOneQuestionDraft {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LESSON_ONE_QUESTION_KEY) ?? "{}") as Partial<LessonOneQuestionDraft>;
    return {
      group: typeof parsed.group === "number" && parsed.group >= 1 && parsed.group <= 6 ? parsed.group : 0,
      heritageId: typeof parsed.heritageId === "number" && heritageCards.some((item) => item.id === parsed.heritageId) ? parsed.heritageId : 1,
      clues: Array.isArray(parsed.clues) ? parsed.clues.filter((item): item is string => typeof item === "string") : [],
      dataFields: Array.isArray(parsed.dataFields) ? parsed.dataFields.filter((item): item is string => typeof item === "string") : [],
      observation: typeof parsed.observation === "string" ? parsed.observation : "",
      question: typeof parsed.question === "string" ? parsed.question : "",
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : 0,
    };
  } catch {
    return emptyQuestionDraft;
  }
}

function LessonOneQuestionWorkshop({ onSaved }: { onSaved: () => void }) {
  const [draft, setDraft] = useState(readLessonOneQuestion);
  const [message, setMessage] = useState("");
  const selectedHeritage = heritageCards.find((item) => item.id === draft.heritageId) ?? heritageCards[0];
  const canSave = isLessonOneQuestionComplete(draft);

  function updateDraft(next: Partial<LessonOneQuestionDraft>) {
    setDraft((current) => ({ ...current, ...next, savedAt: 0 }));
    setMessage("");
  }

  function toggleItem(key: "clues" | "dataFields", item: string) {
    const items = draft[key];
    updateDraft({ [key]: items.includes(item) ? items.filter((value) => value !== item) : [...items, item] });
  }

  function selectHeritage(heritageId: number) {
    updateDraft({ heritageId, clues: [], observation: "", question: "" });
  }

  function saveQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) {
      setMessage("모둠·유산·관찰 단서·데이터 항목을 고르고, 관찰과 질문을 모두 작성해 주세요.");
      return;
    }
    const savedDraft = { ...draft, question: normalizeLessonOneQuestion(draft.question), observation: draft.observation.trim(), savedAt: Date.now() };
    setDraft(savedDraft);
    window.localStorage.setItem(LESSON_ONE_QUESTION_KEY, JSON.stringify(savedDraft));
    setMessage("우리 모둠 질문 카드가 이 기기에 저장되었습니다.");
    onSaved();
  }

  function resetQuestion() {
    setDraft(emptyQuestionDraft);
    setMessage("");
    window.localStorage.removeItem(LESSON_ONE_QUESTION_KEY);
  }

  return (
    <div className="question-workshop">
      <header className="question-workshop__mission">
        <div><span>12분 미션</span><h4>사진에서 단서를 찾고, 조사할 질문 한 문장을 완성하세요.</h4></div>
        <ol aria-label="활동 진행 단계">
          <li className={draft.group > 0 && draft.heritageId > 0 ? "is-done" : ""}><span>1</span>모둠·유산 선택</li>
          <li className={draft.clues.length > 0 && draft.dataFields.length > 0 ? "is-done" : ""}><span>2</span>관찰·데이터 선택</li>
          <li className={draft.savedAt > 0 ? "is-done" : ""}><span>3</span>질문 저장</li>
        </ol>
      </header>

      <section className="question-workshop__step" aria-labelledby="question-group-title">
        <div className="question-workshop__step-heading"><span>1</span><div><h5 id="question-group-title">우리 모둠과 문화유산을 선택하세요</h5><p>사진을 누르면 아래 관찰 화면이 바뀝니다.</p></div></div>
        <div className="question-workshop__groups" role="group" aria-label="모둠 선택">
          {[1, 2, 3, 4, 5, 6].map((group) => <button aria-pressed={draft.group === group} key={group} onClick={() => updateDraft({ group })} type="button">{group}모둠</button>)}
        </div>
        <div className="question-workshop__heritages" role="group" aria-label="문화유산 선택">
          {heritageCards.map((heritage) => (
            <button aria-pressed={draft.heritageId === heritage.id} key={heritage.id} onClick={() => selectHeritage(heritage.id)} type="button">
              <img alt="" src={`${import.meta.env.BASE_URL}images/heritage/three-kingdoms/${heritage.file}`} />
              <span>{heritage.kingdom}</span><strong>{heritage.name}</strong>
            </button>
          ))}
        </div>
      </section>

      <div className="question-workshop__workspace">
        <section className="question-workshop__observation" aria-labelledby="question-observation-title">
          <div className="question-workshop__step-heading"><span>2</span><div><h5 id="question-observation-title">사진에서 실제로 보이는 단서를 고르세요</h5><p>추측이 아니라 눈으로 확인한 것부터 기록합니다.</p></div></div>
          <img alt={`${selectedHeritage.name} 확대 관찰`} src={`${import.meta.env.BASE_URL}images/heritage/three-kingdoms/${selectedHeritage.file}`} />
          <div className="question-workshop__clues" role="group" aria-label="관찰 단서 선택">
            {selectedHeritage.clues.map((clue) => <button aria-pressed={draft.clues.includes(clue)} key={clue} onClick={() => toggleItem("clues", clue)} type="button"><span aria-hidden="true">✓</span>{clue}</button>)}
          </div>
        </section>

        <form className="question-workshop__form" onSubmit={saveQuestion}>
          <div className="question-workshop__step-heading"><span>3</span><div><h5>모을 데이터와 질문을 작성하세요</h5><p>다른 유산과 비교할 수 있는 항목을 선택합니다.</p></div></div>
          <fieldset>
            <legend>어떤 데이터를 모을까요?</legend>
            <div className="question-workshop__data-fields">
              {questionDataFields.map((field) => <button aria-pressed={draft.dataFields.includes(field)} key={field} onClick={() => toggleItem("dataFields", field)} type="button">{field}</button>)}
            </div>
          </fieldset>
          <label><span>사진에서 관찰한 사실</span><textarea maxLength={100} onChange={(event) => updateDraft({ observation: event.target.value })} placeholder="예: 둥근 봉분이 능선을 따라 여러 개 이어져 있다." rows={3} value={draft.observation} /><small>{draft.observation.length}/100</small></label>
          <label><span>우리 모둠의 역사 데이터 질문</span><textarea maxLength={140} onChange={(event) => updateDraft({ question: event.target.value })} placeholder="예: 유산의 재료와 발견 지역은 서로 어떤 관계가 있을까?" rows={4} value={draft.question} /><small>{draft.question.length}/140</small></label>
          {message ? <p className={draft.savedAt > 0 ? "question-workshop__message is-saved" : "question-workshop__message"} role="status">{message}</p> : null}
          <div className="question-workshop__actions"><button className="button button--primary" type="submit">질문 카드 저장</button><button className="button button--outline" onClick={resetQuestion} type="button">처음부터 다시</button></div>
        </form>
      </div>

      <section className={draft.savedAt > 0 ? "question-workshop__result is-saved" : "question-workshop__result"} aria-live="polite">
        <div><span>오늘 남길 결과</span><h5>우리 모둠 질문 카드</h5></div>
        {draft.savedAt > 0 ? (
          <div className="question-workshop__result-card"><span>{draft.group}모둠 · {selectedHeritage.kingdom} · {selectedHeritage.name}</span><strong>“{draft.question}”</strong><p><b>관찰:</b> {draft.observation}</p><p><b>모을 데이터:</b> {draft.dataFields.join(" · ")}</p></div>
        ) : <p>세 단계를 마치고 저장하면 발표할 질문 카드가 여기에 완성됩니다.</p>}
      </section>
    </div>
  );
}

function readCompletion(lessonId: number) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(COMPLETION_STORAGE_KEY) ?? "{}") as Record<string, boolean>;
    return Boolean(saved[lessonId]);
  } catch {
    return false;
  }
}

function saveCompletion(lessonId: number, completed: boolean) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(COMPLETION_STORAGE_KEY) ?? "{}") as Record<string, boolean>;
    saved[lessonId] = completed;
    window.localStorage.setItem(COMPLETION_STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // 저장소가 막혀도 수업 활동은 계속할 수 있습니다.
  }
}

function InternalLessonPanel({ lessonId, onLessonOneSaved, resultBoardUrl }: { lessonId: number; onLessonOneSaved: () => void; resultBoardUrl: string }) {
  if (lessonId === 1) {
    return <div className="external-tool-internal"><LessonOneQuestionWorkshop onSaved={onLessonOneSaved} /></div>;
  }

  return (
    <div className="external-tool-internal external-tool-internal--museum">
      <div className="museum-flow" aria-label="AR 데이터 박물관 설명 순서">
        {["수집", "전처리", "그래프", "과거 유추", "미래 예측", "AR 해설"].map((step, index) => (
          <div key={step}><span>{index + 1}</span><strong>{step}</strong></div>
        ))}
      </div>
      <div className="museum-launch-card">
        <div><span>10차시 운영</span><strong>근거를 먼저 보여 주는 AR 박물관</strong><p>그래프 PNG와 QR 대체 자료를 준비하면 AR이 멈춰도 해설을 계속할 수 있습니다.</p></div>
        {resultBoardUrl ? <a className="button button--primary" href={resultBoardUrl} rel="noreferrer" target="_blank">모둠 결과 모아보기 ↗</a> : <span className="external-tool-muted">결과 모아보기 주소는 교사 설정에서 연결합니다.</span>}
      </div>
    </div>
  );
}

export function ExternalToolActivity({ lesson }: { lesson: Lesson }) {
  const [settings, setSettings] = useState(() => readExternalToolSettings(window.localStorage));
  const [embedOpen, setEmbedOpen] = useState(false);
  const [completed, setCompleted] = useState(() => readCompletion(lesson.id));
  const tool = getResolvedExternalTool(lesson.id, settings);

  useEffect(() => {
    const syncSettings = () => setSettings(readExternalToolSettings(window.localStorage));
    const syncStorage = (event: StorageEvent) => {
      if (event.key === EXTERNAL_TOOL_STORAGE_KEY) syncSettings();
    };
    window.addEventListener(EXTERNAL_TOOL_UPDATE_EVENT, syncSettings);
    window.addEventListener("storage", syncStorage);
    return () => {
      window.removeEventListener(EXTERNAL_TOOL_UPDATE_EVENT, syncSettings);
      window.removeEventListener("storage", syncStorage);
    };
  }, []);

  const executableUrl = tool.launchMode === "embed" ? tool.embedUrl : tool.studentUrl;
  const isReady = tool.enabled && (tool.launchMode === "internal" || Boolean(executableUrl));
  const fallbackUrl = tool.fallbackPath ? `${import.meta.env.BASE_URL}${tool.fallbackPath}` : "";

  function toggleCompleted() {
    const next = !completed;
    setCompleted(next);
    saveCompletion(lesson.id, next);
  }

  function markCompleted() {
    setCompleted(true);
    saveCompletion(lesson.id, true);
  }

  return (
    <div className="external-activity">
      <section className="external-activity__summary">
        <div className="external-activity__summary-copy">
          <div className="external-activity__badges">
            <span>{lesson.id}차시</span>
            <span>{tool.estimatedMinutes}분</span>
            <span>{tool.launchMode === "embed" ? "화면 안에서 실행" : tool.launchMode === "new-tab" ? "새 탭에서 실행" : "웹앱 내부 활동"}</span>
          </div>
          <h3>{tool.toolName}</h3>
          <p>{tool.purpose}</p>
        </div>
        <div className={isReady ? "external-activity__status is-ready" : "external-activity__status"}>
          <Icon name={isReady ? "check" : "clock"} size={19} />
          <span>{isReady ? "수업 준비 완료" : "교사 링크 준비 중"}</span>
        </div>
      </section>

      {!tool.enabled ? (
        <div className="external-activity__notice"><strong>이 차시의 외부 도구가 꺼져 있습니다.</strong><span>교사가 대체 활동을 안내할 때까지 기다리세요.</span></div>
      ) : null}

      {tool.launchMode === "internal" && tool.enabled ? <InternalLessonPanel lessonId={lesson.id} onLessonOneSaved={markCompleted} resultBoardUrl={tool.resultBoardUrl} /> : null}

      {tool.launchMode !== "internal" && tool.enabled ? (
        <section className="external-launch-panel">
          <div>
            <span>활동 시작</span>
            <strong>{isReady ? "버튼을 눌러 외부 도구를 여세요" : "교사가 수업용 링크를 연결해야 합니다"}</strong>
            <p>{isReady ? "작업을 마친 뒤 이 화면으로 돌아와 결과 형식을 확인합니다." : "아래 예비 자료가 있으면 먼저 내려받아 내용을 살펴보세요."}</p>
          </div>
          <div className="external-launch-panel__actions">
            {tool.launchMode === "embed" && executableUrl ? (
              <button className="button button--primary" onClick={() => setEmbedOpen((current) => !current)} type="button">
                {embedOpen ? "도구 화면 닫기" : "화면 안에서 시작"}
              </button>
            ) : null}
            {tool.launchMode === "new-tab" && executableUrl ? (
              <a className="button button--primary" href={executableUrl} rel="noreferrer" target="_blank">새 탭에서 시작 ↗</a>
            ) : null}
            {!isReady ? <button className="button button--primary" disabled type="button">수업용 링크 준비 중</button> : null}
            {fallbackUrl ? <a className="button button--outline" download href={fallbackUrl}>예비 데이터 받기</a> : null}
          </div>
        </section>
      ) : null}

      {embedOpen && executableUrl ? <ExternalToolFrame onClose={() => setEmbedOpen(false)} title={tool.toolName} url={executableUrl} /> : null}

      {lesson.id !== 1 ? <div className="external-activity__work-grid">
        <section className="external-step-card">
          <span>딱 세 단계</span>
          <ol>{tool.steps.map((step, index) => <li key={step}><strong>{index + 1}</strong><p>{step}</p></li>)}</ol>
        </section>
        <section className="external-result-card">
          <span>남길 결과</span>
          <strong>{tool.resultKind === "none" ? "활동지 또는 말로 확인" : tool.resultKind.toUpperCase()}</strong>
          <p>{tool.resultGuide}</p>
          {tool.submissionUrl ? <a href={tool.submissionUrl} rel="noreferrer" target="_blank">결과 제출하기 ↗</a> : <small>제출 주소가 없으면 교사에게 링크나 파일을 보여 주세요.</small>}
          {tool.resultBoardUrl ? <a href={tool.resultBoardUrl} rel="noreferrer" target="_blank">모둠 결과 모아보기 ↗</a> : null}
        </section>
      </div> : null}

      {lesson.id !== 1 ? <aside className="external-data-tip"><Icon name="spark" size={20} /><div><strong>역사 데이터 약속</strong><p>{tool.dataTip}</p></div></aside> : null}

      {tool.helperLinks?.length ? (
        <nav aria-label="선택 도구" className="external-helper-links">
          <span>더 해 보기</span>
          {tool.helperLinks.map((link) => <a href={link.href} key={link.href} rel="noreferrer" target="_blank">{link.label} ↗</a>)}
        </nav>
      ) : null}

      {lesson.id !== 1 ? <button aria-pressed={completed} className={completed ? "external-completion is-complete" : "external-completion"} onClick={toggleCompleted} type="button">
        <span><Icon name="check" size={20} /></span>
        <div><strong>{completed ? "우리 모둠 활동 완료" : "결과를 확인한 뒤 완료 표시"}</strong><small>이 표시는 현재 기기에만 저장됩니다.</small></div>
      </button> : null}
    </div>
  );
}
