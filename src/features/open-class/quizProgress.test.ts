import { expect, it } from 'vitest';
import { newSelfVerification, newVerifyItem } from './model';
import { quizProgress } from './quizProgress';

it('keeps introduction notes separate from actual quiz work and includes prompt-only drafts', () => {
  const check = newSelfVerification(1);
  check.notes!.feature = '우리 유물의 특징';
  expect(quizProgress(check).label).toBe('작성 전');
  check.parts.role = '박물관 선생님';
  expect(quizProgress(check)).toEqual({ label: '질문 작성 중', written: 0, verified: 0 });
  check.selfQuestions![0].explanation = '붙여 넣는 중';
  expect(quizProgress(check).label).toBe('문제 작성 중');
});

it('only counts verification attached to the two visible, nonempty questions', () => {
  const check = newSelfVerification(2);
  const [first, second] = check.selfQuestions!;
  const verified = (questionId: string) => ({ ...newVerifyItem(questionId, 'student'), solved: 'O' as const, why: '역사신문', decision: 'adopt' as const, reason: '자료와 같아요' });
  check.items = [verified(first.id), verified(second.id), verified('old-question')];
  expect(quizProgress(check).verified).toBe(0);
  first.statement = '첫 번째 문제';
  expect(quizProgress(check)).toEqual({ label: '검증 중', written: 1, verified: 1 });
  second.statement = '두 번째 문제';
  expect(quizProgress(check)).toEqual({ label: '검증 완료', written: 2, verified: 2 });
});
