import { tableLessonGuide } from '../tableLessonGuide';
import plans from './continuity-guide.json';
import { lessonFourWebGuide } from '../lessonFourWebGuide';
import worksheets from './worksheet-guide.json';
import { studentExamples } from './studentLanguage';
import { codapTutorial } from './codapTutorial';
import type { HeritageImageKey, LessonSlide } from './slides';

const images: HeritageImageKey[] = ['muryeong', 'incense', 'cheomseongdae', 'crown', 'mural', 'gaya'];

export function getContinuitySlides(id: number, history?: LessonSlide): readonly LessonSlide[] | undefined {
  const plan = plans.find(item => item.id === id);
  const sheet = worksheets.find(item => item.id === id);
  if (!plan || !sheet) return undefined;
  if (id === 4 || id === 5) return [
    { kind: 'cover', image: 'muryeong', tag: '삼국시대 ' + id + '차시', title: plan.title, subtitle: plan.objective },
    ...tableLessonGuide[id].map((step, index): LessonSlide => ({ kind: 'fact', image: 'muryeong', eyebrow: '함께 해요 ' + (index + 1), title: step.title, points: [...step.body] })),
    { kind: 'fact', image: 'muryeong', eyebrow: '다음 시간', title: '우리 표로 이어 가요', points: [plan.nextLessonPrep] },
  ];
  const image = images[(id - 4) % images.length];
  const example = studentExamples[id];
  const slides: LessonSlide[] = [
    { kind: 'cover', image, tag: `삼국시대 ${sheet.label}`, title: sheet.title, subtitle: plan.objective },
    { kind: 'fact', image, eyebrow: '활동 준비', title: '지난 시간과 이어서 해요', points: [plan.activities[0].details[0], '활동지에 모둠과 이름을 써요.'], takeaway: '종이에는 체크·숫자·핵심 낱말만 남겨요.' },
    ...(history ? [history] : []),
    { kind: 'fact', image, eyebrow: '짧은 예시', title: example.title, points: example.lines.slice(0, 3), takeaway: '우리 모둠이 찾은 내용으로 바꾸어 활동해요.' },
  ];
  const addWebGuide = (afterTask: number) => {
    if (id === 4) slides.push(...lessonFourWebGuide.filter(step => step.afterTask === afterTask).map((step): LessonSlide => ({ kind: 'activity', image, eyebrow: '웹앱 따라 하기', title: step.title, instruction: step.instruction, steps: [...step.steps] })));
  };
  addWebGuide(0);
  sheet.tasks.forEach((task, index) => {
    slides.push({ kind: 'activity', image, eyebrow: `활동지 ${index + 1}번`, title: `${index + 1}. ${task.title}`, instruction: task.instruction, steps: [task.tip] });
    addWebGuide(index + 1);
    if (id === 6 && index === 1) slides.push(...codapTutorial.map((tutorial, stepIndex): LessonSlide => ({ kind: 'tutorial', image, title: tutorial.title, tutorial, stepIndex, source: tutorial.source })));
    if (id === 9 && index === 1) slides.push({ kind: 'activity', image, eyebrow: '녹음 따라 하기', title: '녹음하고 다시 들어요', instruction: '설명점에서 녹음 시작을 누르고 마이크 사용을 허용해요.', steps: ['30초 안으로 설명하고 녹음 끝내기를 눌러요.', '재생해서 들어 보고, 다른 설명점도 녹음해요.', '설명을 듣고 풀 수 있는 문제 하나를 만들어요.'] });
    if (id === 9 && index === 2) slides.push({ kind: 'activity', image, eyebrow: '카드로 확인하기', title: '카드를 비추고 해설을 들어요', instruction: '우리 유물의 카드 받기를 눌러 A4 한 장으로 출력해요.', steps: ['다른 기기는 저장한 작업 파일을 먼저 열어요.', '카메라 AR 켜기를 누르고 카드 사진 전체를 비춰요.', '1·2번 설명점을 눌러 듣고 문제를 풀어요.'] });
  });
  slides.push(
    { kind: 'fact', image, eyebrow: '마지막 확인', title: '자료를 보며 확인해요', points: plan.cautions, takeaway: '오늘 작업 저장하기를 누르고 활동지도 보관해요.' },
    { kind: 'closing', image, eyebrow: '다음 연결', title: id === 10 ? '우리가 배운 것을 이야기해요' : '다음 시간에도 이어서 해요', prompt: plan.nextLessonPrep, next: id === 10 ? '활동지와 마지막 작업 파일 보관' : `${id + 1}차시 · ${plans.find(item => item.id === id + 1)?.title}` },
  );
  return slides;
}

export function getStartingWorksheetSlides(id: number): readonly LessonSlide[] | undefined {
  if (id !== 1 && id !== 2) return undefined;
  const sheet = worksheets.find(item => item.id === id)!;
  const image: HeritageImageKey = 'muryeong';
  const slides: LessonSlide[] = [{ kind: 'cover', image, tag: `삼국시대 ${sheet.label}`, title: sheet.title, subtitle: id === 1 ? '사진을 보고 우리 모둠 질문을 정해요.' : 'AI가 한 말을 자료에서 확인해요.' }];
  if (id === 1) slides.push({ kind: 'gallery', image, eyebrow: '우리 유산 만나기', title: '사진에서 무엇이 보이나요?', instruction: '우리 모둠 사진을 크게 보고 모양·재료·장면을 살펴봐요.' });
  if (id === 2) slides.push({ kind: 'fact', image, eyebrow: '내 판단 (○×△?)', title: '네 가지 기호를 사용해요', points: ['○ 자료로 확인 · × 자료와 다름', '△ 의견 나뉨·근거 부족 · ? 더 찾아봐야 함'], takeaway: '확인한 출처가 없으면 ?로 남겨요.' });
  sheet.tasks.forEach((task, index) => {
    slides.push({ kind: 'activity', image, eyebrow: `활동지 ${index + 1}번`, title: `${index + 1}. ${task.title}`, instruction: task.instruction, steps: [task.tip] });
    if (id === 2 && index === 1) slides.push({ kind: 'fact', image, eyebrow: '확인한 출처', title: '읽은 자료의 번호를 적어요', points: ['1 국가유산청 · 2 국립박물관', '3 유네스코 · 4 그 밖의 자료 (이름도 적기)', '검색어는 유산 이름과 궁금한 낱말을 함께 넣어요.'], takeaway: '자료에서 확인한 문장을 가리키며 말해요.' });
  });
  slides.push({ kind: 'closing', image, eyebrow: '다음 시간', title: '완성한 활동지를 보관해요', prompt: id === 1 ? '다음 시간에는 우리 유산에 대한 AI의 말을 확인해요.' : '4차시에는 찾은 문장 세 개를 표로 정리해요.', next: id === 1 ? '2·3차시 · AI가 한 말 확인하기' : '4차시 · 찾은 내용을 표로 정리하기' });
  return slides;
}
