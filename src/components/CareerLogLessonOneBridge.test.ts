import { describe, expect, it } from "vitest";
import { isLessonTwoComplete, readLessonTwoRecord } from "./CareerLogLessonOneBridge";

const completeRecord = {
  groupId: 1,
  marks: Object.fromEntries(Array.from({ length: 6 }, (_, index) => [`g1-${index + 1}`, "○"])),
  sources: Object.fromEntries(Array.from({ length: 6 }, (_, index) => [`g1-${index + 1}`, "국립중앙박물관"])),
};

describe("Career Log 2차시 기록", () => {
  it("자유 JSON으로 저장된 활동 상태를 읽는다", () => {
    expect(readLessonTwoRecord(JSON.stringify(completeRecord))).toEqual(completeRecord);
    expect(readLessonTwoRecord("not-json")).toBeNull();
  });

  it("6개 판단과 6개 출처가 모두 있어야 완료된다", () => {
    expect(isLessonTwoComplete(completeRecord)).toBe(true);
    expect(isLessonTwoComplete({ ...completeRecord, sources: { ...completeRecord.sources, "g1-6": "" } })).toBe(false);
  });
});
