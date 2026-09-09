import * as THREE from 'three';
import { Projector } from 'three/examples/jsm/renderers/Projector.js';

type Point2 = [number, number];

/** Affine texture patch for one projected triangle. Small mural tiles limit perspective distortion. */
export function textureTransform(source: Point2[], target: Point2[]): [number, number, number, number, number, number] | undefined {
  const [[u, v], [u1, v1], [u2, v2]] = source;
  const [[x, y], [x1, y1], [x2, y2]] = target;
  const determinant = (u1 - u) * (v2 - v) - (u2 - u) * (v1 - v);
  if (Math.abs(determinant) < 1e-8) return;
  const a = ((x1 - x) * (v2 - v) - (x2 - x) * (v1 - v)) / determinant;
  const b = ((y1 - y) * (v2 - v) - (y2 - y) * (v1 - v)) / determinant;
  const c = ((x2 - x) * (u1 - u) - (x1 - x) * (u2 - u)) / determinant;
  const d = ((y2 - y) * (u1 - u) - (y1 - y) * (u2 - u)) / determinant;
  return [a, b, c, d, x - a * u - c * v, y - b * u - d * v];
}

/** Canvas preview of the same static teaching mesh when hardware WebGL is unavailable. Not an AR camera renderer. */
export function createSoftwarePreview() {
  const domElement = document.createElement('canvas');
  const context = domElement.getContext('2d');
  if (!context) throw new Error('입체 미리보기를 열지 못했어요. 사진에서 설명점을 붙여 주세요.');
  const projector = new Projector();
  const color = new THREE.Color(), light = new THREE.Vector3(1.5, 3, 2).normalize();
  let width = 1, height = 1, pixelRatio = 1, lastView = '', frame = 0, disposed = false;
  let callback: (() => void) | null = null;

  function loop() {
    const draw = callback;
    if (!draw || disposed) return;
    draw();
    if (callback && !disposed) frame = requestAnimationFrame(loop);
  }

  return {
    domElement,
    setPixelRatio(value: number) { pixelRatio = Math.min(1.5, Math.max(1, value)); lastView = ''; },
    setSize(w: number, h: number) {
      width = w; height = h; lastView = '';
      domElement.width = Math.round(w * pixelRatio); domElement.height = Math.round(h * pixelRatio);
      domElement.style.width = `${w}px`; domElement.style.height = `${h}px`;
    },
    setAnimationLoop(next: (() => void) | null) {
      cancelAnimationFrame(frame); callback = next;
      if (next && !disposed) frame = requestAnimationFrame(loop);
    },
    render(scene: InstanceType<typeof THREE.Scene>, camera: InstanceType<typeof THREE.Camera>) {
      if (disposed) return;
      camera.updateMatrixWorld();
      const view = [...camera.matrixWorld.elements, ...camera.projectionMatrix.elements].join(',');
      // Point labels still update in the outer scene loop; static meshes repaint only when the camera changes.
      if (view === lastView) return;
      lastView = view;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);
      const { elements } = projector.projectScene(scene, camera, true, true);
      // The mural lies just in front of its wall. Draw those front-facing image tiles last
      // to avoid coplanar painter-order artifacts in this simplified, depth-buffer-free preview.
      elements.sort((a: { material?: { map?: unknown } }, b: { material?: { map?: unknown } }) => Number(!!a.material?.map) - Number(!!b.material?.map));
      for (const face of elements) {
        if (!face.v3 || !face.material || face.material.opacity === 0) continue;
        const vertices = [face.v1.positionScreen, face.v2.positionScreen, face.v3.positionScreen];
        if (vertices.some(point => !Number.isFinite(point.x + point.y + point.z) || point.z < -1 || point.z > 1)) continue;
        const triangle: Point2[] = vertices.map(point => [(point.x + 1) * width / 2, (1 - point.y) * height / 2]);
        if (triangle.every(point => point[0] < 0) || triangle.every(point => point[0] > width) || triangle.every(point => point[1] < 0) || triangle.every(point => point[1] > height)) continue;
        const material = face.material;
        color.copy(material.color || new THREE.Color('#b7a38a'));
        if (!material.isMeshBasicMaterial) color.multiplyScalar(.48 + Math.max(0, face.normalModel.dot(light)) * .75);
        context.globalAlpha = material.opacity;
        context.fillStyle = color.getStyle(THREE.SRGBColorSpace);
        context.beginPath(); context.moveTo(...triangle[0]); context.lineTo(...triangle[1]); context.lineTo(...triangle[2]); context.closePath();
        context.fill();
        const picture = material.map?.image;
        if (picture?.width && picture?.height) {
          const uv: Point2[] = face.uvs.map((point: { x: number; y: number }) => [point.x * picture.width, (material.map.flipY ? 1 - point.y : point.y) * picture.height]);
          const transform = textureTransform(uv, triangle);
          if (transform) {
            context.save(); context.clip(); context.transform(...transform);
            context.drawImage(picture, 0, 0); context.restore();
          }
        } else {
          // Cover subpixel antialias gaps while preserving the deliberate gaps between separate stones.
          context.strokeStyle = context.fillStyle; context.lineWidth = .35; context.stroke();
        }
      }
      context.globalAlpha = 1;
    },
    dispose() { disposed = true; callback = null; cancelAnimationFrame(frame); domElement.width = domElement.height = 1; },
  };
}
