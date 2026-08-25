import { Link, useSearchParams } from "react-router-dom";
import { readTeacherAccess } from "../auth/teacherAccess";
import { LessonSlides } from "../components/LessonSlides";
import { LessonWebActivity } from "../components/LessonWebActivity";
import { SimpleLessonSlides } from "../components/SimpleLessonSlides";
import { classroomModeInfo } from "../content/lesson-helpers";
import type { Era, Lesson } from "../types/curriculum";

export function ClassroomLessonPage({ era, lesson }: { era: Era; lesson: Lesson }) {
  const [searchParams] = useSearchParams();
  const hasTeacherAccess = typeof window !== "undefined" && readTeacherAccess(window.sessionStorage);
  const pptAvailable = lesson.id !== 2 || hasTeacherAccess;
  const requestedView = searchParams.get("view") === "activity" ? "activity" : "ppt";
  const view = requestedView === "ppt" && !pptAvailable ? "activity" : requestedView;
  const previousLesson = era.lessons.find((candidate) => candidate.id === lesson.id - 1);
  const nextLesson = era.lessons.find((candidate) => candidate.id === lesson.id + 1);
  const basePath = `${era.route}/lesson`;
  const activityTab = classroomModeInfo[lesson.classroomMode];

  return (
    <div className="classroom-page" style={{ "--era-accent": era.accent, "--era-soft": era.accentSoft } as React.CSSProperties}>
      <header className="classroom-header">
        <div className="page-width classroom-header__inner">
          <Link className="back-link" to={era.route}><span aria-hidden="true">←</span>{era.shortName} 10차시</Link>
          <div className="classroom-header__title">
            <span>{String(lesson.id).padStart(2, "0")}</span>
            <div><p>{era.grade} · {era.shortName}</p><h1>{lesson.title}</h1></div>
          </div>
          <nav aria-label="수업 화면 선택" className="classroom-tabs">
            {pptAvailable ? <Link aria-current={view === "ppt" ? "page" : undefined} className={view === "ppt" ? "is-active" : ""} to={`${basePath}/${lesson.id}?view=ppt`}>
              <span>01</span><strong>수업 PPT</strong><small>교실 화면으로 설명하기</small>
            </Link> : null}
            <Link aria-current={view === "activity" ? "page" : undefined} className={view === "activity" ? "is-active" : ""} to={`${basePath}/${lesson.id}?view=activity`}>
              <span>{pptAvailable ? "02" : "01"}</span><strong>{activityTab.label}</strong><small>{activityTab.description}</small>
            </Link>
          </nav>
        </div>
      </header>

      <main className="page-width classroom-content">
        {view === "ppt" ? (
          era.id === "three-kingdoms"
            ? <LessonSlides key={lesson.id} lessonId={lesson.id} />
            : <SimpleLessonSlides era={era} key={lesson.id} lesson={lesson} />
        ) : <LessonWebActivity era={era} lesson={lesson} />}

        <nav aria-label="이전·다음 차시" className="classroom-pagination">
          {previousLesson ? <Link to={`${basePath}/${previousLesson.id}?view=${view}`}><span>이전</span><strong>← {previousLesson.id}차시</strong></Link> : <span />}
          {nextLesson
            ? <Link to={`${basePath}/${nextLesson.id}?view=${view}`}><span>다음</span><strong>{nextLesson.id}차시 →</strong></Link>
            : <Link to={era.route}><span>수업 완료</span><strong>10차시 목록 →</strong></Link>}
        </nav>
      </main>
    </div>
  );
}
