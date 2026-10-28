import { describe, expect, it } from 'vitest';
import { artifacts } from './data';
import { answerGoryeoChat } from './chatResponses';

const item = (id: string, questionIndex = 0) => {
  const artifact = artifacts.find(value => value.id === id)!;
  return { artifact, question: artifact.questions[questionIndex], questionIndex, choice: 'O' };
};
const ask = (id: string, message: string, questionIndex = 0, choice = 'O') =>
  answerGoryeoChat({ ...item(id, questionIndex), choice, message });

describe('고려 수업 시뮬레이션 대화', () => {
  it('선택한 유물의 알려진 정보는 카드에 근거해 설명한다', () => {
    expect(ask('type', '금속활자 쓰임이 뭐야?')).toContain('인쇄');
    expect(ask('vase', '매병 무늬가 뭐야?')).toContain('구름과 학');
    expect(ask('tripitaka', '어디에 있어?')).toContain('해인사');
    expect(ask('incense', '이 유물은 뭐야?')).toContain('향');
    expect(ask('lacquer', '재료가 뭐야?')).toContain('조개껍데기');
    expect(ask('type', '금속활자는 어디에 쓰여?')).toContain('인쇄');
    expect(ask('tripitaka', '팔만대장경은 뭐야?')).toContain('나무판');
    expect(ask('incense', '이 향로는 무엇에 사용해?')).toContain('향');
    expect(ask('vase', '무늬가 뭐야?')).toContain('구름과 학');
  });
  it('다른 유물과 미지원 질문을 추측하지 않는다', () => {
    for (const message of ['향로는 뭐야?', '누가 만들었어?', '몇 년에 만들었어?', '몇 년도에 만들었어?', '2020년은 몇 년 전이야?', '왜 만들었어?', '왜 만들어졌어?', '전쟁은 어떻게 일어났어?', '재료와 쓰임은 뭐야?', '우리 할머니의 무늬가 뭐야?']) {
      expect(ask('type', message)).toContain('잘 모르겠어');
    }
  });
  it('고른 OX에 대한 이유를 묻는 경우 준비한 의견을 유지한다', () => {
    expect(ask('type', '왜?', 0, 'X')).toContain('네 답이 틀렸어');
    expect(ask('tripitaka', '왜?', 1, 'X')).toContain('금속판');
    expect(ask('tripitaka', '금속판이야?', 1, 'X')).toContain('금속판');
    expect(ask('tripitaka', '나무판이야?', 1, 'X')).toContain('금속판');
    expect(ask('tripitaka', '재료가 뭐야?', 0)).toContain('나무판');
  });
  it('인사에는 다정하게 답하고 모르는 질문은 확인을 권한다', () => {
    expect(ask('type', '안녕')).toContain('안녕');
    expect(ask('type', '고마워')).toContain('천만에');
    expect(ask('type', '강아지가 좋아하는 색은?')).toContain('근거 자료나 선생님께');
  });
});
