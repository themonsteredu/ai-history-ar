import type { StudioProject } from './project';

export function makerPath(search = '', teacher = false) {
  const params = new URLSearchParams(search);
  for (const key of ['step', 'lesson', 'view']) params.delete(key);
  return `${teacher ? '/teacher' : ''}/three-kingdoms/ar-maker${params.size ? `?${params}` : ''}`;
}

export function photoCoordinates(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }): [number, number] {
  const clamp = (value: number) => Math.round(Math.max(.02, Math.min(.98, value)) * 1000) / 1000;
  return [clamp((clientX - rect.left) / Math.max(1, rect.width)), clamp((clientY - rect.top) / Math.max(1, rect.height))];
}

export function readyQuestions(project: StudioProject) {
  return project.questions.filter(q => q.prompt.trim() && q.options.every(option => option.trim()));
}

// A group's slot is claimed by whichever tablet shares first, so an accidental
// share from a blank tablet would lock out the one holding the real work.
export function isEmptyProject(project: StudioProject) {
  const points = project.ar?.points || [];
  return !points.some(point => point.title?.trim() || point.text?.trim() || point.narration) && readyQuestions(project).length === 0;
}
