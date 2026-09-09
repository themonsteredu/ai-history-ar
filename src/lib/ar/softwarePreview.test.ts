import { afterEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createSoftwarePreview, textureTransform } from './softwarePreview';
import { createPreparedModel } from './preparedModels';

afterEach(() => vi.unstubAllGlobals());

describe('preview without hardware WebGL', () => {
  it('maps all texture corners to a tilted triangle and rejects degenerate patches', () => {
    const source: [number, number][] = [[0, 0], [100, 0], [0, 50]];
    const target: [number, number][] = [[10, 20], [210, 40], [-20, 120]];
    const [a, b, c, d, e, f] = textureTransform(source, target)!;
    source.forEach(([u, v], index) => {
      expect(a * u + c * v + e).toBeCloseTo(target[index][0]);
      expect(b * u + d * v + f).toBeCloseTo(target[index][1]);
    });
    expect(textureTransform([[0, 0], [0, 0], [0, 0]], target)).toBeUndefined();
  });

  it('draws the real mural mesh and image, responds to rotation, skips idle repainting and releases its loop', async () => {
    const context = Object.fromEntries(['setTransform', 'clearRect', 'beginPath', 'moveTo', 'lineTo', 'closePath', 'fill', 'stroke', 'save', 'clip', 'transform', 'drawImage', 'restore'].map(name => [name, vi.fn()]));
    const canvas = { width: 0, height: 0, style: {}, getContext: () => context };
    vi.stubGlobal('document', { createElement: () => canvas });
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 7));
    const cancel = vi.fn(); vi.stubGlobal('cancelAnimationFrame', cancel);
    const model = await createPreparedModel('samguk-mural-v1', false);
    const materials = new Set<InstanceType<typeof THREE.Material>>();
    model.traverse((mesh: InstanceType<typeof THREE.Object3D>) => {
      if (!mesh.isMesh) return;
      materials.add(mesh.material);
      if (mesh.material.isMeshBasicMaterial) mesh.material.map = { image: { width: 740, height: 611 }, flipY: true };
    });
    const renderer = createSoftwarePreview();
    try {
      renderer.setSize(600, 400);
      const scene = new THREE.Scene(); scene.add(model);
      const camera = new THREE.PerspectiveCamera(40, 1.5, .01, 50);
      camera.position.set(1.8, 1.3, 2.8); camera.lookAt(0, .6, 0);
      renderer.render(scene, camera);
      const initialFills = context.fill.mock.calls.length;
      expect(initialFills).toBeGreaterThan(10);
      expect(context.drawImage).toHaveBeenCalled();
      expect(context.moveTo.mock.calls.every(args => args.every(Number.isFinite))).toBe(true);
      renderer.render(scene, camera);
      expect(context.fill.mock.calls.length).toBe(initialFills);
      camera.position.x = -.8; camera.lookAt(0, .6, 0);
      renderer.render(scene, camera);
      expect(context.fill.mock.calls.length).toBeGreaterThan(initialFills);
      renderer.setAnimationLoop(() => {}); renderer.dispose();
      expect(cancel).toHaveBeenCalledWith(7);
      expect(canvas.width).toBe(1);
    } finally {
      renderer.dispose();
      model.traverse((mesh: InstanceType<typeof THREE.Object3D>) => mesh.geometry?.dispose());
      materials.forEach(material => material.dispose());
    }
  });
});
