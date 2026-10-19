import { useState } from 'react';
import { ArCard } from './ArCard';
import { artifactById } from './artifacts';
import { copyText } from './clipboard';
import { buildPrompt, DECISIONS, GEMINI_URL, itemDone, missingParts, newVerifyItem, PROMPT_FIELDS, syncItems, type CheckQuestion, type GroupCard, type PromptParts, type Verification, type VerifyItem } from './model';
import { saveLabel, type useSyncedDraft } from './useSyncedDraft';

type Draft = ReturnType<typeof useSyncedDraft<Verification>>;
interface BoardProps { draft: Draft; card?: GroupCard; questions: CheckQuestion[]; targets: GroupCard[]; target: number; onTarget: (group: number) => void }

/** Step 3: solve the other group's OX questions, ask Gemini, then adopt, fix or drop each one with a reason. */
export function VerifyBoard({ draft, card, questions, targets, target, onTarget }: BoardProps) {
  const [selected, setSelected] = useState<string>();
  const [openPrompt, setOpenPrompt] = useState(true);
  const check = draft.data;
  const parts = check.parts;
  const missing = missingParts(parts);
  const artifact = artifactById(card?.artifactId || 0);
  // Rows are only written once the group actually starts, so the teacher never sees an untouched check as started.
  const setParts = (next: Partial<PromptParts>) => draft.update(current => ({ ...syncItems(current, questions), parts: { ...current.parts, ...next } }));
  const setItem = (questionId: string, next: Partial<VerifyItem>) => draft.update(current => { const synced = syncItems(current, questions); return { ...synced, items: synced.items.map(item => item.questionId === questionId ? { ...item, ...next } : item) }; });

  return <div className="oc-verify">
    <section className="oc-panel" aria-label="검증할 카드 고르기">
      <h2><span className="oc-step">1</span>어느 모둠 카드를 검증할까요?</h2>
      {targets.length ? <div className="oc-gallery-list">{targets.map(item => <button key={item.group} type="button" aria-pressed={item.group === target} onClick={() => onTarget(item.group)}><b>{item.group}모둠</b><span>{artifactById(item.artifactId)?.name}</span></button>)}</div>
        : <p className="oc-empty">아직 검증할 다른 모둠 카드가 없어요.</p>}
    </section>

    {card && artifact && <>
      <section className="oc-panel oc-verify-card" aria-label="관찰한 카드">
        <div><ArCard artifactId={card.artifactId} points={card.points} selected={selected} onSelect={setSelected} caption={`${card.group}모둠 · ${artifact.name}`} /></div>
      </section>

      <section className="oc-panel oc-role" aria-labelledby="oc-role-title">
        <div className="oc-role-head"><h2 id="oc-role-title"><span className="oc-step">2</span>AI 역할 설정하기</h2><button type="button" onClick={() => setOpenPrompt(value => !value)}>{openPrompt ? '접기' : '펼치기'}</button></div>
        {openPrompt && <>
          <p className="oc-help">AI에게 보낼 질문의 앞부분이에요. 한 번 쓰면 모든 문제에 같이 들어가요. 회색 예시를 보고 <b>우리 말로</b> 직접 써 보세요.</p>
          <div className="oc-role-grid">{PROMPT_FIELDS.map(field => <label key={field.key} className="oc-field">
            <span>{field.label}</span><small>{field.help}</small>
            <textarea rows={2} maxLength={field.max} value={parts[field.key]} placeholder={field.example} onChange={event => setParts({ [field.key]: event.target.value })} />
          </label>)}</div>
          {missing.length > 0 && <p className="oc-help is-warn">아직 비어 있어요: {missing.join(', ')}</p>}
        </>}
      </section>

      <section className="oc-panel" aria-labelledby="oc-items-title">
        <h2 id="oc-items-title"><span className="oc-step">3</span>문제 하나씩 검증하기</h2>
        {!questions.length && <p className="oc-empty">이 카드에는 아직 완성된 OX 문제가 없어요.</p>}
        <ol className="oc-items">{questions.map((question, index) => {
          const item = check.items.find(value => value.questionId === question.id) || newVerifyItem(question.id, question.source);
          return <CheckItem key={question.id} number={index + 1} question={question} item={item} card={card} parts={parts} artifactName={artifact.name} onChange={next => setItem(question.id, next)} />;
        })}</ol>
      </section>
    </>}

    {card && <section className="oc-save" aria-label="검증 기록 저장">
      <p className={`oc-save-state is-${draft.state}`} role="status">{saveLabel(draft.state, draft.dirty, draft.savedAt)}{draft.message && ` · ${draft.message}`}</p>
      {draft.state === 'conflict' ? <div className="oc-actions"><button type="button" onClick={draft.takeServer}>다른 태블릿 것 불러오기</button><button type="button" className="oc-primary" onClick={draft.keepMine}>이 태블릿 것으로 저장</button></div>
        : <button type="button" className="oc-primary" disabled={draft.state === 'saving'} onClick={() => { void draft.saveNow(true); }}>지금 우리 반에 저장</button>}
      <p className="oc-help">다 쓴 문제 {check.items.filter(itemDone).length} / {questions.length}개</p>
    </section>}
  </div>;
}

