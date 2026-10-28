import type { Artifact, Question } from './data';
import { goryeoCardPoints } from './cardPoints';

/** 수업용 규칙 기반 대화입니다. 정해진 범위 밖의 질문은 추측하지 않습니다. */
export type GoryeoChatInput = {
  artifact: Artifact;
  question: Question;
  questionIndex: number;
  choice: string;
  message: string;
};

const unknown = '그건 잘 모르겠어. 인쇄한 근거 자료나 선생님께 확인해 줘.';
const names: Record<string, RegExp> = {
  buddha: /관촉사|은진미륵|미륵보살/,
  type: /금속활자|활자/,
  tripitaka: /팔만대장경|대장경|경판/,
  vase: /매병|운학문/,
  incense: /향로|칠보/,
  lacquer: /나전|경전함/,
};

const introductions: Record<string, string> = {
  buddha: '관촉사 미륵보살은 돌로 만든 보살상이에요. 논산 관촉사에 있으며 은진미륵이라고도 불러요.',
  type: '금속활자는 금속으로 만든 글자예요. 글자들을 모아 책을 인쇄할 때 사용했어요.',
  tripitaka: '팔만대장경은 불교 경전을 새긴 나무판으로 인쇄한 대장경이에요.',
  vase: '청자 매병은 구름과 학 무늬가 있는 고려청자예요.',
  incense: '칠보무늬 향로는 향을 태우는 데 쓰는 고려청자예요.',
  lacquer: '나전 경전함은 불교 경전을 담는 함이에요. 조개껍데기를 사용해 장식했어요.',
};

function robotOpinion(question: Question, choice: string): string {
  const robotAnswer = question.deliberatelyWrong ? (question.answer === 'O' ? 'X' : 'O') : question.answer;
  const comparison = choice === 'O' || choice === 'X'
    ? `너는 ${choice}라고 골랐구나. 내 생각에는 네 답이 ${choice === robotAnswer ? '맞아' : '틀렸어'}. `
    : '';
  return comparison + question.robot;
}

