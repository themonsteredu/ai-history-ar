import { researchForEra } from '../../content/heritageCatalog';
import { preparedModel } from '../../lib/ar/preparedCatalog';
import { cheomseongdaeModel } from '../../content/three-kingdoms/arModels';
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
  const model = project.heritageId === 3 ? cheomseongdaeModel() : preparedModel(project.heritageId, heritage.sources[0].href);
  const { photoToModelPositions } = await import('../../lib/ar/modelScene');
  const positions = await photoToModelPositions(model, project.ar.points.map(point => point.photoPosition));
  return { ...project, modelChecked: true, pointsChecked: false, ar: { ...project.ar, model, points: project.ar.points.map((point, index) => ({ ...point, position: positions[index] })) } };
}

export function newPreparedProject(group = 1, heritageId = 3) {
  const project = newStudioProject(group, heritageId);
  // Spread the starting points across separate mounds instead of stacking them on one low silhouette.
  if (heritageId === 6) project.ar.points.forEach((point, index) => { point.photoPosition = [[.32, .15], [.72, .57], [.32, .67]][index] as [number, number]; });
  return applyPreparedModel(project);
}

/** Upgrade the old supplied Cheomseongdae as requested; never replace student-built custom models. */
export const prepareMakerDraft = (project: StudioProject): Promise<StudioProject> =>
  hasStarterModel(project) || (project.heritageId === 3 && project.ar.model?.preset === 'samguk-cheomseongdae-v1')
    ? applyPreparedModel(project) : Promise.resolve(project);
