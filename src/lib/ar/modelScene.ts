import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { dataUrlBytes, MAX_MODEL_BYTES, validateGlb, type ExhibitModel, type ExhibitPoint } from './exhibit';
import type { PreparedModelKey } from './preparedCatalog';
import { followPose, steadyTrackingFilter } from './steadyPose';
import { pinBubbleLayout, type PinBubbleLayout } from './pinBubble';

export interface SceneOptions {
  container: HTMLDivElement;
  model?: ExhibitModel;
  loadBuiltIn?: (signal: AbortSignal) => Promise<any>;
  image: string;
  mode: 'preview' | 'camera';
  cardPlacement?: () => CardPlacement;
  targetFile: string;
  targetIndex: number;
  signal: AbortSignal;
  markers: () => Array<HTMLButtonElement | null>;
  points: () => ExhibitPoint[];
  onStatus: (status: 'ready' | 'scanning' | 'found' | 'lost') => void;
  onPreviewFallback?: () => void;
  onTextureUnavailable?: () => void;
  onPlace?: (position: [number, number, number]) => void;
  /** Camera mode: damp tracking shake so a model on a still card stands steady. */
  steady?: boolean;
  /** Camera mode: a sideways swipe turns the model on the card like a turntable. */
  spin?: boolean;
}
export interface ModelScene { dispose: () => void; reset: () => void }

export type CardPlacement = 'table' | 'upright';
/** Change display orientation only; museum geometry and texture remain untouched. */
export function cameraCardTransform(hasModel: boolean, height: number, placement: CardPlacement) {
  const standingOnTable = hasModel && placement === 'table';
  return { rotationX: standingOnTable ? Math.PI / 2 : 0, offsetY: standingOnTable ? 0 : -height / 2 };
}

export function disposeObject(root: any) {
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

export async function readModel(model: ExhibitModel, withImages = true, signal = new AbortController().signal) {
  if (model.asset === 'cheomseongdae-nsm-2015') {
    const { loadCheomseongdaeOriginal } = await import('../../content/three-kingdoms/cheomseongdaeOriginal');
    return loadCheomseongdaeOriginal(signal, withImages);
  }
  if (model.asset === 'goryeo-buddha') {
    const { createBuddhaModel } = await import('./goryeo/buddha');
    return createBuddhaModel();
  }
  if (model.asset === 'goryeo-type') {
    const { createTypeModel } = await import('./goryeo/type');
    return createTypeModel();
  }
  if (model.asset === 'goryeo-tripitaka') {
    const { createTripitakaModel } = await import('./goryeo/tripitaka');
    return createTripitakaModel();
  }
  if (model.format === 'preset' && model.preset?.startsWith('joseon-')) {
    const { createJoseonModel } = await import('./joseon');
    return createJoseonModel(model.preset, withImages);
  }
  if (model.format === 'preset' && model.preset) {
    const { createPreparedModel } = await import('./preparedModels');
    return createPreparedModel(model.preset as PreparedModelKey, withImages);
  }
  if (model.format === 'primitives') {
    const group = new THREE.Group();
    for (const part of model.parts || []) {
      const geometry = part.kind === 'box' ? new THREE.BoxGeometry(1, 1, 1) : part.kind === 'cylinder' ? new THREE.CylinderGeometry(.5, .5, 1, 32) : new THREE.TorusGeometry(.4, .1, 12, 32);
      if (part.kind === 'ring') geometry.rotateX(Math.PI / 2);
      const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: part.color, roughness: .85, metalness: .05 }));
      mesh.position.set(...part.position); mesh.scale.set(...part.scale);
      mesh.rotation.set(...part.rotation.map(value => value * Math.PI / 180));
      group.add(mesh);
    }
    return group;
  }
  const preparedFiles: Record<string,string> = {
    'goryeo-vase': 'ar/goryeo-models/vase.glb',
    'goryeo-incense': 'ar/goryeo-models/incense.glb',
    'goryeo-lacquer': 'ar/goryeo-models/lacquer.glb',
  };
  const preparedFile = model.asset && preparedFiles[model.asset];
  let buffer: ArrayBuffer;
  if (preparedFile) {
    const response = await fetch(`${import.meta.env.BASE_URL}${preparedFile}`, { signal });
    if (!response.ok) throw new Error('박물관 3D 자료를 불러오지 못했어요.');
    buffer = await response.arrayBuffer();
  } else buffer = dataUrlBytes(model.data);
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

/** Map a photo tap onto the front of the same fitted model used by the AR viewer. */
export async function photoToModelPosition(model: ExhibitModel, coordinates: [number, number]): Promise<[number, number, number]> {
  return (await photoToModelPositions(model, [coordinates]))[0];
}

