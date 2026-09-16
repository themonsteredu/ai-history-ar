import { researchForEra } from '../../content/heritageCatalog';
import type { PublicQuestion } from './api';

export interface WorksheetItem { number: number; group: number; prompt: string; options: string[]; evidence?: { title: string; text: string } }
export interface WorksheetSection { group: number; heritage: string; items: WorksheetItem[] }
export interface WorkPoints { group: number; heritageId: number; points: readonly { id: string; title: string; text: string }[] }

/** Paper version of the shared class quiz: every group's questions, numbered straight through. */
export function quizWorksheet(questions: readonly PublicQuestion[] = [], works: readonly WorkPoints[] = []): WorksheetSection[] {
  const heritages = researchForEra('three-kingdoms');
  const groups = [...new Set(questions.map(question => question.group))].sort((a, b) => a - b);
  let number = 0;
  return groups.map(group => {
    const work = works.find(item => item.group === group);
    return {
      group,
      heritage: heritages.find(item => item.id === work?.heritageId)?.heritage || '우리 반 유물',
      items: questions.filter(question => question.group === group).map(question => {
        // The shared question never carries its answer, so the sheet cites the recorded explanation instead.
        const point = work?.points.find(item => item.id === question.pointId);
        const evidence = point && (point.title.trim() || point.text.trim()) ? { title: point.title, text: point.text } : undefined;
        return { number: ++number, group, prompt: question.prompt, options: [...question.options], evidence };
      }),
    };
  });
}

export const worksheetTotal = (sections: readonly WorksheetSection[]) => sections.reduce((total, section) => total + section.items.length, 0);
export const worksheetHasEvidence = (sections: readonly WorksheetSection[]) => sections.some(section => section.items.some(item => item.evidence));
