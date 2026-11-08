import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Presentation } from './Presentation';
import { newCard, newSelfVerification, newVerifyItem } from './model';

describe('AI verification presentation', () => {
  it('shows only the first question and hides the AI answer and correction initially', () => {
    const card = newCard(1, 1), check = newSelfVerification(1);
    const questions = check.selfQuestions!.map((q, index) => ({ ...q, statement: `AI 문제 ${index + 1}`, answer: 'O' as const, explanation: 'AI 설명', source: 'student' as const }));
    check.items = questions.map(q => ({ ...newVerifyItem(q.id, 'student'), solved: 'X' as const, why: '신문', decision: 'revise' as const, revised: '바르게 고친 문장', revisedAnswer: 'X' as const, reason: '틀린 이유', explanation: '검증한 근거' }));
    const html = renderToStaticMarkup(<Presentation check={check} card={card} questions={questions} era="goryeo" artifactName="고려 유물" />);
    expect(html).toContain('AI 문제 1');
    expect(html).not.toContain('AI 문제 2');
    expect(html).toContain('AI 정답 보기');
    expect(html).not.toContain('AI의 답 O');
    expect(html).not.toContain('AI 설명');
    expect(html).toContain('검증 결과 보기');
    expect(html).toContain('다음 문제');
    expect(html).toContain('이전 문제');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('바르게 고친 문장');
    expect(html).not.toContain('검증한 근거');
    expect(html).not.toContain('AI-L.E.A.P.');
  });
  it('starts the presentation without written explanations in either era', () => {
    for (const era of ['goryeo', 'joseon'] as const) {
      const card = newCard(1, 1), check = newSelfVerification(1);
      const questions = check.selfQuestions!.map((q, i) => ({ ...q, statement: `문제 ${i + 1}`, explanation: '', source: 'student' as const }));
      check.items = questions.map(q => ({ ...newVerifyItem(q.id, 'student'), solved: 'O' as const, why: '교과서', decision: 'adopt' as const, reason: '자료와 같아요', explanation: '' }));
      const html = renderToStaticMarkup(<Presentation check={check} card={card} questions={questions} era={era} />);
      expect(html).toContain('문제 1');
      expect(html).not.toContain('<h3>문제 2</h3>');
      expect(html).toContain('다음 문제');
      expect(html).not.toContain('발표할 문제를 2개 검증해 주세요');
      expect(html).not.toContain('아직 쓰지 않았어요');
    }
  });

});

it.each([['goryeo', '팔만대장경'], ['joseon', '측우기']] as const)('shows the full saved teacher review for %s without changing quiz display', (era, name) => {
  const card = newCard(1, 1), check = newSelfVerification(1);
  card.points = [{ id: 'p1', position: [0, 0, 0], title: '카드의 특징', text: '번호를 눌러 읽는 설명' }];
  check.selfQuestions = check.selfQuestions!.map((q, i) => ({ ...q, statement: `저장된 문장 ${i + 1}`, answer: 'O', explanation: 'AI가 쓴 해설' }));
  check.items = [
    { ...newVerifyItem(check.selfQuestions[0].id, 'student'), solved: 'O', why: '신문 1쪽', decision: 'adopt', reason: '자료와 같아요', explanation: '확인한 근거' },
    { ...newVerifyItem(check.selfQuestions[1].id, 'student'), solved: 'X', why: '신문 2쪽', decision: 'exclude', reason: '다른 자료와 다릅니다', explanation: '찾은 차이' },
  ];
  check.notes = { feature: '유물의 특징', use: '유물의 쓰임', benefit: '생활에 준 도움', source: '자료 출처', listening: Array(6).fill(''), learned: '새로 알게 된 점', caution: 'AI도 확인해야 한다' };
  const questions = check.selfQuestions.map(q => ({ ...q, source: 'student' as const }));
  const review = renderToStaticMarkup(<Presentation big teacherReview check={check} card={card} questions={questions} era={era} artifactName={name} />);
  for (const text of [name, '유물의 특징', '유물의 쓰임', '생활에 준 도움', '자료 출처', '카드의 특징', '번호를 눌러 읽는 설명', '저장된 문장 1', '저장된 문장 2', 'AI가 쓴 해설', '신문 1쪽', '다른 자료와 다릅니다', '새로 알게 된 점', 'AI도 확인해야 한다']) expect(review).toContain(text);
  expect(review).toContain('퀴즈 발표 보기');
  expect(review).not.toContain('AI 정답 보기');
  const student = renderToStaticMarkup(<Presentation big check={check} card={card} questions={questions} era={era} artifactName={name} />);
  expect(student).toContain('발표할 문제를 2개 검증해 주세요');
  expect(student).toContain('현재 1개');
  expect(student).not.toContain('검증 과정 보기');
});

it('does not invent a Joseon artifact name when a Goryeo review has no named card', () => {
  const check = newSelfVerification(1);
  const html = renderToStaticMarkup(<Presentation big teacherReview check={check} questions={[]} era="goryeo" />);
  expect(html).toContain('유물 미선택');
  expect(html).not.toContain('측우기');
});

it('looks up the correct Goryeo artifact when a teacher review has no supplied name', () => {
  const card = newCard(1, 3), check = newSelfVerification(1);
  const html = renderToStaticMarkup(<Presentation big teacherReview check={check} card={card} questions={[]} era="goryeo" />);
  expect(html).toContain('팔만대장경');
});
