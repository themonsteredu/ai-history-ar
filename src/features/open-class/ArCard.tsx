import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { ExhibitModel, ExhibitPoint } from '../../lib/ar/exhibit';
import { joseonModelFor, joseonTargets } from '../../lib/ar/joseon/catalog';
import { artifactById } from './artifacts';
import type { CardPoint } from './model';
import '../../styles/ar-exhibit.css';

const HeritageModelView = lazy(() => import('../../components/HeritageModelView'));

export function artifactModel(artifactId: number): ExhibitModel | undefined {
  const info = joseonModelFor(artifactId);
  if (!info) return;
  return { format: 'preset', preset: info.key, data: '', rotation: [0, 0, 0], name: `${info.name} · 사진 참고 3D 재현`,
    credit: '실물 사진을 참고해 만든 3D 재현 모형 · 실측·스캔 원본 아님', source: info.photo?.source || '' };
}
const asExhibitPoints = (points: readonly CardPoint[]): ExhibitPoint[] => points.map(point => ({ id: point.id, title: point.title, text: point.text, position: point.position, photoPosition: [.5, .5] }));

interface ArCardProps {
  artifactId: number; points: readonly CardPoint[]; selected?: string;
  onSelect?: (id: string) => void; onPlace?: (position: [number, number, number]) => void; caption?: string;
}

/** The AR card's face: the artifact's 3D model, turned with a finger, with numbered pins. A tap on the model places a pin while `onPlace` is given. */
export function ArCard({ artifactId, points, selected, onSelect, onPlace, caption }: ArCardProps) {
  const artifact = artifactById(artifactId);
  const model = useMemo(() => artifactModel(artifactId), [artifactId]);
  const exhibitPoints = useMemo(() => asExhibitPoints(points), [points]);
  if (!artifact || !model) return <figure className="oc-card is-empty"><p className="oc-help">유물을 골라 주세요.</p></figure>;
  return <figure className={`oc-card${onPlace ? ' is-placing' : ''}`}>
    <Suspense fallback={<p className="oc-help" role="status">입체 유물을 불러와요…</p>}>
      <HeritageModelView model={model} image="" points={exhibitPoints} selectedId={selected || ''} onSelect={id => onSelect?.(id)} onPlace={onPlace} targetIndex={0} eraId="joseon" />
    </Suspense>
    <figcaption>{caption || `${artifact.name}(${artifact.hanja}) · ${artifact.kind}`}</figcaption>
    <ModelCredit artifactId={artifactId} />
  </figure>;
}

/** Says plainly what the model is, and whose photograph covers it (or that the photo is still missing). */
export function ModelCredit({ artifactId }: { artifactId: number }) {
  const photo = joseonModelFor(artifactId)?.photo;
  return <p className="oc-credit">실물 사진을 참고해 만든 3D 재현 모형이에요(실측·스캔 원본 아님).{' '}
    {photo ? <a href={photo.source} target="_blank" rel="noreferrer">사진: {photo.author} · {photo.license}</a> : '실물 사진은 준비 중이라 지금은 모양만 보여요.'}
  </p>;
}

/** The text of the tapped point, shown under the model or over the camera. */
export function PointBubble({ points, selected }: { points: readonly CardPoint[]; selected?: string }) {
  const index = points.findIndex(point => point.id === selected), point = points[index];
  if (!point) return <p className="oc-bubble is-empty">번호를 눌러 설명을 읽어 보세요.</p>;
  return <div className="oc-bubble" role="status"><b>{index + 1}. {point.title || '제목 없음'}</b><p>{point.text || '아직 설명이 없어요.'}</p></div>;
}

/**
 * AR view. With the printed photo cards ready, the camera finds the card on the desk and stands the model on
 * it. Otherwise (or by choice) the model stands over the live camera picture and is turned with a finger.
 * When the camera is refused, the model is shown on its own.
 */
export function ArCameraView({ artifactId, points, title, onClose }: { artifactId: number; points: readonly CardPoint[]; title: string; onClose: () => void }) {
  const [mode, setMode] = useState<'card' | 'free'>(joseonTargets.ready ? 'card' : 'free');
  const [selected, setSelected] = useState<string>();
  const model = useMemo(() => artifactModel(artifactId), [artifactId]);
  const exhibitPoints = useMemo(() => asExhibitPoints(points), [points]);
  return <div className="oc-ar" role="dialog" aria-modal="true" aria-label={`${title} AR 보기`}>
    {mode === 'free' ? <FreeCamera artifactId={artifactId} points={points} selected={selected} onSelect={setSelected} /> : <div className="oc-ar-float oc-ar-card">
      <Suspense fallback={<p className="oc-help" role="status">AR 카메라를 준비해요…</p>}>
        <HeritageModelView camera steady spin model={model} image="" points={exhibitPoints} selectedId={selected || ''} onSelect={setSelected} targetIndex={artifactId - 1} eraId="joseon" targetFile={`${import.meta.env.BASE_URL}${joseonTargets.file}`} />
      </Suspense>
    </div>}
    <div className="oc-ar-top"><b>{title}</b><div className="oc-actions">
      {joseonTargets.ready && <button type="button" onClick={() => setMode(value => value === 'card' ? 'free' : 'card')}>{mode === 'card' ? '카드 없이 보기' : '인쇄 카드 비추기'}</button>}
      <button type="button" onClick={onClose}>닫기</button>
    </div></div>
    <div className="oc-ar-bottom">
      {mode === 'card' && <p className="oc-ar-problem">인쇄한 {artifactById(artifactId)?.name} 사진 카드를 책상에 두고 비추면 카드 위에 모형이 나타나요. 화면을 좌우로 밀면 모형이 돌아가요.</p>}
      <PointBubble points={points} selected={selected} />
    </div>
  </div>;
}

function FreeCamera({ artifactId, points, selected, onSelect }: { artifactId: number; points: readonly CardPoint[]; selected?: string; onSelect: (id: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [problem, setProblem] = useState('');
  useEffect(() => {
    let stream: MediaStream | undefined, stopped = false;
    if (!navigator.mediaDevices?.getUserMedia) { setProblem('이 기기에서는 카메라를 열 수 없어요. 입체 모형만 보여 줄게요.'); return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }).then(value => {
      if (stopped) { value.getTracks().forEach(track => track.stop()); return; }
      stream = value; if (video.current) { video.current.srcObject = value; void video.current.play().catch(() => undefined); }
    }).catch(() => setProblem('카메라를 쓸 수 없어요. 주소창의 카메라 허용을 확인해 주세요. 지금은 입체 모형만 보여 줄게요.'));
    return () => { stopped = true; stream?.getTracks().forEach(track => track.stop()); };
  }, []);
  return <>
    <video ref={video} className="oc-ar-video" playsInline muted />
    <div className="oc-ar-float"><ArCard artifactId={artifactId} points={points} selected={selected} onSelect={onSelect} /></div>
    {problem && <p className="oc-ar-problem oc-ar-floating">{problem}</p>}
  </>;
}
