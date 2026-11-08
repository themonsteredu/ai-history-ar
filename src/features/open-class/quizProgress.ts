import { inquirySlots, selfItemDone, type Verification } from './model';

export function quizProgress(check?: Verification) {
  const questions = check?.mode === 'self' ? inquirySlots(check) : [];
  const written = questions.filter(question => question.statement.trim()).length;
  const verified = questions.filter(question => question.statement.trim() && check?.items.some(item => item.questionId === question.id && selfItemDone(item))).length;
  const checking = questions.some(question => question.statement.trim() && check?.items.some(item => item.questionId === question.id &&
    (item.why.trim() || item.solved || item.decision || item.reason.trim() || item.revised.trim() || item.explanation.trim())));
  const drafting = questions.some(question => question.statement.trim() || question.explanation.trim() || question.answer === 'X');
  const prompting = check?.mode === 'self' && Object.values(check.parts).some(value => value.trim());
  const label = verified >= 2 ? '검증 완료' : checking ? '검증 중' : drafting ? '문제 작성 중' : prompting ? '질문 작성 중' : '작성 전';
  return { written, verified, label };
}
