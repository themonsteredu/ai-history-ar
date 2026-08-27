import { useMemo, useState } from "react";
import {
  collectGroupRecord,
  GROUP_CHOICE_KEY,
  groupRecordFileName,
  readSavedGroup,
  serializeGroupRecord,
} from "../records/groupRecords";

export function GroupRecordPanel({ submissionUrl }: { submissionUrl: string }) {
  const [group, setGroup] = useState(() => readSavedGroup(window.localStorage));
  const [refreshCount, setRefreshCount] = useState(0);
  const [message, setMessage] = useState("");
  const record = useMemo(
    () => (group > 0 ? collectGroupRecord(window.localStorage, group) : null),
    [group, refreshCount],
  );
  const completedCount = record?.entries.filter((entry) => entry.status === "완료").length ?? 0;

  function chooseGroup(groupNumber: number) {
    setGroup(groupNumber);
    setMessage("");
    try {
      window.localStorage.setItem(GROUP_CHOICE_KEY, String(groupNumber));
    } catch {
      // 저장소가 막혀도 화면에서는 계속 사용할 수 있습니다.
    }
  }

  function downloadRecord() {
    if (!record) return;
    const exportedAt = new Date();
    const blob = new Blob([serializeGroupRecord(record, exportedAt)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = groupRecordFileName(record, exportedAt);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setMessage(`${record.group}모둠 기록 파일을 내려받았습니다. 제출함에 올리거나 교사에게 보여 주세요.`);
  }

  return (
    <section className="group-record-panel" data-testid="group-record-panel">
      <div className="core-mission" aria-label="활동 방법">
        <span>모둠 기록 저장·제출</span>
        <strong>이 기기에 저장된 웹 활동 기록을 우리 모둠 이름으로 저장하고 제출합니다.</strong>
        <p>웹 기록은 기기에만 남으므로, 파일로 내려받아 교사 제출함에 올리면 모둠별로 모입니다.</p>
      </div>

      <fieldset className="group-record-panel__picker">
        <legend>우리 모둠을 선택하세요</legend>
        <div role="group" aria-label="모둠 선택">
          {[1, 2, 3, 4, 5, 6].map((groupNumber) => (
            <button aria-pressed={group === groupNumber} key={groupNumber} onClick={() => chooseGroup(groupNumber)} type="button">{groupNumber}모둠</button>
          ))}
        </div>
      </fieldset>

      {record ? (
        <>
          <header className="chart-studio__progress" aria-live="polite">
            <div><span>{record.group}모둠 웹 활동 기록</span><strong>{record.entries.length}개 활동 중 {completedCount}개 완료</strong></div>
            <button className="button button--outline" onClick={() => setRefreshCount((current) => current + 1)} type="button">기록 새로고침</button>
          </header>

          <ol className="group-record-panel__entries">
            {record.entries.map((entry) => (
              <li data-status={entry.status} key={entry.lessonId}>
                <span>{entry.lessonId}차시</span>
                <div>
                  <strong>{entry.title}</strong>
                  {entry.lines.map((line) => <small key={line}>{line}</small>)}
                </div>
                <b>{entry.status}</b>
              </li>
            ))}
          </ol>

          <div className="group-record-panel__actions">
            <button className="button button--primary" data-testid="download-group-record" onClick={downloadRecord} type="button">{record.group}모둠 기록 파일 내려받기</button>
            {submissionUrl ? (
              <a className="button button--outline" href={submissionUrl} rel="noreferrer" target="_blank">모둠 제출함 열기 ↗</a>
            ) : (
              <span className="external-tool-muted">제출함 주소는 교사가 10차시 도구 설정의 ‘결과 제출’에 연결합니다.</span>
            )}
          </div>

          <p className="group-record-panel__paper">
            <strong>종이 활동지 제출</strong>
            종이 활동지는 위쪽에 모둠 번호를 크게 쓰고, 한 장씩 사진을 찍어 같은 제출함에 올립니다. 기록 파일과 사진이 모두 모이면 모둠 제출이 끝납니다.
          </p>

          {message ? <p className="class-card-studio__message" role="status">{message}</p> : null}
        </>
      ) : (
        <p className="group-record-panel__empty">모둠을 선택하면 이 기기에 저장된 1~10차시 웹 활동 기록을 모아서 보여 줍니다.</p>
      )}
    </section>
  );
}
