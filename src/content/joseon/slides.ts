import plans from './continuity-guide.json';
import { lessonFourWebGuide } from '../lessonFourWebGuide';
import worksheets from './worksheet-guide.json';
import claims from './lesson-two.json';
import { codapTutorial, type CodapTutorialStep } from '../three-kingdoms/codapTutorial';
import { exampleForEra, researchForEra } from '../heritageCatalog';

export interface JoseonSlide {
  kicker: string; title: string; body: readonly string[]; prompt?: string;
  heritageId?: number; taskNumber?: number; tutorial?: CodapTutorialStep;
  source?: { label: string; href: string };
}
export function getJoseonSlides(id: number): readonly JoseonSlide[] {
  const plan = plans.find(item => item.id === id)!;
  const sheet = worksheets.find(item => item.id === id)!;
  const heritage = researchForEra('joseon')[(id - 1) % 6];
  const slides: JoseonSlide[] = [{kicker:`조선시대 ${id}차시`,title:sheet.title,body:[plan.objective],prompt:plan.keyQuestion}];
  if (id === 1) slides.push(...researchForEra('joseon').map(item => ({kicker:`${item.id}모둠 · ${item.category}`,title:item.heritage,body:['사진에서 눈에 보이는 특징을 찾아요.'],prompt:item.question,heritageId:item.id})));
  if (id >= 4) slides.push({kicker:'지난 작업 이어서',title:'우리 모둠 자료를 열어요',body:['지난 시간에 저장한 작업 파일을 열어요.','활동지에 모둠과 이름을 써요.','종이에는 체크·숫자·핵심 낱말만 남겨요.']});
  if (id === 2) slides.push({kicker:'내 판단 (○×△?)',title:'지금 생각을 표시해요',body:['○ 자료와 같음 · × 자료와 다름','△ 근거 부족·과장됨 · ? 아직 확인하지 못함','확인하지 못한 문장은 ?로 남겨도 좋아요.']});
  if (id === 3) slides.push({kicker:'지난 판단 돌아보기',title:'출처를 보고 다시 판단해요',body:['출처: 누가 만든 자료일까요?','시기: 언제의 일을 언제 설명한 자료일까요?','교차·원본: 다른 자료와 원문도 확인할까요?'],prompt:'직접 확인하지 못한 말은 억지로 결론 내리지 않아요.'});
  if (id >= 4) {
    const example = exampleForEra('joseon', id);
    slides.push({kicker:'짧은 예시',title:example.title,body:example.lines.slice(0,3),heritageId:id === 8 ? 2 : heritage.id});
  }
  const addWebGuide = (afterTask: number) => {
    if (id === 4) slides.push(...lessonFourWebGuide.filter(step => step.afterTask === afterTask).map(step => ({ kicker: '웹앱 따라 하기', title: step.title, body: [step.instruction, ...step.steps] })));
  };
  addWebGuide(0);
  sheet.tasks.forEach((task,index) => {
    slides.push({kicker:`활동지 ${index+1}번`,title:`${index+1}. ${task.title}`,body:[task.instruction,task.tip],taskNumber:index+1});
    addWebGuide(index + 1);
    if (id === 6 && index === 1) slides.push(...codapTutorial.map(tutorial => ({kicker:'CODAP 실제 화면',title:tutorial.title,body:[],tutorial,source:tutorial.source})));
    if (id === 9 && index === 1) slides.push({kicker:'녹음 따라 하기',title:'녹음하고 다시 들어요',body:['설명점 선택 → 녹음 시작 → 마이크 허용','30초 안에 설명 → 녹음 끝내기 → 다시 듣기','다른 설명점도 녹음한 뒤 관람 문제를 만들어요.']});
    if (id === 9 && index === 2) slides.push({kicker:'카드와 작업 파일',title:'카드를 비추고 해설을 들어요',body:['우리 유산 카드 PDF를 A4 한 장으로 출력해요.','다른 기기에서는 먼저 우리 모둠 작업 파일을 열어요.','카메라 AR 켜기 → 카드 전체 비추기 → 설명점 듣기']});
  });
  if (id === 3) {
    slides.push({kicker:'모둠 발표 뒤 함께 확인',title:'판단보다 근거를 살펴요',body:['지금부터는 선생님과 답을 확인해요.','같은 판단이어도 어느 자료를 읽었는지 말해요.','자료가 부족한 문장은 단정하지 않아요.']});
    for (const group of claims.groups) for (let part=0;part<2;part++) slides.push({kicker:`${group.id}모둠 · ${part*3+1}~${part*3+3}번 확인`,title:group.heritage,heritageId:group.id,body:group.items.slice(part*3,part*3+3).map((item,index)=>`${part*3+index+1}번 ${item[1]} · ${item[2]}`),source:{label:group.source,href:researchForEra('joseon')[group.id-1].sources[0].href}});
  }
  slides.push({kicker:'다음 연결',title:id===10?'달라진 생각을 나눠요':'오늘 자료를 보관해요',body:[plan.nextLessonPrep],prompt:id>=4?'오늘 작업 저장하기를 누르고 파일을 보관해요.':'활동지는 다음 시간에 다시 사용해요.'});
  return slides;
}
