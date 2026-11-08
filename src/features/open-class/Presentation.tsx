import { useState } from 'react';
import { WorksheetHeader } from '../../components/WorksheetHeader';
import { artifactById } from './artifacts';
import { goryeoArtifact } from '../goryeo/readyCards';
import { decisionLabel, selfItemDone, type CheckQuestion, type GroupCard, type Verification, type VerifyItem } from './model';

/** Each question starts with both answers hidden, including after moving back to it. */
function QuizQuestion({ question, item, number }: { question: CheckQuestion; item: VerifyItem; number: number }) {
  const [showAi, setShowAi] = useState(false);
  const [showResult, setShowResult] = useState(false);
  return <li>
    <div className="oc-quiz-present__number">{number}번 문제</div><h3>{question.statement}</h3>
    <div className="oc-quiz-present__actions">
      <button type="button" className="oc-primary" aria-expanded={showAi} onClick={() => setShowAi(value => !value)}>{showAi ? 'AI 정답 숨기기' : 'AI 정답 보기'}</button>
      <button type="button" aria-expanded={showResult} onClick={() => setShowResult(value => !value)}>{showResult ? '검증 결과 닫기' : '검증 결과 보기'}</button>
    </div>
    {showAi && <div className="oc-quiz-present__ai"><strong>AI의 답 {question.answer}</strong>{question.explanation && <p>{question.explanation}</p>}</div>}
    {showResult && <div className="oc-quiz-present__result"><b>{item.decision === 'revise' ? 'AI 내용 수정 필요' : 'AI 내용 확인 완료'}</b><p><strong>확인한 답 {item.solved}</strong></p>{item.decision === 'revise' && item.revised.trim() && <p>고친 문장: {item.revised} {item.revisedAnswer && `(답 ${item.revisedAnswer})`}</p>}{(item.explanation || item.reason) && <p>{item.explanation || item.reason}</p>}<small>확인 자료: {item.why}</small></div>}
  </li>;
}

type PresentationProps = { check?: Verification; card?: GroupCard; questions: CheckQuestion[]; big?: boolean; artifactName?: string; era?: 'joseon'|'goryeo'; teacherReview?: boolean };

/** The teacher can review every saved step, including unfinished or excluded questions. */
function TeacherPresentation({ check, card, questions, artifactName, era }: { check: Verification; card?: GroupCard; questions: CheckQuestion[]; artifactName?: string; era: 'joseon'|'goryeo' }) {
  const [view, setView] = useState<'review' | 'quiz'>('review');
  const artifact = era === 'goryeo' ? goryeoArtifact(card?.artifactId || 0) : artifactById(card?.artifactId || 0);
  // The student quiz intentionally filters empty drafts; the teacher should see those too.
  const allQuestions: CheckQuestion[] = check.mode === 'self'
    ? (check.selfQuestions || []).map(question => ({ ...question, source: 'student' as const }))
    : questions;
  const notes = check.notes;
  const show = (value?: string) => value?.trim() || '작성하지 않았어요';
  return <div className="oc-teacher-presentation">
    <nav className="oc-present-view-switch oc-present-tools" aria-label="발표 화면 보기 방식">
      <button type="button" aria-pressed={view === 'review'} onClick={() => setView('review')}>검증 과정 보기</button>
      <button type="button" aria-pressed={view === 'quiz'} onClick={() => setView('quiz')}>퀴즈 발표 보기</button>
    </nav>
    {view === 'quiz' ? <div className="oc-present-quiz-big"><Presentation check={check} card={card} questions={questions} artifactName={artifactName} era={era} big /></div> :
      <article className="oc-present is-big oc-teacher-review">
        <header><p>{check.verifier}모둠 · 검증 과정</p><h2>{artifactName || artifact?.name || '유물 미선택'} {check.verifier !== check.target ? `· ${check.target}모둠 카드` : ''}</h2><p>학생이 저장한 내용을 함께 살펴보세요.</p></header>
        <section className="oc-review-intro" aria-label="모둠 유물 소개">
          <h3>모둠의 유물 소개</h3>
          <dl className="oc-review-fields">
            <div><dt>특징</dt><dd>{show(notes?.feature)}</dd></div>
            <div><dt>쓰임</dt><dd>{show(notes?.use)}</dd></div>
            <div><dt>사람들의 생활에 준 도움</dt><dd>{show(notes?.benefit)}</dd></div>
            <div><dt>확인한 출처</dt><dd>{show(notes?.source)}</dd></div>
          </dl>
          {card?.points.length ? <div className="oc-review-card-points"><h4>AR 카드에 적은 설명</h4><ul>{card.points.map((point, index) => <li key={point.id}><strong>{index + 1}. {show(point.title)}</strong><p>{show(point.text)}</p></li>)}</ul></div> : <p className="oc-review-empty">저장된 AR 카드 설명이 없어요.</p>}
        </section>
        <h3 className="oc-review-questions-heading">문항별 검증 과정</h3>
        {allQuestions.length === 0 ? <p className="oc-empty">저장된 문항이 아직 없어요.</p> : <ol>
          {allQuestions.map((question, index) => {
            const item = check.items.find(value => value.questionId === question.id);
            return <li key={question.id} className={`is-${item?.decision || 'none'}`}>
              <div className="oc-present-q"><span className="oc-num">{index + 1}</span><p>{show(question.statement)}<small>{check.mode === 'self' ? 'AI가 만든 OX 문장' : question.source === 'teacher' ? '선생님 출제 문장' : '모둠 출제 문장'}</small></p><b className="oc-present-decision">{decisionLabel(item?.decision || '')}</b></div>
              <dl className="oc-review-fields">
                <div><dt>{check.mode === 'self' ? 'AI가 제안한 정답' : '문제의 정답'}</dt><dd>{question.statement.trim() ? question.answer : '작성하지 않았어요'}</dd></div>
                <div><dt>{check.mode === 'self' ? 'AI가 쓴 해설' : '문제의 해설'}</dt><dd>{show(question.explanation)}</dd></div>
                <div><dt>모둠의 OX</dt><dd>{show(item?.solved)}</dd></div>
                {item?.curious && <div><dt>AI에게 질문</dt><dd>{item.curious}</dd></div>}
                {item?.aiAnswer && <div><dt>AI의 답</dt><dd>{item.aiAnswer}</dd></div>}
                <div><dt>확인한 자료</dt><dd>{show(item?.why)}</dd></div>
                <div><dt>판단과 이유</dt><dd><strong>{decisionLabel(item?.decision || '')}</strong> · {show(item?.reason)}</dd></div>
                <div><dt>바르게 고친 내용</dt><dd>{show(item?.revised)}{item?.revisedAnswer ? ` (정답 ${item.revisedAnswer})` : ''}</dd></div>
                <div><dt>최종 정답 해설</dt><dd>{show(item?.explanation)}</dd></div>
              </dl>
            </li>;
          })}
        </ol>}
        <section className="oc-review-reflection"><h3>모둠의 배움 정리</h3><dl className="oc-review-fields">
          <div><dt>오늘 알게 된 점</dt><dd>{show(notes?.learned)}</dd></div>
          <div><dt>AI 답을 확인해야 하는 까닭</dt><dd>{show(notes?.caution)}</dd></div>
        </dl></section>
      </article>}
  </div>;
}

