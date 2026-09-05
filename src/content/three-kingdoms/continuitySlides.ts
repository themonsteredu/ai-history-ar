import plans from './continuity-guide.json';
import type { HeritageImageKey, LessonSlide } from './slides';

const images: HeritageImageKey[] = ['muryeong', 'incense', 'cheomseongdae', 'crown', 'mural', 'gaya'];
const checks: Record<number, { statement: string; explanation: string }> = {
  4: { statement: '표의 한 행은 유산 한 점이므로 같은 유산을 다룬 문장은 모두 합쳐야 한다.', explanation: '우리 표는 서로 다른 근거 문장을 한 건씩 모읍니다. 같은 유산이어도 다른 사실을 설명하는 근거는 다른 행에 남깁니다.' },
  5: { statement: '같은 출처 주소를 사용하는 근거 두 개는 언제나 중복이다.', explanation: '같은 원문도 여러 사실을 담고 있습니다. 같은 내용이 반복될 때만 중복을 정리하고, 다른 근거는 출처가 같아도 남깁니다.' },
  6: { statement: '우리 그래프의 막대가 길수록 그 유산이 역사적으로 더 중요하다.', explanation: '막대는 우리가 모은 근거 문장 수를 나타냅니다. 유산의 중요성이나 나라의 힘을 나타내지 않습니다.' },
  7: { statement: '우리가 고른 근거의 개수만으로 삼국시대 전체 생활을 설명할 수 있다.', explanation: '이 그래프는 우리 조사 범위만 보여 줍니다. 어떤 자료를 골랐는지 밝히고, 선택하지 않은 사람과 자료는 알 수 없다고 말해야 합니다.' },
  8: { statement: '어떤 말이든 끝에 가능성이 있다고 붙이면 좋은 역사 유추가 된다.', explanation: '유추의 내용이 선택한 두 근거와 연결되어야 합니다. 말투만 바꾸어 근거 없는 상상을 정당화할 수는 없습니다.' },
  9: { statement: '전시 기획서에 체크했다면 실제 전시를 열어 보지 않아도 준비가 끝난다.', explanation: '실제로 그래프·사진·해설·관람객 활동을 열어 봐야 합니다. 다른 기기에서 작업 파일을 불러오고 카메라 없는 대체 화면도 점검합니다.' },
  10: { statement: '관람객의 질문에는 모르는 내용도 즉시 정답처럼 답해야 한다.', explanation: '좋은 해설사는 확인한 근거와 아직 모르는 부분을 구분합니다. 근거를 찾지 못한 질문은 함께 찾아볼 질문으로 남깁니다.' },
};
const bridges: Record<number, string> = {
  4: '이미 마친 2·3차시의 판단을 가져옵니다. AI 의심 수업을 다시 하지 않습니다.',
  5: '4차시에서 모은 우리 근거 표를 엽니다. 새 예비 표로 바꾸지 않습니다.',
  6: '5차시에서 정제한 바로 그 CSV를 사용합니다. 한 행은 근거 문장 하나입니다.',
  7: '6차시에서 만든 우리 그래프를 다시 엽니다. 표가 바뀌었다면 그래프도 갱신합니다.',
  8: '7차시의 그래프는 조사 범위를 보여 줍니다. 이제 근거 문장의 내용으로 돌아갑니다.',
  9: '8차시의 근거 두 개와 설명을 그래프·사진·AR에 함께 담습니다.',
  10: '9차시에서 시험한 같은 파일로 박물관을 엽니다. 새 작품을 만드는 시간이 아닙니다.',
};
export function getContinuitySlides(id: number, history?: LessonSlide): readonly LessonSlide[] | undefined {
  const plan = plans.find(item => item.id === id);
  if (!plan) return undefined;
  const image = images[(id-4)%images.length];
  const [intro, main, closing] = plan.activities;
  return [
    { kind: 'cover', image, tag: `삼국시대 ${id}차시 · 모둠 탐구`, title: plan.title, subtitle: plan.objective },
    { kind: 'fact', image, eyebrow: '앞 차시에서 가져온 것', title: plan.role, points: [bridges[id], ...intro.details], takeaway: '앞 차시의 결과가 오늘의 준비물입니다.' },
    { kind: 'gallery', image, eyebrow: '우리 유산 다시 보기', title: '같은 유산, 이어지는 질문', instruction: '담당 유산을 찾고 우리 모둠의 질문과 확인한 근거를 한 문장으로 말해 봅시다.' },
    ...(history ? [history] : []),
    { kind: 'fact', image, eyebrow: '오늘의 약속', title: plan.keyQuestion, points: plan.cautions, takeaway: '근거로 확인한 사실과 우리의 설명을 나누어 말합니다.' },
    { kind: 'activity', image, eyebrow: '모둠 활동 · 29분', title: plan.title, instruction: main.details[0], steps: main.details.slice(1) },
    { kind: 'fact', image, eyebrow: '선생님과 중간 확인', title: '다음 단계로 갈 준비가 되었나요?', points: plan.outputs.map(output => `${output}이 준비되었는지 확인합니다.`) },
    { kind: 'quiz', image, eyebrow: '잠깐 판단하기', title: '이렇게 해도 될까요?', statement: checks[id].statement, verdict: '틀림', explanation: checks[id].explanation },
    { kind: 'activity', image, eyebrow: '오늘의 결과 보관', title: '같은 작업을 다음 시간으로 가져가요', instruction: '작업 파일에는 근거·그래프·해설이 함께 들어 있습니다.', steps: closing.details },
    { kind: 'closing', image, eyebrow: '마지막 질문', title: '오늘 결과가 다음 시간에 어떻게 이어질까요?', prompt: `${plan.nextLessonPrep} 오늘 확인한 사실과 아직 모르는 점을 구분하고, 원본과 최종 작업 파일을 함께 보관합니다.`, next: id === 10 ? '완성한 탐구 결과 돌아보기' : `${id+1}차시 · ${plans.find(item => item.id===id+1)?.title}` },
  ];
}
