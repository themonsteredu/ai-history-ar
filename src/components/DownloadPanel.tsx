import { Link } from "react-router-dom";
import { lessonDownloadPath } from "../content/downloads";
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
      <div className="download-panel__downloads">
        <a className="button button--primary button--full" download href={lessonDownloadPath(era.id, lesson.id, "student")}>
          <Icon name="download" size={18} />학생 활동지 PDF
        </a>
        <a className="button button--gold button--full" download href={lessonDownloadPath(era.id, lesson.id, "teacher")}>
          <Icon name="download" size={18} />교사지도안·활동카드 PDF
        </a>
        <a className="button button--quiet button--full" download href={lessonDownloadPath(era.id, lesson.id, "answer")}>
          <Icon name="download" size={18} />학생 활동지 답안 PDF
        </a>
        <a className="button button--outline button--full" download href={lessonDownloadPath(era.id, lesson.id, "bundle")}>
          <Icon name="download" size={18} />이 차시 전체 ZIP
        </a>
      </div>
      <button className="button button--outline button--full" onClick={() => window.print()} type="button">
        <Icon name="print" size={18} />화면 운영안 바로 인쇄
      </button>
      <Link className="button button--quiet button--full" to={`/teacher/${era.id}/downloads`}>
        10차시 전체 다운로드 센터 <Icon name="arrow" size={16} />
      </Link>
      <p className="download-panel__notice">
        학생용은 차시당 A4 한 장이며, 교사용 답안은 별도 PDF입니다. 모든 파일은 흑백 인쇄용입니다.
      </p>
    </aside>
  );
}
