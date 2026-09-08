import { describe, expect, it } from 'vitest';
import { researchForEra, statementSetsForEra, heritageImageUrl, arTargetUrl } from '../heritageCatalog';
import { newProject, parseProject, projectCsv, projectReadiness, updateRecords, type ResearchRecord } from '../three-kingdoms/project';
import { lessonTwoStorageKey } from '../../lib/careerLogKeys';
import { newArExhibit } from '../../lib/ar/exhibit';
import { cheomseongdaeModel } from '../three-kingdoms/arModels';
import { getJoseonSlides } from './slides';
import { joseonLessons } from './lessons';
import worksheets from './worksheet-guide.json';
import claims from './lesson-two.json';
import images from './images.json';

describe('Joseon classroom sequence and portable work', () => {
  it('uses the same three tasks on paper and the classroom deck for all ten lessons', () => {
    expect(joseonLessons.map(lesson => lesson.id)).toEqual([1,2,3,4,5,6,7,8,9,10]);
    for (const sheet of worksheets) {
      const lesson = joseonLessons.find(item => item.id === sheet.id)!;
      expect(lesson.title).toBe(sheet.title);
      expect(lesson.activities.reduce((sum,item) => sum + item.minutes,0)).toBe(40);
      const slides = getJoseonSlides(sheet.id);
      if (sheet.id === 4 || sheet.id === 5 || sheet.id === 6) {
        expect(slides).toHaveLength(6);
        expect(JSON.stringify(slides)).not.toMatch(/세 개|3개|지난 활동지|확인 상태|JSON|CSV/);
        expect(slides.at(-1)?.body).toContain(lesson.nextLessonPrep);
        continue;
      }
      expect(slides.filter(slide => slide.taskNumber).map(slide => slide.title)).toEqual(sheet.tasks.map((task,i) => `${i+1}. ${task.title}`));
      expect(slides.at(-1)?.body).toContain(lesson.nextLessonPrep);
    }
    const tutorial = getJoseonSlides(6).filter(slide => slide.tutorial);
    expect(tutorial).toHaveLength(0);
    expect(tutorial.every(slide => slide.tutorial?.screenshot.startsWith('https://codap.concord.org/wp-content/'))).toBe(true);
  });

  it('keeps all 36 original questions and delays answers until lesson three', () => {
    const sets = statementSetsForEra('joseon');
    expect(sets).toHaveLength(6);
    expect(sets.map(set => set.statements.map(statement => statement.text))).toEqual(claims.groups.map(group => group.items.map(item => item[0])));
    for (const group of claims.groups) for (const item of group.items) {
      expect(JSON.stringify(getJoseonSlides(2))).not.toContain(item[2]);
      expect(JSON.stringify(getJoseonSlides(3))).toContain(item[2]);
    }
  });

  it('binds each Joseon heritage to its own attributed original photo and era targets', () => {
    expect(images).toHaveLength(6);
    for (const heritage of researchForEra('joseon')) {
      const image = images.find(item => item.id === heritage.id)!;
      expect(heritage.image).toBe(image.file);
      expect(heritageImageUrl('joseon',heritage.id)).toBe(`/images/heritage/joseon/${image.file}`);
      expect(image.credit).toBeTruthy();
      const facts = heritage.sources.flatMap(source => source.facts).filter(fact => fact.kind === 'confirmed');
      expect(facts.length).toBeGreaterThanOrEqual(3);
      expect(new Set(facts.map(fact => fact.text)).size).toBe(facts.length);
    }
    expect(arTargetUrl('joseon')).toBe('/ar/joseon-targets.mind');
    expect(arTargetUrl('three-kingdoms')).toBe('/ar/three-kingdoms-targets.mind');
  });

  it('keeps earlier Three Kingdoms files and storage keys compatible while separating Joseon', () => {
    const old = newProject();
    expect(old.eraId).toBeUndefined();
    expect(parseProject(JSON.stringify(old))).toEqual(old);
    const joseon = newProject(2,6,'joseon');
    expect(() => parseProject(JSON.stringify(joseon))).toThrow('삼국시대');
    expect(() => parseProject(JSON.stringify(old),'joseon')).toThrow('조선시대');
    expect(lessonTwoStorageKey('','')).toBe('moa-history-ar:three-kingdoms:lesson-2:judgement:v1:standalone');
    expect(lessonTwoStorageKey('','','joseon')).not.toBe(lessonTwoStorageKey('',''));
  });

  it('carries evidence, its chart, narration and visitor question into the final museum on another device', () => {
    const heritage = researchForEra('joseon')[1];
    const rows: ResearchRecord[] = heritage.sources.flatMap(source => source.facts.filter(fact => fact.kind === 'confirmed').map(fact => ({id:fact.id,text:fact.text,category:'사용·생활' as const,status:'확인됨' as const,source:source.institution,url:source.href}))).slice(0,3);
    let project = updateRecords({...newProject(2,2,'joseon'),previousClaim:'임금이 매일 실록을 썼다.',correction:'사관의 기록 등을 모아 임금이 세상을 떠난 뒤 편찬했다.'},rows);
    const ar = newArExhibit(rows.slice(0,2).map(row => row.text));
    ar.points[0].narration = {data:'data:audio/webm;base64,YWJj',seconds:10};
    ar.points[1].narration = {data:'data:audio/webm;base64,ZGVm',seconds:12};
    ar.question = '실록 보관 방법을 설명하는 곳을 골라요.';
    project = {...project, cleanedRevision:project.revision,graph:{image:'data:image/png;base64,iVBORw0KGgo=',dimension:'category',revision:project.revision,title:'우리 문장 세 개'},interpretation:'사용·생활은 세 개다.',limitation:'우리 모둠이 고른 문장 수다.',inference:{evidenceIds:rows.slice(0,2).map(row=>row.id),sentence:'역사 기록을 지키려 애썼을 것 같다.',limit:'모든 사람의 마음은 모른다.'},exhibit:{focusId:rows[0].id,effect:'표시',action:'특징 찾기',tested:true},ar};
    const restored = parseProject(JSON.stringify(project),'joseon');
    expect(restored).toEqual(project);
    expect(projectReadiness(restored).exhibited).toBe(true);
    expect(projectCsv(restored)).toContain('조선왕조실록');
    expect(projectCsv(restored)).not.toContain('백제');
    const edited = updateRecords(restored,[...rows,{...rows[0],id:'extra',text:'다시 확인한 다른 문장'}]);
    expect(projectReadiness(edited)).toMatchObject({cleaned:false,graphed:false,exhibited:false});
    expect(() => parseProject(JSON.stringify({...project,ar:{...ar,model:cheomseongdaeModel()}}),'joseon')).toThrow('조선시대 유산');
  });
});
