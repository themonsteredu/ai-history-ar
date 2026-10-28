import type { EraId } from "../types/curriculum";
import { arTargetUrl } from "../content/heritageCatalog";
import { useEffect, useId, useRef, useState } from 'react';
import type { ExhibitModel, ExhibitPoint } from '../lib/ar/exhibit';
import type { CardPlacement, ModelScene } from '../lib/ar/modelScene';
import { ReconstructionCredit } from './ReconstructionCredit';
import { cameraFailureMessage } from '../lib/ar/cameraDiagnosis';

export default function HeritageModelView({ model, image, points, selectedId, onSelect, onPlace, camera = false, cardPlacement = 'table', targetIndex, onTracking, eraId = "three-kingdoms", targetFile, steady = false, spin = false, bubbles = false }: {
  model?: ExhibitModel; image: string; points: ExhibitPoint[]; selectedId: string; onSelect: (id: string) => void;
  onPlace?: (position: [number, number, number]) => void; camera?: boolean; targetIndex: number; eraId?: EraId;
  onTracking?: (visible: boolean) => void;
  /** Printed-card targets other than the era's own set (the Joseon open lesson's photo cards). */
  targetFile?: string;
  /** On a printed card: damp tracking shake, and let a sideways swipe turn the model on the card. */
  steady?: boolean;
  spin?: boolean;
  cardPlacement?: CardPlacement;
  /** Show the selected point's title and text in a speech bubble beside its number. */
  bubbles?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const pins = useRef<Array<HTMLButtonElement | null>>([]);
  const scene = useRef<ModelScene | null>(null);
  const current = useRef({ points, onPlace, onTracking, cardPlacement }); current.current = { points, onPlace, onTracking, cardPlacement };
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [simplePreview, setSimplePreview] = useState(false);
  const [textureUnavailable, setTextureUnavailable] = useState(false);
  const rotation = model?.rotation.join(',') || '';
  const partsVersion = JSON.stringify(model?.parts);
  const bubbleId = useId();
  // Tapping the open pin again closes its bubble (and reopens it); choosing another point opens afresh.
  const [bubble, setBubble] = useState({ id: selectedId, open: true });
  if (bubbles && bubble.id !== selectedId) setBubble({ id: selectedId, open: true });
  // Hidden while placing a point, so it never covers the spot a student is about to tap.
  const showBubble = bubbles && !onPlace && (bubble.id !== selectedId || bubble.open);
  const pick = (id: string) => { if (bubbles && id === selectedId) setBubble({ id, open: !showBubble }); onSelect(id); };
  const pinHint = !bubbles ? '' : showBubble && points.some(point => point.id === selectedId) ? ' 같은 번호를 또 누르면 설명이 닫혀요.' : ' 번호를 누르면 번호 옆에 설명이 나와요.';
  useEffect(() => {
    const surface = document.createElement('div'); surface.className = 'ar-model-surface'; container.current?.append(surface);
    const abort = new AbortController(); setStatus('loading'); setError(''); setSimplePreview(false); setTextureUnavailable(false); current.current.onTracking?.(false);
    void (async () => {
      const { mountModelScene } = await import('../lib/ar/modelScene');
      const original = model?.asset === 'cheomseongdae-nsm-2015' ? await import('../content/three-kingdoms/cheomseongdaeOriginal') : undefined;
      return mountModelScene({
      container: surface, model, image, mode: camera ? 'camera' : 'preview',
      cardPlacement: () => current.current.cardPlacement,
      loadBuiltIn: original?.loadCheomseongdaeOriginal,
      targetFile: targetFile || arTargetUrl(eraId), targetIndex, signal: abort.signal, steady, spin,
      markers: () => pins.current, points: () => current.current.points,
      onPlace: camera ? undefined : position => current.current.onPlace?.(position),
      onPreviewFallback: () => { if (!abort.signal.aborted) setSimplePreview(true); },
      onTextureUnavailable: () => { if (!abort.signal.aborted) setTextureUnavailable(true); },
      onStatus: next => { if (!abort.signal.aborted) { setStatus(next); current.current.onTracking?.(next === 'found' || next === 'ready'); } },
      });
    })().then(runtime => { if (abort.signal.aborted) runtime.dispose(); else scene.current = runtime; }).catch(reason => {
      if (!abort.signal.aborted) {
        setStatus('error'); current.current.onTracking?.(false);
        void cameraFailureMessage(reason, navigator, window.isSecureContext).then(message => setError(message));
      }
    });
    return () => { abort.abort(); scene.current = null; surface.remove(); };
  }, [model?.data, model?.format, model?.asset, model?.preset, partsVersion, image, rotation, camera, targetIndex, eraId, targetFile, steady, spin]);
  return <div className="ar-model-view">
    <div className="ar-model-stage" ref={container} aria-label={camera ? '유산 카드를 비추는 AR 카메라' : '끌어서 돌려 보는 입체 유물'}>
      {points.map((point, index) => { const open = showBubble && selectedId === point.id; return <button hidden type="button" className="ar-hotspot" key={point.id} ref={node => { pins.current[index] = node; }} aria-label={`${index + 1}번 ${point.title || '설명'} 열기`} aria-pressed={selectedId === point.id} aria-expanded={bubbles ? open : undefined} aria-describedby={open ? bubbleId : undefined} onClick={() => pick(point.id)}>{index + 1}{open && <span className="ar-pin-bubble" id={bubbleId}><b>{point.title || '제목 없음'}</b><span className={point.text ? undefined : 'is-empty'}>{point.text || '아직 설명이 없어요.'}</span></span>}</button>; })}
      {(status === 'loading' || status === 'error') && <p className="ar-model-notice" role="status">{error || (model?.asset === 'cheomseongdae-nsm-2015' ? '공식 첨성대 모형을 준비해요. 처음에는 약 36MB를 내려받아요…' : camera ? '카메라와 입체 유물을 준비해요…' : '입체 유물을 불러와요…')}</p>}
    </div>
    <div className="ar-model-controls">
      <p role="status">{status === 'scanning' || status === 'lost' ? '출력한 유산 카드 전체를 카메라에 비춰 주세요.' : status === 'found' ? (bubbles ? `카드를 찾았어요!${spin ? ' 좌우로 밀면 모형이 돌아요.' : ''}${pinHint}` : spin ? '카드를 찾았어요! 화면을 좌우로 밀면 모형이 카드 위에서 돌아가요.' : '카드를 찾았어요! 표시점을 눌러 해설을 들어 보세요.') : !camera ? (onPlace ? '끌어서 돌리고, 설명할 곳을 짧게 눌러요.' : bubbles ? `끌어서 돌려 보세요.${pinHint}` : points.length ? '끌어서 돌려 보고, 표시점을 눌러요.' : '끌어서 돌려 보세요.') : ''}</p>
      {(!camera || spin) && <button type="button" onClick={() => scene.current?.reset()}>처음 방향</button>}
    </div>
    {simplePreview && <p className="ar-help">간단한 입체 보기예요. 모형을 돌리고 설명점을 찍을 수 있어요. AR 카메라는 그래픽 기능이 지원되는 기기에서 열어 주세요.</p>}
    {textureUnavailable && <p className="ar-help" role="status">사진 표면을 불러오지 못해 모형의 형태만 보여요. 인터넷 연결을 확인하고 화면을 다시 열어 주세요. 설명과 녹음은 유지돼요.</p>}
    <ReconstructionCredit model={model} />
  </div>;
}
