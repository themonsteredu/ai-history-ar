import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { GroupStatus, GroupDetail } from './OpenClassTeacher';
import { isVerification, newCard, newSelfVerification, newQuestion, newVerifyItem } from './model';
import { SelfQuizLab } from './SelfInquiry';
import { useSyncedDraft } from './useSyncedDraft';
import { goryeoCard, GORYEO_TAG } from '../goryeo/readyCards';
import type { OpenItem } from './api';
import type { Verification } from './model';

describe('shared era class status', () => {
 it.each([['goryeo','팔만대장경'],['joseon','간의']] as const)('shows the correct %s artifact and the two AI drafts', (era, name) => {
  const card=era==='goryeo'?goryeoCard(1,3):newCard(1,3);
  const check=newSelfVerification(1); check.selfQuestions=[{...newQuestion(),statement:'첫 문제'},{...newQuestion(),statement:'둘째 문제'}];
  const checks=[{key:'1:1',data:check,updatedAt:'2026-01-01T00:00:00Z'}] as OpenItem<Verification>[];
  const html=renderToStaticMarkup(<GroupStatus era={era} group={1} card={card} checks={checks} cardOf={()=>card} teacherFor={()=>undefined} open={false} onToggle={()=>{}} onCardPresentation={()=>{}} onPresent={()=>{}}/>);
  expect(html).toContain(name);expect(html).toMatch(/OX 문제<\/dt><dd>2개/);
  const detail=renderToStaticMarkup(<GroupDetail era={era} group={1} card={card} checks={checks} cardOf={()=>card} teacherFor={()=>undefined}/>);
  expect(detail).toContain('첫 문제');expect(detail).toContain('둘째 문제');
  if(era==='goryeo')expect((card as typeof card & {lesson:string}).lesson).toBe(GORYEO_TAG);
 });
});

it.each(['goryeo', 'joseon'] as const)('omits the retired final explanation input from the %s quiz form', era => {
  const card = newCard(1, 1);
  const check = newSelfVerification(1);
  check.items = [{ ...newVerifyItem(check.selfQuestions![0].id, 'student'), explanation: '예전에 저장한 최종 해설' }];
  function StudentForm() {
    const draft = useSyncedDraft({ draftKey: 'test', blank: () => check, check: isVerification, save: async () => ({ version: 1 }) });
    return <SelfQuizLab draft={draft} card={card} era={era} />;
  }
  const html = renderToStaticMarkup(<StudentForm />);
  expect(html).toContain('채택하거나 수정한 이유');
  expect(html).not.toMatch(/최종 정답 해설|예전에 저장한 최종 해설/);
});
