import { describe, expect, it } from "vitest";
import lessonTwoScript from "../../../scripts/generate_lesson2_onepage.py?raw";
import starterCsv from "../../../public/data/three-kingdoms/heritage-data-starter.csv?raw";
import { judgementMarks, lessonTwoStatementSets } from "./webActivities";
import { getThreeKingdomsSlides } from "./slides";
import { threeKingdomsExternalTools } from "./externalTools";
import { threeKingdomsLessons } from "./lessons";
import plans from "./continuity-guide.json";
import { newProject, projectCsv } from "./project";

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

describe("4~10차시 근거 표와 수업 자료 연결", () => {
  it("학생이 내보낸 표와 교사 연습 표는 같은 근거 항목을 사용한다", () => {
    const heading = projectCsv(newProject()).trim().split(/\r?\n/)[0];
    const starterHeading = starterCsv.trim().split(/\r?\n/)[0].split(",").slice(1).map(value => value.replaceAll('"', ''));
    expect(heading.split(",").map(value => value.replaceAll('"', ''))).toEqual(starterHeading);
    expect(starterCsv).toContain("교사 연습용");
    expect(heading).not.toContain("정확한연도");
  });
  it("지도안과 슬라이드가 같은 차시 제목과 다음 결과물을 안내한다", () => {
    for (const plan of plans) {
      const lesson = threeKingdomsLessons.find(item => item.id === plan.id)!;
      expect(lesson.title).toBe(plan.title);
      expect(lesson.outputs).toEqual(plan.outputs);
      const slides = JSON.stringify(getThreeKingdomsSlides(plan.id));
      expect(slides).toContain(plan.title);
      expect(slides).toContain(plan.nextLessonPrep);
    }
  });
  it("그래프는 유산이나 나라의 수 대신 확인한 근거의 개수를 센다", () => {
    const lesson = threeKingdomsLessons.find(item => item.id === 6)!;
    const tool = threeKingdomsExternalTools.find(item => item.lessonId === 6)!;
    expect(JSON.stringify(lesson)).toContain("근거 문장 수");
    expect(JSON.stringify(tool)).toContain("근거 문장 수");
    expect(threeKingdomsLessons.find(item => item.id === 8)?.cautions.join(" ")).toContain("교차 검증");
    expect(threeKingdomsLessons.find(item => item.id === 10)?.nextLessonPrep).toContain("최종 작업 파일");
  });
});
