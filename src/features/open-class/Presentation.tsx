import { useState } from 'react';
import { WorksheetHeader } from '../../components/WorksheetHeader';
import { artifactById } from './artifacts';
import { decisionLabel, selfItemDone, type CheckQuestion, type GroupCard, type Verification } from './model';

/** Step 4: the group's checks as one sheet to present, project or print. */
export function Presentation({ check, card, questions, big }: { check?: Verification; card?: GroupCard; questions: CheckQuestion[]; big?: boolean }) {
  const [revealed,setRevealed] = useState<Record<string, boolean>>({});
  if (!check || !card) return <p className="oc-empty">검증 기록이 아직 없어요. ‘AI 문제 만들고 검증’에서 먼저 문제를 검증해 주세요.</p>;
  const artifact = artifactById(card.artifactId);
  const rows = questions.map(question => ({ question, item: check.items.find(item => item.questionId === question.id) }));
  const count = (id: string) => rows.filter(row => row.item?.decision === id).length;
  if (check.mode === 'self') return <article className={`oc-present${big?' is-big':''}`}><header><p>{check.verifier}모둠 퀴즈 발표</p><h2>{artifact?.name} · 우리가 자료로 확인한 OX</h2><p>친구들이 먼저 답한 뒤 정답과 근거를 공개하세요. 제외하거나 검증을 마치지 않은 문제는 출제하지 않습니다.</p></header><ol>{rows.filter(({item})=>item&&selfItemDone(item)&&item.decision!=='exclude').map(({question,item},index)=><li key={question.id}><h3>{index+1}. {item!.decision==='revise'?item!.revised:question.statement}</h3><button onClick={()=>setRevealed(r=>({...r,[question.id]:!r[question.id]}))}>{revealed[question.id]?'정답·근거 감추기':'정답·근거 공개'}</button>{revealed[question.id]&&<div><p><b>정답 {item!.decision==='revise'?item!.revisedAnswer:item!.solved}</b></p><p>{item!.explanation}</p><p>확인 자료: {item!.why}</p><p>{decisionLabel(item!.decision)}한 이유: {item!.reason}</p></div>}</li>)}</ol>{!rows.some(({item})=>item&&selfItemDone(item)&&item.decision!=='exclude')&&<p className="oc-empty">아직 출제할 문제가 없어요. 문제 2개의 자료·판단·해설을 먼저 작성해 주세요.</p>}<details><summary>검증 결과와 배움 정리 보기</summary>{rows.map(({question,item},i)=><section key={question.id}><h3>{i+1}번 · {decisionLabel(item?.decision||'')}</h3><p>AI 초안: {question.statement} / {question.answer}</p><p>자료: {item?.why||'미작성'}</p><p>판단 이유: {item?.reason||'미작성'}</p><p>최종 해설: {item?.explanation||'미작성'}</p></section>)}<p>오늘 알게 된 점: {check.notes?.learned||'미작성'}</p><p>AI 정보를 확인해야 하는 까닭: {check.notes?.caution||'미작성'}</p></details></article>;
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
      <p className="oc-present-line is-key"><span>정답 해설</span>{item?.explanation || '아직 쓰지 않았어요.'}</p>
    </li>)}</ol>
  </article>;
}
