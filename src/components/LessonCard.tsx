import { Link } from "react-router-dom";
import type { Era, Lesson } from "../types/curriculum";
import { getLessonActivityModeInfo } from "../content/lesson-helpers";
import { Icon } from "./Icon";
import { PhaseBadge } from "./PhaseBadge";

interface LessonCardProps {
  era: Era;
  lesson: Lesson;
  mode?: "student" | "teacher";
}

export function LessonCard({ era, lesson, mode = "student" }: LessonCardProps) {
  const activityMode = getLessonActivityModeInfo(lesson, era.id);

  if (mode === "student") {
    const path = `${era.route}/lesson/${lesson.id}`;
    return (
      <article className="lesson-card lesson-card--classroom" style={{ "--era-accent": era.accent } as React.CSSProperties}>
        <div className="lesson-card__number" aria-label={`${lesson.id}차시`}>{String(lesson.id).padStart(2, "0")}</div>
        <div className="lesson-card__body"><PhaseBadge phase={lesson.phase} /><h3>{lesson.title}</h3></div>
        <div className="lesson-card__classroom-actions">
          <Link aria-label={`${lesson.id}차시 수업 PPT 열기`} to={`${path}?view=ppt`}><Icon name="book" size={19} /><span>수업 PPT</span></Link>
          <Link aria-label={`${lesson.id}차시 ${activityMode.label} 열기`} to={`${path}?view=activity`}><Icon name={lesson.classroomMode === "worksheet" ? "book" : "spark"} size={19} /><span>{activityMode.label}</span></Link>
        </div>
      </article>
    );
  }

  const path = `/teacher/${era.id}/lesson/${lesson.id}`;

  return (
    <article className="lesson-card">
      <div className="lesson-card__number" aria-label={`${lesson.id}차시`}>
        {String(lesson.id).padStart(2, "0")}
      </div>
      <div className="lesson-card__body">
        <PhaseBadge phase={lesson.phase} />
        <h3>{lesson.title}</h3>
        <p>{lesson.objective}</p>
        <div className="lesson-card__meta">
          <span><Icon name="clock" size={17} />40분</span>
          <span><Icon name="folder" size={17} />산출물 {lesson.outputs.length}종</span>
          <span><Icon name={lesson.classroomMode === "worksheet" ? "book" : "spark"} size={17} />{activityMode.shortLabel}</span>
        </div>
      </div>
      <Link aria-label={`${lesson.id}차시 ${lesson.title} 교사 설정 열기`} className="lesson-card__link" to={path}>
        <span>지도안·자료</span><Icon name="arrow" size={18} />
      </Link>
    </article>
  );
}