function CheckItem({ number, question, item, card, parts, artifactName, onChange }: { number: number; question: CheckQuestion; item: VerifyItem; card: GroupCard; parts: PromptParts; artifactName: string; onChange: (next: Partial<VerifyItem>) => void }) {
  const [copied, setCopied] = useState('');
  const prompt = buildPrompt(parts, { artifact: artifactName, statement: question.statement, solved: item.solved, why: item.why, curious: item.curious, card: card.points });
  const revealed = !!item.solved;
  function copy(openGemini: boolean) {
    const ok = copyText(prompt);
    if (openGemini) window.open(GEMINI_URL, '_blank', 'noopener');
    onChange({ asked: true });
    setCopied(ok ? (openGemini ? '복사했어요! 제미나이 입력칸을 길게 눌러 붙여넣기 하세요.' : '복사했어요.') : '복사가 안 됐어요. 아래 글을 길게 눌러 복사해 주세요.');
  }
  return <li className={`oc-item${itemDone(item) ? ' is-done' : ''}`}>
    <header className="oc-item-head">
      <span className="oc-num">{number}</span>
      <p className="oc-statement">“{question.statement}”</p>
      {question.source === 'teacher' ? <span className="oc-badge is-teacher">선생님 출제</span> : <span className="oc-badge">{card.group}모둠 출제</span>}
    </header>

    <div className="oc-substep"><h3>① 문제 풀기</h3>
      <div className="oc-ox-row"><span>우리 생각</span>{(['O', 'X'] as const).map(value => <button key={value} type="button" className={`oc-ox oc-ox--${value}`} aria-pressed={item.solved === value} onClick={() => onChange({ solved: value })}>{value}</button>)}</div>
      <label className="oc-field">왜 그렇게 생각했나요?<input value={item.why} maxLength={300} placeholder="카드의 몇 번 설명을 보고 그렇게 생각했는지 써요." onChange={event => onChange({ why: event.target.value })} /></label>
    </div>

    <div className="oc-substep"><h3>② AI에게 물어보기</h3>
      <label className="oc-field">더 궁금한 점 <small>(질문에 같이 들어가요. 없으면 비워도 돼요)</small><input value={item.curious} maxLength={300} placeholder={`예: ${artifactName}의 쓰임새가 더 궁금해`} onChange={event => onChange({ curious: event.target.value })} /></label>
      <details className="oc-prompt"><summary>AI에게 보낼 질문 미리 보기</summary><pre>{prompt}</pre></details>
      <div className="oc-actions">
        <button type="button" className="oc-primary oc-gemini" onClick={() => copy(true)}>복사하고 제미나이 열기</button>
        <button type="button" onClick={() => copy(false)}>복사만 하기</button>
      </div>
      {copied && <p className="oc-help" role="status">{copied}</p>}
      <label className="oc-field">AI가 뭐라고 했나요? <small>(한두 문장으로 줄여 써요)</small><textarea rows={2} maxLength={800} value={item.aiAnswer} placeholder="예: AI는 X라고 했어요. 카드 설명과 다른 부분이 있다고 했어요." onChange={event => onChange({ aiAnswer: event.target.value })} /></label>
    </div>

    <div className="oc-substep"><h3>③ {question.source === 'teacher' ? '선생님' : '만든 모둠'}의 정답 확인</h3>
      {revealed ? <p className="oc-answer"><b className={`oc-ox-mark oc-ox--${question.answer}`}>{question.answer}</b>{question.explanation || '정답 이유가 적혀 있지 않아요.'}</p>
        : <p className="oc-help">먼저 ①에서 O 또는 X를 고르면 정답이 보여요.</p>}
    </div>

    <div className="oc-substep"><h3>④ 판단하기</h3>
      <div className="oc-decisions">{DECISIONS.map(decision => <button key={decision.id} type="button" className={`oc-decision is-${decision.id}`} aria-pressed={item.decision === decision.id} onClick={() => onChange({ decision: decision.id })}><b>{decision.label}</b><small>{decision.help}</small></button>)}</div>
      {item.decision === 'revise' && <div className="oc-revise">
        <label className="oc-field">고친 문장<textarea rows={2} maxLength={200} value={item.revised} placeholder="틀린 곳이나 애매한 곳을 고쳐 다시 써요." onChange={event => onChange({ revised: event.target.value })} /></label>
        <div className="oc-ox-row"><span>고친 문장의 정답</span>{(['O', 'X'] as const).map(value => <button key={value} type="button" className={`oc-ox oc-ox--${value}`} aria-pressed={item.revisedAnswer === value} onClick={() => onChange({ revisedAnswer: value })}>{value}</button>)}</div>
      </div>}
      <label className="oc-field">그렇게 판단한 이유<textarea rows={2} maxLength={400} value={item.reason} placeholder={item.decision === 'exclude' ? '어디에서도 근거를 찾을 수 없었던 까닭을 써요.' : '카드 설명과 AI 답을 비교해서 써요.'} onChange={event => onChange({ reason: event.target.value })} /></label>
    </div>

    <div className="oc-substep"><h3>⑤ 발표할 정답 해설</h3>
      <label className="oc-field">친구들에게 설명할 정답과 해설<textarea rows={2} maxLength={600} value={item.explanation} placeholder="예: 정답은 O예요. 카드 2번 설명과 AI 답에 같은 내용이 있기 때문이에요." onChange={event => onChange({ explanation: event.target.value })} /></label>
    </div>
  </li>;
}
