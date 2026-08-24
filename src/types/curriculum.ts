export type EraId = "three-kingdoms" | "joseon";

export type LessonPhase = "의심하기" | "확인하고 만들기" | "해설사 되기";

export type LessonStage = "도입" | "전개" | "정리";

export interface LessonActivity {
  stage: LessonStage;
  minutes: number;
  title: string;
  details: readonly string[];
  materials: readonly string[];
}

export interface LessonAssessment {
  method: "관찰" | "산출물" | "앱 기록 + 산출물";
  criterion: string;
  evidence: string;
}

export interface DownloadSummary {
  student: readonly string[];
  teacher: readonly string[];
  specialFormat?: "A6 카드" | "A5 접지";
}

export interface Lesson {
  id: number;
  slug: string;
  title: string;
  phase: LessonPhase;
  role: string;
  objective: string;
  keyQuestion: string;
  activities: readonly LessonActivity[];
  outputs: readonly string[];
  assessment: LessonAssessment;
  teacherPrep: readonly string[];
  cautions: readonly string[];
  nextLessonPrep: string;
  downloads: DownloadSummary;
}

export interface HeritageGroup {
  id: number;
  heritage: string;
  category: string;
  inquiryQuestion: string;
  colorName: string;
  color: string;
  visualCue: string;
  alternative?: string;
}

export interface Era {
  id: EraId;
  shortName: string;
  title: string;
  eyebrow: string;
  coreQuestion: string;
  description: string;
  verificationLabel: string;
  verificationSteps: readonly string[];
  accent: string;
  accentSoft: string;
  route: string;
  lessons: readonly Lesson[];
  groups: readonly HeritageGroup[];
}
