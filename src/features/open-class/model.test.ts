import { describe, expect, it } from 'vitest';
import heritageReadings from './heritage-reading.json';
import { buildCreationPrompt, inquirySlots, newSelfVerification, selfItemDone, selfQuestions, buildPrompt, cardProblems, emptyParts, isGroupCard, isTeacherSet, isVerification, itemDone, missingParts, newCard, newPoint, newQuestion, newVerification, newVerifyItem, questionsToCheck, syncItems, verifyProgress, type GroupCard } from './model';

function readyCard(): GroupCard {
  const card = newCard(2, 1);
  card.points = [{ ...newPoint([0, .7, .1]), title: '빗물 받는 그릇', text: '쇠로 만든 둥근 통이에요.' }, { ...newPoint([0, .2, .3]), title: '돌 받침', text: '그릇을 올려 두는 받침이에요.' }];
  card.questions = card.questions.map((q, i) => ({ ...q, statement: i ? '측우기 받침은 나무로 만들었다.' : '측우기는 비의 양을 잰다.', answer: i ? 'X' : 'O', explanation: '카드 설명에 있어요.', pointId: card.points[i].id }));
  return card;
}

describe('open lesson card', () => {
  it('starts with two empty OX questions and lists what is left', () => {
    const card = newCard(1);
    expect(card.questions).toHaveLength(2);
    expect(isGroupCard(card)).toBe(true);
    expect(cardProblems(card)).toContain('우리 모둠 유물을 골라 주세요.');
  });
  it('is complete with two written points and two OX questions with reasons', () => {
    expect(cardProblems(readyCard())).toEqual([]);
  });
  it('rejects cards the server should not keep', () => {
    expect(isGroupCard({ ...readyCard(), group: 7 })).toBe(false);
    expect(isGroupCard({ ...readyCard(), artifactId: 9 })).toBe(false);
    expect(isGroupCard({ ...readyCard(), points: Array.from({ length: 7 }, () => newPoint([0, .1, .1])) })).toBe(false);
    expect(isGroupCard({ ...readyCard(), questions: [{ ...newQuestion(), answer: '△' }] })).toBe(false);
    expect(isGroupCard({ ...readyCard(), questions: Array.from({ length: 6 }, newQuestion) })).toBe(false);
    expect(isGroupCard({ ...readyCard(), points: [{ ...newPoint([0, 4, 0]) }] })).toBe(false);
    expect(isGroupCard({ ...readyCard(), points: [{ id: 'old', x: .5, y: .5, title: '', text: '' }] })).toBe(false);
  });
});

describe('checking another group card', () => {
  it('adds the teacher questions for the same artifact, marked as the teacher\'s', () => {
    const card = readyCard();
    const teacher = { version: 1 as const, artifactId: 1, questions: [{ ...newQuestion(), statement: '측우기는 세종 때 만들었다.' }, newQuestion()] };
    const list = questionsToCheck(card, teacher);
    expect(list.map(q => q.source)).toEqual(['student', 'student', 'teacher']);
    expect(questionsToCheck(card, { ...teacher, artifactId: 2 })).toHaveLength(2);
    expect(isTeacherSet(teacher)).toBe(true);
  });
  it('keeps written rows when questions change and counts decisions', () => {
    const card = readyCard();
    const questions = questionsToCheck(card, undefined);
    let check = syncItems(newVerification(1, 2), questions);
    check.items[0] = { ...check.items[0], solved: 'O', decision: 'adopt', reason: '카드와 AI가 같아요.', explanation: '정답은 O예요.' };
    check = syncItems(check, [...questions, { ...newQuestion(), statement: '새 문제', source: 'student' }]);
    expect(check.items).toHaveLength(3);
    expect(check.items[0].decision).toBe('adopt');
    expect(itemDone(check.items[0])).toBe(true);
    expect(itemDone({ ...check.items[0], decision: 'revise' })).toBe(false);
    expect(verifyProgress(check, 3)).toMatchObject({ total: 3, solved: 1, done: 1, adopt: 1, revise: 0, exclude: 0 });
    expect(isVerification(check)).toBe(true);
    expect(isVerification({ ...check, target: 1 })).toBe(false);
  });
  it('joins only what students wrote into the question for Gemini', () => {
    const parts = { ...emptyParts(), role: '박물관 선생님', style: '쉽게 세 문장으로' };
    expect(missingParts(parts)).toEqual(['우리 상황 알려 주기']);
    const prompt = buildPrompt(parts, { artifact: '측우기', statement: '측우기는 비의 양을 잰다.', solved: 'O', why: '1번 설명을 봤어.', curious: '', card: readyCard().points });
    expect(prompt).toContain('[역할] 너는 지금부터 박물관 선생님이야.');
    expect(prompt).toContain('- 빗물 받는 그릇: 쇠로 만든 둥근 통이에요.');
    expect(prompt).toContain('"측우기는 비의 양을 잰다."');
    expect(prompt).toContain('우리는 O라고 생각해. 왜냐하면 1번 설명을 봤어.');
    expect(prompt).not.toContain('[상황]');
    expect(prompt).not.toContain('[더 궁금한 점]');
    expect(newVerifyItem('q', 'teacher').source).toBe('teacher');
    expect(buildPrompt({ ...parts, role: '세종 때 과학자' }, { artifact: '측우기', statement: '문장', solved: '', why: '', curious: '', card: [] })).toContain('너는 지금부터 세종 때 과학자야.');
  });
});


