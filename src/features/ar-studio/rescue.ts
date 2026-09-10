import { researchForEra } from '../../content/heritageCatalog';
import type { StoredDraft } from '../../lib/projectDraftStore';
import type { StudioProject } from './project';

export interface DraftSummary {
  key: string; classCode: string; group: number; heritageId: number; heritage: string;
  points: number; recordings: number; letters: number; questions: number; seconds: number;
  hasWork: boolean; project: StudioProject;
}

function heritageName(id: number) {
  return researchForEra('three-kingdoms').find(item => item.id === id)?.heritage || `유물 ${id}`;
}

export function draftClassCode(key: string) {
  // history-ar-maker:v1:<class code or practice>:<member id or local>
  const parts = key.split(':');
  const code = parts.length >= 4 ? parts[2] : '';
  return code && code !== 'practice' ? code : '';
}

export function summarizeDraft({ key, text }: StoredDraft): DraftSummary | undefined {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return undefined; }
  const container = parsed as { project?: unknown };
  const project = (container && typeof container === 'object' && container.project ? container.project : parsed) as StudioProject;
  const points = project?.ar?.points;
  if (!project || typeof project !== 'object' || !Array.isArray(points)) return undefined;
  const recordings = points.filter(point => point?.narration?.data).length;
  const letters = points.reduce((total, point) => total + (point?.title?.trim().length || 0) + (point?.text?.trim().length || 0), 0);
  const seconds = points.reduce((total, point) => total + (point?.narration?.seconds || 0), 0);
  const questions = Array.isArray(project.questions)
    ? project.questions.filter(question => question?.prompt?.trim() && question.options?.every(option => option?.trim())).length : 0;
  return {
    key, classCode: draftClassCode(key), group: Number(project.group) || 0,
    heritageId: Number(project.heritageId) || 0, heritage: heritageName(Number(project.heritageId)),
    points: points.length, recordings, letters, questions, seconds: Math.round(seconds),
    hasWork: recordings > 0 || letters > 0 || questions > 0, project,
  };
}

// Richest work first so a teacher recovering tablets sees real student work above blank drafts.
export function rescueOrder(a: DraftSummary, b: DraftSummary) {
  return b.recordings - a.recordings || b.letters - a.letters || b.questions - a.questions || a.group - b.group;
}

export function collectDrafts(drafts: StoredDraft[]): DraftSummary[] {
  return drafts.map(summarizeDraft).filter((value): value is DraftSummary => !!value).sort(rescueOrder);
}

export function rescueFileName(summary: DraftSummary, index: number) {
  const label = summary.group ? `${summary.group}모둠` : `작업${index + 1}`;
  return `AR복구_${label}_${summary.heritage}.json`;
}
