import { describe, expect, it } from "vitest";
import lessonTwoScript from "../../../scripts/generate_lesson2_onepage.py?raw";
import lessonFourScript from "../../../scripts/generate_lesson4_datacards.py?raw";
import starterCsv from "../../../public/data/three-kingdoms/heritage-data-starter.csv?raw";
import cleanedCsv from "../../../public/data/three-kingdoms/heritage-data-cleaned.csv?raw";
import {
  classTableColumns,
  classTableCsv,
  cleanedTableColumns,
  cleaningColumns,
  dataCardFields,
  lessonFiveStartColumns,
  lessonFiveStartCsv,
  judgementMarks,
  lessonTwoStatementSets,
  type ClassDataRow,
} from "./webActivities";
import { getThreeKingdomsSlides } from "./slides";
import { threeKingdomsExternalTools } from "./externalTools";
import { threeKingdomsLessons } from "./lessons";

/**
 * 실제 수업 피드백에서 나온 최우선 원칙:
 * PPT · 활동 화면 · 활동지가 완전히 같은 용어, 같은 항목명, 같은 흐름을 써야 합니다.
 * PPT와 활동지는 생성 스크립트가 만들므로 스크립트 원문을 그대로 읽어 대조합니다.
 */
describe("2차시 자료 용어 일치", () => {
  it("활동 화면의 판단 기호가 활동지·PPT와 같은 네 가지 표현이다", () => {
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

  it("활동지의 표 항목명을 PPT·활동 화면이 그대로 쓴다", () => {
    for (const column of ["번호", "AI가 한 말", "내 판단 (○×△?)", "확인한 출처", "오늘의 한 문장"]) {
      expect(lessonTwoScript, `활동지 항목 ${column}`).toContain(column);
    }
    const deck = JSON.stringify(getThreeKingdomsSlides(2));
    expect(deck).toContain("내 판단");
    expect(deck).toContain("확인한 출처");
  });

  it("활동 화면 문장이 모둠별 활동지 6문장과 글자까지 같다", () => {
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
    for (const heading of ["AI의 역사 설명을 얼마나 믿나요?", "오늘의 미션", "내 판단 (○×△?)", "활동 화면 여는 방법", "활동 시간 안내", "좋은 검색어 만들기 · 어디에서 확인할까?", "AI는 왜 틀릴까?"]) {
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

/**
 * 4차시가 모은 데이터가 5~8차시로 실제로 이어지는지 확인합니다.
 * 이전에는 4차시를 자기 자신하고만 비교해서, 5차시 시작 파일과 열 이름이
 * '시기' 하나만 겹치는데도 테스트가 통과했습니다.
 */
describe("4차시 → 5~8차시 데이터 연결", () => {
  /** 따옴표 안의 쉼표까지 다루는 최소 CSV 파서. */
  const parse = (csv: string) => csv.trim().split(/\r?\n/).map((line) => {
    const cells: string[] = [];
    let cell = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"') {
        if (quoted && line[index + 1] === '"') { cell += '"'; index += 1; } else { quoted = !quoted; }
      } else if (character === "," && !quoted) { cells.push(cell); cell = ""; } else { cell += character; }
    }
    cells.push(cell);
    return cells;
  });
  const header = (csv: string) => parse(csv)[0];

  it("5차시 시작 파일이 4차시 일곱 항목을 그대로 이어받는다", () => {
    expect(lessonFiveStartColumns.slice(0, 3)).toEqual(["모둠", "기록한 곳", "유산"]);
    for (const field of dataCardFields) {
      expect(lessonFiveStartColumns, `시작 파일 열 ${field.label}`).toContain(field.label);
    }
    expect(header(starterCsv)).toEqual([...lessonFiveStartColumns]);
  });

  it("시작 파일에 정제할 거리(중복·AI 줄·빈 출처)가 들어 있다", () => {
    const rows = starterCsv.trim().split(/\r?\n/).slice(1);
    expect(rows.length, "시작 파일 줄 수").toBe(14);
    expect(rows.length - new Set(rows).size, "완전히 같은 줄").toBeGreaterThanOrEqual(2);
    expect(rows.filter((row) => row.includes("AI 답변")).length, "AI 답변 줄").toBe(6);
    expect(rows.filter((row) => row.endsWith('""')).length, "출처가 빈 줄").toBeGreaterThanOrEqual(6);
  });

  it("웹앱이 만드는 시작 파일과 예비 파일의 열이 같다", () => {
    const values = Object.fromEntries(dataCardFields.map((field) => [field.id, "값"])) as ClassDataRow["values"];
    const csv = lessonFiveStartCsv([{ groupId: 1, heritage: "무령왕릉", values, updatedAt: "" }]);
    expect(header(csv)).toEqual(header(starterCsv));
  });

  it("5차시가 만드는 다섯 열이 6~8차시 예비 파일에 들어 있다", () => {
    expect(cleaningColumns.map((column) => column.label)).toEqual(["나라", "세기", "자료 종류", "지역", "확인 기관"]);
    expect(header(cleanedCsv)).toEqual([...cleanedTableColumns]);
  });

  it("다섯 열 이름을 지도안·슬라이드·외부 도구가 함께 쓴다", () => {
    const lesson = JSON.stringify(threeKingdomsLessons.filter((item) => item.id >= 5 && item.id <= 8));
    const decks = [5, 6, 7, 8].map((id) => JSON.stringify(getThreeKingdomsSlides(id))).join(" ");
    const tools = JSON.stringify(threeKingdomsExternalTools.filter((item) => item.lessonId >= 5 && item.lessonId <= 8));
    for (const { label } of cleaningColumns) {
      expect(`${lesson} ${decks} ${tools}`, `다섯 열 ${label}`).toContain(label);
    }
  });

  it("6~8차시 그래프에 쓸 숫자 열과 범주 열이 실제로 있다", () => {
    const [head, ...rows] = parse(cleanedCsv);
    const columnAt = (label: string) => rows.map((row) => row[head.indexOf(label)]);
    expect(columnAt("세기").every((value) => /^\d+$/.test(value)), "세기는 숫자여야 CODAP 가로축에 놓을 수 있다").toBe(true);
    expect(new Set(columnAt("나라")).size, "나라 범주 수").toBeLessThan(rows.length);
    expect(new Set(columnAt("자료 종류")).size, "자료 종류 범주 수").toBeLessThan(rows.length);
  });
});