export async function photoToModelPositions(model: ExhibitModel, coordinates: Array<[number, number]>): Promise<Array<[number, number, number]>> {
  const content = await readModel(model, false);
  try {
    const oriented = new THREE.Group();
    oriented.add(content);
    oriented.rotation.set(...model.rotation.map(degrees => degrees * Math.PI / 180));
    const bounds = new THREE.Box3().setFromObject(oriented);
    const size = bounds.getSize(new THREE.Vector3());
    const extent = Math.max(size.x, size.y, size.z);
    if (!Number.isFinite(extent) || extent <= 0) throw new Error('모형의 크기를 확인해 주세요.');
    const center = bounds.getCenter(new THREE.Vector3());
    oriented.position.set(-center.x, -bounds.min.y, -center.z);
    const fitted = new THREE.Group(); fitted.scale.setScalar(1 / extent); fitted.add(oriented); fitted.updateMatrixWorld(true);
    return coordinates.map(coordinate => {
      const x = (coordinate[0] - .5) * size.x / extent;
      const y = (1 - coordinate[1]) * size.y / extent;
      const ray = new THREE.Raycaster(new THREE.Vector3(x, y, 2), new THREE.Vector3(0, 0, -1));
      const hit = ray.intersectObject(fitted, true)[0];
      const position = hit ? hit.point.add(new THREE.Vector3(0, 0, .015)) : new THREE.Vector3(x, y, size.z / extent / 2 + .015);
      return position.toArray().map((n: number) => Math.round(n * 1000) / 1000) as [number, number, number];
    });
  } finally { disposeObject(content); }
}

