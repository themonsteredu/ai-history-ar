import { describe, expect, it } from "vitest";
import lessonTwoScript from "../../../scripts/generate_lesson2_onepage.py?raw";
import lessonFourScript from "../../../scripts/generate_lesson4_datacards.py?raw";
import {
  classTableColumns,
  classTableCsv,
  dataCardFields,
  judgementMarks,
  lessonTwoStatementSets,
  type ClassDataRow,
} from "./webActivities";
import { getThreeKingdomsSlides } from "./slides";
import { threeKingdomsExternalTools } from "./externalTools";
import { threeKingdomsLessons } from "./lessons";

/**
 * 실제 수업 피드백에서 나온 최우선 원칙:
 * PPT · 웹앱 · 활동지가 완전히 같은 용어, 같은 항목명, 같은 흐름을 써야 합니다.
 * PPT와 활동지는 생성 스크립트가 만들므로 스크립트 원문을 그대로 읽어 대조합니다.
 */
describe("2차시 자료 용어 일치", () => {
  it("웹앱의 판단 기호가 활동지·PPT와 같은 네 가지 표현이다", () => {
    expect(judgementMarks.map((mark) => `${mark.symbol} ${mark.meaning}`)).toEqual([
      "○ 자료로 확인",
      "× 자료와 다름",
      "△ 의견 나뉨·근거 부족",
      "? 더 찾아봐야 함",
    ]);
    for (const mark of judgementMarks) {
      expect(lessonTwoScript, `${mark.symbol} 기호 설명`).toContain(mark.meaning);
    }
  });

  it("활동지의 표 항목명을 PPT·웹앱이 그대로 쓴다", () => {
    for (const column of ["번호", "AI가 한 말", "내 판단 (○×△?)", "확인한 출처", "오늘의 한 문장"]) {
      expect(lessonTwoScript, `활동지 항목 ${column}`).toContain(column);
    }
    const deck = JSON.stringify(getThreeKingdomsSlides(2));
    expect(deck).toContain("내 판단");
    expect(deck).toContain("확인한 출처");
  });

  it("웹앱 문장이 모둠별 활동지 6문장과 글자까지 같다", () => {
    expect(lessonTwoStatementSets).toHaveLength(6);
    for (const set of lessonTwoStatementSets) {
      expect(set.statements, `${set.groupId}모둠 문장 수`).toHaveLength(6);
      for (const statement of set.statements) {
        expect(lessonTwoScript, `${set.groupId}모둠: ${statement.text}`).toContain(statement.text);
      }
    }
    const ids = lessonTwoStatementSets.flatMap((set) => set.statements.map((statement) => statement.id));
    expect(new Set(ids).size).toBe(36);
  });

  it("2차시 PPT가 실제 수업 흐름 14장으로 구성된다", () => {
    for (const heading of ["AI의 역사 설명을 얼마나 믿나요?", "오늘의 미션", "내 판단 (○×△?)", "웹앱 접속 안내", "활동 시간 안내", "좋은 검색어 만들기 · 어디에서 확인할까?", "AI는 왜 틀릴까?"]) {
      expect(lessonTwoScript, `PPT 슬라이드 ${heading}`).toContain(heading);
    }
    // 모둠별 정답은 그 모둠이 발표한 뒤에만 엽니다.
    expect(lessonTwoScript).toContain("발표 후 공개");
  });
});

describe("4차시 자료 용어 일치", () => {
  const labels = dataCardFields.map((field) => field.label);

  it("일곱 항목의 이름과 순서가 고정되어 있다", () => {
    expect(labels).toEqual(["시기", "만든 까닭", "가치", "현재 상태", "AI 오류 바로잡기", "아직 모름", "출처"]);
  });

  it("PPT·활동지 생성 스크립트가 같은 일곱 항목을 쓴다", () => {
    for (const field of dataCardFields) {
      expect(lessonFourScript, `항목 ${field.label}`).toContain(`("${field.label}", "${field.hint}")`);
    }
  });

  it("지도안·수업 슬라이드·외부 도구 안내가 같은 항목명을 쓴다", () => {
    const lesson = threeKingdomsLessons.find((item) => item.id === 4);
    const lessonCopy = JSON.stringify(lesson);
    const deck = JSON.stringify(getThreeKingdomsSlides(4));
    const tool = JSON.stringify(threeKingdomsExternalTools.find((item) => item.lessonId === 4));
    for (const label of labels) {
      expect(lessonCopy, `지도안 ${label}`).toContain(label);
      expect(deck, `슬라이드 ${label}`).toContain(label);
      expect(tool, `외부 도구 ${label}`).toContain(label);
    }
  });

  it("학급 표 열 이름이 일곱 항목을 그대로 따른다", () => {
    expect(classTableColumns).toEqual(["모둠", "유산", ...labels]);
  });

  it("5차시 시작 CSV를 모둠 순서대로 내보낸다", () => {
    const row = (groupId: number, heritage: string): ClassDataRow => ({
      groupId,
      heritage,
      values: Object.fromEntries(dataCardFields.map((field) => [field.id, `${groupId}-${field.id}`])) as ClassDataRow["values"],
      updatedAt: "2026-09-01T00:00:00.000Z",
    });
    const csv = classTableCsv([row(3, "첨성대"), row(1, "무령왕릉")]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe(classTableColumns.map((column) => `"${column}"`).join(","));
    expect(lines[1]).toContain('"1모둠","무령왕릉"');
    expect(lines[2]).toContain('"3모둠","첨성대"');
  });

  it("따옴표가 든 값도 CSV에서 깨지지 않는다", () => {
    const values = Object.fromEntries(dataCardFields.map((field) => [field.id, ""])) as ClassDataRow["values"];
    values.correction = '‘도굴되었다"’ → 도굴되지 않았다';
    const csv = classTableCsv([{ groupId: 1, heritage: "무령왕릉", values, updatedAt: "" }]);
    expect(csv).toContain('"‘도굴되었다""’ → 도굴되지 않았다"');
  });
});
