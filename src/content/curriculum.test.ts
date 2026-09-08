import worksheets from './three-kingdoms/worksheet-guide.json';
import { describe, expect, it } from "vitest";
import { eras } from "./catalog";
import { getLessonMinutes } from "./lesson-helpers";
import { getThreeKingdomsSlides } from "./three-kingdoms/slides";
import { threeKingdomsExternalTools } from "./three-kingdoms/externalTools";

describe("curriculum catalog", () => {
  // 삼국시대는 이미 진행한 통합 차시를 유지하고, 조선시대는 판단과 검증을 나누어 열 차시로 운영합니다.
  it("keeps the taught Three Kingdoms sequence and ten separate Joseon lessons", () => {
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
      "우리 유산과 질문 정하기", "AI가 한 말 확인하기",
      "문장을 표로 정리하기", "우리 표를 보기 좋게 고치기", "우리 표로 그래프 만들기",
      "그래프를 보고 말하기", "자료로 옛날 모습 생각하기", "우리 목소리로 안내하는 AR 전시", "우리 반 유산 박물관 열기",
    ]);
    const merged = eras[0].lessons[1];
    expect(merged.objective).toContain("○×△?");
    expect(JSON.stringify(merged)).toContain("출처 번호");
  });

  it("uses one-page worksheets in the judgement and data lessons", () => {
    expect(eras[0].lessons.map((lesson) => lesson.classroomMode)).toEqual(
      ["teacher-led", "worksheet", "worksheet", "student", "student", "student", "student", "student", "student"],
    );
    expect(eras[1].lessons.map((lesson) => lesson.classroomMode)).toEqual(
      ["teacher-led", "worksheet", "worksheet", "worksheet", "student", "student", "student", "student", "student", "student"],
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

  it("keeps the classroom deck in the same three-task order as the printed worksheet", () => {
    for (const sheet of worksheets) {
      const slides = getThreeKingdomsSlides(sheet.id);
      if (sheet.id === 4 || sheet.id === 5 || sheet.id === 6) {
        expect(slides).toHaveLength(6);
        expect(JSON.stringify(slides)).not.toMatch(/세 개|3개|지난 활동지|확인 상태|JSON|CSV/);
        expect(JSON.stringify(slides)).toContain('표');
        continue;
      }
      const taskSlides = slides.filter(slide => slide.kind === "activity" && slide.eyebrow.startsWith("활동지 "));
      expect(taskSlides.map(slide => slide.title)).toEqual(sheet.tasks.map((task, index) => `${index + 1}. ${task.title}`));
      expect(slides.at(-1)?.kind).toBe("closing");
      expect(JSON.stringify(slides)).not.toMatch(/다운로드 없음|새 탭/);
    }
    expect(getThreeKingdomsSlides(6).filter(slide => slide.kind === "tutorial")).toHaveLength(0);
  });});
