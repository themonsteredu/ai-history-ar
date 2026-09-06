import type { EraId } from '../types/curriculum';
import { heritageResearchCases, lessonTwoStatementSets, type HeritageResearchCase } from './three-kingdoms/webActivities';
import joseonResearch from './joseon/research.json';
import joseonClaims from './joseon/lesson-two.json';
import threeKingdomsWorksheets from './three-kingdoms/worksheet-guide.json';
import joseonWorksheets from './joseon/worksheet-guide.json';
import { studentExamples } from './three-kingdoms/studentLanguage';
import joseonExamples from './joseon/examples.json';
import joseonImages from './joseon/images.json';

export const eraName = (eraId: EraId) => eraId === 'joseon' ? '조선시대' : '삼국시대';
export const researchForEra = (eraId: EraId): readonly HeritageResearchCase[] => eraId === 'joseon' ? joseonResearch as HeritageResearchCase[] : heritageResearchCases;
export const worksheetsForEra = (eraId: EraId) => eraId === 'joseon' ? joseonWorksheets : threeKingdomsWorksheets;
export const heritageImageUrl = (eraId: EraId, id: number) => `${import.meta.env.BASE_URL}images/heritage/${eraId}/${researchForEra(eraId).find(item => item.id === id)!.image}`;
export const arTargetUrl = (eraId: EraId) => `${import.meta.env.BASE_URL}ar/${eraId}-targets.mind`;
export const exampleForEra = (eraId: EraId, id: number) => (eraId === 'joseon' ? (joseonExamples as Record<number, {title: string; lines: string[]}>)[id] : undefined) ?? studentExamples[id];
export const imageCreditForEra = (eraId: EraId, id: number) => eraId === 'joseon' ? joseonImages.find(item => item.id === id) : undefined;
export const sourceChoicesForEra = (eraId: EraId) => ['1 국가유산청', '2 국립박물관', eraId === 'joseon' ? '3 국사편찬위원회' : '3 유네스코', '4 기타: '];
export const statementSetsForEra = (eraId: EraId) => eraId === 'joseon' ? joseonClaims.groups.map(group => ({ groupId: group.id, heritage: group.heritage, aiQuestion: group.question, statements: group.items.map((item,index) => ({id:`j${group.id}-${index+1}`,text:item[0]})) })) : lessonTwoStatementSets;
