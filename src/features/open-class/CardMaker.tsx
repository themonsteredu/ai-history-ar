import { useState } from 'react';
import { ArCard, LessonCamera } from './ArCard';
import { artifacts as goryeoArtifacts } from '../goryeo/data';
import { ARTIFACTS } from './artifacts';
import { HeritageReading } from './HeritageReading';
import { cardProblems, newPoint, type CardPoint, type GroupCard } from './model';
import { saveLabel } from './useSyncedDraft';
import type { useSyncedDraft } from './useSyncedDraft';

type Draft = ReturnType<typeof useSyncedDraft<GroupCard>>;

/** Step 1: one group makes one artifact card: places to look at, what each shows, and OX questions about it. */
export function CardMaker({ draft, assignedArtifactId, era = 'joseon' }: { draft: Draft; assignedArtifactId: number; era?: 'goryeo' | 'joseon' }) {
  const card = draft.data;
  const [selected, setSelected] = useState<string>();
  const [placing, setPlacing] = useState(false);
  const [moving, setMoving] = useState(false);
  const [ar, setAr] = useState(false);
  const [removed,setRemoved] = useState<{point:CardPoint;index:number;artifactId:number}>();
  const maxPoints = 3;
  const catalog = era === 'goryeo' ? goryeoArtifacts.map((a, i) => ({ id:i+1, name:a.short, kind:a.role, look:[] as string[] })) : ARTIFACTS;
  const artifact = catalog.find(a => a.id === card.artifactId);
  const assignedArtifact = catalog.find(a => a.id === assignedArtifactId);
  const matchesAssignment = assignedArtifactId > 0 && card.artifactId === assignedArtifactId;
  const problems = cardProblems(card);
  const change = (next: Partial<GroupCard>) => draft.update(current => ({ ...current, ...next }));
  const selectedPoint = card.points.find(point => point.id === selected);

  function place(position: [number, number, number]) {
    if (moving && selected) { draft.update(current => ({ ...current, points: current.points.map(p => p.id === selected ? { ...p, position } : p) })); setMoving(false); return; }
    if (card.points.length >= maxPoints) return;
    const point = newPoint(position);
    draft.update(current => ({ ...current, points: [...current.points, point] }));
    setSelected(undefined); setPlacing(false);
  }
  function removePoint(id: string) {
    const index = card.points.findIndex(p=>p.id===id); if(index<0)return;
    setRemoved({point:card.points[index],index,artifactId:card.artifactId});
    draft.update(current => ({ ...current, points: current.points.filter(p => p.id !== id) }));
    setSelected(undefined);
  }

  function restorePoint() {
    if(!removed || removed.artifactId !== card.artifactId || card.points.length >= maxPoints) return;
    draft.update(current => { if(current.points.some(p=>p.id===removed.point.id))return current; const points=[...current.points];points.splice(Math.min(removed.index,points.length),0,removed.point);return {...current,points}; });
    setRemoved(undefined);
  }
  return <div className="oc-maker">
    <section className="oc-panel" aria-labelledby="oc-pick">
      <h2 id="oc-pick"><span className="oc-step">1</span>우리 모둠 유물</h2>
      {assignedArtifact ? <p><strong>{assignedArtifact.name}</strong> · 이 유물로 계속 활동해요. 유물은 학생이 바꿀 수 없어요.</p>
        : <p role="status">선생님이 우리 모둠 유물을 배정하면 시작할 수 있어요.</p>}
      {assignedArtifact && !matchesAssignment && <div className="oc-notice" role="alert"><p>이 기기의 유물과 모둠에 저장된 유물이 달라요. 모둠 저장본을 불러와 주세요. 이 기기의 작성 내용은 따로 보관해요.</p><button type="button" onClick={draft.takeServer}>모둠 저장본 불러오기</button></div>}
      <label className="oc-field">우리 모둠 이름들 <small>(선택)</small><input value={card.members} maxLength={100} placeholder="예: 김하늘, 이바다, 박구름" onChange={event => change({ members: event.target.value })} /></label>
    </section>

    {artifact && matchesAssignment && <section className="oc-panel" aria-labelledby="oc-points"><HeritageReading era={era} id={card.artifactId}/>
      <h2 id="oc-points"><span className="oc-step">2</span>입체 모형에서 위치를 눌러 설명 쓰기</h2>
      <p className="oc-help">손가락으로 끌면 모형이 돌아가요. ‘점 추가’를 누른 뒤 모형에서 설명하고 싶은 곳을 짧게 누르세요. 점은 {maxPoints}개까지 찍을 수 있어요. 번호를 다시 누르면 지울 수 있어요.</p>
      {artifact.look.length > 0 && <details className="oc-look"><summary>어디를 볼까요? 관찰 힌트</summary><ul>{artifact.look.map(item => <li key={item}>{item}</li>)}</ul></details>}
      <div className="oc-maker-card">
        <div>
          <ArCard era={era} artifactId={card.artifactId} points={card.points} selected={selected} onSelect={id => { if(id===selected && !placing && !moving) { if(window.confirm("이 설명을 지울까요?"))removePoint(id); return; } setSelected(id); setPlacing(false); setMoving(false); }} onPlace={placing || moving ? place : undefined} />
          <div className="oc-actions">
            <button type="button" className="oc-primary" disabled={card.points.length >= maxPoints} aria-pressed={placing} onClick={() => { setPlacing(value => !value); setMoving(false); }}>{placing ? '모형에서 위치를 누르세요' : '＋ 점 추가'}</button>
            <button type="button" onClick={restorePoint} disabled={!removed || removed.artifactId!==card.artifactId || card.points.length>=maxPoints}>삭제 되돌리기</button><button type="button" onClick={() => setAr(true)} disabled={!card.points.length}>AR로 미리 보기</button>{card.points.length>0&&<button type="button" onClick={()=>{if(window.confirm("작성한 설명을 모두 지울까요?")){draft.update(d=>({...d,points:[]}));setSelected(undefined);setRemoved(undefined);}}}>설명 모두 지우기</button>}
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
      {matchesAssignment && draft.state === 'conflict' && <div className="oc-actions"><button type="button" onClick={draft.takeServer}>모둠 저장본 불러오기</button><button type="button" className="oc-primary" onClick={draft.keepMine}>내 내용으로 덮어쓰기</button></div>}
      {draft.state !== 'conflict' && <button type="button" className="oc-primary" disabled={!matchesAssignment || draft.state === 'saving'} onClick={() => { void draft.saveNow(true); }}>지금 우리 반에 저장</button>}
      {problems.length > 0 ? <details className="oc-todo"><summary>아직 남은 일 {problems.length}가지</summary><ul>{problems.map(item => <li key={item}>{item}</li>)}</ul></details> : <p className="oc-done">카드 준비 완료! 이 카드로 발표하고 AI 문제를 만들어요.</p>}
    </section>
    {ar && artifact && matchesAssignment && <LessonCamera era={era} card={card} onClose={() => setAr(false)} />}
  </div>;
}
