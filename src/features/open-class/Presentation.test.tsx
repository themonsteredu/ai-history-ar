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
