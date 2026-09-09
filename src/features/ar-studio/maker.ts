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
