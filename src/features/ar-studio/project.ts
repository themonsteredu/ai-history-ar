import { isArExhibit, type ArExhibit, type ExhibitPoint } from '../../lib/ar/exhibit';
import { newPart, type ModelPart } from '../../lib/ar/primitives';
export interface StudioQuestion { id: string; prompt: string; options: [string, string, string]; answer: number; pointId: string }
export interface StudioProject { version: 1; group: number; heritageId: number; ar: ArExhibit; questions: StudioQuestion[]; modelChecked: boolean; pointsChecked: boolean; role: string; reflection: string }
export function newPoint(index: number): ExhibitPoint {
  return { id: crypto.randomUUID(), title: '', text: '', position: [0, .2 + index * .2, .3], photoPosition: [.5, .2 + index * .2] };
}
export function newQuestion(pointId: string): StudioQuestion { return { id: crypto.randomUUID(), prompt: '', options: ['', '', ''], answer: 0, pointId }; }
export function newStudioProject(group = 1, heritageId = 1): StudioProject {
  const points = [0, 1, 2].map(newPoint);
  return { version: 1, group, heritageId, modelChecked: false, pointsChecked: false, role: '', reflection: '', ar: { points, question: '', answerId: points[0].id, model: { format: 'primitives', data: '', parts: [newPart('box', .15)], name: '우리 모둠 학습용 모형', credit: '학생들이 직접 만든 학습용 모형', source: '', rotation: [0, 0, 0] } }, questions: [newQuestion(points[0].id), newQuestion(points[1].id)] };
}
export function changeParts(project: StudioProject, parts: ModelPart[]): StudioProject {
  return { ...project, modelChecked: false, pointsChecked: false, ar: { ...project.ar, model: { ...project.ar.model!, parts } } };
}
export function submissionProblems(project: StudioProject) {
  const problems: string[] = [];
  if (!project.modelChecked) problems.push('모형을 돌려 보고 완성 확인을 눌러 주세요.');
  if (!project.pointsChecked) problems.push('설명점의 위치를 확인해 주세요.');
  if (project.ar.points.length < 3 || project.ar.points.length > 4) problems.push('해설은 3~4개를 준비해 주세요.');
  project.ar.points.forEach((p, i) => { if (!p.title.trim() || !p.text.trim() || !p.narration) problems.push(`${i + 1}번 해설의 제목·내용·녹음을 확인해 주세요.`); });
  if (project.questions.length < 2 || project.questions.length > 3) problems.push('문제는 2~3개를 준비해 주세요.');
  project.questions.forEach((q, i) => { if (!q.prompt.trim() || q.options.some(o => !o.trim()) || new Set(q.options.map(o => o.trim())).size !== 3 || !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 2 || !project.ar.points.some(p => p.id === q.pointId)) problems.push(`${i + 1}번 문제의 보기·정답·근거 해설을 확인해 주세요.`); });
  return problems;
}
export function isStudioProject(v: unknown): v is StudioProject {
  if (!v || typeof v !== 'object') return false;
  const p = v as StudioProject;
  return p.version === 1 && Number.isInteger(p.group) && p.group >= 1 && p.group <= 6 && Number.isInteger(p.heritageId) && p.heritageId >= 1 && p.heritageId <= 6 && typeof p.modelChecked === 'boolean' && typeof p.pointsChecked === 'boolean' && typeof p.role === 'string' && p.role.length <= 300 && typeof p.reflection === 'string' && p.reflection.length <= 1000 && isArExhibit(p.ar) && p.ar.model?.format === 'primitives' && p.ar.points.length >= 3 && Array.isArray(p.questions) && p.questions.length >= 2 && p.questions.length <= 3 && new Set(p.questions.map(q => q?.id)).size === p.questions.length && p.questions.every(q => q && typeof q.id === 'string' && q.id.length > 0 && q.id.length <= 60 && typeof q.prompt === 'string' && q.prompt.length <= 300 && Array.isArray(q.options) && q.options.length === 3 && q.options.every(o => typeof o === 'string' && o.length <= 150) && Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 2 && p.ar.points.some(point => point.id === q.pointId));
}
