import { researchForEra } from '../../content/heritageCatalog';
import type { PublicQuestion } from './api';

export interface CardSlot { heritageId: number; heritage: string; groups: number[] }

/** Every printed card, with the groups that already shared a work for it. */
export function cardSlots(gallery: readonly { group: number; heritageId: number }[] = []): CardSlot[] {
  return researchForEra('three-kingdoms').map(item => ({
    heritageId: item.id,
    heritage: item.heritage,
    groups: gallery.filter(work => work.heritageId === item.id).map(work => work.group).sort((a, b) => a - b),
  }));
}

/** Cards that show nothing in the camera, so a visitor is told instead of left waiting. */
export const waitingCards = (slots: CardSlot[]) => slots.filter(slot => !slot.groups.length);
export const readyCards = (slots: CardSlot[]) => slots.filter(slot => slot.groups.length);

export interface GroupQuiz { group: number; mine: boolean; questions: PublicQuestion[]; answered: number }

/** One visit at a time: a student answers the questions of the group whose card they just heard. */
export function groupQuizzes(questions: readonly PublicQuestion[] = [], answers: Record<string, number> = {}, myGroup = 0): GroupQuiz[] {
  const groups = [...new Set(questions.map(question => question.group))].sort((a, b) => a - b);
  return groups.map(group => {
    const own = questions.filter(question => question.group === group);
    return { group, mine: group === myGroup, questions: own, answered: own.filter(question => Number.isInteger(answers[question.id])).length };
  });
}

export function quizProgress(questions: readonly PublicQuestion[] = [], answers: Record<string, number> = {}) {
  const answered = questions.filter(question => Number.isInteger(answers[question.id])).length;
  return { answered, total: questions.length, done: questions.length > 0 && answered === questions.length };
}

/** A tablet holding work that never reached the class is the one failure a visitor cannot fix. */
export function sharedFromThisTablet(gallery: readonly { group: number }[] | undefined, group: number | undefined) {
  return !!group && !!gallery?.some(work => work.group === group);
}
