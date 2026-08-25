import { useEffect, useState } from "react";
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
  ["백제", "무령왕릉", "muryeong-tomb.jpg"],
  ["백제", "금동대향로", "baekje-incense-burner.jpg"],
  ["신라", "첨성대", "cheomseongdae.jpg"],
  ["신라", "신라 금관", "silla-crown.jpg"],
  ["고구려", "고분벽화", "goguryeo-mural.jpg"],
  ["가야", "가야 고분군", "gaya-tombs.jpg"],
] as const;

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

function InternalLessonPanel({ lessonId, resultBoardUrl }: { lessonId: number; resultBoardUrl: string }) {
  if (lessonId === 1) {
    return (
      <div className="external-tool-internal external-tool-internal--heritage">
        <div className="external-heritage-grid">
          {heritageCards.map(([kingdom, name, file]) => (
            <article key={name}>
              <img alt={`${name} 관찰 사진`} src={`${import.meta.env.BASE_URL}images/heritage/three-kingdoms/${file}`} />
              <div><span>{kingdom}</span><strong>{name}</strong></div>
            </article>
          ))}
        </div>
        <div className="external-question-guide">
          <strong>모을 수 있는 데이터로 질문하세요</strong>
          <div><span>시기</span><span>지역</span><span>자료 종류</span><span>발견 장소</span><span>출처</span></div>
          <p>웹에서는 사진을 관찰하고 말로 정합니다. 최종 질문 한 문장만 활동지에 씁니다.</p>
        </div>
      </div>
    );
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

      {tool.launchMode === "internal" && tool.enabled ? <InternalLessonPanel lessonId={lesson.id} resultBoardUrl={tool.resultBoardUrl} /> : null}

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

      <div className="external-activity__work-grid">
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
      </div>

      <aside className="external-data-tip"><Icon name="spark" size={20} /><div><strong>역사 데이터 약속</strong><p>{tool.dataTip}</p></div></aside>

      {tool.helperLinks?.length ? (
        <nav aria-label="선택 도구" className="external-helper-links">
          <span>더 해 보기</span>
          {tool.helperLinks.map((link) => <a href={link.href} key={link.href} rel="noreferrer" target="_blank">{link.label} ↗</a>)}
        </nav>
      ) : null}

      <button aria-pressed={completed} className={completed ? "external-completion is-complete" : "external-completion"} onClick={toggleCompleted} type="button">
        <span><Icon name="check" size={20} /></span>
        <div><strong>{completed ? "우리 모둠 활동 완료" : "결과를 확인한 뒤 완료 표시"}</strong><small>이 표시는 현재 기기에만 저장됩니다.</small></div>
      </button>
    </div>
  );
}
