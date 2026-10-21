import { useState } from 'react';
import { ArCard, ArCameraView } from './ArCard';
import { ARTIFACTS, artifactById } from './artifacts';
import { cardProblems, MAX_POINTS, newPoint, type GroupCard } from './model';
import { saveLabel } from './useSyncedDraft';
import type { useSyncedDraft } from './useSyncedDraft';

type Draft = ReturnType<typeof useSyncedDraft<GroupCard>>;

/** Step 1: one group makes one artifact card: places to look at, what each shows, and OX questions about it. */
export function CardMaker({ draft, taken }: { draft: Draft; taken: Map<number, number[]> }) {
  const card = draft.data;
  const [selected, setSelected] = useState<string>();
  const [placing, setPlacing] = useState(false);
  const [moving, setMoving] = useState(false);
  const [ar, setAr] = useState(false);
  const artifact = artifactById(card.artifactId);
  const problems = cardProblems(card);
  const change = (next: Partial<GroupCard>) => draft.update(current => ({ ...current, ...next }));
  const selectedPoint = card.points.find(point => point.id === selected);

  function place(position: [number, number, number]) {
    if (moving && selected) { draft.update(current => ({ ...current, points: current.points.map(p => p.id === selected ? { ...p, position } : p) })); setMoving(false); return; }
    if (card.points.length >= MAX_POINTS) return;
    const point = newPoint(position);
    draft.update(current => ({ ...current, points: [...current.points, point] }));
    setSelected(point.id); setPlacing(false);
  }
  function removePoint(id: string) {
    draft.update(current => ({ ...current, points: current.points.filter(p => p.id !== id), questions: current.questions.map(q => q.pointId === id ? { ...q, pointId: '' } : q) }));
    setSelected(undefined);
  }

  return <div className="oc-maker">
    <section className="oc-panel" aria-labelledby="oc-pick">
      <h2 id="oc-pick"><span className="oc-step">1</span>우리 모둠 유물 고르기</h2>
      <div className="oc-artifacts">{ARTIFACTS.map(item => {
        const others = (taken.get(item.id) || []).filter(group => group !== card.group);
        return <button key={item.id} type="button" aria-pressed={card.artifactId === item.id} onClick={() => change({ artifactId: item.id })}>
          <b>{item.name}</b><small>{item.kind}</small>{others.length > 0 && <em>{others.join('·')}모둠도 골랐어요</em>}
        </button>;
      })}</div>
      <label className="oc-field">우리 모둠 이름들 <small>(선택)</small><input value={card.members} maxLength={100} placeholder="예: 김하늘, 이바다, 박구름" onChange={event => change({ members: event.target.value })} /></label>
    </section>

    {artifact && <section className="oc-panel" aria-labelledby="oc-points">
      <h2 id="oc-points"><span className="oc-step">2</span>입체 모형에서 위치를 눌러 설명 쓰기</h2>
      <p className="oc-help">손가락으로 끌면 모형이 돌아가요. ‘점 추가’를 누른 뒤 모형에서 설명하고 싶은 곳을 짧게 누르세요. 점은 {MAX_POINTS}개까지 찍을 수 있어요.</p>
      <details className="oc-look"><summary>어디를 볼까요? 관찰 힌트</summary><ul>{artifact.look.map(item => <li key={item}>{item}</li>)}</ul></details>
      <div className="oc-maker-card">
        <div>
          <ArCard artifactId={card.artifactId} points={card.points} selected={selected} onSelect={id => { setSelected(id); setPlacing(false); setMoving(false); }} onPlace={placing || moving ? place : undefined} />
          <div className="oc-actions">
            <button type="button" className="oc-primary" disabled={card.points.length >= MAX_POINTS} aria-pressed={placing} onClick={() => { setPlacing(value => !value); setMoving(false); }}>{placing ? '모형에서 위치를 누르세요' : '＋ 점 추가'}</button>
            <button type="button" onClick={() => setAr(true)} disabled={!card.points.length}>AR로 미리 보기</button>
          </div>
        </div>
        <div className="oc-point-list">
          {card.points.length === 0 && <p className="oc-help">아직 점이 없어요. ‘점 추가’를 눌러 시작하세요.</p>}
          {card.points.map((point, index) => <div key={point.id} className={`oc-point${point.id === selected ? ' is-selected' : ''}`} onFocus={() => setSelected(point.id)}>
            <div className="oc-point-head"><span className="oc-num">{index + 1}</span>
              <input aria-label={`${index + 1}번 점 제목`} value={point.title} maxLength={40} placeholder="이곳의 이름 (예: 빗물 받는 그릇)" onChange={event => draft.update(current => ({ ...current, points: current.points.map(p => p.id === point.id ? { ...p, title: event.target.value } : p) }))} />
            </div>
            <textarea aria-label={`${index + 1}번 점 설명`} value={point.text} maxLength={400} rows={3} placeholder="조사한 내용을 우리 말로 써요. (예: 쇠로 만든 둥근 통에 빗물을 받았어요.)" onChange={event => draft.update(current => ({ ...current, points: current.points.map(p => p.id === point.id ? { ...p, text: event.target.value } : p) }))} />
            {point.id === selected && <div className="oc-point-tools">
              <button type="button" aria-pressed={moving} onClick={() => { setMoving(value => !value); setPlacing(false); }}>{moving ? '모형에서 새 위치를 누르세요' : '위치 옮기기'}</button>
              <button type="button" className="oc-danger" onClick={() => { if (window.confirm(`${index + 1}번 점을 지울까요?`)) removePoint(point.id); }}>점 지우기</button>
            </div>}
          </div>)}
        </div>
      </div>
      {selectedPoint && moving && <p className="oc-help" role="status">{card.points.indexOf(selectedPoint) + 1}번 점을 옮길 곳을 모형에서 누르세요.</p>}
    </section>}

    <section className="oc-save" aria-label="카드 저장">
      <p className={`oc-save-state is-${draft.state}`} role="status">{saveLabel(draft.state, draft.dirty, draft.savedAt)}{draft.message && ` · ${draft.message}`}</p>
      {draft.state === 'conflict' && <div className="oc-actions"><button type="button" onClick={draft.takeServer}>다른 태블릿 것 불러오기</button><button type="button" className="oc-primary" onClick={draft.keepMine}>이 태블릿 것으로 저장</button></div>}
      {draft.state !== 'conflict' && <button type="button" className="oc-primary" disabled={draft.state === 'saving'} onClick={() => { void draft.saveNow(true); }}>지금 우리 반에 저장</button>}
      {problems.length > 0 ? <details className="oc-todo"><summary>아직 남은 일 {problems.length}가지</summary><ul>{problems.map(item => <li key={item}>{item}</li>)}</ul></details> : <p className="oc-done">사전 카드 준비 완료! 공개수업에서는 이 카드로 발표하고 AI 문제를 만들어요.</p>}
    </section>
    {ar && artifact && <ArCameraView artifactId={card.artifactId} points={card.points} title={`${card.group}모둠 · ${artifact.name}`} onClose={() => setAr(false)} />}
  </div>;
}
