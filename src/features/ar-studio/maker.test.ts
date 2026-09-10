import { describe, expect, it } from 'vitest';
import { makerPath, photoCoordinates, readyQuestions } from './maker';
import { isStudioProject, newStudioProject } from './project';
import { photoToModelPosition } from '../../lib/ar/modelScene';

describe('integrated AR maker', () => {
  it('opens independently of lessons while keeping classroom context', () => {
    expect(makerPath('?hub_code=class1&student_id=abc&step=gallery&lesson=6&view=ppt')).toBe('/three-kingdoms/ar-maker?hub_code=class1&student_id=abc');
    expect(makerPath('', true)).toBe('/teacher/three-kingdoms/ar-maker');
    const project = newStudioProject(1, 3);
    expect(isStudioProject(project)).toBe(true);
    expect(readyQuestions(project)).toEqual([]);
    expect(project.ar.points.every(point => point.text === '')).toBe(true);
  });
  it('places touch coordinates proportionally on an uncropped photo', () => {
    expect(photoCoordinates(300, 200, { left: 100, top: 50, width: 400, height: 300 })).toEqual([.5, .5]);
    expect(photoCoordinates(-10, 900, { left: 100, top: 50, width: 400, height: 300 })).toEqual([.02, .98]);
  });
  it('maps photo pins onto the actual normalized 3D front surface', async () => {
    const project = newStudioProject(1, 3);
    const before = structuredClone(project);
    const position = await photoToModelPosition(project.ar.model!, [.5, .5]);
    expect(position[0]).toBeCloseTo(0);
    expect(position[1]).toBeGreaterThan(0);
    expect(position[2]).toBeGreaterThan(0);
    expect(project).toEqual(before);
    project.ar.points[0].position = position;
    expect(isStudioProject(project)).toBe(true);
  });
  it('keeps unfinished questions out of personal quiz preview', () => {
    const project = newStudioProject();
    project.questions[0].prompt = '재료는?'; project.questions[0].options = ['돌', '나무', '철'];
    project.questions[1].prompt = '미완성';
    expect(readyQuestions(project)).toHaveLength(1);
  });
});

it('treats a draft with no writing, recording or question as an empty share', async () => {
  const { isEmptyProject } = await import('./maker');
  const { newStudioProject } = await import('./project');
  const blank = newStudioProject(1, 1);
  expect(isEmptyProject(blank)).toBe(true);

  const written = newStudioProject(1, 1);
  written.ar.points[0] = { ...written.ar.points[0], text: '벽돌을 쌓아 올렸습니다.' };
  expect(isEmptyProject(written)).toBe(false);

  const recorded = newStudioProject(1, 1);
  recorded.ar.points[1] = { ...recorded.ar.points[1], narration: { data: 'data:audio/mp4;base64,AAAA', seconds: 9 } };
  expect(isEmptyProject(recorded)).toBe(false);

  const asked = newStudioProject(1, 1);
  asked.questions[0] = { ...asked.questions[0], prompt: '무엇일까요?', options: ['가', '나', '다'] };
  expect(isEmptyProject(asked)).toBe(false);
});
