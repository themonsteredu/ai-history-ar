import { describe, expect, it } from "vitest";
import { eras } from "./catalog";
import { getLessonMinutes } from "./lesson-helpers";
import { getThreeKingdomsSlides } from "./three-kingdoms/slides";

describe("curriculum catalog", () => {
  it("contains two complete 10-lesson courses", () => {
    expect(eras).toHaveLength(2);
    expect(eras.flatMap((era) => era.lessons)).toHaveLength(20);
    expect(eras.every((era) => era.lessons.length === 10)).toBe(true);
  });

  it("keeps every lesson at 40 minutes", () => {
    for (const era of eras) {
      for (const lesson of era.lessons) {
        expect(getLessonMinutes(lesson), `${era.shortName} ${lesson.id}차시`).toBe(40);
      }
    }
  });

  it("uses the agreed three-act phase structure", () => {
    for (const era of eras) {
      expect(era.lessons.map((lesson) => lesson.phase)).toEqual([
        "의심하기",
        "의심하기",
        "의심하기",
        "확인하고 만들기",
        "확인하고 만들기",
        "확인하고 만들기",
        "확인하고 만들기",
        "해설사 되기",
        "해설사 되기",
        "해설사 되기",
      ]);
    }
  });

  it("keeps each era's verification model distinct", () => {
    expect(eras[0].verificationSteps).toEqual(["출처", "시기", "교차", "원본", "보류"]);
    expect(eras[1].verificationSteps).toEqual(["출처", "시기", "교차", "원본"]);
  });

  it("aligns both courses to the 2022 revised grade-five social studies standards", () => {
    expect(eras.every((era) => era.grade === "초등학교 5학년")).toBe(true);
    expect(eras[0].curriculumStandards.map((standard) => standard.code)).toEqual(["6사04-02"]);
    expect(eras[1].curriculumStandards.map((standard) => standard.code)).toEqual(["6사05-01", "6사05-02"]);
    expect(eras.flatMap((era) => era.lessons).every((lesson) => lesson.objective.length <= 55)).toBe(true);
  });

  it("defines six distinct heritage groups and downloads for every lesson", () => {
    for (const era of eras) {
      expect(era.groups).toHaveLength(6);
      expect(new Set(era.groups.map((group) => group.heritage)).size).toBe(6);
      expect(
        era.lessons.every(
          (lesson) => lesson.downloads.student.length > 0 && lesson.downloads.teacher.length > 0,
        ),
      ).toBe(true);
    }
  });

  it("restores AI doubt and source verification in the early Three Kingdoms sequence", () => {
    expect(eras[0].lessons.map((lesson) => lesson.title)).toEqual([
      "역사 데이터 질문 찾기",
      "AI에게 물어보았습니다",
      "진짜인지 확인하는 방법",
      "우리 모둠 유산 파헤치기",
      "AR로 만나는 문화유산",
      "역사 데이터를 그림으로 보기",
      "그래프를 읽고 설명하기",
      "데이터로 과거 유추하기",
      "데이터로 미래 변화 예측하기",
      "AR 데이터 박물관 열기",
    ]);
  });

  it("uses individual web responses in lesson two and reserves other web apps for needed interactions", () => {
    const expectedModes = ["teacher-led", "student", "teacher-led", "worksheet", "student", "student", "student", "student", "student", "student"];
    for (const era of eras) {
      expect(era.lessons.map((lesson) => lesson.classroomMode), era.shortName).toEqual(expectedModes);
    }
  });

  it("keeps every Three Kingdoms deck rich, classroom-facing, and Q&A-led", () => {
    const internalPhrases = /웹앱|다운로드 없음|Google|CODAP|Desmos|CSV|PNG|새 탭/;

    for (let lessonId = 1; lessonId <= 10; lessonId += 1) {
      const slides = getThreeKingdomsSlides(lessonId);
      const lastSlide = slides.at(-1);
      const visibleCopy = JSON.stringify(slides);
      expect(slides.length, `${lessonId}차시 기본 슬라이드`).toBeGreaterThanOrEqual(7);
      expect(slides.filter((slide) => slide.kind === "fact").length, `${lessonId}차시 내용 슬라이드`).toBeGreaterThanOrEqual(3);
      if (lessonId <= 5) {
        expect(slides.length, `${lessonId}차시 확장 슬라이드`).toBeGreaterThanOrEqual(14);
        expect(slides.some((slide) => slide.kind === "gallery"), `${lessonId}차시 문화유산 관찰 슬라이드`).toBe(true);
        expect(slides.some((slide) => slide.kind === "quiz"), `${lessonId}차시 판단 퀴즈`).toBe(true);
      }
      expect(lastSlide?.kind, `${lessonId}차시 마지막 슬라이드`).toBe("closing");
      expect(internalPhrases.test(visibleCopy), `${lessonId}차시 운영 문구`).toBe(false);
      if (lastSlide?.kind === "closing") {
        expect(lastSlide.title.endsWith("까요?") || lastSlide.title.endsWith("할까요?")).toBe(true);
        expect(lastSlide.prompt.length).toBeGreaterThan(45);
      }
    }
  });
});
