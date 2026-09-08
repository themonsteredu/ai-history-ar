import { describe, expect, it } from 'vitest';
import { researchForEra, statementSetsForEra } from './heritageCatalog';
import { addLessonFourSample, lessonFourSample, previousWorksheetAnswers } from './lessonFourSamples';
import { newProject, parseProject, projectCsv, projectReadiness, recordProblems } from './three-kingdoms/project';

describe('4차시 모둠별 샘플과 지난 활동지 답안', () => {
  for (const era of ['three-kingdoms', 'joseon'] as const) {
    it(`${era}: 6개 모둠의 표와 36개 답안이 해당 유산·활동지에 맞는다`, () => {
      const answers = previousWorksheetAnswers(era);
      expect(answers).toHaveLength(6);
      for (const heritage of researchForEra(era)) {
        const sample = lessonFourSample(era, heritage.id);
        const answer = answers.find(item => item.id === heritage.id)!;
        const statements = statementSetsForEra(era).find(item => item.groupId === heritage.id)!;
        expect(answer.items.map(item => item[0])).toEqual(statements.statements.map(item => item.text));
        expect(answer.items).toHaveLength(6);
        expect(sample.records).toHaveLength(3);
        expect(recordProblems(sample.records)).toEqual([]);
        for (const record of sample.records) {
          expect(heritage.sources.some(source => source.href === record.url && source.facts.some(fact => fact.id === record.id && fact.text === record.text))).toBe(true);
          expect(record.status).toBe('추가 확인');
        }
        expect(parseProject(JSON.stringify(sample), era)).toEqual(sample);
        expect(projectReadiness(sample)).toMatchObject({ research: true, cleaned: false, inferred: false });
        expect(projectCsv(sample)).toContain(heritage.heritage);
      }
    });
  }
  it('샘플을 반복 추가해도 학생 입력과 모둠 번호를 유지하고 중복을 만들지 않는다', () => {
    const sample = lessonFourSample('three-kingdoms', 1);
    const original = { ...newProject(6, 1), previousClaim: '내가 쓴 말', correction: '내가 고친 말', records: [{ ...sample.records[0], text: '내가 직접 고친 문장' }] };
    const added = addLessonFourSample(original, sample);
    expect(added.records).toHaveLength(3);
    expect(added.records[0]).toEqual(original.records[0]);
    expect(added.group).toBe(6);
    expect(added.previousClaim).toBe(original.previousClaim);
    expect(added.correction).toBe(original.correction);
    expect(addLessonFourSample(added, sample)).toBe(added);
    expect(original.records).toHaveLength(1);
  });
  it('다른 유산이나 시대의 샘플을 섞지 않는다', () => {
    const original = newProject();
    expect(addLessonFourSample(original, lessonFourSample('three-kingdoms', 2))).toBe(original);
    expect(addLessonFourSample(original, lessonFourSample('joseon', 1))).toBe(original);
  });
});
