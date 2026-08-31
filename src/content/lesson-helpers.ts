import type { ClassroomActivityMode, EraId, Lesson, LessonPhase } from "../types/curriculum";

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

const lessonFourResearchModeInfo = {
  label: "모둠 공식 자료실",
  shortLabel: "모둠 자료실",
  description: "담당 유산의 공식 자료를 웹에서 조사하기",
} as const;

const externalDataToolModeInfo = {
  label: "외부 데이터 도구",
  shortLabel: "외부 도구 실습",
  description: "Google Sheets·CODAP에서 직접 정제하고 분석하기",
} as const;

const arDataExplanationModeInfo = {
  label: "AR 데이터 해설",
  shortLabel: "AR 해설 체험",
  description: "그래프 결과를 문화유산 AR 설명으로 연결하기",
} as const;

const arMuseumModeInfo = {
  label: "AR 데이터 박물관",
  shortLabel: "박물관 운영",
  description: "그래프·AR·도슨트 해설을 한 부스에서 운영하기",
} as const;

export function getLessonActivityModeInfo(lesson: Lesson, eraId: EraId) {
  if (eraId === "three-kingdoms" && lesson.id === 4) return lessonFourResearchModeInfo;
  if (eraId === "three-kingdoms" && lesson.id >= 5 && lesson.id <= 8) return externalDataToolModeInfo;
  if (eraId === "three-kingdoms" && lesson.id === 9) return arDataExplanationModeInfo;
  if (eraId === "three-kingdoms" && lesson.id === 10) return arMuseumModeInfo;
  return classroomModeInfo[lesson.classroomMode];
}

export function getLessonPhase(lessonId: number): LessonPhase {
  if (lessonId <= 3) return "의심하기";
  if (lessonId <= 7) return "확인하고 만들기";
  return "해설사 되기";
}

export function getClassroomActivityMode(lessonId: number): ClassroomActivityMode {
  if (lessonId === 2) return "worksheet";
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
