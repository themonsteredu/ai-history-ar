import type { ClassroomActivityMode, Lesson, LessonPhase } from "../types/curriculum";

export const classroomModeInfo = {
  "teacher-led": {
    label: "교사 공동 활동",
    shortLabel: "교사 화면",
    description: "한 화면으로 함께 질의응답하기",
  },
  worksheet: {
    label: "활동지 수업",
    shortLabel: "활동지 중심",
    description: "인쇄 자료에 생각을 기록하기",
  },
  student: {
    label: "학생 체험 웹앱",
    shortLabel: "학생 직접 체험",
    description: "각자 체험하고 결과를 수업에서 활용하기",
  },
} as const satisfies Record<ClassroomActivityMode, { label: string; shortLabel: string; description: string }>;

export function getLessonPhase(lessonId: number): LessonPhase {
  if (lessonId <= 3) return "의심하기";
  if (lessonId <= 7) return "확인하고 만들기";
  return "해설사 되기";
}

export function getClassroomActivityMode(lessonId: number): ClassroomActivityMode {
  if (lessonId === 2) return "student";
  if (lessonId <= 3) return "teacher-led";
  if (lessonId === 4) return "worksheet";
  return "student";
}

type LessonDefinition = Omit<Lesson, "phase" | "slug" | "classroomMode"> & Partial<Pick<Lesson, "classroomMode">>;

export function defineLesson(lesson: LessonDefinition): Lesson {
  return {
    ...lesson,
    phase: getLessonPhase(lesson.id),
    slug: String(lesson.id).padStart(2, "0"),
    classroomMode: lesson.classroomMode ?? getClassroomActivityMode(lesson.id),
  };
}

export function getLessonMinutes(lesson: Lesson): number {
  return lesson.activities.reduce((total, activity) => total + activity.minutes, 0);
}
