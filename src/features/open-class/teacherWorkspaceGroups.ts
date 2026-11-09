import type { OpenState } from './api';
import { artifactById } from './artifacts';
import { goryeoArtifact, goryeoPhoto } from '../goryeo/readyCards';
import { joseonModelFor } from '../../lib/ar/joseon/catalog';
import { cardProblems, selfItemDone, selfQuestions } from './model';
import { quizProgress } from './quizProgress';

export type TeacherEra = 'goryeo' | 'joseon';

export function teacherWorkspaceGroups(era: TeacherEra, groupCount: number, state: OpenState) {
  return Array.from({ length: groupCount }, (_, index) => {
    const group = index + 1;
    const cardItem = state.cards.find(item => item.data.group === group);
    const checkItem = state.checks.find(item => item.data.mode === 'self' && item.data.verifier === group && item.data.target === group);
    const card = cardItem?.data, check = checkItem?.data;
    const id = card?.artifactId || 0;
    const artifact = era === 'goryeo' ? goryeoArtifact(id) : artifactById(id);
    const photo = era === 'goryeo' ? goryeoPhoto(id) : joseonModelFor(id)?.photo;
    const photoPath = photo ? ('texture' in photo ? photo.texture || photo.path : photo.path) : '';
    const questions = selfQuestions(check).filter(question => {
      const item = check?.items.find(value => value.questionId === question.id);
      return item && item.decision !== 'exclude' && selfItemDone(item);
    });
    return {
      group, cardItem, checkItem, card, check, artifact, photo, photoPath, questions,
      cardLabel: !artifact ? '작성 전' : card && cardProblems(card).length === 0 ? '완성' : '제작 중',
      quiz: quizProgress(check),
      canPresentCard: !!card && !!artifact,
      canPresentQuiz: !!card && !!artifact && questions.length >= 2,
    };
  });
}

export type TeacherGroup = ReturnType<typeof teacherWorkspaceGroups>[number];
