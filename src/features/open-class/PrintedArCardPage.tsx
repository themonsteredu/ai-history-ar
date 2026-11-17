import { useEffect, useState } from 'react';
import { joseonModelFor } from '../../lib/ar/joseon/catalog';
import { StudioApiError } from '../ar-studio/api';
import { ArCameraView, ArCard } from './ArCard';
import { loadPrintedGroupCard } from './api';
import { artifactById } from './artifacts';
import type { PrintedCardTarget } from './cardLinks';
import type { PrintedGroupCard } from './model';
import './open-class.css';

type CardLoad = { card: PrintedGroupCard } | { error: string };

export default function PrintedArCardPage({ target }: { target: PrintedCardTarget | 'invalid' }) {
  const { code, group, artifactId } = target === 'invalid' ? {} : target;
  const [result, setResult] = useState<CardLoad>();
  const [retry, setRetry] = useState(0);
  const [camera, setCamera] = useState(false);
  useEffect(() => {
    if (!code || !group) return;
    let active = true;
    void loadPrintedGroupCard({ code, group, artifactId }).then(card => {
      if (active) setResult({ card });
    }, (error: unknown) => {
      if (!active) return;
      const missing = error instanceof StudioApiError && error.status === 404;
      setResult({ error: missing ? '이 QR에 연결된 AR 카드를 찾지 못했어요. 선생님에게 카드를 확인해 주세요.' : 'AR 카드를 불러오지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.' });
    });
    return () => { active = false; };
  }, [code, group, artifactId, retry]);

  const card = result && 'card' in result ? result.card : undefined;
  const artifact = card ? artifactById(card.artifactId) : undefined;
  const photo = card ? joseonModelFor(card.artifactId)?.photo : undefined;
  const error = target === 'invalid' ? 'AR 카드 주소가 올바르지 않아요. 인쇄된 QR을 다시 찍어 주세요.' :
    result && 'error' in result ? result.error : '';

  return <article className="oc-page page-width">
    <header className="oc-head"><div>
      <p className="oc-eyebrow">조선시대 공개수업{target !== 'invalid' && ` · ${target.group}모둠 AR 카드`}</p>
      <h1>{artifact?.name ?? '모둠 AR 카드'}</h1>
    </div></header>
    {error ? <>
      <p className="oc-notice" role="alert">{error}</p>
      {target !== 'invalid' && <button type="button" onClick={() => { setResult(undefined); setRetry(value => value + 1); }}>다시 불러오기</button>}
    </> : card && artifact ? <>
      <section className="oc-panel oc-group-detail" aria-label={`${card.group}모둠 ${artifact.name} AR 카드`}>
        <div>
          <button type="button" className="oc-primary" onClick={() => setCamera(true)}>AR 카메라로 보기</button>
          <ArCard artifactId={card.artifactId} points={card.points} caption={artifact.name}
            fallbackImage={photo && `${import.meta.env.BASE_URL}${photo.path}`} />
        </div>
        <div>
          <h2>카드에 적은 설명</h2>
          {card.points.length ? <ol className="oc-group-points">{card.points.map(point =>
            <li key={point.id}><b>{point.title}</b>{' '}{point.text}</li>,
          )}</ol> : <p className="oc-help">아직 저장된 설명이 없어요.</p>}
        </div>
      </section>
      {camera && <ArCameraView artifactId={card.artifactId} points={card.points} title={`${card.group}모둠 · ${artifact.name}`} onClose={() => setCamera(false)} />}
    </> : <p className="oc-help" role="status">AR 카드를 불러오는 중…</p>}
  </article>;
}
