import { describe, expect, it } from "vitest";
import { historySourceEventId, isLessonTwoComplete, readLessonTwoRecord } from "./CareerLogLessonOneBridge";
import bridgeSource from "./CareerLogLessonOneBridge.tsx?raw";
import lessonPageSource from "../pages/ClassroomLessonPage.tsx?raw";


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

  it("활동 화면과 Hub의 4~10자 참여 코드·UUID가 있을 때만 저장 UI를 연다", () => {
    expect(bridgeSource).toMatch(/params\.get\("view"\) === "activity"/);
    expect(bridgeSource).toMatch(/\^\[a-z0-9\]\{4,10\}\$/);
    expect(bridgeSource).toMatch(/UUID_V4_RE\.test\(inboundStudentId\)/);
    expect(bridgeSource).not.toContain('|| "문화유산"');
  });

  it("수업 화면과 차시 이동에서 Hub 연결 쿼리를 보존한다", () => {
    expect(lessonPageSource).toMatch(/new URLSearchParams\(currentSearch\)/);
    expect(lessonPageSource).toMatch(/viewPath\(previousLesson\.id, view\)/);
    expect(lessonPageSource).toMatch(/viewPath\(nextLesson\.id, view\)/);
  });

  it("저장소 예외를 처리하고 Hub가 전달한 UUID를 우선한다", () => {
    expect(bridgeSource).toMatch(/function browserStorage/);
    expect(bridgeSource).toMatch(/if \(UUID_V4_RE\.test\(candidate\)\)/);
    expect(bridgeSource).toMatch(/catch \{ return null; \}/);
    expect(bridgeSource).toMatch(/setStatus\("saving"\);[\s\S]*try \{/);
  });

  it("Hub 학생 UUID별로 결정적인 source event ID를 사용한다", () => {
    const first = historySourceEventId("abcd12", 2, "11111111-1111-4111-8111-111111111111");
    const retry = historySourceEventId("abcd12", 2, "11111111-1111-4111-8111-111111111111");
    const otherStudent = historySourceEventId("abcd12", 2, "22222222-2222-4222-8222-222222222222");
    expect(retry).toBe(first);
    expect(otherStudent).not.toBe(first);
  });
});
