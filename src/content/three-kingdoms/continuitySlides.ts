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
  9: { statement: '녹음했으니 들어 보지 않고 전시해도 돼요.', explanation: '친구 화면에서 설명점을 눌러 목소리를 들어 봐요. 설명과 녹음이 맞는지, 관람 문제를 풀 수 있는지도 확인해요.' },
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
    ...(id === 9 ? [
      { kind: 'activity' as const, image, eyebrow: '설명점 만들기', title: '설명할 곳 두 군데를 골라요', instruction: '1번 설명을 고른 뒤 유물에서 설명할 곳을 눌러요.', steps: ['자료에서 확인한 설명을 적어요.', '2번 설명에서도 같은 순서로 해요.', '입체 모형은 끌어서 돌려 보고 짧게 눌러 위치를 정해요.'] },
      { kind: 'activity' as const, image, eyebrow: '목소리 녹음하기', title: '우리 목소리로 설명해요', instruction: '설명점에서 녹음 시작을 누르고 마이크 사용을 허용해요.', steps: ['설명을 30초 안으로 읽고 녹음 끝내기를 눌러요.', '재생 버튼으로 들어 보고, 필요하면 다시 녹음해요.', '다른 설명점도 녹음한 뒤 친구 화면으로 체험해요.'] },
      { kind: 'activity' as const, image, eyebrow: '카드로 관람하기', title: '카드를 비추고 해설을 들어요', instruction: '인식용 유물 사진을 받아 자르지 않고 출력해요.', steps: ['다른 기기는 오늘 작업 저장하기로 받은 파일을 먼저 열어요.', '수업 웹앱의 카메라 AR 켜기를 누르고 출력물을 비춰요.', '1·2번 설명점을 눌러 듣고 친구가 만든 문제를 풀어요.'] },
    ] : []),
    { kind: 'activity', image, eyebrow: `함께 해요 · ${main.minutes}분`, title: plan.title, instruction: main.details[0], steps: main.details.slice(1) },
    { kind: 'fact', image, eyebrow: '여기까지 했나요?', title: '오늘 만든 것을 확인해요', points: plan.outputs, takeaway: '빠진 것이 있으면 친구나 선생님에게 물어봐요.' },
    { kind: 'quiz', image, eyebrow: '잠깐 생각하기', title: '이렇게 해도 될까요?', statement: checks[id].statement, verdict: '틀림', explanation: checks[id].explanation },
    { kind: 'activity', image, eyebrow: '오늘 작업 저장하기', title: '다음 시간에도 이어서 해요', instruction: id >= 9 ? '녹음을 끝낸 뒤 ‘오늘 작업 저장하기’를 누르면 설명점·녹음·전시 설정도 함께 담겨요.' : '‘오늘 작업 저장하기’를 누르면 표·그래프·설명이 한 파일에 담겨요.', steps: closing.details },
    { kind: 'closing', image, eyebrow: '마지막 확인', title: '다음 시간에는 무엇을 할까요?', prompt: plan.nextLessonPrep, next: id === 10 ? '처음과 지금의 생각 비교하기' : `${id + 1}차시 · ${plans.find(item => item.id === id + 1)?.title}` },
  ];
}
