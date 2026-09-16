import { expect, it } from 'vitest';
import type { PublicQuestion } from './api';
import { quizWorksheet, worksheetHasEvidence, worksheetTotal } from './worksheet';

const question = (group: number, id: string, pointId = 'p1'): PublicQuestion => ({ id, group, pointId, prompt: `${group}모둠 문제 ${id}`, options: ['돌', '나무', '흙'] });
const work = (group: number, heritageId: number) => ({ group, heritageId, points: [{ id: 'p1', title: '가운데 창', text: '돌을 층층이 쌓았다.' }, { id: 'p2', title: '', text: '' }] });

it('numbers every group question straight through and names each group heritage', () => {
  const sections = quizWorksheet([question(3, 'c'), question(1, 'a'), question(1, 'b')], [work(1, 3), work(3, 1)]);
  expect(sections.map(section => [section.group, section.heritage])).toEqual([[1, '첨성대'], [3, '무령왕릉']]);
  expect(sections.flatMap(section => section.items.map(item => item.number))).toEqual([1, 2, 3]);
  expect(worksheetTotal(sections)).toBe(3);
  expect(sections[0].items[0].options).toEqual(['돌', '나무', '흙']);
});

it('cites the recorded explanation a question is answered from, and omits an empty one', () => {
  const sections = quizWorksheet([question(1, 'a'), question(1, 'b', 'p2')], [work(1, 3)]);
  expect(sections[0].items[0].evidence).toEqual({ title: '가운데 창', text: '돌을 층층이 쌓았다.' });
  expect(sections[0].items[1].evidence).toBeUndefined();
  expect(worksheetHasEvidence(sections)).toBe(true);
});

it('still prints the questions when a group work could not be read', () => {
  const sections = quizWorksheet([question(2, 'a')], []);
  expect(sections).toHaveLength(1);
  expect(sections[0].heritage).toBe('우리 반 유물');
  expect(sections[0].items[0].evidence).toBeUndefined();
  expect(worksheetHasEvidence(sections)).toBe(false);
  expect(quizWorksheet()).toEqual([]);
  expect(worksheetTotal([])).toBe(0);
});
