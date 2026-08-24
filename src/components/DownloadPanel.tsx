import { Link } from "react-router-dom";
import type { Era, Lesson } from "../types/curriculum";
import { Icon } from "./Icon";

interface DownloadPanelProps {
  era: Era;
  lesson: Lesson;
}

export function DownloadPanel({ era, lesson }: DownloadPanelProps) {
  return (
    <aside aria-labelledby="download-panel-title" className="download-panel">
      <div className="download-panel__eyebrow">교사용 자료</div>
      <h2 id="download-panel-title">{lesson.id}차시 인쇄 자료</h2>
      <div className="download-panel__count">
        <span>학생용 <strong>{lesson.downloads.student.length}</strong>종</span>
        <span>교사용 <strong>{lesson.downloads.teacher.length}</strong>종</span>
      </div>
      <ul className="download-panel__list">
        {lesson.downloads.student.slice(0, 2).map((item) => <li key={item}>{item}</li>)}
        {lesson.downloads.student.length > 2 ? <li>외 {lesson.downloads.student.length - 2}종</li> : null}
      </ul>
      <button className="button button--outline button--full" onClick={() => window.print()} type="button">
        <Icon name="print" size={18} />현재 운영안 인쇄
      </button>
      <Link className="button button--primary button--full" to={`/teacher/${era.id}/downloads`}>
        <Icon name="download" size={18} />다운로드 센터
      </Link>
      <p className="download-panel__notice">
        활동지 PDF 파일은 다음 구현 단계에서 연결됩니다. 현재는 자료 구성과 인쇄용 운영안을 확인할 수 있습니다.
      </p>
    </aside>
  );
}
