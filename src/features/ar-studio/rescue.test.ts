import { expect, it } from 'vitest';
import { newStudioProject } from './project';
import { collectDrafts, draftClassCode, rescueFileName, summarizeDraft } from './rescue';

function worked(group: number, heritageId: number, recordings: number) {
  const project = newStudioProject(group, heritageId);
  project.ar.points = project.ar.points.map((point, index) => ({
    ...point, title: `설명 ${index + 1}`, text: '자료에서 확인한 내용',
    ...(index < recordings ? { narration: { data: 'data:audio/mp4;base64,AAAA', seconds: 12 } } : {}),
  }));
  project.questions[0] = { ...project.questions[0], prompt: '무엇일까요?', options: ['가', '나', '다'] };
  return project;
}
const draft = (key: string, project: unknown, revision = 3) => ({ key, text: JSON.stringify({ project, revision }) });

it('reads the class code out of a draft key and treats practice work as codeless', () => {
  expect(draftClassCode('history-ar-maker:v1:250910:member-7')).toBe('250910');
  expect(draftClassCode('history-ar-maker:v1:practice:local')).toBe('');
  expect(draftClassCode('broken-key')).toBe('');
});

it('counts the recordings, writing and questions a group actually left on the tablet', () => {
  const summary = summarizeDraft(draft('history-ar-maker:v1:250910:m1', worked(3, 3, 2)));
  expect(summary?.group).toBe(3);
  expect(summary?.heritage).toBe('첨성대');
  expect(summary?.recordings).toBe(2);
  expect(summary?.seconds).toBe(24);
  expect(summary?.questions).toBe(1);
  expect(summary?.letters).toBeGreaterThan(0);
  expect(summary?.hasWork).toBe(true);
  expect(summary?.classCode).toBe('250910');
});

it('reads a draft saved as a bare project as well as one wrapped with its revision', () => {
  const project = worked(2, 1, 1);
  const wrapped = summarizeDraft(draft('history-ar-maker:v1:250910:m2', project));
  const bare = summarizeDraft({ key: 'history-ar-maker:v1:250910:m2', text: JSON.stringify(project) });
  expect(bare?.recordings).toBe(wrapped?.recordings);
  expect(bare?.letters).toBe(wrapped?.letters);
});

it('marks an untouched draft as empty without discarding it', () => {
  const summary = summarizeDraft(draft('history-ar-maker:v1:practice:local', newStudioProject(1, 1)));
  expect(summary).toBeDefined();
  expect(summary?.hasWork).toBe(false);
  expect(summary?.recordings).toBe(0);
});

it('keeps every readable draft and puts the richest work first', () => {
  const drafts = [
    draft('history-ar-maker:v1:practice:local', newStudioProject(1, 1)),
    draft('history-ar-maker:v1:250910:m1', worked(5, 2, 1)),
    { key: 'history-ar-maker:v1:250910:broken', text: '{ not json' },
    draft('history-ar-maker:v1:250910:m2', worked(2, 4, 3)),
  ];
  const collected = collectDrafts(drafts);
  expect(collected).toHaveLength(3);
  expect(collected.map(item => item.group)).toEqual([2, 5, 1]);
  expect(collected.filter(item => item.hasWork)).toHaveLength(2);
});

it('names each recovered file after the group and heritage', () => {
  const summary = summarizeDraft(draft('history-ar-maker:v1:250910:m1', worked(4, 6, 1)))!;
  expect(rescueFileName(summary, 0)).toBe('AR복구_4모둠_가야 고분군.json');
  expect(rescueFileName({ ...summary, group: 0 }, 2)).toBe('AR복구_작업3_가야 고분군.json');
});