/** 선택한 문항과 연관된 정해진 답만 제공하며 임의의 사실을 생성하지 않습니다. */
export function answerGoryeoChat({ artifact, question, choice, message }: GoryeoChatInput): string {
  const text = message.replace(/\s+/g, '').replace(/[?!.,~！？，。]/g, '').trim();
  if (!text) return unknown;
  if (/^(안녕|안녕하세요|반가워|반가워요|하이|헬로)$/.test(text)) return '안녕! 선택한 유물과 OX 문제에 대해 함께 생각해 보자.';
  if (/^(고마워|고마워요|감사|감사해|감사합니다|땡큐)$/.test(text)) return '천만에! 내 설명도 근거 자료와 꼭 비교해 줘.';

  // 다른 유물을 섞거나 인물, 연도, 이유 등 카드에 없는 내용을 물으면 추측하지 않습니다.
  if (Object.entries(names).some(([id, name]) => id !== artifact.id && name.test(text))) return unknown;
  if (/누가|누구|언제|몇년|몇월|몇일|연도|시대는|왕은|왕이|왕때|왕의|만든사람|계산|더하기|빼기|곱하기|나누기|[0-9０-９]|[+×÷=]/.test(text)) return unknown;

  if (/^(왜|왜요|어째서|이유|이유가뭐야|이유가뭐예요|왜그렇게생각해|왜그렇게생각해요|왜그렇게생각하는거야|왜그렇게말했어|왜그렇게말해|왜그런거야|왜그런가요|왜맞아|왜틀렸어|내답이왜맞아|내답이왜틀렸어|어떻게생각해|어떻게생각해요|내답이맞니|내답이맞아|내답이맞나요|맞아|맞나요|맞니|정답이뭐야|정답이뭐예요)$/.test(text)) {
    return robotOpinion(question, choice);
  }

  // 팔만대장경의 2번 문항에서는 같은 주장에 대한 재질문도 같은 로봇의 생각을 유지합니다.
  if (question.deliberatelyWrong && artifact.id === 'tripitaka' && /^(이건|그건|경판은|대장경판은|팔만대장경은)?(금속판|나무판|금속|나무|재료)(이야|인가요|인가|이맞아|맞아|맞나요|이니|야|예요|로만들었어|로만든거야|가뭐야|는뭐야|이뭐야|가뭐예요|는뭐예요|이뭐예요)$/.test(text)) {
    return question.robot;
  }

  const points = goryeoCardPoints[artifact.id];
  if (!points || !introductions[artifact.id]) return unknown;
  // 명확한 짧은 질문에만 자료의 해당 설명을 연결합니다.
  const inquiry = /(뭐야|뭐예요|뭔가요|무엇인가요|어때|어때요|알려줘|알려주세요|설명해줘|설명해주세요|어떻게해|어떻게하나요|어떻게만들어|어떻게만들었어|어디에있어|어디에있나요|어디있어|어디있나요|어디에써|어디에쓰여|무엇에사용해|어디에사용해)$/;
  if (!inquiry.test(text)) return unknown;
  // 문장의 낱말이 준비한 질문 범위에 속하지 않으면, 익숙한 단어가 일부 있더라도 답을 지어내지 않습니다.
  const leftovers = text.replace(/관촉사미륵보살|팔만대장경|대장경판|청자매병|금속활자|나전경전함|나전칠기|관촉사|은진미륵|미륵보살|대장경|경판|운학문|매병|향로|칠보|나전|활자|이유물|그유물|이것|그것|이거|그거|유물|어디에있나요|어디에있어|어디있나요|어디있어|어디에쓰여|어디에써|어디에사용해|무엇에사용해|어떻게만들었어|어떻게만들어|어떻게하나요|어떻게해|무엇인가요|설명해주세요|설명해줘|알려주세요|알려줘|뭐예요|뭔가요|뭐야|어때요|어때|보관장소|무엇으로|무엇에써|금속판|나무판|재료|쓰임|용도|무늬|상감|투각|자개|모양|특징|뭘로|뭐|무엇|청자|이|가|은|는|의|을|를/g, '');
  if (leftovers) return unknown;
  // 둘 이상의 설명 주제를 한 번에 묻는 문장은 의미가 불분명할 수 있어 보수적으로 처리합니다.
  const topics = [
    /쓰임|용도|어디에써|어디에쓰여|어디에사용|무엇에써|무엇에사용/,
    /재료|무엇으로|뭘로|금속판|나무판/,
    /무늬|운학문|칠보|상감|투각|자개/,
    /어디에있|어디있|보관장소/,
    /모양|특징/,
  ].filter(pattern => pattern.test(text));
  if (topics.length > 1) return unknown;
  if (topics.length === 0 && /^(이유물|유물|이것|이거|그것|그거|뭐|무엇|(?:이|그)?(?:금속활자|활자|팔만대장경|대장경|매병|향로|나전칠기|나전경전함|관촉사미륵보살))(은|는|이|가)?(뭐야|뭐예요|뭔가요|무엇인가요|알려줘|알려주세요|설명해줘|설명해주세요)$/.test(text)) return introductions[artifact.id];

  const usage: Record<string, number> = { type: 2, tripitaka: 1, vase: 0, incense: 1, lacquer: 0 };
  const material: Record<string, number> = { buddha: 0, type: 0, tripitaka: 0, incense: 2, lacquer: 1 };
  const pattern: Record<string, number> = { vase: /상감/.test(text) ? 2 : 1, incense: 0, lacquer: 1 };
  const location: Record<string, number> = { buddha: 0, tripitaka: 2 };
  const feature: Record<string, number> = { buddha: 2, type: 1, tripitaka: 1, vase: 0, incense: 0, lacquer: 1 };
  let index: number | undefined;
  if (/쓰임|용도|어디에써|어디에쓰여|어디에사용|무엇에써|무엇에사용/.test(text)) index = usage[artifact.id];
  else if (/재료|무엇으로|뭘로|금속판|나무판/.test(text)) index = material[artifact.id];
  else if (/무늬|운학문|칠보|상감|투각|자개/.test(text)) index = pattern[artifact.id];
  else if (/어디에있|어디있|보관장소/.test(text)) index = location[artifact.id];
  else if (/모양|특징/.test(text)) index = feature[artifact.id];
  return index === undefined ? unknown : points[index].text;
}
