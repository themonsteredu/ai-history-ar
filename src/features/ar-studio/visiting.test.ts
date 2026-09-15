import { expect, it } from 'vitest';
import type { PublicQuestion } from './api';
import { cardSlots, groupQuizzes, quizProgress, readyCards, sharedFromThisTablet, waitingCards } from './visiting';

const gallery = [{ group: 2, heritageId: 3 }, { group: 1, heritageId: 1 }, { group: 5, heritageId: 3 }];
const question = (group: number, id: string): PublicQuestion => ({ id, group, prompt: '무엇으로 만들었나요?', options: ['돌', '나무', '흙'], pointId: 'point' });

it('names the cards a visitor can point at and the ones still waiting to be shared', () => {
  const slots = cardSlots(gallery);
  expect(slots).toHaveLength(6);
  expect(readyCards(slots).map(slot => [slot.heritageId, slot.groups])).toEqual([[1, [1]], [3, [2, 5]]]);
  expect(waitingCards(slots).map(slot => slot.heritageId)).toEqual([2, 4, 5, 6]);
  expect(waitingCards(cardSlots([])).length).toBe(6);
  expect(waitingCards(cardSlots()).length).toBe(6);
  slots.forEach(slot => expect(slot.heritage.length).toBeGreaterThan(0));
});

it('splits the class quiz into one set per group and marks the visitor own group', () => {
  const questions = [question(3, '3:a'), question(1, '1:a'), question(1, '1:b')];
  const sets = groupQuizzes(questions, { '1:a': 2 }, 1);
  expect(sets.map(set => [set.group, set.mine, set.questions.length, set.answered])).toEqual([[1, true, 2, 1], [3, false, 1, 0]]);
  expect(groupQuizzes(questions, {}, 0).every(set => !set.mine)).toBe(true);
  expect(groupQuizzes()).toEqual([]);
});

it('counts only real choices as progress so an unfinished quiz is never reported as ready', () => {
  const questions = [question(1, 'a'), question(2, 'b')];
  expect(quizProgress(questions, { a: 0 })).toEqual({ answered: 1, total: 2, done: false });
  expect(quizProgress(questions, { a: 0, b: 1 })).toEqual({ answered: 2, total: 2, done: true });
  expect(quizProgress([], {})).toEqual({ answered: 0, total: 0, done: false });
});

it('reports whether this group work reached the class server', () => {
  expect(sharedFromThisTablet(gallery, 1)).toBe(true);
  expect(sharedFromThisTablet(gallery, 4)).toBe(false);
  expect(sharedFromThisTablet(undefined, 1)).toBe(false);
  expect(sharedFromThisTablet(gallery, undefined)).toBe(false);
});
