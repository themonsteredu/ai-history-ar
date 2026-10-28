import { describe, expect, it } from 'vitest';
import { artifacts } from './data';
import { validParts } from '../../lib/ar/primitives';

describe('고려 유물 수업 샘플',()=>{
 it('교사 시범과 학생 탐구별 카드와 두 문항이 있다',()=>{
  expect(artifacts.map(a=>a.id)).toEqual(['buddha','type','tripitaka','vase','incense','lacquer']);
  for(const a of artifacts){ expect(a.questions).toHaveLength(2); expect(a.evidence.length).toBeGreaterThan(0); expect(validParts(a.parts)).toBe(true); }
 });
 it('학생 문항 10개 중 로봇 답변 하나만 의도적으로 틀린다',()=>{
  const questions=artifacts.slice(1).flatMap(a=>a.questions);
  expect(questions).toHaveLength(10);
  expect(questions.filter(q=>q.robot[0]!==q.answer)).toEqual(questions.filter(q=>q.deliberatelyWrong));
  expect(questions.filter(q=>q.deliberatelyWrong)).toHaveLength(1);
 });
});
