import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TeacherGroupDashboard, TeacherQuizStatus } from './TeacherGroupDashboard';
import { newCard, newPoint, newSelfVerification, newVerifyItem } from './model';

describe('teacher group dashboard', () => {
  it('exposes unfinished prompt fields and a pasted explanation before a question is complete', () => {
    const check = newSelfVerification(1);
    check.parts = { role: '유물을 설명하는 선생님', situation: '친구들에게 소개', style: '' };
    check.selfQuestions![0].explanation = '아직 옮기는 중인 AI 해설';
    const html = renderToStaticMarkup(<TeacherQuizStatus check={check} />);
    expect(html).toContain('유물을 설명하는 선생님');
    expect(html).toContain('친구들에게 소개');
    expect(html).toContain('아직 옮기는 중인 AI 해설');
    expect(html).toContain('문장 작성 전');
    expect(html).not.toContain('검증 완료');
  });
  it.each(['goryeo', 'joseon'] as const)('offers the same five activities for %s and shows empty records', era => {
    const html = renderToStaticMarkup(<TeacherGroupDashboard group={3} era={era} onBack={() => {}} onCardPresentation={() => {}} onQuizPresentation={() => {}} />);
    for (const label of ['AR 카드 제작 현황', 'AR 카드 확인', 'AR 카드 발표', 'OX 퀴즈 작성 현황', 'OX 퀴즈 발표', '모둠 목록']) expect(html).toContain(label);
    expect(html).toContain('3모둠 활동');
    expect(html).toContain('아직 저장된 AR 카드가 없어요');
    expect(html).toContain('0 / 2문제 작성');
  });
  it('shows saved partial card work rather than marking it complete', () => {
    const card = newCard(2, 1);
    card.points = [{ ...newPoint([0, 0, 0]), title: '설명 제목', text: '' }];
    const html = renderToStaticMarkup(<TeacherGroupDashboard group={2} era="joseon" cardItem={{ key: '2', version: 1, data: card, updatedAt: '' }} onBack={() => {}} onCardPresentation={() => {}} onQuizPresentation={() => {}} />);
    expect(html).toContain('카드 만드는 중');
    expect(html).toContain('설명 제목');
    expect(html).toContain('설명 작성 전');
    expect(html).not.toContain('카드 완성');
  });
  it('shows each saved question and its own AI answer and verification', () => {
    const check = newSelfVerification(1);
    const [first, second] = check.selfQuestions!;
    first.statement = '첫 번째 문장'; first.answer = 'X'; first.explanation = 'AI 해설';
    second.statement = '두 번째 문장';
    check.items = [{ ...newVerifyItem(first.id, 'student'), why: '교과서 12쪽', solved: 'O', decision: 'revise', revised: '고친 문장', revisedAnswer: 'O', reason: '자료 확인' }];
    const html = renderToStaticMarkup(<TeacherQuizStatus check={check} />);
    for (const text of ['첫 번째 문장', '두 번째 문장', 'AI 정답', 'AI 해설', '교과서 12쪽', '고친 문장', '자료 확인', '검증 완료']) expect(html).toContain(text);
    expect(html).toContain('작성 중');
  });
});
