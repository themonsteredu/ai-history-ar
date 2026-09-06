import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { dataUrlBytes, MAX_MODEL_BYTES, validateGlb, type ExhibitModel, type ExhibitPoint } from './exhibit';

export interface SceneOptions {
  container: HTMLDivElement;
  model?: ExhibitModel;
  loadBuiltIn?: (signal: AbortSignal) => Promise<any>;
  image: string;
  mode: 'preview' | 'camera';
  targetFile: string;
  targetIndex: number;
  signal: AbortSignal;
  markers: () => Array<HTMLButtonElement | null>;
  points: () => ExhibitPoint[];
  onStatus: (status: 'ready' | 'scanning' | 'found' | 'lost') => void;
  onPlace?: (position: [number, number, number]) => void;
}
export interface ModelScene { dispose: () => void; reset: () => void }

function disposeObject(root: any) {
  const disposed = new Set<any>();
  const dispose = (value: any) => { if (value?.dispose && !disposed.has(value)) { disposed.add(value); value.dispose(); } };
  root.traverse((object: any) => {
    dispose(object.geometry);
    const materials = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
    materials.forEach((material: any) => {
      Object.values(material).forEach((value: any) => { if (value?.isTexture) dispose(value); });
      dispose(material);
    });
  });
}

async function readModel(model: ExhibitModel) {
  const buffer = dataUrlBytes(model.data);
  if (buffer.byteLength > MAX_MODEL_BYTES) throw new Error('12MB 이하의 3D 모형을 사용해 주세요.');
  let object: any;
  if (model.format === 'glb') {
    validateGlb(buffer);
    const manager = new THREE.LoadingManager();
    manager.setURLModifier((url: string) => {
      if (!url.startsWith('blob:') && !/^data:image\/(png|jpeg|webp);base64,/.test(url)) throw new Error('3D 모형의 그림을 파일 안에 포함해 주세요.');
      return url;
    });
    const gltf = await new GLTFLoader(manager).parseAsync(buffer, '');
    object = gltf.scene;
  } else {
    const view = new DataView(buffer);
    const binary = buffer.byteLength >= 84 && 84 + view.getUint32(80, true) * 50 === buffer.byteLength;
    if (!binary && !/^\s*solid\b/.test(new TextDecoder().decode(buffer.slice(0, 100)))) throw new Error('올바른 STL 파일이 아니에요.');
    const geometry = new STLLoader().parse(buffer);
    object = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xb29a67, metalness: .35, roughness: .58 }));
  }
  let vertices = 0;
  object.traverse((item: any) => { vertices += item.geometry?.attributes?.position?.count || 0; });
  if (!vertices || vertices > 1_000_000) { disposeObject(object); throw new Error('휴대폰에서 보기에는 모형이 너무 복잡해요. 더 가벼운 파일을 골라 주세요.'); }
  return object;
}

