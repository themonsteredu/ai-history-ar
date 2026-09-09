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
