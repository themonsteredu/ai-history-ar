import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { cameraCardTransform, disposeObject, readModel } from '../../lib/ar/modelScene';
import { cameraFailureMessage } from '../../lib/ar/cameraDiagnosis';
import { followPose, steadyTrackingFilter } from '../../lib/ar/steadyPose';
import type { ExhibitModel } from '../../lib/ar/exhibit';
import { artifacts } from './data';
import { goryeoCardPoints } from './cardPoints';
import { photos } from './photos';
import './goryeo-scanner.css';

const assets: Record<string, ExhibitModel['asset']> = {
  buddha: 'goryeo-buddha', type: 'goryeo-type', tripitaka: 'goryeo-tripitaka',
  vase: 'goryeo-vase', incense: 'goryeo-incense', lacquer: 'goryeo-lacquer',
};
const reconstructions = new Set(['buddha', 'type', 'tripitaka']);
// Leave room for the model and its markers on a phone when the paper fills much of the camera view.
const cameraScale = .30;
type Stage = { spinner: any; follower: any; anchor: any; fresh: boolean };

/** One camera and six target anchors: presenting a different card does not restart the camera. */
export default function GoryeoScanner({ onClose, onDetected, onQuiz }: {
  onClose: () => void; onDetected: (id: string) => void; onQuiz?: () => void;
}) {
  const surface = useRef<HTMLDivElement>(null);
  const markers = useRef<Array<HTMLButtonElement | null>>([]);
  const onDetectedRef = useRef(onDetected); onDetectedRef.current = onDetected;
  const activeRef = useRef<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [pointId, setPointId] = useState('');
  const [loading, setLoading] = useState(true);
  const [modelLoading, setModelLoading] = useState(false);
  const [error, setError] = useState('');
  const [textureMissing, setTextureMissing] = useState(false);
  const artifact = artifacts.find(item => item.id === active);
  const points = active ? goryeoCardPoints[active] : undefined;
  const point = points?.find(item => item.id === pointId);

  useEffect(() => {
    const host = surface.current;
    if (!host) return;
    const element = document.createElement('div'); element.className = 'ar-model-surface'; host.prepend(element);
    let mind: any, renderer: any, cancelled = false, starting = false, lastFrame = 0;
    let startX: number | undefined, lastX: number | undefined;
    const abort = new AbortController();
    const stages = new Map<string, Stage>();
    const models = new Map<string, Promise<void>>();
    const objects: any[] = [];
    const releaseVideo = () => element.querySelectorAll('video').forEach(video => {
      (video.srcObject as MediaStream | null)?.getTracks().forEach(track => track.stop()); video.srcObject = null;
    });
    const stopCamera = () => { try { mind?.stop(); } catch { /* Camera may already be closed. */ } releaseVideo(); };
    const down = (event: PointerEvent) => { startX = lastX = event.clientX; };
    const move = (event: PointerEvent) => {
      if (startX === undefined || lastX === undefined) return;
      if (Math.abs(event.clientX - startX) > 7 && !element.hasPointerCapture(event.pointerId)) {
        try { element.setPointerCapture(event.pointerId); } catch { /* Pointer may have moved away. */ }
      }
      const stage = activeRef.current && stages.get(activeRef.current);
      if (stage) stage.spinner.rotation.y += (event.clientX - lastX) * .012;
      lastX = event.clientX;
    };
    const end = () => { startX = lastX = undefined; };
    element.addEventListener('pointerdown', down); element.addEventListener('pointermove', move);
    element.addEventListener('pointerup', end); element.addEventListener('pointercancel', end);
    activeRef.current = null;

    void (async () => {
      const { MindARThree } = await import('mind-ar/dist/mindar-image-three.prod.js');
      if (cancelled) return;
      mind = new MindARThree({ container: element, imageTargetSrc: `${import.meta.env.BASE_URL}ar/goryeo-targets.mind`, maxTrack: 1, uiLoading: 'no', uiScanning: 'no', uiError: 'no', ...steadyTrackingFilter });
      renderer = mind.renderer; renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace;
      mind.scene.add(new THREE.HemisphereLight(0xffffff, 0x63523c, 2.5));
      const light = new THREE.DirectionalLight(0xffffff, 3); light.position.set(1.5, 3, 2); mind.scene.add(light);
      const loadModel = (id: string) => {
        const existing = models.get(id); if (existing) return existing;
        const item = artifacts.find(candidate => candidate.id === id)!;
        const model: ExhibitModel = { format: 'glb', asset: assets[id], data: '', name: item.name, credit: '', source: photos[id].source, rotation: id === 'tripitaka' ? [-90, 0, 0] : [0, 0, 0] };
        const promise = (async () => {
          const content = await readModel(model, true, abort.signal);
          if (cancelled) { disposeObject(content); return; }
          objects.push(content);
          if (content.userData.photoTextureLoaded === false) setTextureMissing(true);
          const oriented = new THREE.Group(); oriented.add(content);
          oriented.rotation.set(...model.rotation.map(degrees => degrees * Math.PI / 180));
          const box = new THREE.Box3().setFromObject(oriented), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
          const extent = Math.max(size.x, size.y, size.z);
          if (!Number.isFinite(extent) || extent <= 0) throw new Error('모형의 크기를 읽지 못했어요.');
          oriented.position.set(-center.x, -box.min.y, -center.z);
          const fitted = new THREE.Group(); fitted.scale.setScalar(cameraScale / extent); fitted.add(oriented);
          stages.get(id)!.spinner.add(fitted);
        })();
        models.set(id, promise);
        void promise.catch(() => { models.delete(id); });
        return promise;
      };
      artifacts.forEach((item, index) => {
        const anchor = mind.addAnchor(index);
        const follower = new THREE.Group(), stage = new THREE.Group(), spinner = new THREE.Group();
        follower.visible = false; follower.add(stage); stage.add(spinner); mind.scene.add(follower);
        const transform = cameraCardTransform(true, 1, 'table');
        stage.rotation.x = transform.rotationX; stage.position.y = transform.offsetY; stage.position.z = .02;
        stages.set(item.id, { spinner, follower, anchor, fresh: true });
        anchor.onTargetFound = () => {
          if (cancelled) return;
          activeRef.current = item.id; setActive(item.id); setPointId(''); setError(''); setModelLoading(true);
          onDetectedRef.current(item.id);
          void loadModel(item.id).then(() => {
            if (!cancelled && activeRef.current === item.id) setModelLoading(false);
          }).catch(() => {
            if (!cancelled && activeRef.current === item.id) { setModelLoading(false); setError('입체 유물을 불러오지 못했어요. 인터넷을 확인한 뒤 카드를 다시 비춰 주세요.'); }
          });
        };
        anchor.onTargetLost = () => {
          if (cancelled || activeRef.current !== item.id) return;
          activeRef.current = null; setActive(null); setPointId(''); setModelLoading(false); setError('');
        };
      });
      starting = true;
      try { await mind.start(); } finally { starting = false; if (cancelled) stopCamera(); }
      if (cancelled) return;
      setLoading(false);
      renderer.setAnimationLoop(() => {
        if (cancelled) return;
        const now = performance.now(), seconds = lastFrame ? (now - lastFrame) / 1000 : 0; lastFrame = now;
        stages.forEach(stage => {
          if (stage.anchor.group.visible) { followPose(stage.follower, stage.anchor.group.matrix, seconds, stage.fresh); stage.fresh = false; stage.follower.visible = true; }
          else { stage.follower.visible = false; stage.fresh = true; }
        });
        renderer.render(mind.scene, mind.camera);
        const id = activeRef.current, stage = id ? stages.get(id) : undefined, rect = host.getBoundingClientRect(), canvasRect = renderer.domElement.getBoundingClientRect();
        markers.current.forEach((button, index) => {
          if (!button) return;
          const hotspot = id && goryeoCardPoints[id]?.[index];
          if (!hotspot || !stage?.follower.visible || !models.has(id!)) { button.hidden = true; return; }
          const [x, y, z] = hotspot.position;
          const position = id === 'tripitaka' ? [cameraScale * x, cameraScale * (z + .0355), cameraScale * (.18 - y)] : [cameraScale * x, cameraScale * y, cameraScale * z];
          const projected = new THREE.Vector3(position[0], position[1], position[2]).applyMatrix4(stage.spinner.matrixWorld).project(mind.camera);
          const left = (projected.x + 1) / 2 * canvasRect.width + canvasRect.left - rect.left;
          const top = (1 - projected.y) / 2 * canvasRect.height + canvasRect.top - rect.top;
          button.hidden = projected.z < -1 || projected.z > 1 || left < 22 || top < 22 || left > rect.width - 22 || top > rect.height - 22;
          button.style.left = `${left}px`; button.style.top = `${top}px`;
        });
      });
    })().catch(reason => {
      if (cancelled) return;
      setLoading(false); stopCamera();
      void cameraFailureMessage(reason, navigator, window.isSecureContext).then(message => { if (!cancelled) setError(message); });
    });
    return () => {
      cancelled = true; abort.abort(); activeRef.current = null;
      markers.current.forEach(button => { if (button) button.hidden = true; });
      renderer?.setAnimationLoop(null); releaseVideo(); if (!starting) stopCamera();
      element.removeEventListener('pointerdown', down); element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerup', end); element.removeEventListener('pointercancel', end);
      objects.forEach(disposeObject); renderer?.dispose(); element.remove();
    };
  }, []);

  return <div className="goryeo-scanner" role="dialog" aria-modal="true" aria-label="고려 유물 AR 카메라">
    <div className="goryeo-scanner-top"><b>고려 유물 AR 카메라</b><button onClick={onClose}>닫기</button></div>
    <div className="goryeo-scanner-stage ar-model-stage" ref={surface}>
      {[0, 1, 2].map(index => <button hidden ref={el => { markers.current[index] = el; }} key={index} className="ar-hotspot" aria-label={`${index + 1}번 설명 보기`} aria-pressed={pointId === points?.[index]?.id} onClick={() => { if (points?.[index]) setPointId(points[index].id); }}>{index + 1}</button>)}
    </div>
    <div className="goryeo-scanner-bottom">
      <p role="status">{loading ? '카메라를 준비해요. 카메라 사용을 허용해 주세요.' : error || (artifact ? `${artifact.short} 카드를 찾았어요!${modelLoading ? ' 입체 유물을 불러와요…' : ' 화면을 좌우로 밀면 유물이 돌아가요.'}` : '인쇄한 고려 유물 카드 전체를 밝은 곳에서 비춰 주세요.')}</p>
      {textureMissing && <p>일부 사진 표면을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.</p>}
      {artifact && points && <div className="goryeo-scanner-reading">
        <p><b>{artifact.name}</b> · {artifact.role}</p>
        <p>{artifact.id === 'buddha' ? '선생님이 미리 완성한 시범 카드의 설명 3개를 눌러 읽어요.' : '학생이 미리 완성한 카드의 설명 3개를 눌러 읽어요.'}</p>
        <div className="goryeo-ar-points" aria-label="AR 카드 설명 번호">{points.map((item, index) => <button type="button" key={item.id} aria-pressed={pointId === item.id} onClick={() => setPointId(item.id)}>{index + 1}번</button>)}</div>
        {point && <p className="goryeo-scanner-detail" aria-live="polite"><b>{point.title}</b> · {point.text}</p>}
        {onQuiz && <button className="goryeo-scanner-quiz" onClick={onQuiz}>닫고 이 유물 OX 풀기 →</button>}
        <p className="goryeo-scanner-credit">{reconstructions.has(artifact.id) ? '사진을 참고한 학습용 3D 재현 · 보이지 않는 부분은 추정' : '3D: 국립중앙박물관 · 공공누리 제1유형 · 웹용 변환'} · <a href={photos[artifact.id].source} target="_blank" rel="noreferrer">사진 출처</a>{artifact.id === 'tripitaka' && <> · 복제 경판 사진: <a href="https://commons.wikimedia.org/wiki/File:Korea-Haeinsa_Tripitaka_Koreana_woodblock_2770-06a.jpg" target="_blank" rel="noreferrer">Steve46814 / Wikimedia Commons</a> · CC BY-SA 3.0</>}</p>
      </div>}
    </div>
  </div>;
}
