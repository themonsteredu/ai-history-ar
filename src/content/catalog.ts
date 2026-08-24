import { joseonGroups } from "./joseon/groups";
import { joseonLessons } from "./joseon/lessons";
import { threeKingdomsGroups } from "./three-kingdoms/groups";
import { threeKingdomsLessons } from "./three-kingdoms/lessons";
import type { Era, EraId, Lesson } from "../types/curriculum";

export const eras = [
  {
    id: "three-kingdoms",
    grade: "초등학교 5학년",
    shortName: "삼국시대",
    title: "삼국시대 문화유산 AI 해설사",
    eyebrow: "1500년 전의 단서를 따라가는 수업",
    coreQuestion: "1500년 전 이야기, AI는 어떻게 알고 있을까?",
    description: "학자들도 결론 내리지 못한 질문을 만나며, 모르는 것을 ‘아직 모름’으로 남기는 정직한 검증을 배웁니다.",
    verificationLabel: "검증 5단계",
    verificationSteps: ["출처", "시기", "교차", "원본", "보류"],
    accent: "#7f3f31",
    accentSoft: "#f2ded5",
    route: "/three-kingdoms",
    curriculumStandards: [
      {
        code: "6사04-02",
        description: "역사 기록이나 유적과 유물에 나타난 고대 사람들의 생각과 생활을 추론한다.",
      },
    ],
    lessons: threeKingdomsLessons,
    groups: threeKingdomsGroups,
  },
  {
    id: "joseon",
    grade: "초등학교 5학년",
    shortName: "조선시대",
    title: "조선시대 문화유산 AI 해설사",
    eyebrow: "기록과 통념을 구분하는 수업",
    coreQuestion: "우리가 아는 조선, 정말 그랬을까?",
    description: "드라마와 통념 속 이야기에서 한 걸음 물러나, 기록과 원본으로 확인한 사실을 자기 말로 다시 설명합니다.",
    verificationLabel: "검증 4단계",
    verificationSteps: ["출처", "시기", "교차", "원본"],
    accent: "#24574e",
    accentSoft: "#dcebe5",
    route: "/joseon",
    curriculumStandards: [
      {
        code: "6사05-01",
        description: "조선 시대 사람들의 생각과 생활에 유교 문화가 미친 영향을 파악한다.",
      },
      {
        code: "6사05-02",
        description: "조선 후기 사회·문화적 변화와 개항기 근대 문물 수용 과정에서 달라진 사람들의 생활을 이해한다.",
      },
    ],
    lessons: joseonLessons,
    groups: joseonGroups,
  },
] as const satisfies readonly Era[];

export const eraById = new Map<EraId, Era>(eras.map((era) => [era.id, era]));

export function getEra(eraId: string | undefined): Era | undefined {
  if (eraId !== "three-kingdoms" && eraId !== "joseon") return undefined;
  return eraById.get(eraId);
}

export function getLesson(era: Era, lessonId: string | undefined): Lesson | undefined {
  if (!lessonId) return undefined;
  const parsedId = Number.parseInt(lessonId, 10);
  if (!Number.isInteger(parsedId)) return undefined;
  return era.lessons.find((lesson) => lesson.id === parsedId);
}

export function getEraFromRoute(routeName: string | undefined): Era | undefined {
  if (routeName === "three-kingdoms" || routeName === "joseon") return getEra(routeName);
  return undefined;
}
