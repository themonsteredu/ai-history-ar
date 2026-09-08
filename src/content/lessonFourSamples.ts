import type { EraId } from '../types/curriculum';
import { researchForEra } from './heritageCatalog';
import samgukAnswers from './three-kingdoms/lessonTwoAnswers.json';
import joseonAnswers from './joseon/lesson-two.json';
import { newProject, updateRecords, type EvidenceCategory, type HeritageProject, type ResearchRecord } from './three-kingdoms/project';

export const previousWorksheetAnswers = (eraId: EraId) => (eraId === 'joseon' ? joseonAnswers : samgukAnswers).groups;

const sampleCategories: Record<EraId, readonly (readonly EvidenceCategory[])[]> = {
  'three-kingdoms': [
    ['시기·발견', '재료·구조', '사용·생활'], ['시기·발견', '재료·구조', '모양·장면'],
    ['시기·발견', '재료·구조', '사용·생활'], ['시기·발견', '재료·구조', '모양·장면'],
    ['사용·생활', '사용·생활', '모양·장면'], ['재료·구조', '시기·발견', '모양·장면'],
  ],
  joseon: [
    ['시기·발견', '시기·발견', '사용·생활'], ['사용·생활', '시기·발견', '사용·생활'],
    ['시기·발견', '재료·구조', '재료·구조'], ['재료·구조', '시기·발견', '사용·생활'],
    ['사용·생활', '사용·생활', '모양·장면'], ['시기·발견', '사용·생활', '사용·생활'],
  ],
};

export function lessonFourSample(eraId: EraId, heritageId: number): HeritageProject {
  const heritage = researchForEra(eraId).find(item => item.id === heritageId);
  const answer = previousWorksheetAnswers(eraId).find(item => item.id === heritageId);
  if (!heritage || !answer) throw new Error('유산을 찾지 못했습니다.');
  const correctionIndex = answer.items.findIndex(item => item[1].startsWith('×'));
  const correction = answer.items[correctionIndex];
  const facts = heritage.sources.flatMap(source => source.facts.filter(fact => fact.kind === 'confirmed').map(fact => ({ fact, source }))).slice(0, 3);
  const records: ResearchRecord[] = facts.map(({ fact, source }, index) => ({
    id: fact.id, text: fact.text, category: sampleCategories[eraId][heritageId - 1][index],
    // A supplied example is not evidence that the learner has read the source.
    status: '추가 확인', source: source.institution, url: source.href,
  }));
  return updateRecords({ ...newProject(heritageId, heritageId, eraId), previousClaim: `${correctionIndex + 1}번 · ${correction[0]}`, correction: correction[2] }, records);
}

export function addLessonFourSample(project: HeritageProject, sample: HeritageProject): HeritageProject {
  if (project.heritageId !== sample.heritageId || (project.eraId ?? 'three-kingdoms') !== (sample.eraId ?? 'three-kingdoms')) return project;
  const normalize = (text: string) => text.normalize('NFKC').replace(/\s+/g, '');
  const additions = sample.records.filter(example => !project.records.some(record => record.id === example.id || normalize(record.text) === normalize(example.text)));
  return additions.length ? { ...updateRecords(project, [...project.records, ...additions]), savedAt: new Date().toISOString() } : project;
}
