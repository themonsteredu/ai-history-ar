import type { Artifact, Question } from './data';
import { artifacts } from './data';
import { knowledgeA } from './knowledgeA';
import { knowledgeB } from './knowledgeB';

/** 정해진 자료를 바탕으로 대답하는 수업용 대화입니다. */
export type GoryeoChatInput = {
  artifact: Artifact;
  question: Question;
  questionIndex: number;
  choice: string;
  message: string;
  lastRobotMessage?: string;
};

type Knowledge = { topics: string[]; answer: string; source: string };
const knowledge: Record<string, Knowledge[]> = { ...knowledgeA, ...knowledgeB };
const unknown = '그건 잘 모르겠어. 인쇄한 근거 자료나 선생님께 확인해 줘.';
const names: Record<string, RegExp> = {
  buddha: /논산관촉사석조미륵보살입상|관촉사미륵보살|관촉사|은진미륵|미륵보살/,
  type: /고려금속활자|금속활자|직지|활자/,
  tripitaka: /팔만대장경|고려대장경|대장경판|대장경|경판/,
  vase: /청자상감운학문매병|청자상감구름학무늬매병|상감운학문매병|청자매병|매병/,
  incense: /청자투각칠보문뚜껑향로|칠보무늬향로|청자향로|향로/,
  lacquer: /나전경전함|나전칠기|경전함|나전/,
};
const introductions: Record<string, string> = {
  buddha: '관촉사 미륵보살은 돌로 만든 보살상이에요. 논산 관촉사에 있으며 은진미륵이라고도 불러요.',
  type: '금속활자는 금속으로 만든 글자예요. 글자들을 모아 책을 인쇄할 때 사용했어요.',
  tripitaka: '팔만대장경은 불교 경전을 새긴 나무판으로 인쇄한 대장경이에요.',
  vase: '청자 매병은 구름과 학 무늬가 있는 고려청자예요.',
  incense: '칠보무늬 향로는 향을 태우는 데 쓰는 고려청자예요.',
  lacquer: '나전 경전함은 불교 경전을 담는 함이에요. 조개껍데기를 사용해 장식했어요.',
};

const normal = (s: string) => s.toLowerCase().replace(/\s+/g, '').replace(/[?!.,~！？，。]/g, '');
function robotOpinion(question: Question, choice: string): string {
  const robotAnswer = question.deliberatelyWrong ? (question.answer === 'O' ? 'X' : 'O') : question.answer;
  const comparison = choice === 'O' || choice === 'X'
    ? `너는 ${choice}라고 골랐구나. 내 생각에는 네 답이 ${choice === robotAnswer ? '맞아' : '틀렸어'}. `
    : '';
  return comparison + question.robot;
}

function lastKnowledge(message?: string): { artifactId: string; entry: Knowledge } | undefined {
  if (!message) return undefined;
  for (const [artifactId, entries] of Object.entries(knowledge)) {
    const entry = entries.find(value => value.answer === message);
    if (entry) return { artifactId, entry };
  }
  return undefined;
}
function sourceName(source: string): string {
  if (/unesco\.org/.test(source)) return '유네스코';
  if (/museum\.go\.kr/.test(source)) return '국립중앙박물관';
  if (/heritage\.go\.kr/.test(source)) return '국가유산포털';
  return '공식 자료';
}

