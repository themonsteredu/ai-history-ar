import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Presentation } from './Presentation';
import { newCard, newSelfVerification, newVerifyItem } from './model';

describe('AI verification presentation', () => {
  it('shows the original AI answer without exposing the correction before reveal', () => {
    const card = newCard(1, 1), check = newSelfVerification(1);
    const questions = check.selfQuestions!.map((q, index) => ({ ...q, statement: `AI 문제 ${index + 1}`, answer: 'O' as const, explanation: 'AI 설명', source: 'student' as const }));
    check.items = questions.map(q => ({ ...newVerifyItem(q.id, 'student'), solved: 'X' as const, why: '신문', decision: 'revise' as const, revised: '바르게 고친 문장', revisedAnswer: 'X' as const, reason: '틀린 이유', explanation: '검증한 근거' }));
    const html = renderToStaticMarkup(<Presentation check={check} card={card} questions={questions} era="goryeo" artifactName="고려 유물" />);
    expect(html).toContain('AI 문제 1');
    expect(html).toContain('AI의 답 O');
    expect(html).toContain('AI 설명');
    expect(html).toContain('검증 결과 보기');
    expect(html).not.toContain('바르게 고친 문장');
    expect(html).not.toContain('검증한 근거');
    expect(html).not.toContain('AI-L.E.A.P.');
  });
});
