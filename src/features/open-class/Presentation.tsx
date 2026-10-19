import { artifactById } from './artifacts';
import { decisionLabel, type CheckQuestion, type GroupCard, type Verification } from './model';

/** Step 4: the group's checks as one sheet to present, project or print. */
export function Presentation({ check, card, questions, big }: { check?: Verification; card?: GroupCard; questions: CheckQuestion[]; big?: boolean }) {
  if (!check || !card) return <p className="oc-empty">검증 기록이 아직 없어요. ‘AI로 검증하기’에서 먼저 문제를 검증해 주세요.</p>;
  const artifact = artifactById(card.artifactId);
  const rows = questions.map(question => ({ question, item: check.items.find(item => item.questionId === question.id) }));
  const count = (id: string) => rows.filter(row => row.item?.decision === id).length;
  return <article className={`oc-present${big ? ' is-big' : ''}`}>
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
