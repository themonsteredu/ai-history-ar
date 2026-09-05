import { describe, expect, it } from 'vitest';
import { newProject, parseProject, projectCsv, projectReadiness, recordProblems, summarizeRecords, updateRecords, type HeritageProject, type ResearchRecord } from './project';

const records: ResearchRecord[] = [
  { id: 'a', text: '지석으로 무덤 주인을 확인했다.', category: '사용·생활', status: '확인됨', source: '박물관', url: 'https://www.museum.go.kr/' },
  { id: 'b', text: '무덤은 벽돌을 쌓아 만들었다.', category: '재료·구조', status: '확인됨', source: '박물관', url: 'https://www.museum.go.kr/' },
  { id: 'c', text: '장례의 모든 순간은 단정하기 어렵다.', category: '사용·생활', status: '판단 보류', source: '박물관', url: 'https://www.museum.go.kr/' },
];
function finished(): HeritageProject {
  let project = updateRecords({ ...newProject(5, 1), previousClaim: '무덤 주인은 모른다.', correction: '지석으로 확인했다.' }, structuredClone(records));
  project = { ...project, cleanedRevision: project.revision, graph: { image: 'data:image/png;base64,iVBORw0KGgo=', dimension: 'category', revision: project.revision, title: '우리 근거 3건' }, interpretation: '사용·생활은 2건입니다.', limitation: '우리 자료만 셉니다.', inference: { evidenceIds: ['a','b'], sentence: '기록과 건축 기술을 활용했을 가능성이 있습니다.', limit: '장례의 모든 모습은 모릅니다.' }, exhibit: { focusId: 'b', effect: '확대', action: '근거 고르기', tested: true } };
  return project;
}
describe('same project from taught lessons through the museum', () => {
  it('retains the actual group, heritage, source evidence, PNG and explanation across file transfer', () => {
    const original = finished();
    const nextDevice = parseProject(JSON.stringify(original));
    expect(nextDevice).toEqual(original);
    expect(nextDevice.group).toBe(5);
    expect(nextDevice.heritageId).toBe(1);
    expect(projectReadiness(nextDevice).exhibited).toBe(true);
    expect(summarizeRecords(nextDevice)).toEqual([{label:'시기·발견',count:0},{label:'재료·구조',count:1},{label:'모양·장면',count:0},{label:'사용·생활',count:2}]);
  });
  it('requires rechecking the chart and explanation if the evidence changes later', () => {
    const edited = updateRecords(finished(), [...records, { ...records[0], id: 'd', text: '새로 확인한 근거' }]);
    expect(projectReadiness(edited)).toMatchObject({research:true,cleaned:false,graphed:false,inferred:false,exhibited:false});
    const recleaned = { ...edited, cleanedRevision: edited.revision };
    expect(projectReadiness(recleaned).graphed).toBe(false);
  });
  it('does not mistake different statements from the same source for duplicate evidence', () => {
    expect(recordProblems(records)).toEqual([]);
    expect(recordProblems([...records, { ...records[0], id:'copy', text:' 지석으로  무덤 주인을 확인했다. ' }])).toHaveLength(1);
  });
  it('does not let a held or missing claim become a confirmed inference anchor', () => {
    const project = finished();
    expect(projectReadiness({ ...project, inference: { ...project.inference, evidenceIds: ['a','c'] } }).inferred).toBe(false);
    expect(projectReadiness({ ...project, previousClaim: '' }).exhibited).toBe(false);
  });
  it('rejects malformed portable work and active-content images', () => {
    expect(() => parseProject('{}')).toThrow();
    const project = finished();
    expect(() => parseProject(JSON.stringify({ ...project, graph:{...project.graph,image:'data:image/svg+xml,<svg onload="alert(1)"/>'} }))).toThrow();
    expect(() => parseProject(JSON.stringify({ ...project, records:[null] }))).toThrow();
    expect(() => parseProject(JSON.stringify({ ...project, heritageId:99 }))).toThrow();
  });
  it('exports evidence counts rather than ambiguous heritage years and protects spreadsheet cells', () => {
    const project = finished();project.records[0].text = '=1+1,"test"\n다음 줄';
    const csv = projectCsv(project);
    expect(csv).toContain('"근거번호","모둠","유산","살펴본항목","확인상태"');
    expect(csv).toContain('"\'=1+1,""test""\n다음 줄"');
    expect(csv).not.toContain('정확한연도');
  });
});
