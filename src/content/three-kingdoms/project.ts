import { heritageResearchCases } from './webActivities';

export const evidenceCategories = ['시기·발견', '재료·구조', '모양·장면', '사용·생활'] as const;
export const evidenceStatuses = ['확인됨', '판단 보류', '추가 확인'] as const;
export type EvidenceCategory = typeof evidenceCategories[number];
export type EvidenceStatus = typeof evidenceStatuses[number];
export interface ResearchRecord {
  id: string;
  text: string;
  category: EvidenceCategory | '';
  status: EvidenceStatus;
  source: string;
  url: string;
}
export interface HeritageProject {
  version: 1;
  group: number;
  heritageId: number;
  question: string;
  previousClaim: string;
  correction: string;
  records: ResearchRecord[];
  revision: number;
  cleanedRevision: number;
  graph: { image: string; dimension: 'category' | 'status'; revision: number; title: string };
  interpretation: string;
  limitation: string;
  inference: { evidenceIds: string[]; sentence: string; limit: string };
  exhibit: { focusId: string; effect: '표시' | '확대'; action: '특징 찾기' | '근거 고르기'; tested: boolean };
  savedAt: string;
}
export const PROJECT_STORAGE_KEY = 'moa-history-ar:research-project:v1';
export function newProject(group = 1, heritageId = 1): HeritageProject {
  return {
    version: 1, group, heritageId,
    question: heritageResearchCases.find(item => item.id === heritageId)?.question ?? '',
    previousClaim: '', correction: '', records: [], revision: 0, cleanedRevision: -1,
    graph: { image: '', dimension: 'category', revision: -1, title: '' },
    interpretation: '', limitation: '', inference: { evidenceIds: [], sentence: '', limit: '' },
    exhibit: { focusId: '', effect: '표시', action: '특징 찾기', tested: false }, savedAt: '',
  };
}
export function sourceUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password &&
      ['museum.go.kr', 'heritage.go.kr', 'khs.go.kr', 'history.go.kr', 'unesco.org'].some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`)) ? value : '';
  } catch { return ''; }
}
const normalized = (text: string) => text.normalize('NFKC').replace(/\s+/g, '').trim();
export function recordProblems(records: ResearchRecord[]) {
  const seen = new Set<string>();
  return records.flatMap((record, index) => {
    const problems: string[] = [];
    const key = normalized(record.text);
    if (!key) problems.push(`${index + 1}행: 근거 문장이 비어 있습니다.`);
    if (key && seen.has(key)) problems.push(`${index + 1}행: 같은 근거가 반복됩니다. 원본을 남긴 뒤 중복 행을 정리하세요.`);
    seen.add(key);
    if (!record.category) problems.push(`${index + 1}행: 살펴본 항목을 골라 주세요.`);
    if (!record.source.trim() || !sourceUrl(record.url)) problems.push(`${index + 1}행: 공식 출처와 원문 주소를 확인하세요.`);
    return problems;
  });
}
export function summarizeRecords(project: HeritageProject) {
  const dimension = project.graph.dimension;
  const labels = dimension === 'category' ? evidenceCategories : evidenceStatuses;
  return labels.map(label => ({ label, count: project.records.filter(record => record[dimension] === label).length }));
}
export function projectReadiness(project: HeritageProject) {
  const research = project.records.length >= 3 && !!project.previousClaim.trim() && !!project.correction.trim() && !!project.question.trim();
  const cleaned = research && recordProblems(project.records).length === 0 && project.cleanedRevision === project.revision;
  const graphed = cleaned && !!project.graph.image && !!project.graph.title.trim() && project.graph.revision === project.revision;
  const interpreted = graphed && !!project.interpretation.trim() && !!project.limitation.trim();
  const evidence = project.records.filter(record => project.inference.evidenceIds.includes(record.id) && record.status === '확인됨');
  const inferred = interpreted && new Set(evidence.map(record => normalized(record.text))).size === 2 && !!project.inference.sentence.trim() && !!project.inference.limit.trim();
  const planned = inferred && evidence.some(record => record.id === project.exhibit.focusId);
  return { research, cleaned, graphed, interpreted, inferred, planned, exhibited: planned && project.exhibit.tested };
}
export function updateRecords(project: HeritageProject, records: ResearchRecord[]): HeritageProject {
  return { ...project, records, revision: project.revision + 1, interpretation: '', limitation: '',
    inference: { evidenceIds: [], sentence: '', limit: '' }, exhibit: { ...project.exhibit, focusId: '', tested: false } };
}
export function parseProject(text: string): HeritageProject {
  if (text.length > 2_800_000) throw new Error('파일이 너무 큽니다. 수업에서 저장한 프로젝트 파일을 선택하세요.');
  const value = JSON.parse(text) as HeritageProject;
  const short = (v: unknown, max = 1500): v is string => typeof v === 'string' && v.length <= max;
  if (value?.version !== 1 || !Number.isInteger(value.group) || value.group < 1 || value.group > 6 || !Number.isInteger(value.heritageId) || value.heritageId < 1 || value.heritageId > 6 ||
    !short(value.question) || !short(value.previousClaim) || !short(value.correction) || !short(value.savedAt) ||
    !Number.isSafeInteger(value.revision) || value.revision < 0 || !Number.isSafeInteger(value.cleanedRevision) ||
    !Array.isArray(value.records) || value.records.length > 60 ||
    value.records.some(r => !r || !short(r.id, 100) || !short(r.text) || !short(r.source) || !short(r.url, 2000) || (r.category !== '' && !evidenceCategories.includes(r.category)) || !evidenceStatuses.includes(r.status)) ||
    new Set(value.records.map(r => r.id)).size !== value.records.length ||
    !value.graph || !['category', 'status'].includes(value.graph.dimension) || !short(value.graph.title) || !Number.isSafeInteger(value.graph.revision) || !short(value.graph.image, 2_400_000) ||
    (value.graph.image !== '' && !/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(value.graph.image)) ||
    !short(value.interpretation) || !short(value.limitation) || !value.inference || !Array.isArray(value.inference.evidenceIds) || value.inference.evidenceIds.length > 2 || value.inference.evidenceIds.some(id => !short(id, 100)) || !short(value.inference.sentence) || !short(value.inference.limit) ||
    !value.exhibit || !short(value.exhibit.focusId) || !['표시', '확대'].includes(value.exhibit.effect) || !['특징 찾기', '근거 고르기'].includes(value.exhibit.action) || typeof value.exhibit.tested !== 'boolean') throw new Error('올바른 삼국시대 프로젝트 파일이 아닙니다.');
  return value;
}
export function csvCell(value: string) { return `"${(/^[\s]*[=+@-]/.test(value) ? "'" : '') + value.replaceAll('"', '""')}"`; }
export function projectCsv(project: HeritageProject) {
  const heritage = heritageResearchCases.find(item => item.id === project.heritageId)!;
  const rows = [['근거번호', '모둠', '유산', '살펴본항목', '확인상태', '근거문장', '출처기관', '출처URL'],
    ...project.records.map((record, index) => [String(index + 1), String(project.group), heritage.heritage, record.category, record.status, record.text, record.source, record.url])];
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
}
export function downloadProjectFile(content: BlobPart, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
