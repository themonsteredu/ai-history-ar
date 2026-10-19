import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { ExhibitModel, ExhibitPoint } from '../../lib/ar/exhibit';
import { joseonModelFor } from '../../lib/ar/joseon/catalog';
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
 * AR view: the 3D model stands over the live camera picture, so students hold the tablet up and turn
 * the artifact with a finger in the room. When the camera is refused, the model is shown on its own.
 */
export function ArCameraView({ artifactId, points, title, onClose }: { artifactId: number; points: readonly CardPoint[]; title: string; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [selected, setSelected] = useState<string>();
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
  return <div className="oc-ar" role="dialog" aria-modal="true" aria-label={`${title} AR 보기`}>
    <video ref={video} className="oc-ar-video" playsInline muted />
    <div className="oc-ar-top"><b>{title}</b><button type="button" onClick={onClose}>닫기</button></div>
    <div className="oc-ar-float"><ArCard artifactId={artifactId} points={points} selected={selected} onSelect={setSelected} /></div>
    <div className="oc-ar-bottom">
      {problem && <p className="oc-ar-problem">{problem}</p>}
      <PointBubble points={points} selected={selected} />
    </div>
  </div>;
}
