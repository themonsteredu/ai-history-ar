import { Link } from "react-router-dom";
import type { Era, Lesson } from "../types/curriculum";
import { Icon } from "./Icon";
import { PhaseBadge } from "./PhaseBadge";

interface LessonCardProps {
  era: Era;
  lesson: Lesson;
  mode?: "student" | "teacher";
}

export function LessonCard({ era, lesson, mode = "student" }: LessonCardProps) {
  const path = mode === "teacher"
    ? `/teacher/${era.id}/lesson/${lesson.id}`
    : `${era.route}/lesson/${lesson.id}`;

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
        </div>
      </div>
      <Link aria-label={`${lesson.id}차시 ${lesson.title} 자세히 보기`} className="lesson-card__link" to={path}>
        <span>{mode === "teacher" ? "운영안 보기" : "차시 보기"}</span>
        <Icon name="arrow" size={18} />
      </Link>
    </article>
  );
}
