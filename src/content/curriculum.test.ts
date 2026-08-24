import { describe, expect, it } from "vitest";
import { eras } from "./catalog";
import { getLessonMinutes } from "./lesson-helpers";

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
});
