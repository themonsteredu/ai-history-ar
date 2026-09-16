import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { QuizWorksheet } from './QuizWorksheet';
import type { Classroom, StudioSession } from './api';

const session: StudioSession = { code: '250915', group: 1, memberId: 'id', token: 'private-token', name: '선생님' };
const room = (questions: number): Classroom => ({
  code: '250915', phase: 'quiz', gallery: [{ group: 1, heritageId: 3, title: '첨성대', version: 1, updatedAt: '' }],
  questions: Array.from({ length: questions }, (_, index) => ({ id: `1:${index}`, group: 1, pointId: 'p1', prompt: `문제 ${index}`, options: ['돌', '나무', '흙'] })),
});

it('offers the sheet only once a class has shared questions, and never leaks the token', () => {
  const waiting = renderToStaticMarkup(<QuizWorksheet classroom={room(0)} session={session} />);
  expect(waiting).toContain('퀴즈 활동지 만들기');
  expect(waiting).toContain('모둠이 문제를 공유하면');
  expect(waiting).not.toContain('private-token');
  expect(renderToStaticMarkup(<QuizWorksheet classroom={room(2)} session={undefined} />)).toContain('수업코드로 입장하면');
  expect(renderToStaticMarkup(<QuizWorksheet classroom={room(2)} session={session} />)).toContain('2문제 · 1모둠');
});
