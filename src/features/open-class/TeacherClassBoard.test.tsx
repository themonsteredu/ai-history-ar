import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { TeacherClassBoard } from './TeacherClassBoard';
import { newCard, newSelfVerification, newVerifyItem } from './model';
import type { OpenState } from './api';

describe('교사 전체 모둠 내용 보기', () => {
  it.each(['goryeo', 'joseon'] as const)('%s 수업의 실제 카드와 검증 내용을 함께 표시한다', era => {
    const card = newCard(1, 1);
    card.points = [{ id: 'point1', position: [0, 0, 0], title: '쓰임', text: '학생이 조사한 카드 설명' }];
    const check = newSelfVerification(1);
    const question = check.selfQuestions![0];
    question.statement = '학생들이 확인한 문제'; question.answer = 'O'; question.explanation = 'AI가 제안한 해설';
    check.items = [{ ...newVerifyItem(question.id, 'student'), solved: 'X', why: '읽기 자료 2쪽', decision: 'revise', reason: '자료에 다른 내용이 있어요', revised: '학생이 고친 문장', revisedAnswer: 'X' }];
    check.notes!.learned = '학생이 정리한 배움';
    const state: OpenState = { cards: [{ key: '1', version: 1, data: card, updatedAt: '' }], checks: [{ key: '1:1', version: 1, data: check, updatedAt: '' }], teacher: [] };
    const html = renderToStaticMarkup(<TeacherClassBoard code="12345" groupCount={2} state={state} updatedAt={1} error="" era={era} onClose={vi.fn()} onPresentCard={vi.fn()} onPresentQuiz={vi.fn()} />);
    for (const text of ['수업코드 12345', '전체 모둠 보기', '1모둠', '2모둠', '학생이 조사한 카드 설명', '학생들이 확인한 문제', 'AI가 제안한 해설', '읽기 자료 2쪽', '자료에 다른 내용이 있어요', '학생이 고친 문장', '학생이 정리한 배움', 'AR 카드 발표 화면', 'OX 발표 화면']) expect(html).toContain(text);
    expect(html).toContain('기록 전');
  });
  it('기록을 못 불러온 상태를 미작성이라고 표시하지 않는다', () => {
    const html = renderToStaticMarkup(<TeacherClassBoard code="12345" groupCount={2} state={{ cards: [], checks: [], teacher: [] }} error="연결이 끊겼어요" era="goryeo" onClose={vi.fn()} onPresentCard={vi.fn()} onPresentQuiz={vi.fn()} />);
    expect(html).toContain('연결이 끊겼어요');
    expect(html).toContain('수업 기록을 불러오지 못했어요');
    expect(html).not.toContain('기록 전');
  });
});
