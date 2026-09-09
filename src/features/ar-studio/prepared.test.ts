import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { isArExhibit } from '../../lib/ar/exhibit';
import { preparedHeritages, preparedModel } from '../../lib/ar/preparedCatalog';
import { createPreparedModel } from '../../lib/ar/preparedModels';
import { photoToModelPositions } from '../../lib/ar/modelScene';
import { applyPreparedModel, hasStarterModel, newPreparedProject, prepareMakerDraft } from './prepared';
import { isStudioProject, newStudioProject, submissionProblems } from './project';

describe('ready-made heritage models', () => {
  it('opens all six heritages as compact, valid and round-trippable projects', async () => {
    for (const heritage of preparedHeritages) {
      const project = await newPreparedProject(heritage.id, heritage.id);
      expect(project.ar.model?.preset).toBe(heritage.key);
      expect(isStudioProject(project)).toBe(true);
      expect(project.ar.points.every(point => point.position.every(Number.isFinite))).toBe(true);
      const text = JSON.stringify(project);
      expect(text.length).toBeLessThan(4000);
      expect(JSON.parse(text)).toEqual(project);
      expect(isStudioProject(JSON.parse(text))).toBe(true);
    }
  });

  it('rejects unknown, mismatched and mixed model definitions', async () => {
    const project = await newPreparedProject(1, 3);
    const unknown = structuredClone(project);
    (unknown.ar.model as unknown as { preset: string }).preset = 'https://example.com/model.glb';
    expect(isArExhibit(unknown.ar)).toBe(false);
    expect(isStudioProject({ ...project, heritageId: 4 })).toBe(false);
    expect(isArExhibit({ ...project.ar, model: { ...project.ar.model, parts: [] } })).toBe(false);
    expect(isArExhibit({ ...project.ar, model: { ...project.ar.model, data: 'not-empty' } })).toBe(false);
    expect(isArExhibit({ ...project.ar, model: { ...project.ar.model, asset: 'cheomseongdae-nsm-2015' } })).toBe(false);
  });

  it('generates distinct finite meshes within a tablet geometry and draw-call budget', async () => {
    const signatures = new Set<string>();
    for (const heritage of preparedHeritages) {
      const model = await createPreparedModel(heritage.key, false);
      const materials = new Set<InstanceType<typeof THREE.Material>>();
      let vertices = 0, drawCalls = 0;
      try {
        const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
        expect(size.toArray().every((n: number) => Number.isFinite(n) && n > .1)).toBe(true);
        model.traverse((mesh: InstanceType<typeof THREE.Object3D>) => {
          if (!mesh.isMesh) return;
          const positions = mesh.geometry.getAttribute('position');
          expect(Array.from(positions.array as Float32Array).every(Number.isFinite)).toBe(true);
          vertices += positions.count; drawCalls++;
          materials.add(mesh.material);
        });
        expect(vertices).toBeGreaterThan(100);
        expect(vertices / 3).toBeLessThan(60_000);
        expect(drawCalls).toBeLessThanOrEqual(12);
        signatures.add(`${vertices}:${size.toArray().join(',')}`);
      } finally {
        model.traverse((mesh: InstanceType<typeof THREE.Object3D>) => mesh.geometry?.dispose());
        materials.forEach(material => material.dispose());
      }
    }
    expect(signatures.size).toBe(6);
  });

  it('projects mural points onto the rear picture wall, without fetching an image or changing the model', async () => {
    const model = preparedModel(5), before = structuredClone(model);
    const points = await photoToModelPositions(model, [[.4, .4], [.6, .6]]);
    expect(points[0][0]).toBeLessThan(0);
    expect(points[1][0]).toBeGreaterThan(0);
    expect(points[0][1]).toBeGreaterThan(points[1][1]);
    expect(points.every(point => point[2] < 0)).toBe(true);
    expect(model).toEqual(before);
  });

  it('upgrades the starter while retaining writing, audio and quiz references, and leaves custom work intact', async () => {
    const old = newStudioProject(2, 4);
    old.ar.points[0].title = '가지 장식'; old.ar.points[0].text = '내가 찾은 특징';
    old.ar.points[0].narration = { data: 'data:audio/wav;base64,UklGRg==', seconds: 2 };
    old.questions[0].prompt = '어떤 특징을 찾았나요?'; old.role = '해설'; old.reflection = '사진과 비교했어요.';
    const before = structuredClone(old);
    const upgraded = await prepareMakerDraft(old);
    expect(upgraded.ar.model?.format).toBe('preset');
    expect(upgraded.ar.points.map(({ position: _position, ...point }) => point)).toEqual(old.ar.points.map(({ position: _position, ...point }) => point));
    expect(upgraded.questions).toEqual(old.questions);
    expect([upgraded.role, upgraded.reflection, upgraded.ar.answerId]).toEqual([old.role, old.reflection, old.ar.answerId]);
    expect(old).toEqual(before);
    expect(isStudioProject(upgraded)).toBe(true);
    expect(await prepareMakerDraft(upgraded)).toBe(upgraded);
    old.ar.model!.parts![0].scale[1] = 1;
    expect(hasStarterModel(old)).toBe(false);
    expect(await prepareMakerDraft(old)).toBe(old);
    const replaced = await applyPreparedModel(old);
    expect(replaced.ar.points[0].narration).toEqual(old.ar.points[0].narration);
    expect(replaced.questions).toEqual(old.questions);
    expect(replaced.pointsChecked).toBe(false);
  });

  it('requires explanations, audio and quiz work but no student model construction', async () => {
    const project = await newPreparedProject();
    project.modelChecked = false; project.pointsChecked = true;
    project.ar.points.forEach(point => { point.title = '특징'; point.text = '자료에서 찾은 설명'; point.narration = { data: 'data:audio/wav;base64,UklGRg==', seconds: 2 }; });
    project.questions.forEach(question => { question.prompt = '재료는?'; question.options = ['돌', '나무', '철']; });
    expect(submissionProblems(project)).toEqual([]);
    delete project.ar.points[0].narration;
    expect(submissionProblems(project)).toHaveLength(1);
  });
});
