import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { ModelPart } from '../../lib/ar/primitives';

export default function PrimitiveCanvas({ parts, selected, onSelect }: { parts: ModelPart[]; selected: string; onSelect: (id: string) => void }) {
  const surface = useRef<HTMLDivElement>(null);
  const runtime = useRef<{ group: any; reset: () => void } | undefined>(undefined);
  const callbacks = useRef(onSelect); callbacks.current = onSelect;
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!surface.current) return;
    let renderer: any, controls: any, observer: ResizeObserver | undefined;
    const element = surface.current, scene = new THREE.Scene(), group = new THREE.Group();
    const camera = new THREE.PerspectiveCamera(40, 1, .01, 100); camera.position.set(3, 2.5, 4);
    scene.add(group); scene.background = new THREE.Color('#F1EFEB');
    scene.add(new THREE.HemisphereLight(0xffffff, 0x776955, 2.7));
    const light = new THREE.DirectionalLight(0xffffff, 2.5); light.position.set(2, 4, 3); scene.add(light);
    const grid = new THREE.GridHelper(6, 24, '#C7C0B7', '#DDD8D0'); grid.position.y = -.005; scene.add(grid);
    let start: { x: number; y: number } | undefined;
    const down = (event: PointerEvent) => { start = { x: event.clientX, y: event.clientY }; };
    const up = (event: PointerEvent) => {
      if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) { start = undefined; return; }
      start = undefined; const rect = element.getBoundingClientRect(); const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
      const hit = ray.intersectObjects(group.children)[0]; if (hit) callbacks.current(hit.object.userData.partId);
    };
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace; element.append(renderer.domElement);
      controls = new OrbitControls(camera, renderer.domElement); controls.target.set(0, .7, 0); controls.enablePan = true; controls.minDistance = 1; controls.maxDistance = 12; controls.update(); controls.saveState();
      observer = new ResizeObserver(() => { const w = Math.max(1, element.clientWidth), h = Math.max(1, element.clientHeight); renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }); observer.observe(element);
      renderer.domElement.addEventListener('pointerdown', down); renderer.domElement.addEventListener('pointerup', up);
      renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
      runtime.current = { group, reset: () => controls.reset() }; setReady(true);
    } catch { setError('입체 편집 화면을 열지 못했어요. 브라우저를 다시 열어 주세요.'); }
    return () => {
      runtime.current = undefined; observer?.disconnect(); controls?.dispose(); renderer?.setAnimationLoop(null);
      group.children.forEach((mesh: any) => { mesh.geometry.dispose(); mesh.material.dispose(); }); grid.geometry.dispose(); grid.material.dispose();
      renderer?.domElement.removeEventListener('pointerdown', down); renderer?.domElement.removeEventListener('pointerup', up); renderer?.dispose(); element.replaceChildren();
    };
  }, []);
  useEffect(() => {
    const group = runtime.current?.group; if (!group) return;
    [...group.children].forEach((mesh: any) => { group.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); });
    parts.forEach(part => {
      const geometry = part.kind === 'box' ? new THREE.BoxGeometry(1, 1, 1) : part.kind === 'cylinder' ? new THREE.CylinderGeometry(.5, .5, 1, 32) : new THREE.TorusGeometry(.4, .1, 12, 32);
      if (part.kind === 'ring') geometry.rotateX(Math.PI / 2);
      const material = new THREE.MeshStandardMaterial({ color: part.color, roughness: .85, emissive: selected === part.id ? '#51291F' : '#000000', emissiveIntensity: .22 });
      const mesh = new THREE.Mesh(geometry, material); mesh.position.set(...part.position); mesh.scale.set(...part.scale); mesh.rotation.set(...part.rotation.map(n => n * Math.PI / 180)); mesh.userData.partId = part.id; group.add(mesh);
    });
  }, [parts, selected, ready]);
  return <div className="studio-canvas-wrap"><div className="studio-canvas" ref={surface} aria-label="도형을 눌러 선택하고 손가락으로 돌려 보는 모형 편집기" />{error && <p role="alert">{error}</p>}<div className="studio-canvas-caption"><span>한 손가락으로 회전 · 두 손가락으로 확대·이동</span><button type="button" onClick={() => runtime.current?.reset()}>처음 방향</button></div></div>;
}
