import type { EraId, Lesson } from "../types/curriculum";

const eraCopy = {
  "three-kingdoms": {
    objective: "AI 설명에서 사실·오류·근거가 부족한 단정을 찾아 근거로 판단할 수 있다.",
    keyQuestion: "AI가 자신 있게 말하면 모두 역사적 사실일까?",
    role: "모둠별 검증 증거물을 만드는 첫 수업",
    intro: "확인된 사실·명백한 오류·아직 확정하기 어려운 단정이 섞인 AI 답변임을 안내한다.",
    judgment: "각 모둠은 담당 유산 전용 A4 한 장 활동지에서 문장 6개를 ○·×·△·?로 먼저 판단한다.",
    verification: "가장 의심한 문장 1~2개를 국가유산청·국립박물관·유네스코 자료로 확인하고 출처와 바르게 고친 문장을 같은 면에 기록한다.",
    share: "오류 또는 보류 문장 한 개를 근거와 함께 발표하고, 아직 확인할 수 없는 내용은 억지로 결론 내리지 않는다.",
    caution: "첨성대의 구체적 사용법과 신라 금관의 실제 착용 여부처럼 학계 의견이 나뉘는 내용은 △ 보류를 정답으로 인정한다.",
    next: "국가기관 자료·여행 블로그·AI 요약문을 비교할 자료 3종과 검증 5단계 포스터를 준비한다.",
  },
  joseon: {
    objective: "AI 설명에 섞인 사실·오류·근거 없는 단정을 찾아 자료로 확인할 수 있다.",
    keyQuestion: "많이 반복된 드라마 속 이야기는 사실이 될까?",
    role: "드라마·통념과 기록을 구분하는 검증 증거물 제작",
    intro: "확인된 사실·명백한 오류·드라마나 통념에서 생긴 근거 없는 단정이 섞인 AI 답변임을 안내한다.",
    judgment: "각 모둠은 담당 유산 전용 A4 한 장 활동지에서 문장 6개를 ○·×·△·?로 먼저 판단한다.",
    verification: "가장 의심한 문장 1~2개를 국가유산청·국사편찬위원회·국립박물관 자료로 확인하고 출처와 바르게 고친 문장을 같은 면에 기록한다.",
    share: "드라마나 통념과 실제 기록이 달랐던 문장 한 개를 근거와 함께 발표한다.",
    caution: "기록에 없는 장영실의 이후 행적이나 거중기의 과장된 효과를 그럴듯한 이야기만으로 확정하지 않는다.",
    next: "국가유산청 자료·여행 블로그·AI 답변을 비교할 자료 3종과 검증 4단계 포스터를 준비한다.",
  },
} satisfies Record<EraId, Record<string, string>>;

export function applyLesson2Override(eraId: EraId, lessons: readonly Lesson[]): readonly Lesson[] {
  const copy = eraCopy[eraId];

  return lessons.map((lesson): Lesson => {
    if (lesson.id !== 2) return lesson;

    return {
      ...lesson,
      title: "AI에게 물어보았습니다",
      role: copy.role,
      objective: copy.objective,
      keyQuestion: copy.keyQuestion,
      activities: [
        {
          stage: "도입",
          minutes: 5,
          title: "AI는 모르는 것이 없을까",
          details: [
            "AI의 역사 설명을 얼마나 믿는지 손들기로 확인한다.",
            copy.intro,
            "오늘의 미션인 ‘그럴듯한 설명에서 의심할 문장 찾기’를 안내한다.",
          ],
          materials: ["2차시 수업 PPT", "모둠별 A4 한 장 활동지 6종"],
        },
        {
          stage: "전개",
          minutes: 27,
          title: "사실과 오류가 섞인 AI 설명 검증하기",
          details: [
            copy.judgment,
            "가장 의심한 문장과 그 까닭을 출처 없음·너무 확실함·시대 불일치·숫자 수상·한 사람의 공로 중에서 고른다.",
            copy.verification,
          ],
          materials: ["모둠별 A4 한 장 오류 발견 기록지", "검색 기기", "공식 자료 바로가기"],
        },
        {
          stage: "정리",
          minutes: 8,
          title: "근거와 함께 최종 판단하기",
          details: [
            copy.share,
            "교사가 모둠별 정답과 추천 검색어를 공개하고 AI가 틀리는 까닭을 정리한다.",
            "완성한 활동지는 10차시 교실 박물관에서 검증 증거물로 전시한다.",
          ],
          materials: ["교사용 정답 PDF", "학생 완성 활동지"],
        },
      ],
      outputs: ["모둠별 A4 한 장 오류 발견 기록지"],
      assessment: {
        method: "산출물",
        criterion: "AI 답변에서 의심할 부분을 찾고 출처·근거로 최종 판단을 설명하는가?",
        evidence: "모둠별 A4 한 장 오류 발견 기록지",
      },
      teacherPrep: [
        "모둠별 담당 유산에 맞춘 서로 다른 활동지 6종을 한 장씩 인쇄한다.",
        "각 답변은 확인된 사실, 명백한 오류, 근거가 부족한 단정을 섞되 모든 학생에게 같은 문장을 제공한다.",
        "수업 PPT·교사용 정답·추천 검색어를 미리 열어 두고 검색 기기를 점검한다.",
      ],
      cautions: [
        "학생용 활동지는 반드시 A4 세로 한 장, 한 페이지로만 제공한다.",
        "정답을 먼저 공개하지 않고 학생이 의심한 이유와 출처를 말한 뒤 비교한다.",
        copy.caution,
      ],
      nextLessonPrep: copy.next,
      downloads: {
        student: ["모둠별 A4 한 장 오류 발견 기록지 6종", "6모둠 통합 학생용 PDF"],
        teacher: ["2차시 수업 PPT", "교사용 운영안·정답 PDF", "모둠별 추천 검색어"],
      },
      classroomMode: "worksheet",
    };
  });
}
