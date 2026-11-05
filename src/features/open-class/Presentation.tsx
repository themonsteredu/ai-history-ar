import { useState } from 'react';
import { WorksheetHeader } from '../../components/WorksheetHeader';
import { artifactById } from './artifacts';
import { decisionLabel, selfItemDone, type CheckQuestion, type GroupCard, type Verification } from './model';

/** Step 4: the group's checks as one sheet to present, project or print. */
export function Presentation({ check, card, questions, big, artifactName, era='joseon' }: { check?: Verification; card?: GroupCard; questions: CheckQuestion[]; big?: boolean; artifactName?: string; era?: 'joseon'|'goryeo' }) {
  const [revealed,setRevealed] = useState<Record<string, boolean>>({});
  if (!check || !card) return <p className="oc-empty">검증 기록이 아직 없어요. ‘AI 문제 만들고 검증’에서 먼저 문제를 검증해 주세요.</p>;
  const artifact = artifactById(card.artifactId);
  const rows = questions.map(question => ({ question, item: check.items.find(item => item.questionId === question.id) }));
  const count = (id: string) => rows.filter(row => row.item?.decision === id).length;
  const presentable = rows.filter(({item}) => item && selfItemDone(item) && item.decision !== 'exclude');
  if (check.mode === 'self') return <article className={`oc-present oc-quiz-present${big ? ' is-big' : ''}`}>
    <header className="oc-quiz-present__header"><p>{check.verifier}모둠 · {artifactName || artifact?.name}</p><h2>AI의 답, 맞을까요?</h2><span>문제와 AI의 설명을 보고 판단해요.</span></header>
    {presentable.length < 2 ? <p className="oc-empty">발표할 문제를 2개 검증해 주세요. (현재 {presentable.length}개)</p> : <ol className="oc-quiz-present__questions">{presentable.slice(0,2).map(({question,item},index)=><li key={question.id}>
      <div className="oc-quiz-present__number">{index + 1}번 문제</div><h3>{question.statement}</h3>
      <div className="oc-quiz-present__ai"><strong>AI의 답 {question.answer}</strong>{question.explanation && <p>{question.explanation}</p>}</div>
      <button type="button" className="oc-primary" aria-expanded={!!revealed[question.id]} onClick={()=>setRevealed(r=>({...r,[question.id]:!r[question.id]}))}>{revealed[question.id] ? '검증 결과 닫기' : '검증 결과 보기'}</button>
      {revealed[question.id] && <div className="oc-quiz-present__result"><b>{item!.decision === 'revise' ? 'AI 내용 수정 필요' : 'AI 내용 확인 완료'}</b><p><strong>확인한 답 {item!.solved}</strong></p>{item!.decision === 'revise' && item!.revised.trim() && <p>고친 문장: {item!.revised} {item!.revisedAnswer && `(답 ${item!.revisedAnswer})`}</p>}{(item!.explanation || item!.reason) && <p>{item!.explanation || item!.reason}</p>}<small>확인 자료: {item!.why}</small></div>}
    </li>)}</ol>}
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