export async function mountModelScene(options: SceneOptions): Promise<ModelScene> {
  let disposed = false;
  let renderer: any;
  let controls: any;
  let mind: any;
  let observer: ResizeObserver | undefined;
  let content: any;
  let startingCamera = false;
  let softwarePreview = false;
  let environmentTarget: InstanceType<typeof THREE.WebGLRenderTarget> | undefined;
  let tracked = options.mode === 'preview';
  let photoWidth = 1;
  let photoHeight = 1;
  let canvas: HTMLCanvasElement | undefined;
  let pointerTarget: HTMLElement | undefined;
  const stage = new THREE.Group();
  // The model and its pins live in `spinner`, so turning it on the card turns the pins with it.
  const spinner = new THREE.Group(); stage.add(spinner);
  let follower: InstanceType<typeof THREE.Group> | undefined;
  let followed: any;
  let freshPose = true, lastFrame = 0;
  let spinFrom: number | undefined;
  let lastPlacement: CardPlacement | undefined;
  const bubbles = new WeakMap<HTMLElement, PinBubbleLayout>();
  // Runs every frame, so only the values that changed are written.
  const placeBubble = (marker: HTMLElement, x: number, y: number, width: number, height: number) => {
    const before = bubbles.get(marker), next = pinBubbleLayout(x, y, width, height, before?.side);
    if (next.side !== before?.side) marker.dataset.bubble = next.side;
    for (const [key, property] of [['maxWidth', '--bubble-w'], ['maxHeight', '--bubble-h'], ['from', '--bubble-from'], ['to', '--bubble-to']] as const) {
      if (next[key] !== before?.[key]) marker.style.setProperty(property, `${next[key]}px`);
    }
    bubbles.set(marker, next);
  };
  const updateCardPlacement = () => {
    const placement = options.cardPlacement?.() || 'table';
    if (placement === lastPlacement) return;
    lastPlacement = placement;
    const transform = cameraCardTransform(!!options.model, photoHeight, placement);
    stage.rotation.x = transform.rotationX; stage.position.y = transform.offsetY;
    stage.position.z = .02;
  };
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
    environmentTarget?.dispose();
    renderer?.dispose();
    if (pointerTarget) {
      pointerTarget.removeEventListener('pointerdown', pointerDown); pointerTarget.removeEventListener('pointerup', pointerUp);
      pointerTarget.removeEventListener('pointermove', pointerMove); pointerTarget.removeEventListener('pointercancel', pointerEnd);
    }
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
  const pointerDown = (event: PointerEvent) => {
    pointerStart = { x: event.clientX, y: event.clientY };
    if (options.spin && options.mode === 'camera') spinFrom = event.clientX;
  };
  const pointerMove = (event: PointerEvent) => {
    if (spinFrom === undefined || !pointerStart) return;
    // Capture only once it is clearly a swipe, so a tap on a numbered pin still reaches the pin.
    if (Math.abs(event.clientX - pointerStart.x) > 7 && !pointerTarget?.hasPointerCapture(event.pointerId)) {
      try { pointerTarget?.setPointerCapture(event.pointerId); } catch { /* still spins while over the view */ }
    }
    spinner.rotation.y += (event.clientX - spinFrom) * .012; spinFrom = event.clientX;
  };
  const pointerEnd = () => { spinFrom = undefined; };
  const pointerUp = (event: PointerEvent) => {
    pointerEnd();
    if (!options.onPlace || !pointerStart || !canvas || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 7) return;
    pointerStart = undefined;
    const rect = canvas.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
    const hit = raycaster.intersectObject(stage, true)[0];
    if (hit) {
      const position = spinner.worldToLocal(hit.point.clone());
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
    if (content.userData.photoTextureLoaded === false) options.onTextureUnavailable?.();
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
    // Museum scans fill the printed card too closely when viewed from above.
    // Keep a little space around them in camera mode; the preview stays full-size.
    const cameraScale = options.mode === 'camera' && options.model?.asset?.startsWith('goryeo-') ? .42 : 1;
    fitted.scale.setScalar(cameraScale / extent);
    fitted.add(oriented); spinner.add(fitted);

    if (options.mode === 'camera') {
      const { MindARThree } = await import('mind-ar/dist/mindar-image-three.prod.js');
      if (disposed) throw new DOMException('Cancelled', 'AbortError');
      mind = new MindARThree({ container: options.container, imageTargetSrc: options.targetFile, maxTrack: 1, uiLoading: 'no', uiScanning: 'no', uiError: 'no', ...(options.steady ? steadyTrackingFilter : {}) });
      ({ renderer, scene, camera } = mind);
      // A vertical computer screen needs a different display orientation from a desk card.
      updateCardPlacement();
      const anchor = mind.addAnchor(options.targetIndex);
      if (options.steady) {
        // The stage follows a smoothed copy of the card pose instead of the raw, slightly noisy one.
        follower = new THREE.Group(); follower.visible = false; follower.add(stage); scene.add(follower); followed = anchor.group;
      } else anchor.group.add(stage);
      anchor.onTargetFound = () => { if (!disposed) { tracked = true; options.onStatus('found'); } };
      anchor.onTargetLost = () => { if (!disposed) { tracked = false; options.onStatus('lost'); } };
    } else {
      try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
      catch (error) {
        if (options.model?.format !== 'preset' && options.model?.format !== 'primitives') throw error;
        const { createSoftwarePreview } = await import('./softwarePreview');
        if (disposed) throw new DOMException('Cancelled', 'AbortError');
        renderer = createSoftwarePreview(); softwarePreview = true; options.onPreviewFallback?.();
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(40, 1, .01, 50);
      camera.position.set(1.25, 1.05, 1.8);
      if (options.model && photoHeight < .5) camera.position.multiplyScalar(.7);
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
    const museumOriginal = options.model?.asset === 'cheomseongdae-nsm-2015';
    const photoReconstruction = !!content.userData.reconstruction;
    if (photoReconstruction && !softwarePreview) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
      if (options.model?.preset === 'samguk-incense-v1' || options.model?.preset === 'samguk-crown-v1' || content.userData.metallic) {
        // Local area lights supply reflections to gold without fetching an external HDRI.
        const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
        if (disposed) throw new DOMException('Cancelled', 'AbortError');
        const room = new RoomEnvironment(), generator = new THREE.PMREMGenerator(renderer);
        try { environmentTarget = generator.fromScene(room, .04); scene.environment = environmentTarget.texture; }
        finally { generator.dispose(); room.dispose(); }
      }
    }
    scene.add(new THREE.HemisphereLight(0xffffff, 0x63523c, museumOriginal ? 1 : photoReconstruction ? 1.5 : 2.5));
    const light = new THREE.DirectionalLight(0xffffff, museumOriginal ? .6 : photoReconstruction ? 2.2 : 3);
    light.position.set(1.5, 3, 2); scene.add(light);
    canvas = renderer.domElement;
    // MindAR lays a CSS layer over its canvas, so camera mode listens on the whole view; taps for placing stay on the canvas.
    pointerTarget = options.mode === 'camera' ? options.container : canvas;
    pointerTarget!.addEventListener('pointerdown', pointerDown);
    pointerTarget!.addEventListener('pointerup', pointerUp);
    pointerTarget!.addEventListener('pointermove', pointerMove);
    pointerTarget!.addEventListener('pointercancel', pointerEnd);
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
      if (options.mode === 'camera') updateCardPlacement();
      if (follower && followed) {
        const now = performance.now(), seconds = lastFrame ? (now - lastFrame) / 1000 : 0; lastFrame = now;
        if (followed.visible) { followPose(follower, followed.matrix, seconds, freshPose); freshPose = false; follower.visible = true; }
        else { follower.visible = false; freshPose = true; }
      }
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
        point.applyMatrix4(spinner.matrixWorld).project(camera);
        const x = (point.x + 1) / 2 * canvasRect.width + canvasRect.left - rect.left;
        const y = (1 - point.y) / 2 * canvasRect.height + canvasRect.top - rect.top;
        marker.hidden = !tracked || point.z < -1 || point.z > 1 || x < 22 || x > rect.width - 22 || y < 22 || y > rect.height - 22;
        marker.style.left = `${x}px`; marker.style.top = `${y}px`;
        // An open speech bubble rides inside its pin; a fresh one starts without last time's side.
        if (!marker.lastElementChild) bubbles.delete(marker);
        else if (!marker.hidden) placeBubble(marker, x, y, rect.width, rect.height);
      });
    });
    return { dispose, reset: () => { controls?.reset(); spinner.rotation.y = 0; } };
  } catch (error) { dispose(); throw error; }
}