export async function mountModelScene(options: SceneOptions): Promise<ModelScene> {
  let disposed = false;
  let renderer: any;
  let controls: any;
  let mind: any;
  let observer: ResizeObserver | undefined;
  let content: any;
  let startingCamera = false;
  let tracked = options.mode === 'preview';
  let photoWidth = 1;
  let photoHeight = 1;
  let canvas: HTMLCanvasElement | undefined;
  const stage = new THREE.Group();
  const releaseVideo = () => {
    options.container.querySelectorAll('video').forEach(video => {
      (video.srcObject as MediaStream | null)?.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    });
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    observer?.disconnect();
    controls?.dispose();
    renderer?.setAnimationLoop(null);
    if (mind && !startingCamera) { try { mind.stop(); } catch { /* Camera may already be closed. */ } }
    releaseVideo();
    if (content) disposeObject(content);
    renderer?.dispose();
    if (canvas) { canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('pointerup', pointerUp); }
    options.markers().forEach(marker => { if (marker) marker.hidden = true; });
    options.signal.removeEventListener('abort', dispose);
    // The container belongs to this instance; it is never shared with a replacement scene.
    options.container.replaceChildren();
  };
  options.signal.addEventListener('abort', dispose, { once: true });
  if (options.signal.aborted) { dispose(); throw new DOMException('Cancelled', 'AbortError'); }

  let camera: any;
  let scene: any;
  let pointerStart: { x: number; y: number } | undefined;
  const raycaster = new THREE.Raycaster();
  const point = new THREE.Vector3();
  const pointerDown = (event: PointerEvent) => { pointerStart = { x: event.clientX, y: event.clientY }; };
  const pointerUp = (event: PointerEvent) => {
    if (!options.onPlace || !pointerStart || !canvas || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 7) return;
    pointerStart = undefined;
    const rect = canvas.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
    const hit = raycaster.intersectObject(stage, true)[0];
    if (hit) {
      const position = stage.worldToLocal(hit.point.clone());
      options.onPlace([position.x, position.y, position.z].map(n => Math.round(n * 1000) / 1000) as [number, number, number]);
    }
  };

  try {
    if (options.model?.asset && options.loadBuiltIn) content = await options.loadBuiltIn(options.signal);
    else if (options.model) content = await readModel(options.model);
    else {
      const texture = await new THREE.TextureLoader().loadAsync(options.image);
      texture.colorSpace = THREE.SRGBColorSpace;
      const aspect = texture.image.width / texture.image.height;
      content = new THREE.Mesh(new THREE.PlaneGeometry(aspect, 1), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
      content.position.y = .5;
    }
    if (disposed) { disposeObject(content); throw new DOMException('Cancelled', 'AbortError'); }
    const oriented = new THREE.Group();
    oriented.add(content);
    oriented.rotation.set(...(options.model?.rotation || [0,0,0]).map(degrees => degrees * Math.PI / 180));
    const box = new THREE.Box3().setFromObject(oriented);
    const size = box.getSize(new THREE.Vector3());
    // MindAR measures a printed target in units of its width. A photo overlay
    // keeps that exact aspect ratio; solid objects fit within one target width.
    const extent = options.model ? Math.max(size.x, size.y, size.z) : size.x;
    photoWidth = size.x / extent; photoHeight = size.y / extent;
    if (!Number.isFinite(extent) || extent <= 0) throw new Error('모형의 크기를 읽지 못했어요. 다른 파일을 골라 주세요.');
    const center = box.getCenter(new THREE.Vector3());
    oriented.position.set(-center.x, -box.min.y, -center.z);
    const fitted = new THREE.Group();
    fitted.scale.setScalar(1 / extent);
    fitted.add(oriented); stage.add(fitted);

    if (options.mode === 'camera') {
      const { MindARThree } = await import('mind-ar/dist/mindar-image-three.prod.js');
      if (disposed) throw new DOMException('Cancelled', 'AbortError');
      mind = new MindARThree({ container: options.container, imageTargetSrc: options.targetFile, maxTrack: 1, uiLoading: 'no', uiScanning: 'no', uiError: 'no' });
      ({ renderer, scene, camera } = mind);
      // Stand a solid model on the card; keep the photo fallback on its surface.
      stage.rotation.x = options.model ? Math.PI / 2 : 0;
      if (!options.model) stage.position.y = -photoHeight / 2;
      stage.position.z = .02;
      const anchor = mind.addAnchor(options.targetIndex);
      anchor.group.add(stage);
      anchor.onTargetFound = () => { if (!disposed) { tracked = true; options.onStatus('found'); } };
      anchor.onTargetLost = () => { if (!disposed) { tracked = false; options.onStatus('lost'); } };
    } else {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(40, 1, .01, 50);
      camera.position.set(1.25, 1.05, 1.8);
      scene.add(stage);
      options.container.append(renderer.domElement);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, size.y / extent * .45, 0);
      controls.enablePan = false;
      controls.minDistance = .8; controls.maxDistance = 4;
      controls.update(); controls.saveState();
      observer = new ResizeObserver(() => {
        if (disposed) return;
        const width = Math.max(1, options.container.clientWidth), height = Math.max(1, options.container.clientHeight);
        renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix();
      });
      observer.observe(options.container);
    }
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x63523c, 2.5));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(1.5, 3, 2); scene.add(light);
    canvas = renderer.domElement;
    canvas!.addEventListener('pointerdown', pointerDown);
    canvas!.addEventListener('pointerup', pointerUp);
    if (options.mode === 'camera') {
      startingCamera = true;
      try { await mind.start(); }
      finally {
        startingCamera = false;
        if (disposed) { try { mind.stop(); } catch { /* Permission may have been denied. */ } releaseVideo(); options.container.replaceChildren(); }
      }
      if (disposed) throw new DOMException('Cancelled', 'AbortError');
      if (!tracked) options.onStatus('scanning');
    } else options.onStatus('ready');
    renderer.setAnimationLoop(() => {
      if (disposed) return;
      controls?.update();
      renderer.render(scene, camera);
      const rect = options.container.getBoundingClientRect();
      const canvasRect = canvas!.getBoundingClientRect();
      const markers = options.markers();
      options.points().forEach((hotspot, index) => {
        const marker = markers[index];
        if (!marker) return;
        if (options.model) point.set(...hotspot.position);
        else point.set((hotspot.photoPosition[0] - .5) * photoWidth, (1 - hotspot.photoPosition[1]) * photoHeight, .005);
        point.applyMatrix4(stage.matrixWorld).project(camera);
        const x = (point.x + 1) / 2 * canvasRect.width + canvasRect.left - rect.left;
        const y = (1 - point.y) / 2 * canvasRect.height + canvasRect.top - rect.top;
        marker.hidden = !tracked || point.z < -1 || point.z > 1 || x < 22 || x > rect.width - 22 || y < 22 || y > rect.height - 22;
        marker.style.left = `${x}px`; marker.style.top = `${y}px`;
      });
    });
    return { dispose, reset: () => controls?.reset() };
  } catch (error) { dispose(); throw error; }
}
