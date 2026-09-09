import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { arTargetUrl, researchForEra } from '../../content/heritageCatalog';
import type { ArExhibit } from '../../lib/ar/exhibit';
import type { ExhibitionSound } from '../../lib/ar/sound';
export interface CameraWork { group: number; heritageId: number; ar: ArExhibit }

export default function ClassroomCamera({ works, sound, onClose }: { works: CameraWork[]; sound: ExhibitionSound; onClose: () => void }) {
  const [selectedGroups, setSelectedGroups] = useState<Record<number, number>>({});
  const choices = Object.fromEntries(works.map(work => [work.heritageId, works.filter(w => w.heritageId === work.heritageId)]));
  const chosen = Object.values(choices).map(list => list.find(w => w.group === selectedGroups[list[0].heritageId]) || list[0]);
  const chosenKey = chosen.map(w => w.group).join(',');
  const [active, setActive] = useState<number | null>(null); const activeRef = useRef<number | null>(null);
  const [pointId, setPointId] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const surface = useRef<HTMLDivElement>(null); const markers = useRef<Array<HTMLButtonElement | null>>([]); const audio = useRef<HTMLAudioElement>(null);
  const work = chosen.find(w => w.group === active); const point = work?.ar.points.find(p => p.id === pointId) || work?.ar.points[0];
  useEffect(() => {
    const player = audio.current; return () => { player?.pause(); sound.narration(false); };
  }, [sound]);
  useEffect(() => {
    if (!surface.current) return;
    const element = document.createElement('div'); element.className = 'ar-model-surface'; surface.current.append(element);
    let mind: any, renderer: any, cancelled = false, starting = false;
    const objects: any[] = []; const stages = new Map<number, any>();
    const selectedWorks = new Map(chosen.map(w => [w.group, w]));
    const player = audio.current;
    setLoading(true); setError(''); setActive(null); activeRef.current = null;
    const releaseVideo = () => element.querySelectorAll('video').forEach(video => { (video.srcObject as MediaStream | null)?.getTracks().forEach(track => track.stop()); video.srcObject = null; });
    const stopCamera = () => { try { mind?.stop(); } catch { /* pending camera permission */ } releaseVideo(); };
    void (async () => {
      const { MindARThree } = await import('mind-ar/dist/mindar-image-three.prod.js'); if (cancelled) return;
      mind = new MindARThree({ container: element, imageTargetSrc: arTargetUrl('three-kingdoms'), maxTrack: 1, uiLoading: 'no', uiScanning: 'no', uiError: 'no' });
      renderer = mind.renderer; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace;
      mind.scene.add(new THREE.HemisphereLight(0xffffff, 0x63523c, 2.5)); const light = new THREE.DirectionalLight(0xffffff, 3); light.position.set(1.5, 3, 2); mind.scene.add(light);
      for (const selected of chosen) {
        const content = new THREE.Group();
        for (const part of selected.ar.model?.parts || []) {
          const g = part.kind === 'box' ? new THREE.BoxGeometry(1, 1, 1) : part.kind === 'cylinder' ? new THREE.CylinderGeometry(.5, .5, 1, 32) : new THREE.TorusGeometry(.4, .1, 12, 32);
          if (part.kind === 'ring') g.rotateX(Math.PI / 2);
          const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: part.color, roughness: .85, metalness: .05 })); mesh.position.set(...part.position); mesh.scale.set(...part.scale); mesh.rotation.set(...part.rotation.map(n => n * Math.PI / 180)); content.add(mesh); objects.push(mesh);
        }
        content.rotation.set(...(selected.ar.model?.rotation || [0, 0, 0]).map(n => n * Math.PI / 180));
        const box = new THREE.Box3().setFromObject(content), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
        const extent = Math.max(size.x, size.y, size.z); if (!Number.isFinite(extent) || extent <= 0) throw new Error('모형의 크기를 확인하지 못했어요.');
        content.position.set(-center.x, -box.min.y, -center.z); const fit = new THREE.Group(); fit.scale.setScalar(1 / extent); fit.add(content);
        const stage = new THREE.Group(); stage.add(fit); stage.rotation.x = Math.PI / 2; stage.position.z = .02; stages.set(selected.group, stage);
        const anchor = mind.addAnchor(selected.heritageId - 1); anchor.group.add(stage);
        anchor.onTargetFound = () => { if (cancelled) return; player?.pause(); sound.narration(false); activeRef.current = selected.group; setActive(selected.group); setPointId(selected.ar.points[0].id); if (player) { player.src = selected.ar.points[0].narration?.data || ''; player.load(); } sound.effect('found'); };
        anchor.onTargetLost = () => { if (cancelled || activeRef.current !== selected.group) return; player?.pause(); sound.narration(false); activeRef.current = null; setActive(null); };
      }
      starting = true; try { await mind.start(); } finally { starting = false; if (cancelled) stopCamera(); }
      if (cancelled) return; setLoading(false);
      renderer.setAnimationLoop(() => {
        if (cancelled) return; renderer.render(mind.scene, mind.camera);
        const current = selectedWorks.get(activeRef.current || -1), stage = stages.get(activeRef.current || -1);
        const rect = surface.current?.getBoundingClientRect(), canvasRect = renderer.domElement.getBoundingClientRect();
        markers.current.forEach((button, i) => {
          if (!button) return; const p = current?.ar.points[i]; if (!p || !stage || !rect) { button.hidden = true; return; }
          const projected = new THREE.Vector3(...p.position).applyMatrix4(stage.matrixWorld).project(mind.camera);
          const x = (projected.x + 1) / 2 * canvasRect.width + canvasRect.left - rect.left, y = (1 - projected.y) / 2 * canvasRect.height + canvasRect.top - rect.top;
          button.hidden = projected.z < -1 || projected.z > 1 || x < 22 || y < 22 || x > rect.width - 22 || y > rect.height - 22;
          button.style.left = `${x}px`; button.style.top = `${y}px`;
        });
      });
    })().catch(e => { if (!cancelled) { setLoading(false); setError(e instanceof DOMException && e.name === 'NotAllowedError' ? '카메라 사용을 허용한 뒤 다시 시작해 주세요.' : e instanceof Error ? e.message : 'AR 카메라를 열지 못했어요.'); stopCamera(); } });
    return () => { cancelled = true; markers.current.forEach(button => { if (button) button.hidden = true; }); player?.pause(); sound.narration(false); renderer?.setAnimationLoop(null); releaseVideo(); if (!starting) stopCamera(); objects.forEach(mesh => { mesh.geometry.dispose(); mesh.material.dispose(); }); renderer?.dispose(); element.remove(); };
  }, [works, chosenKey, sound]);
  function select(id: string) {
    const next = work?.ar.points.find(p => p.id === id); if (!next) return; setPointId(id); audio.current?.pause();
    if (next.narration && audio.current) { audio.current.src = next.narration.data; void audio.current.play().catch(() => setError('재생 버튼을 눌러 해설을 들어 주세요.')); }
  }
  const heritage = researchForEra('three-kingdoms').find(h => h.id === work?.heritageId)?.heritage;
  return <section className="studio-auto-camera"><div className="studio-actions"><h2>카드를 비추면 작품을 찾아요</h2><button onClick={onClose}>카메라 닫기</button></div>{Object.values(choices).filter(list => list.length > 1).map(list => <label key={list[0].heritageId}>같은 유물 카드의 관람 모둠<select value={selectedGroups[list[0].heritageId] || list[0].group} onChange={e => setSelectedGroups(old => ({ ...old, [list[0].heritageId]: Number(e.target.value) }))}>{list.map(w => <option value={w.group} key={w.group}>{w.group}모둠</option>)}</select></label>)}<div className="ar-model-stage studio-camera-stage" ref={surface}>{[0, 1, 2, 3].map(i => <button hidden ref={el => { markers.current[i] = el; }} key={i} className="ar-hotspot" aria-label={`${i + 1}번 해설 듣기`} onClick={() => { if (work?.ar.points[i]) select(work.ar.points[i].id); }}>{i + 1}</button>)}</div><p role="status">{loading ? '카메라와 모둠 작품을 준비해요…' : error || (work ? `${work.group}모둠 · ${heritage}` : '출력한 유물 카드 전체를 비춰 주세요.')}</p>{work && <div className="studio-camera-reading"><div className="studio-tabs">{work.ar.points.map((p, i) => <button aria-pressed={point?.id === p.id} key={p.id} onClick={() => select(p.id)}>해설 {i + 1}</button>)}</div><h3>{point?.title}</h3><p>{point?.text}</p></div>}<audio ref={audio} hidden={!work || !point?.narration} controls onPlaying={() => sound.narration(true)} onPause={() => sound.narration(false)} onEnded={() => sound.narration(false)} onError={() => { sound.narration(false); setError('이 기기에서 음성을 재생하지 못했어요. 설명 글을 확인해 주세요.'); }} /></section>;
}
