import { researchForEra } from '../../content/heritageCatalog';
import { preparedModel } from '../../lib/ar/preparedCatalog';
import { newStudioProject, type StudioProject } from './project';

export function hasStarterModel(project: StudioProject) {
  const model = project.ar.model, part = model?.parts?.[0];
  return model?.format === 'primitives' && model.parts?.length === 1 && part?.kind === 'box' &&
    part.position.join(',') === '0,0.15,0' && part.scale.join(',') === '0.7,0.3,0.7' &&
    part.rotation.every(n => n === 0) && model.rotation.every(n => n === 0) && part.color.toLowerCase() === '#b7a38a';
}

/** Preserve the student's point IDs, writing, recordings and quizzes while replacing only the model. */
export async function applyPreparedModel(project: StudioProject): Promise<StudioProject> {
  const heritage = researchForEra('three-kingdoms').find(item => item.id === project.heritageId)!;
  const model = preparedModel(project.heritageId, heritage.sources[0].href);
  const { photoToModelPositions } = await import('../../lib/ar/modelScene');
  const positions = await photoToModelPositions(model, project.ar.points.map(point => point.photoPosition));
  return { ...project, modelChecked: true, pointsChecked: false, ar: { ...project.ar, model, points: project.ar.points.map((point, index) => ({ ...point, position: positions[index] })) } };
}

export const newPreparedProject = (group = 1, heritageId = 3) => applyPreparedModel(newStudioProject(group, heritageId));

/** Only the untouched old starter cube is automatically upgraded; custom models are retained. */
export const prepareMakerDraft = (project: StudioProject): Promise<StudioProject> =>
  hasStarterModel(project) ? applyPreparedModel(project) : Promise.resolve(project);
