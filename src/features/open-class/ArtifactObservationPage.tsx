import { lazy, Suspense, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { joseonModels } from '../../lib/ar/joseon/catalog';
import { encodeUrlQr } from '../../lib/qr/classroomQr';
import { goryeoCardPoints } from '../goryeo/cardPoints';
import { artifacts as goryeoArtifacts } from '../goryeo/data';
import { goryeoPhoto } from '../goryeo/readyCards';
import { ArCameraView, ArCard } from './ArCard';
import { artifactObservationUrl } from './cardLinks';
import { readyJoseonPoints } from './ReadyJoseonCards';
import './open-class.css';
import './artifact-observation.css';

const GoryeoScanner = lazy(() => import('../goryeo/GoryeoScanner'));
const base = import.meta.env.BASE_URL;
const exhibits = {
  joseon: joseonModels.map(({ id, name, photo }) => ({
    id, name, short: name, points: readyJoseonPoints(id), photo: photo?.path,
    marker: photo?.path,
  })),
  goryeo: goryeoArtifacts.map((item, index) => ({
    id: index + 1, name: item.name, short: item.short, points: goryeoCardPoints[item.id],
    photo: goryeoPhoto(index + 1)?.path, marker: `goryeo-ar-cards.html?card=${item.id}`,
  })),
};

export default function ArtifactObservationPage({ era }: { era: keyof typeof exhibits }) {
  const [params, setParams] = useSearchParams();
  const [camera, setCamera] = useState(false);
  const cards = exhibits[era];
  const card = cards.find(item => String(item.id) === params.get('artifact')) ?? cards[0];
  const qr = useMemo(() => encodeUrlQr(artifactObservationUrl(era, card.id)), [era, card.id]);
  const eraName = era === 'joseon' ? '조선' : '고려';

  function selectArtifact(id: number) {
    if (id !== card.id) setParams({ artifact: String(id) }, { replace: true });
  }

  return <article className="oc-page page-width artifact-observation">
    <header>
      <Link to="/classes">← 수업 선택</Link>
      <h1>{eraName} 유물 관찰</h1>
    </header>
    <div className="artifact-observation__tools">
      <div className="artifact-observation__choose">
        <label htmlFor="observation-artifact">관찰할 유물</label>
        <select id="observation-artifact" value={card.id} onChange={event => selectArtifact(Number(event.target.value))}>
          {cards.map(item => <option key={item.id} value={item.id}>{item.short}</option>)}
        </select>
      </div>
      <button type="button" className="oc-primary" onClick={() => setCamera(true)}>AR 카메라 켜기</button>
      <details className="artifact-observation__qr">
        <summary>이 유물 관찰 QR 보기</summary>
        <svg role="img" aria-label={`${card.short} 관찰 QR`} viewBox={`0 0 ${qr.size} ${qr.size}`} shapeRendering="crispEdges">
          <rect width="100%" height="100%" fill="#fff" /><path d={qr.path} fill="#000" />
        </svg>
        <a href={qr.url}>{card.short} 관찰 링크</a>
      </details>
    </div>
    <section className="artifact-observation__exhibit" aria-label={`${card.name} 3D 관찰`}>
      <div>
        <h2>{card.name} 3D 모형</h2>
        {!camera && <ArCard key={card.id} era={era} artifactId={card.id} points={card.points}
          fallbackImage={card.photo && base + card.photo} />}
      </div>
      <aside>
        <h2>유물 설명</h2>
        <ol>{card.points.map(point => <li key={point.id}><strong>{point.title}</strong><p>{point.text}</p></li>)}</ol>
        {card.marker && <div className="artifact-observation__marker">
          <a href={base + card.marker} target="_blank" rel="noreferrer">{card.short} AR 인식 카드 열기 ↗</a>
          <p>카드를 인쇄하거나 다른 화면에 띄운 뒤 AR 카메라로 비춰 보세요.</p>
        </div>}
      </aside>
    </section>
    {camera && (era === 'joseon'
      ? <ArCameraView artifactId={card.id} points={card.points} title={card.name} onClose={() => setCamera(false)} />
      : <Suspense fallback={<p role="status">AR 카메라를 준비하고 있어요…</p>}>
          <GoryeoScanner onClose={() => setCamera(false)} onDetected={key => {
            const index = goryeoArtifacts.findIndex(item => item.id === key);
            if (index >= 0) selectArtifact(index + 1);
          }} />
        </Suspense>)}
  </article>;
}
