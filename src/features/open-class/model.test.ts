import { describe, expect, it } from 'vitest';
import { buildPrompt, cardProblems, emptyParts, isGroupCard, isTeacherSet, isVerification, itemDone, missingParts, newCard, newPoint, newQuestion, newVerification, newVerifyItem, questionsToCheck, syncItems, verifyProgress, type GroupCard } from './model';

function readyCard(): GroupCard {
  const card = newCard(2, 1);
  card.points = [{ ...newPoint(.5, .3), title: '빗물 받는 그릇', text: '쇠로 만든 둥근 통이에요.' }, { ...newPoint(.5, .8), title: '돌 받침', text: '그릇을 올려 두는 받침이에요.' }];
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
    expect(isGroupCard({ ...readyCard(), points: Array.from({ length: 7 }, () => newPoint(.1, .1)) })).toBe(false);
    expect(isGroupCard({ ...readyCard(), questions: [{ ...newQuestion(), answer: '△' }] })).toBe(false);
    expect(isGroupCard({ ...readyCard(), questions: Array.from({ length: 6 }, newQuestion) })).toBe(false);
    expect(isGroupCard({ ...readyCard(), points: [{ ...newPoint(1.2, .5) }] })).toBe(false);
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
