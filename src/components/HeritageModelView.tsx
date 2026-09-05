import { useEffect, useRef, useState } from 'react';
import type { ExhibitModel, ExhibitPoint } from '../lib/ar/exhibit';
import type { ModelScene } from '../lib/ar/modelScene';

export default function HeritageModelView({ model, image, points, selectedId, onSelect, onPlace, camera = false, targetIndex, onTracking }: {
  model?: ExhibitModel; image: string; points: ExhibitPoint[]; selectedId: string; onSelect: (id: string) => void;
  onPlace?: (position: [number, number, number]) => void; camera?: boolean; targetIndex: number;
  onTracking?: (visible: boolean) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const pins = useRef<Array<HTMLButtonElement | null>>([]);
  const scene = useRef<ModelScene | null>(null);
  const current = useRef({ points, onPlace, onTracking }); current.current = { points, onPlace, onTracking };
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const rotation = model?.rotation.join(',') || '';
  useEffect(() => {
    const surface = document.createElement('div'); surface.className = 'ar-model-surface'; container.current?.append(surface);
    const abort = new AbortController(); setStatus('loading'); setError(''); current.current.onTracking?.(false);
    void (async () => {
      const { mountModelScene } = await import('../lib/ar/modelScene');
      const original = model?.asset === 'cheomseongdae-nsm-2015' ? await import('../content/three-kingdoms/cheomseongdaeOriginal') : undefined;
      return mountModelScene({
      container: surface, model, image, mode: camera ? 'camera' : 'preview',
      loadBuiltIn: original?.loadCheomseongdaeOriginal,
      targetFile: `${import.meta.env.BASE_URL}ar/three-kingdoms-targets.mind`, targetIndex, signal: abort.signal,
      markers: () => pins.current, points: () => current.current.points,
      onPlace: camera ? undefined : position => current.current.onPlace?.(position),
      onStatus: next => { if (!abort.signal.aborted) { setStatus(next); current.current.onTracking?.(next === 'found' || next === 'ready'); } },
      });
    })().then(runtime => { if (abort.signal.aborted) runtime.dispose(); else scene.current = runtime; }).catch(reason => {
      if (!abort.signal.aborted) {
        setStatus('error'); current.current.onTracking?.(false);
        setError(reason instanceof DOMException && reason.name === 'NotAllowedError' ? '카메라 사용을 허용한 뒤 다시 열어 주세요.' : reason instanceof Error ? reason.message : '입체 유물을 열지 못했어요.');
      }
    });
    return () => { abort.abort(); scene.current = null; surface.remove(); };
  }, [model?.data, model?.format, model?.asset, image, rotation, camera, targetIndex]);
  return <div className="ar-model-view">
    <div className="ar-model-stage" ref={container} aria-label={camera ? '유산 카드를 비추는 AR 카메라' : '끌어서 돌려 보는 입체 유물'}>
      {points.map((point, index) => <button hidden type="button" className="ar-hotspot" key={point.id} ref={node => { pins.current[index] = node; }} aria-label={`${index + 1}번 ${point.title || '설명'} 열기`} aria-pressed={selectedId === point.id} onClick={() => onSelect(point.id)}>{index + 1}</button>)}
      {(status === 'loading' || status === 'error') && <p className="ar-model-notice" role="status">{error || (model?.asset ? '공식 첨성대 모형을 준비해요. 처음에는 약 36MB를 내려받아요…' : camera ? '카메라와 입체 유물을 준비해요…' : '입체 유물을 불러와요…')}</p>}
    </div>
    <div className="ar-model-controls">
      <p role="status">{status === 'scanning' || status === 'lost' ? '출력한 유산 카드 전체를 카메라에 비춰 주세요.' : status === 'found' ? '카드를 찾았어요! 표시점을 눌러 해설을 들어 보세요.' : !camera ? (onPlace ? '끌어서 돌리고, 설명할 곳을 짧게 눌러요.' : '끌어서 돌려 보고, 표시점을 눌러요.') : ''}</p>
      {!camera && <button type="button" onClick={() => scene.current?.reset()}>처음 방향</button>}
    </div>
  </div>;
}
