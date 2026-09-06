import plans from './continuity-guide.json';
import { studentExamples } from './studentLanguage';
import { codapTutorial } from './codapTutorial';
import type { HeritageImageKey, LessonSlide } from './slides';

const images: HeritageImageKey[] = ['muryeong', 'incense', 'cheomseongdae', 'crown', 'mural', 'gaya'];
const checks: Record<number, { statement: string; explanation: string }> = {
  4: { statement: '같은 유산을 설명하는 문장은 모두 하나로 합쳐야 해요.', explanation: '한 줄에 서로 다른 문장 하나를 담아요. 같은 유산이어도 모양과 발견 장소처럼 내용이 다르면 각각 남겨요.' },
  5: { statement: '같은 박물관 자료에서 찾았으면 문장 하나는 지워야 해요.', explanation: '내용이 다른 문장은 둘 다 남겨요. 같은 문장을 두 번 담았을 때만 하나를 빼요.' },
  6: { statement: '그래프의 막대가 길수록 더 중요한 유산이에요.', explanation: '막대는 우리가 고른 문장이 몇 개인지 보여 줘요. 유산의 중요성을 보여 주는 것은 아니에요.' },
  7: { statement: '우리가 고른 문장 몇 개를 세면 삼국시대 생활을 모두 알 수 있어요.', explanation: '우리는 고른 자료만 살펴봤어요. 다른 자료에는 우리가 아직 보지 못한 이야기도 있어요.' },
  8: { statement: '아무 말이나 “그랬을 것 같아요”라고 쓰면 돼요.', explanation: '왜 그렇게 생각했는지 보여 주는 문장 두 개가 필요해요. 문장에 없는 이야기를 지어 쓰지는 않아요.' },
  9: { statement: '전시할 내용을 골랐으니 화면을 열어 보지 않아도 돼요.', explanation: '전시를 열어 사진·그래프·설명을 확인해요. 친구가 할 활동도 직접 눌러 봐요.' },
  10: { statement: '친구가 물어보면 모르는 것도 아는 것처럼 대답해야 해요.', explanation: '모르면 “아직 모르겠어요. 같이 찾아볼까요?”라고 말해도 괜찮아요.' },
};
const bridges: Record<number, string> = {
  4: '지난 2·3차시 활동지를 꺼내요.', 5: '4차시에 저장한 우리 모둠 파일을 열어요.',
  6: '5차시에 고친 우리 표로 그래프를 만들어요.', 7: '6차시에 만든 그래프를 다시 봐요.',
  8: '이제 자료의 문장을 다시 읽어요.', 9: '8차시에 고른 문장 두 개와 우리 설명을 가져와요.',
  10: '9차시에 확인한 전시를 친구에게 보여 줘요.',
};
export function getContinuitySlides(id: number, history?: LessonSlide): readonly LessonSlide[] | undefined {
  const plan = plans.find(item => item.id === id);
  if (!plan) return undefined;
  const image = images[(id - 4) % images.length];
  const [intro, main, closing] = plan.activities;
  const example = studentExamples[id];
  return [
    { kind: 'cover', image, tag: `삼국시대 ${id}차시 · 우리 모둠 활동`, title: plan.title, subtitle: plan.objective },
    { kind: 'fact', image, eyebrow: '지난 시간과 이어서', title: plan.role, points: [bridges[id], ...intro.details], takeaway: '지난 시간에 저장한 파일을 이어서 써요.' },
    { kind: 'gallery', image, eyebrow: '우리 유산 다시 보기', title: '우리 모둠의 유산은 어디 있나요?', instruction: '우리 유산을 찾고, 지난 시간에 알게 된 것을 하나 말해 봐요.' },
    ...(history ? [history] : []),
    { kind: 'fact', image, eyebrow: '예를 보며 알아보기', title: example.title, points: example.lines, takeaway: '예시를 보고, 우리 모둠이 찾은 내용으로 활동해요.' },
    { kind: 'fact', image, eyebrow: '꼭 기억해요', title: plan.keyQuestion, points: plan.cautions, takeaway: '자료에서 확인한 것과 우리 생각을 나누어 말해요.' },
    ...(id === 6 ? codapTutorial.map((tutorial, stepIndex): LessonSlide => ({ kind: 'tutorial', image, title: tutorial.title, tutorial, stepIndex, source: tutorial.source })) : []),
    { kind: 'activity', image, eyebrow: `함께 해요 · ${main.minutes}분`, title: plan.title, instruction: main.details[0], steps: main.details.slice(1) },
    { kind: 'fact', image, eyebrow: '여기까지 했나요?', title: '오늘 만든 것을 확인해요', points: plan.outputs, takeaway: '빠진 것이 있으면 친구나 선생님에게 물어봐요.' },
    { kind: 'quiz', image, eyebrow: '잠깐 생각하기', title: '이렇게 해도 될까요?', statement: checks[id].statement, verdict: '틀림', explanation: checks[id].explanation },
    { kind: 'activity', image, eyebrow: '오늘 작업 저장하기', title: '다음 시간에도 이어서 해요', instruction: '‘오늘 작업 저장하기’를 누르면 표·그래프·설명이 한 파일에 담겨요.', steps: closing.details },
    { kind: 'closing', image, eyebrow: '마지막 확인', title: '다음 시간에는 무엇을 할까요?', prompt: plan.nextLessonPrep, next: id === 10 ? '처음과 지금의 생각 비교하기' : `${id + 1}차시 · ${plans.find(item => item.id === id + 1)?.title}` },
  ];
}