describe('own-group AI inquiry', () => {
 it('accepts three AI drafts and existing two-draft records without allowing unmarked self checks', () => {
   const check = newSelfVerification(2);
   expect(isVerification(check)).toBe(true);
   expect(check.selfQuestions).toHaveLength(2);
   const old = {...check, selfQuestions: [...check.selfQuestions!, newQuestion()]};
   expect(isVerification(old)).toBe(true);
   const slots = inquirySlots(old);
   expect(slots).toHaveLength(2);
   expect(slots).toEqual(old.selfQuestions.slice(0,2));
   expect(isVerification({...old, selfQuestions: slots})).toBe(true);
   expect(isVerification({...check, target:3})).toBe(false);
   expect(isVerification({...check, mode:undefined})).toBe(false);
   expect(isVerification({...check,selfQuestions:[newQuestion()]})).toBe(false);
   expect(isVerification({...check, notes:{...check.notes,listening:['only one']}})).toBe(false);
   expect(cardProblems({...readyCard(),questions:[]})).toEqual([]);
 });
 it('adds the matching newspaper only to the copied request for each era', () => {
   for (const era of ['goryeo', 'joseon'] as const) {
     for (let artifactId = 1; artifactId <= 6; artifactId++) {
       const card = {...readyCard(), artifactId};
       const parts = { role: '역사 선생님', situation: '모둠 발표를 준비해', style: '짧고 쉽게' };
       const full = buildCreationPrompt(parts, card, true, undefined, era);
       const preview = buildCreationPrompt(parts, card, false, undefined, era);
       const reading = heritageReadings[era].find(item => item.id === artifactId)!;
       const other = heritageReadings[era].find(item => item.id !== artifactId)!;
       expect(full).toContain('[역할] 역사 선생님');
       expect(full).toContain('[상황] 모둠 발표를 준비해');
       expect(full).toContain('[답하는 방법] 짧고 쉽게');
       expect(full).toContain('빗물 받는 그릇: 쇠로 만든 둥근 통이에요.');
       expect(full).toContain('[검증용 참고 자료:');
       expect(full).toContain(reading.paragraphs.join('\n\n'));
       expect(full).not.toContain(other.paragraphs.join('\n\n'));
       expect(full).toContain('위 자료만으로 O 또는 X를 판단');
       expect(full).toContain(`[역사신문 기준 추가 지시] 위에 제공한 '${reading.name}' 역사신문 본문을 바탕으로 OX 문제 두 개`);
       expect(full).toContain('신문에 없는 새로운 사실을 지어내지 마');
       expect(full).toContain('정확히 1문항');
       expect(preview).not.toContain('[검증용 참고 자료:');
       expect(preview).not.toContain('[추가 요청]');
       expect(preview).not.toContain('[역사신문 기준 추가 지시]');
       expect(preview).not.toContain(reading.paragraphs[0]);
     }
   }
 });
 it('requires source evidence and retains exclusions without inventing an answer', () => {
   const item = {...newVerifyItem('q','student'),decision:'exclude' as const,reason:'근거 없음',explanation:'자료에서 확인할 수 없어 제외'};
   expect(selfItemDone(item)).toBe(false);
   expect(selfItemDone({...item,why:'교과서 10쪽과 박물관 자료를 확인함'})).toBe(true);
   const check = newSelfVerification(2);check.selfQuestions![0].statement='AI 초안';
   expect(selfQuestions(check)).toHaveLength(1);
   const prompt=buildCreationPrompt(emptyParts(),readyCard());expect(prompt).toContain('정확히 2개');expect(prompt).toContain('정확성은 자료로 다시 확인');expect(prompt).toContain('정확히 1문항');expect(prompt).toContain('정답이 X인 문장');
   const preview=buildCreationPrompt(emptyParts(),readyCard(),false);expect(preview).toContain('정확히 2개');expect(preview).not.toContain('의도적으로');
 });
});


describe('optional OX explanations', () => {
  it('completes a verified question without an explanation while preserving other requirements', () => {
    const item = { ...newVerifyItem('q', 'student'), why: '교과서 10쪽', solved: 'O' as const, decision: 'adopt' as const, reason: '자료와 같아요', explanation: '' };
    expect(itemDone(item)).toBe(true);
    expect(selfItemDone(item)).toBe(true);
    expect(selfItemDone({ ...item, why: '' })).toBe(false);
    expect(selfItemDone({ ...item, reason: '' })).toBe(false);
    expect(selfItemDone({ ...item, solved: '' })).toBe(false);
    expect(selfItemDone({ ...item, decision: 'revise', revised: '', revisedAnswer: '' })).toBe(false);
    expect(selfItemDone({ ...item, decision: 'revise', revised: '고친 문장', revisedAnswer: 'X' })).toBe(true);
    expect(selfItemDone({ ...item, decision: 'exclude', explanation: '' })).toBe(true);
  });
});
