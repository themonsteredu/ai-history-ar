import { expect, it } from 'vitest';
import { mergeDraftData } from './draftMerge';
import { newSelfVerification, newVerifyItem } from './model';

it('combines edits to different questions, notes and listening slots', () => {
  const base = newSelfVerification(1);
  const local = structuredClone(base), remote = structuredClone(base);
  local.selfQuestions![0].statement = 'first';
  remote.selfQuestions![1].statement = 'second';
  local.notes!.feature = 'feature';
  remote.notes!.use = 'use';
  local.notes!.listening[0] = 'one';
  remote.notes!.listening[1] = 'two';
  const result = mergeDraftData(base, local, remote);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.data.selfQuestions!.map(q => q.statement)).toEqual(['first', 'second']);
  expect(result.data.notes).toMatchObject({ feature: 'feature', use: 'use', listening: ['one','two','','','',''] });
});

it('does not resurrect a deleted point or silently replace an edited point', () => {
  const point = { id: 'one', text: 'old' };
  const base = { points: [point, { id: 'two', text: 'old' }] };
  expect(mergeDraftData(base, { points: [base.points[1]] }, { points: [{ ...point, text: 'new' }, base.points[1]] })).toEqual({ ok: false });
  expect(mergeDraftData(base, { points: [point] }, { points: [{ ...point, text: 'new' }, base.points[1]] })).toEqual({ ok: true, data: { points: [{ ...point, text: 'new' }] } });
});

it('does not merge a verification of the old question into a newly edited question', () => {
  const base = newSelfVerification(1);
  base.selfQuestions![0].statement = 'old question';
  const local = structuredClone(base), remote = structuredClone(base);
  local.selfQuestions![0].statement = 'new question';
  remote.items = [{ ...newVerifyItem(base.selfQuestions![0].id, 'student'), solved: 'O', why: 'page 1' }];
  expect(mergeDraftData(base, local, remote)).toEqual({ ok: false });
});
