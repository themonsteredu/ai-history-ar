import worksheetGuide from './worksheet-guide.json';
import pptCopy from '../../../scripts/simple_ppt_copy.json';
import simpleScript from '../../../scripts/generate_simple_materials.py?raw';
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
      expect(simpleScript + JSON.stringify(worksheetGuide), `활동지 항목 ${column}`).toContain(column);
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

  it("학교용 PPT의 정답을 모둠별 두 장으로 나누고 활동지 순서를 유지한다", () => {
    expect(pptCopy.outputSlides).toHaveLength(20);
    const answers = pptCopy.outputSlides.filter(slide => slide.narrativeRole.startsWith("teacher answer"));
    expect(answers).toHaveLength(12);
    const copy = JSON.stringify(pptCopy);
    for (const heading of ["1. 내 판단 표시하기", "2. 자료에서 확인하기", "3. 오늘의 한 문장"]) expect(copy).toContain(heading);
    expect(copy).toContain("우리 모둠 발표를 마친 뒤 확인해요.");
  });});

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
    expect(threeKingdomsLessons.find(item => item.id === 8)?.cautions.join(" ")).toContain("두 곳에서 따로 확인한 것이 아닙니다");
    expect(threeKingdomsLessons.find(item => item.id === 10)?.nextLessonPrep).toContain("마지막으로 저장한 작업 파일");
  });
});