/** 검증 활동의 10문항 중 한 답변에만 준비된 오류가 있습니다. */
export function answerGoryeoChat({ artifact, question, choice, message, lastRobotMessage }: GoryeoChatInput): string {
  const text = normal(message);
  if (!text) return unknown;
  if (/^(안녕|안녕하세요|반가워|반가워요|하이|헬로)$/.test(text)) return '안녕! 유물에 대해 함께 생각해 보자.';
  if (/^(고마워|고마워요|감사|감사해|감사합니다|땡큐)$/.test(text)) return '천만에! 내 설명도 근거 자료와 꼭 비교해 줘.';
  const previous = lastKnowledge(lastRobotMessage);
  // 앞의 설명을 가리키는 출처 질문은 답변의 실제 출처에 연결합니다.
  const mentionedIds = Object.entries(names).filter(([, pattern]) => pattern.test(text)).map(([id]) => id);
  const sourceQuestion = /어디에?나와|어디에?적혀|어디에?쓰여있|출처|근거|어디서봤|뭘보고|어떻게알았/.test(text) || (/어디서나왔/.test(text) && mentionedIds.length === 0);
  if (sourceQuestion) {
    if (previous) return `내가 참고한 ${sourceName(previous.entry.source)} 자료를 살펴봐 줘. 인쇄 자료에는 이 내용이 없을 수도 있어. ${previous.entry.source}`;
    const previousIntroId = Object.entries(introductions).find(([, answer]) => answer === lastRobotMessage)?.[0];
    const previousIntro = artifacts.find(item => item.id === previousIntroId);
    if (previousIntro) return `내가 참고한 ${previousIntro.sourceName} 자료를 살펴봐 줘. 인쇄 자료에도 관련 내용이 있는지 확인해 보자. ${previousIntro.source}`;
    if (lastRobotMessage && (lastRobotMessage.includes(question.robot) || lastRobotMessage === robotOpinion(question, choice))) {
      return `인쇄한 근거 자료에서 이 문제와 관련된 내용을 찾아 내 생각과 비교해 줘. ${artifact.sourceName} 자료도 살펴볼 수 있어. ${artifact.source}`;
    }
    return '어떤 설명의 출처를 찾는지 잘 모르겠어. 궁금한 유물과 내용을 먼저 물어봐 줘.';
  }

  // OX에 대한 재질문은 준비된 로봇의 생각을 유지합니다. 다른 유물 설명 뒤의 ‘왜?’는 그 설명을 다시 보여줍니다.
  if (/^(왜|왜요|어째서|이유|이유가뭐야|이유가뭐예요|왜그렇게생각해|왜그렇게생각해요|왜그렇게생각하는거야|왜그렇게말했어|왜그렇게말해|왜그런거야|왜그런가요|왜맞아|왜틀렸어|내답이왜맞아|내답이왜틀렸어|어떻게생각해|어떻게생각해요|내답이맞니|내답이맞아|내답이맞나요|맞아|맞나요|맞니|정답이뭐야|정답이뭐예요)$/.test(text)) {
    if (previous && /^(왜|왜요|어째서|이유|이유가뭐야|이유가뭐예요)$/.test(text)) return previous.entry.answer;
    return robotOpinion(question, choice);
  }
  // 의도된 오류는 같은 문제에 관한 재질문에서도 바뀌지 않습니다.
  if (question.deliberatelyWrong && artifact.id === 'tripitaka' && mentionedIds.every(id => id === 'tripitaka') && /재료|무엇으로만들|뭘로만들|뭐로만들|무슨판|나무판|금속판|나무로만들|나무로만든|금속으로만들|금속으로만든|목판/.test(text) && !/할머니|할아버지|엄마|아빠|강아지|고양이/.test(text)) return question.robot;

  const ids = mentionedIds;
  if (ids.length > 1) return unknown;
  const id = ids[0] || previous?.artifactId || artifact.id;
  const target = artifacts.find(item => item.id === id);
  if (!target) return unknown;
  // 익숙한 단어가 들어간 전혀 다른 질문에 임의로 답하지 않습니다.
  if (/할머니|할아버지|엄마|아빠|강아지|고양이|날씨|음식|계산|더하기|빼기|곱하기|나누기|[+×÷=]/.test(text)) return unknown;
  const generic = text.replace(names[id], '').replace(/^(이유물|그유물|이것|이거|그것|그거|유물|이|그|저)/, '').replace(/^(은|는|이|가)/, '');
  if (/^(뭐야|뭐예요|뭔가요|무엇인가요|뭐니|뭐야알려줘|알려줘|알려주세요|설명해줘|설명해주세요)$/.test(generic)) return introductions[id] || unknown;

  // 긴 유물 이름은 주제가 아닙니다. 다만 직지 관련 복합 키워드는 남겨 둡니다.
  const topicText = id === 'type' && /직지/.test(text) ? text.replace(/직지(?:은|는|이|가|의|을|를)/g, '직지') : text.replace(names[id], '');
  const matches = (knowledge[id] || []).flatMap(entry => entry.topics
    .map(normal).filter(topic => topic && topicText.includes(topic))
    .map(topic => ({ entry, topic })));
  matches.sort((a, b) => b.topic.length - a.topic.length);
  if (!matches.length) return unknown;
  const best = matches[0];
  // 의문문과 관계없는 명사가 남는 질문은 안전하게 모른다고 답합니다.
  const withoutKnownTopics = best.entry.topics.map(normal).sort((a, b) => b.length - a.length).reduce((value, topic) => value.replace(topic, ''), topicText);
  const remainder = withoutKnownTopics
    .replace(/직지|고려|이유물|그유물|이것|그것|이거|그거|유물|이런|그런|어떻게|무엇으로|무엇을|무엇에|어디에|어디서|무엇|무슨|어떤|언제|어디|왜|뭐로|뭘로|뭐를|뭐가|뭐야|뭐예요|뭔가요|뭐니|뭐|몇년|몇세기|몇개|몇마리|얼마나|알려주세요|알려줘|설명해주세요|설명해줘|만들어졌|만들었|만들어|만드는|만든|만들|생겼|쓰여|사용|보관|인쇄|나왔|발견|장식|표현|되었|되었어|이루어졌|있는데|있어|있나요|있니|있나|있지|있을까|있을|있|됐|였|하는|하나요|했어|했니|할까|하니|인가요|인가|이야|예요|인가|라고|으로|에서|에는|에게|거야|거니|거야|거예요|건가요|건가|일까|이에요|입니까|에요|인가요|인가|까요|나요|니|야|요|해|해요|어|었어|었니|었나요|은|는|이|가|의|을|를|에|로|와|과|도|까|지|야|거|야|야/g, '');
  return remainder ? unknown : best.entry.answer;
}

