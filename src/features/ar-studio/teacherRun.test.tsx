import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { expect, it } from 'vitest';
import { TeacherRunPanel } from './TeacherRunPanel';
import type { ComponentProps } from 'react';
import { readGroupCount, runLessons, sharingStatus } from './teacherRun';

const noop = () => {};
const render = (props: ComponentProps<typeof TeacherRunPanel>) =>
  renderToStaticMarkup(<MemoryRouter><TeacherRunPanel {...props} /></MemoryRouter>);
const session = { code: '250910', group: 1, memberId: 'id', token: 'private-token', name: '선생님' };
const room = (groups: number[]) => ({ code: '250910', phase: 'quiz' as const, gallery: groups.map(group => ({ group, heritageId: group, title: '전시', version: 1, updatedAt: '' })) });

it('runs the shortened course as two lessons that end in sharing and the class quiz', () => {
  expect(runLessons.map(lesson => lesson.id)).toEqual([1, 2]);
  expect(runLessons.map(lesson => lesson.name)).toEqual(['AR 카드 만들기', '우리 반 관람회']);
  runLessons.forEach(lesson => {
    expect(lesson.steps.reduce((total, step) => total + step.minutes, 0)).toBeLessThanOrEqual(lesson.minutes);
    expect(lesson.steps.some(step => step.actor === 'teacher')).toBe(true);
  });
  expect(runLessons[0].steps.at(-1)?.press).toBe('모둠에 공유');
  expect(runLessons[1].steps.at(-2)?.press).toBe('내 답안과 활동 기록 제출');
});

it('reports sharing only for the groups this class actually uses', () => {
  expect(sharingStatus(6, undefined)).toEqual({ shared: [], missing: [1, 2, 3, 4, 5, 6], ready: false });
  expect(sharingStatus(6, room([1, 3]).gallery)).toEqual({ shared: [1, 3], missing: [2, 4, 5, 6], ready: false });
  expect(sharingStatus(4, room([1, 2, 3, 4]).gallery).ready).toBe(true);
  expect(sharingStatus(4, room([1, 2, 3, 4, 5]).gallery).ready).toBe(true);
});

it('falls back to six groups when nothing valid is stored', () => {
  expect(readGroupCount(undefined)).toBe(6);
  expect(readGroupCount({ getItem: () => 'many' })).toBe(6);
  expect(readGroupCount({ getItem: () => '9' })).toBe(6);
  expect(readGroupCount({ getItem: () => '4' })).toBe(4);
});

it('tells a teacher without a class code to make one first', () => {
  const html = render({ code: '', onView: noop });
  expect(html).toContain('먼저 수업코드를 정해 주세요');
  expect(html).toContain('학생 입장 QR 만들기');
  expect(html).toContain('1차시 · AR 카드 만들기');
  expect(html).toContain('2차시 · 우리 반 관람회');
  expect(html).not.toContain('공유 완료');
});

it('warns while groups are still missing and clears once every group has shared', () => {
  const waiting = render({ code: '250910', session, classroom: room([1, 2]), onView: noop });
  expect(waiting).toContain('2 / 6모둠 공유됨');
  expect(waiting).toContain('아직 3, 4, 5, 6모둠이 남았습니다');
  expect(waiting).not.toContain('우리 반 전시·퀴즈 열기');
  expect(waiting).not.toContain('private-token');

  const ready = render({ code: '250910', session, classroom: room([1, 2, 3, 4, 5, 6]), onView: noop });
  expect(ready).toContain('모든 모둠이 공유를 마쳤습니다');
  expect(ready).toContain('우리 반 전시·퀴즈 열기');
  expect(ready).not.toContain('남았습니다');
});

it('keeps the sharing board unconfirmed until the teacher joins the class', () => {
  const html = render({ code: '250910', onView: noop });
  expect(html).toContain('수업코드 저장 완료');
  expect(html).toContain('확인 전');
  expect(html).toContain('모둠에 공유');
});
