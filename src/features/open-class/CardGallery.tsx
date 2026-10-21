import { useState } from 'react';
import { ArCard, ArCameraView } from './ArCard';
import { artifactById } from './artifacts';
import type { OpenItem } from './api';
import { readyQuestions, type GroupCard } from './model';

/** Step 2: look at the other groups' cards, on screen or floating over the camera. */
export function CardGallery({ cards, myGroup, onCheck, initialGroup }: { cards: OpenItem<GroupCard>[]; myGroup: number; onCheck?: (group: number) => void; initialGroup?: number }) {
  const visible = cards.filter(item => item.data.artifactId).sort((a, b) => a.data.group - b.data.group);
  const [open, setOpen] = useState<number | undefined>(initialGroup);
  const [selected, setSelected] = useState<string>();
  const [ar, setAr] = useState(false);
  const current = visible.find(item => item.data.group === open)?.data;
  if (!visible.length) return <p className="oc-empty">아직 저장된 모둠 카드가 없어요. 친구들이 카드를 저장하면 여기에 나와요.</p>;
  return <div className="oc-gallery">
    <div className="oc-gallery-list">{visible.map(({ data }) => {
      const artifact = artifactById(data.artifactId);
      return <button key={data.group} type="button" aria-pressed={open === data.group} onClick={() => { setOpen(data.group); setSelected(undefined); }}>
        <b>{data.group}모둠{data.group === myGroup && ' (우리)'}</b><span>{artifact?.name}</span><small>점 {data.points.length}개 · 문제 {readyQuestions(data.questions).length}개</small>
      </button>;
    })}</div>
    {current ? <section className="oc-panel oc-observe" aria-label={`${current.group}모둠 카드`}>
      <div className="oc-observe-card">
        <ArCard artifactId={current.artifactId} points={current.points} selected={selected} onSelect={setSelected} caption={`${current.group}모둠 · ${artifactById(current.artifactId)?.name}`} />
      </div>
      <div className="oc-actions">
        <button type="button" className="oc-primary" onClick={() => setAr(true)}>AR로 보기 (카메라)</button>
        {onCheck && current.group !== myGroup && <button type="button" onClick={() => onCheck(current.group)}>이 카드 검증하러 가기 →</button>}
      </div>
      <details className="oc-look" open><summary>설명 전체 보기</summary><ol>{current.points.map(point => <li key={point.id}><b>{point.title}</b> {point.text}</li>)}</ol></details>
      {ar && <ArCameraView artifactId={current.artifactId} points={current.points} title={`${current.group}모둠 · ${artifactById(current.artifactId)?.name}`} onClose={() => setAr(false)} />}
    </section> : <p className="oc-help">위에서 관찰할 모둠 카드를 고르세요.</p>}
  </div>;
}