/** Step 4: the group's checks as one sheet to present, project or print. */
export function Presentation({ check, card, questions, big, artifactName, era='joseon', teacherReview }: PresentationProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  if (teacherReview && check) return <TeacherPresentation check={check} card={card} questions={questions} artifactName={artifactName} era={era} />;
  if (!check || !card) return <p className="oc-empty">검증 기록이 아직 없어요. ‘AI 문제 만들고 검증’에서 먼저 문제를 검증해 주세요.</p>;
  const artifact = artifactById(card.artifactId);
  const rows = questions.map(question => ({ question, item: check.items.find(item => item.questionId === question.id) }));
  const count = (id: string) => rows.filter(row => row.item?.decision === id).length;
  const presentable = rows.filter(({item}) => item && selfItemDone(item) && item.decision !== 'exclude');
  const currentIndex = Math.min(questionIndex, Math.max(0, Math.min(presentable.length, 2) - 1));
  const current = presentable[currentIndex];
  if (check.mode === 'self') return <article className={`oc-present oc-quiz-present${big ? ' is-big' : ''}`}>
    <header className="oc-quiz-present__header"><p>{check.verifier}모둠 · {artifactName || artifact?.name}</p><h2>AI의 답, 맞을까요?</h2><span>문제를 읽고 생각한 뒤 AI의 답을 확인해요.</span></header>
    {presentable.length < 2 || !current?.item ? <p className="oc-empty">발표할 문제를 2개 검증해 주세요. (현재 {presentable.length}개)</p> : <>
      <p className="oc-quiz-present__progress" aria-live="polite">문제 {currentIndex + 1} / 2</p>
      <ol className="oc-quiz-present__questions" start={currentIndex + 1}>
        <QuizQuestion key={current.question.id} question={current.question} item={current.item} number={currentIndex + 1} />
      </ol>
      <nav className="oc-quiz-present__nav" aria-label="퀴즈 문제 이동">
        <button type="button" disabled={currentIndex === 0} onClick={() => setQuestionIndex(0)}>← 이전 문제</button>
        <button type="button" className="oc-primary" disabled={currentIndex === 1} onClick={() => setQuestionIndex(1)}>다음 문제 →</button>
      </nav>
    </>}
  </article>;
  return <article className={`oc-present${big ? ' is-big' : ''}`}>
    <WorksheetHeader subject="조선 과학 유물 · AI 검증 발표" lesson="공개수업" objective="AI의 답을 근거와 비교하여 판단하고 그 이유를 설명할 수 있어요." />
    <header><p>{check.verifier}모둠 발표</p><h2>{card.group}모둠의 ‘{artifact?.name}’ 카드를 검증했어요</h2>
      <ul className="oc-present-count"><li className="is-adopt">채택 {count('adopt')}</li><li className="is-revise">직접 수정 {count('revise')}</li><li className="is-exclude">제외 {count('exclude')}</li></ul>
    </header>
    <ol>{rows.map(({ question, item }, index) => <li key={question.id} className={`is-${item?.decision || 'none'}`}>
      <div className="oc-present-q"><span className="oc-num">{index + 1}</span><p>“{question.statement}” <small>{question.source === 'teacher' ? '선생님 출제' : `${card.group}모둠 출제`} · 정답 {question.answer}</small></p><b className="oc-present-decision">{decisionLabel(item?.decision || '')}</b></div>
      {item?.decision === 'revise' && <p className="oc-present-line"><span>고친 문장</span>“{item.revised}” (정답 {item.revisedAnswer || '?'})</p>}
      {item?.solved && <p className="oc-present-line"><span>우리 생각</span>{item.solved}{item.why && ` · ${item.why}`}</p>}
      {item?.aiAnswer && <p className="oc-present-line"><span>AI 확인</span>{item.aiAnswer}</p>}
      <p className="oc-present-line"><span>이유</span>{item?.reason || '아직 쓰지 않았어요.'}</p>
      {item?.explanation && <p className="oc-present-line is-key"><span>정답 해설</span>{item.explanation}</p>}
    </li>)}</ol>
  </article>;
}
