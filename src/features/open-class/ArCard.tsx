import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ArtifactArt } from './ArtifactArt';
import { artifactById } from './artifacts';
import type { CardPoint } from './model';

interface ArCardProps {
  artifactId: number; points: readonly CardPoint[]; selected?: string;
  onSelect?: (id: string) => void; onPlace?: (x: number, y: number) => void; placing?: boolean; caption?: string;
}

/** The card face: the artifact picture with numbered places. Tapping the picture while placing drops a point there. */
export function ArCard({ artifactId, points, selected, onSelect, onPlace, placing, caption }: ArCardProps) {
  const artifact = artifactById(artifactId);
  function place(event: PointerEvent<HTMLDivElement>) {
    if (!placing || !onPlace) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const clamp = (n: number) => Math.round(Math.max(.03, Math.min(.97, n)) * 1000) / 1000;
    onPlace(clamp((event.clientX - rect.left) / Math.max(1, rect.width)), clamp((event.clientY - rect.top) / Math.max(1, rect.height)));
  }
  return <figure className={`oc-card${placing ? ' is-placing' : ''}`}>
    <div className="oc-card-stage" onPointerUp={place}>
      <ArtifactArt id={artifactId} title={artifact?.name} />
      {points.map((point, index) => <button key={point.id} type="button" className={`oc-pin${point.id === selected ? ' is-selected' : ''}`}
        style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }} aria-label={`${index + 1}번 ${point.title || '설명 점'}`}
        onPointerUp={event => event.stopPropagation()} onClick={() => onSelect?.(point.id)}>{index + 1}</button>)}
    </div>
    <figcaption>{caption || (artifact ? `${artifact.name}(${artifact.hanja}) · ${artifact.kind}` : '유물을 골라 주세요')}</figcaption>
  </figure>;
}

/** The text of the tapped point, shown under the card or over the camera. */
export function PointBubble({ points, selected }: { points: readonly CardPoint[]; selected?: string }) {
  const index = points.findIndex(point => point.id === selected), point = points[index];
  if (!point) return <p className="oc-bubble is-empty">번호를 눌러 설명을 읽어 보세요.</p>;
  return <div className="oc-bubble" role="status"><b>{index + 1}. {point.title || '제목 없음'}</b><p>{point.text || '아직 설명이 없어요.'}</p></div>;
}

/**
 * AR view without a printed marker: the card floats over the live camera so students can hold the tablet
 * up and walk around it. When the camera is refused, the same card is shown on its own.
 */
export function ArCameraView({ artifactId, points, title, onClose }: { artifactId: number; points: readonly CardPoint[]; title: string; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [selected, setSelected] = useState<string>();
  const [problem, setProblem] = useState('');
  const [scale, setScale] = useState(1);
  useEffect(() => {
    let stream: MediaStream | undefined, stopped = false;
    if (!navigator.mediaDevices?.getUserMedia) { setProblem('이 기기에서는 카메라를 열 수 없어요. 카드만 크게 보여 줄게요.'); return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }).then(value => {
      if (stopped) { value.getTracks().forEach(track => track.stop()); return; }
      stream = value; if (video.current) { video.current.srcObject = value; void video.current.play().catch(() => undefined); }
    }).catch(() => setProblem('카메라를 쓸 수 없어요. 주소창의 카메라 허용을 확인해 주세요. 지금은 카드만 보여 줄게요.'));
    return () => { stopped = true; stream?.getTracks().forEach(track => track.stop()); };
  }, []);
  return <div className="oc-ar" role="dialog" aria-modal="true" aria-label={`${title} AR 보기`}>
    <video ref={video} className="oc-ar-video" playsInline muted />
    <div className="oc-ar-top"><b>{title}</b><button type="button" onClick={onClose}>닫기</button></div>
    <div className="oc-ar-float" style={{ transform: `scale(${scale})` }}><ArCard artifactId={artifactId} points={points} selected={selected} onSelect={setSelected} /></div>
    <div className="oc-ar-bottom">
      {problem && <p className="oc-ar-problem">{problem}</p>}
      <PointBubble points={points} selected={selected} />
      <div className="oc-ar-zoom"><button type="button" onClick={() => setScale(s => Math.max(.6, s - .15))}>작게</button><button type="button" onClick={() => setScale(s => Math.min(1.6, s + .15))}>크게</button></div>
    </div>
  </div>;
}
