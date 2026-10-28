import { describe, expect, it } from 'vitest';
import { artifacts } from './data';
import { answerGoryeoChat } from './chatResponses';

const item = (id: string, questionIndex = 0) => {
  const artifact = artifacts.find(value => value.id === id)!;
  return { artifact, question: artifact.questions[questionIndex], questionIndex, choice: 'O' };
};
const ask = (id: string, message: string, questionIndex = 0, choice = 'O', lastRobotMessage?: string) =>
  answerGoryeoChat({ ...item(id, questionIndex), choice, message, lastRobotMessage });

describe('고려 수업 시뮬레이션 대화', () => {
  it('각 유물의 다양한 정보를 질문할 수 있다', () => {
    expect(ask('type', '금속활자 쓰임이 뭐야?')).toContain('인쇄');
    expect(ask('type', '직지는 언제 만들었어?')).toContain('1377');
    expect(ask('type', '직지는 어디서 만들었어?')).toContain('흥덕사');
    expect(ask('type', '직지가 어디에 있어?')).toContain('프랑스');
    expect(ask('type', '직지 내용이 뭐야?')).toContain('가르침');
    expect(ask('vase', '매병 무늬가 뭐야?')).toContain('구름과 학');
    expect(ask('vase', '청자 상감운학문 매병은 어디에 있어?')).toContain('국립중앙박물관');
    expect(ask('tripitaka', '어디에 있어?')).toContain('해인사');
    expect(ask('tripitaka', '언제 만들었어?')).toContain('1237');
    expect(ask('incense', '이 유물은 뭐야?')).toContain('향');
    expect(ask('incense', '받침에 토끼가 몇 마리야?')).toContain('세 마리');
    expect(ask('incense', '향로는 어디서 나왔어?')).toContain('개성');
    expect(ask('lacquer', '재료가 뭐야?')).toContain('나무');
    expect(ask('buddha', '몇 미터야?')).toContain('18m');
  });
  it('다른 유물도 이름을 밝히면 찾아 답하지만 알 수 없는 질문은 추측하지 않는다', () => {
    expect(ask('type', '향로는 뭐야?')).toContain('향');
    expect(ask('type', '팔만대장경은 어디에 있어?')).toContain('해인사');
    for (const message of ['2020년은 몇 년 전이야?', '전쟁은 어떻게 일어났어?', '우리 할머니의 무늬가 뭐야?', '강아지가 좋아하는 색은?', '활자와 향로의 차이는 뭐야?']) {
      expect(ask('type', message)).toContain('잘 모르겠어');
    }
  });
  it('OX에 대한 이유와 의도된 오류는 같은 생각을 유지한다', () => {
    expect(ask('type', '왜?', 0, 'X')).toContain('네 답이 틀렸어');
    expect(ask('tripitaka', '왜?', 1, 'X')).toContain('금속판');
    expect(ask('tripitaka', '금속판이야?', 1, 'X')).toContain('금속판');
    expect(ask('tripitaka', '나무판이야?', 1, 'X')).toContain('금속판');
    expect(ask('tripitaka', '대장경판은 무엇으로 만들었어?', 1, 'X')).toContain('금속판');
    expect(ask('tripitaka', '나무로 만든 거 아냐?', 1, 'X')).toContain('금속판');
    expect(ask('tripitaka', '재료가 뭐야?', 0)).toContain('나무판');
    expect(artifacts.filter(a => a.id !== 'buddha').flatMap(a => a.questions).filter(q => q.deliberatelyWrong)).toHaveLength(1);
  });
  it('출처 질문은 바로 앞 응답의 근거를 안내한다', () => {
    const prior = ask('type', '팔만대장경은 어디에 있어?');
    const source = ask('type', '어디에 나와있는데?', 0, 'O', prior);
    expect(source).toContain('국가유산포털');
    expect(source).toContain('https://heritage.go.kr/');
    expect(source).not.toContain('고려 금속활자');
    const ox = ask('tripitaka', '내 답이 맞니?', 1, 'X');
    const oxSource = ask('tripitaka', '어디에 나와 있는데?', 1, 'X', ox);
    expect(oxSource).toContain('비교해');
    expect(oxSource).not.toContain('금속판이라고 적혀');
    const intro = ask('type', '향로는 뭐야?');
    const introSource = ask('type', '어디에 나와있는데?', 0, 'O', intro);
    expect(introSource).toContain('국립중앙박물관');
    expect(introSource).toContain('relicId=1227');
    expect(ask('type', '어디에 나와있는데?', 0, 'O', '그건 잘 모르겠어.')).toContain('잘 모르겠어');
  });
  it('인사에는 다정하게 답하고 모르는 질문은 확인을 권한다', () => {
    expect(ask('type', '안녕')).toContain('안녕');
    expect(ask('type', '고마워')).toContain('천만에');
    expect(ask('type', '강아지가 좋아하는 색은?')).toContain('근거 자료나 선생님께');
  });
});
