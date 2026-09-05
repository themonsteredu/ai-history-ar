import { describe, expect, it } from "vitest";
import { eras } from "./catalog";
import { getLessonMinutes } from "./lesson-helpers";
import { getThreeKingdomsSlides } from "./three-kingdoms/slides";
import { threeKingdomsExternalTools } from "./three-kingdoms/externalTools";

describe("curriculum catalog", () => {
  // 삼국시대는 2·3차시를 한 차시로 합쳐 아홉 차시입니다. 조선시대는 열 차시 그대로입니다.
  it("keeps the merged Three Kingdoms sequence and the untouched Joseon sequence", () => {
    expect(eras).toHaveLength(2);
    expect(eras[0].lessons.map((lesson) => lesson.id)).toEqual([1, 2, 4, 5, 6, 7, 8, 9, 10]);
    expect(eras[1].lessons.map((lesson) => lesson.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("keeps every lesson at 40 minutes", () => {
    for (const era of eras) {
      for (const lesson of era.lessons) {
        expect(getLessonMinutes(lesson), `${era.shortName} ${lesson.id}차시`).toBe(40);
      }
    }
  });

  it("uses the agreed three-act phase structure", () => {
    expect(eras[0].lessons.map((lesson) => lesson.phase)).toEqual([
      "의심하기", "의심하기",
      "확인하고 만들기", "확인하고 만들기", "확인하고 만들기", "확인하고 만들기",
      "해설사 되기", "해설사 되기", "해설사 되기",
    ]);
    expect(eras[1].lessons.map((lesson) => lesson.phase)).toEqual([
      "의심하기", "의심하기", "의심하기",
      "확인하고 만들기", "확인하고 만들기", "확인하고 만들기", "확인하고 만들기",
      "해설사 되기", "해설사 되기", "해설사 되기",
    ]);
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
      expect(era.lessons.every((lesson) => lesson.downloads.student.length > 0 && lesson.downloads.teacher.length > 0)).toBe(true);
    }
  });

  it("folds AI doubt and source verification into a single Three Kingdoms lesson", () => {
    expect(eras[0].lessons.map((lesson) => lesson.title)).toEqual([
      "역사 데이터 질문 찾기", "AI에게 물어보았습니다",
      "우리 유산의 이야기 찾기", "우리 표를 깔끔하게 고치기", "우리 표로 그래프 만들기",
      "그래프를 보고 말하기", "자료로 옛날 모습 생각하기", "우리 유산 전시 준비하기", "우리 반 유산 박물관 열기",
    ]);
    const merged = eras[0].lessons[1];
    expect(merged.objective).toContain("○×△?");
    expect(JSON.stringify(merged)).toContain("출처·시기·교차·원본·보류");
  });

  it("uses one-page worksheets in the judgement and data lessons", () => {
    expect(eras[0].lessons.map((lesson) => lesson.classroomMode)).toEqual(
      ["teacher-led", "worksheet", "worksheet", "student", "student", "student", "student", "student", "student"],
    );
    expect(eras[1].lessons.map((lesson) => lesson.classroomMode)).toEqual(
      ["teacher-led", "worksheet", "teacher-led", "worksheet", "student", "student", "student", "student", "student", "student"],
    );
    for (const era of eras) {
      expect(era.lessons[1].downloads.student.join(" "), era.shortName).toContain("A4 한 장");
      expect(era.lessons[1].outputs.join(" "), era.shortName).toContain("A4 한 장");
    }
  });

  it("keeps grade-five student results choice-led and short", () => {
    const studentCopy = JSON.stringify(threeKingdomsExternalTools);
    expect(studentCopy).not.toMatch(/두 가지 적|수정 이유를.*기록|30초 도슨트 대본을 완성/);
    const tool = (lessonId: number) => threeKingdomsExternalTools.find((item) => item.lessonId === lessonId);
    expect(tool(7)?.resultGuide).toContain("하나");
    expect(tool(10)?.resultGuide).toContain("친구");
  });

  it("keeps every Three Kingdoms deck rich, classroom-facing, and Q&A-led", () => {
    const internalPhrases = /다운로드 없음|새 탭/;
    for (const lessonId of eras[0].lessons.map((lesson) => lesson.id)) {
      const slides = getThreeKingdomsSlides(lessonId);
      const lastSlide = slides.at(-1);
      const visibleCopy = JSON.stringify(slides);
      expect(slides.length, `${lessonId}차시 충분한 수업 슬라이드`).toBeGreaterThanOrEqual(lessonId >= 4 ? 9 : 13);
      expect(slides.filter((slide) => slide.kind === "fact").length, `${lessonId}차시 내용 슬라이드`).toBeGreaterThanOrEqual(3);
      if ([1, 2, 4, 9].includes(lessonId)) {
        expect(slides.length, `${lessonId}차시 확장 슬라이드`).toBeGreaterThanOrEqual(lessonId >= 4 ? 9 : 14);
        expect(slides.some((slide) => slide.kind === "gallery"), `${lessonId}차시 문화유산 관찰 슬라이드`).toBe(true);
        expect(slides.some((slide) => slide.kind === "quiz"), `${lessonId}차시 판단 퀴즈`).toBe(true);
      }
      expect(slides.some((slide) => slide.kind === "activity"), `${lessonId}차시 따라 하기 활동`).toBe(true);
      expect(slides.some((slide) => slide.kind === "quiz"), `${lessonId}차시 중간 확인 퀴즈`).toBe(true);
      expect(lastSlide?.kind, `${lessonId}차시 마지막 슬라이드`).toBe("closing");
      expect(internalPhrases.test(visibleCopy), `${lessonId}차시 운영 문구`).toBe(false);
      if (lastSlide?.kind === "closing") {
        expect(lastSlide.title.endsWith("까요?") || lastSlide.title.endsWith("할까요?")).toBe(true);
        if (lessonId >= 4) {
          expect(lastSlide.prompt.length).toBeGreaterThan(0);
          expect(lastSlide.prompt.length).toBeLessThanOrEqual(140);
        } else expect(lastSlide.prompt.length).toBeGreaterThan(45);
      }
    }
  });
});
