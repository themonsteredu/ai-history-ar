import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { threeKingdomsExternalTools } from "../content/three-kingdoms/externalTools";
import {
  EXTERNAL_TOOL_UPDATE_EVENT,
  createDefaultExternalToolSettings,
  readExternalToolSettings,
  validateExternalToolSetting,
  writeExternalToolSettings,
} from "../settings/externalToolSettings";
import type { ExternalToolLessonSettings, ToolLaunchMode } from "../types/externalTools";
import { Icon } from "../components/Icon";

export function TeacherToolSettingsPage() {
  const [settings, setSettings] = useState(() => readExternalToolSettings(window.localStorage));
  const [message, setMessage] = useState("");
  const definitionByLesson = useMemo(() => new Map(threeKingdomsExternalTools.map((tool) => [tool.lessonId, tool])), []);
  const errorCount = settings.lessons.reduce((total, lesson) => total + validateExternalToolSetting(lesson).length, 0);

  function updateLesson(lessonId: number, patch: Partial<ExternalToolLessonSettings>) {
    setSettings((current) => ({
      ...current,
      lessons: current.lessons.map((lesson) => lesson.lessonId === lessonId ? { ...lesson, ...patch } : lesson),
    }));
    setMessage("");
  }

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (errorCount > 0) {
      setMessage("주소나 실행 방식을 먼저 확인해 주세요.");
      return;
    }

    try {
      const saved = writeExternalToolSettings(window.localStorage, settings);
      setSettings(saved);
      window.dispatchEvent(new Event(EXTERNAL_TOOL_UPDATE_EVENT));
      setMessage("저장했습니다. 같은 브라우저의 학생 수업 화면에 바로 적용됩니다.");
    } catch {
      setMessage("브라우저 저장소를 사용할 수 없습니다. 설정 JSON을 내려받아 보관해 주세요.");
    }
  }

  function exportSettings() {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "moa-three-kingdoms-tool-settings.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importSettings(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      const saved = writeExternalToolSettings(window.localStorage, imported);
      setSettings(saved);
      window.dispatchEvent(new Event(EXTERNAL_TOOL_UPDATE_EVENT));
      setMessage("설정 파일을 불러왔습니다.");
    } catch {
      setMessage("설정 파일을 읽을 수 없습니다.");
    } finally {
      event.target.value = "";
    }
  }

  function resetSettings() {
    if (!window.confirm("입력한 수업용 링크를 기본값으로 되돌릴까요?")) return;
    const defaults = createDefaultExternalToolSettings();
    setSettings(defaults);
    writeExternalToolSettings(window.localStorage, defaults);
    window.dispatchEvent(new Event(EXTERNAL_TOOL_UPDATE_EVENT));
    setMessage("기본 설정으로 되돌렸습니다.");
  }

  return (
    <div className="teacher-tools-page">
      <section className="teacher-tools-hero">
        <div className="page-width">
          <p className="eyebrow">PIN 3035 · 교사 전용</p>
          <h1>삼국시대 외부 도구 설정</h1>
          <p>학생 화면에는 실행 링크만 보입니다. 교사용 원본·설정 주소와 준비 상태는 이 화면에서만 관리합니다.</p>
          <div className="teacher-tools-hero__actions">
            <Link className="button button--outline" to="/three-kingdoms/lesson/1?view=activity">학생 활동 화면 보기</Link>
            <button className="button button--outline" onClick={exportSettings} type="button">설정 내려받기</button>
            <label className="button button--outline teacher-tools-import">설정 불러오기<input accept="application/json" onChange={importSettings} type="file" /></label>
          </div>
        </div>
      </section>

      <form className="page-width teacher-tools-form" onSubmit={saveSettings}>
        <div className="teacher-tools-summary">
          <div><strong>{settings.lessons.length}</strong><span>전체 차시</span></div>
          <div><strong>{settings.lessons.filter((lesson) => lesson.enabled).length}</strong><span>사용 차시</span></div>
          <div className={errorCount > 0 ? "has-error" : ""}><strong>{errorCount}</strong><span>확인할 항목</span></div>
          <button className="button button--primary" type="submit">전체 설정 저장</button>
        </div>

        {message ? <p className="teacher-tools-message" role="status">{message}</p> : null}

        <div className="teacher-tools-list">
          {settings.lessons.map((lessonSetting) => {
            const definition = definitionByLesson.get(lessonSetting.lessonId) ?? threeKingdomsExternalTools[0];
            const errors = validateExternalToolSetting(lessonSetting);
            const ready = lessonSetting.enabled && errors.length === 0;
            const isInternal = definition.launchMode === "internal";

            return (
              <article className="teacher-tool-card" key={lessonSetting.lessonId}>
                <header>
                  <div className="teacher-tool-card__number">{String(lessonSetting.lessonId).padStart(2, "0")}</div>
                  <div><span>{definition.toolName}</span><h2>{definition.purpose}</h2></div>
                  <label className="teacher-tool-switch">
                    <input checked={lessonSetting.enabled} onChange={(event) => updateLesson(lessonSetting.lessonId, { enabled: event.target.checked })} type="checkbox" />
                    <span>{lessonSetting.enabled ? "사용" : "끄기"}</span>
                  </label>
                </header>

                <div className="teacher-tool-card__meta">
                  <span className={ready ? "is-ready" : ""}><Icon name={ready ? "check" : "clock"} size={16} />{ready ? "준비 완료" : "확인 필요"}</span>
                  <span>결과 {definition.resultKind === "none" ? "활동지·말" : definition.resultKind.toUpperCase()}</span>
                  {definition.toolHomeUrl ? <a href={definition.toolHomeUrl} rel="noreferrer" target="_blank">공식 도구 열기 ↗</a> : <span>이 화면에서 활동</span>}
                </div>

                {isInternal ? (
                  <div className="teacher-tool-internal-note">
                    <strong>이 화면에서 활동</strong>
                    <p>외부 실행 주소가 필요하지 않습니다. 결과 모아보기 주소만 선택해서 연결할 수 있습니다.</p>
                  </div>
                ) : (
                  <div className="teacher-tool-fields">
                    <label>
                      <span>실행 방식</span>
                      <select onChange={(event) => updateLesson(lessonSetting.lessonId, { launchMode: event.target.value as ToolLaunchMode })} value={lessonSetting.launchMode}>
                        <option value="embed">이 화면 안에서 열기</option>
                        <option value="new-tab">새 탭에서 열기</option>
                      </select>
                    </label>
                    <label>
                      <span>학생 실행 URL</span>
                      <input onChange={(event) => updateLesson(lessonSetting.lessonId, { studentUrl: event.target.value })} placeholder="https://..." type="url" value={lessonSetting.studentUrl} />
                    </label>
                    <label>
                      <span>임베드 URL</span>
                      <input disabled={lessonSetting.launchMode !== "embed"} onChange={(event) => updateLesson(lessonSetting.lessonId, { embedUrl: event.target.value })} placeholder="https://.../viewform?embedded=true" type="url" value={lessonSetting.embedUrl} />
                    </label>
                    <label>
                      <span>교사용 원본 URL</span>
                      <input onChange={(event) => updateLesson(lessonSetting.lessonId, { teacherSourceUrl: event.target.value })} placeholder="학생에게 보이지 않는 원본 주소" type="url" value={lessonSetting.teacherSourceUrl} />
                    </label>
                  </div>
                )}

                <div className="teacher-tool-fields teacher-tool-fields--results">
                  <label>
                    <span>결과 제출 URL</span>
                    <input onChange={(event) => updateLesson(lessonSetting.lessonId, { submissionUrl: event.target.value })} placeholder="Google Form 제출 주소" type="url" value={lessonSetting.submissionUrl} />
                  </label>
                  <label>
                    <span>결과 모아보기 URL</span>
                    <input onChange={(event) => updateLesson(lessonSetting.lessonId, { resultBoardUrl: event.target.value })} placeholder="읽기 전용 시트 또는 결과 게시판" type="url" value={lessonSetting.resultBoardUrl} />
                  </label>
                </div>

                <footer>
                  <p>허용 주소: {definition.allowedDomains.join(" · ")}</p>
                  {errors.length > 0 ? <ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul> : <strong>학생 화면에서 사용할 준비가 되었습니다.</strong>}
                </footer>
              </article>
            );
          })}
        </div>

        <div className="teacher-tools-footer">
          <button className="button button--outline" onClick={resetSettings} type="button">기본값으로 되돌리기</button>
          <button className="button button--primary" type="submit">전체 설정 저장</button>
        </div>
      </form>
    </div>
  );
}
