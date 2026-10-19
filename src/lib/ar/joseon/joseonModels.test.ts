import { afterEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createJoseonModel } from '.';
import { joseonModels } from './catalog';

afterEach(() => vi.restoreAllMocks());
function dispose(root: InstanceType<typeof THREE.Group>) {
  root.traverse((mesh: InstanceType<typeof THREE.Object3D>) => {
    if (!(mesh instanceof THREE.Mesh)) return;
    mesh.geometry.dispose(); mesh.material.map?.dispose(); mesh.material.dispose();
  });
}

describe('Joseon artifact reconstructions', () => {
  it('builds all six as real 3D geometry within the tablet budget', async () => {
    vi.spyOn(THREE.TextureLoader.prototype, 'loadAsync').mockImplementation(async () => new THREE.Texture());
    for (const info of joseonModels) {
      const root = await createJoseonModel(info.key);
      try {
        let triangles = 0, draws = 0;
        root.traverse((mesh: InstanceType<typeof THREE.Object3D>) => {
          if (!(mesh instanceof THREE.Mesh)) return;
          draws++; triangles += mesh.geometry.getAttribute('position').count / 3;
          const uv = mesh.geometry.getAttribute('uv');
          expect(Array.from(uv.array as Float32Array).every(n => Number.isFinite(n))).toBe(true);
          expect(mesh.geometry.getAttribute('normal').count).toBe(mesh.geometry.getAttribute('position').count);
        });
        expect(triangles, info.key).toBeLessThan(60_000);
        expect(draws, info.key).toBeLessThanOrEqual(12);
        const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
        expect(Math.min(size.x, size.y, size.z) / Math.max(size.x, size.y, size.z), info.key).toBeGreaterThan(.05); // not a flat picture
        expect(root.userData.features.length, info.key).toBeGreaterThanOrEqual(1);
        expect(root.userData.reconstruction).toBe('photo-reference-v2');
        expect(root.userData.photoPending).toBe(!info.photo);
      } finally { dispose(root); }
    }
  });

  it('loads a photo only for artifacts that have one, and never for point picking', async () => {
    const loader = vi.spyOn(THREE.TextureLoader.prototype, 'loadAsync').mockImplementation(async () => new THREE.Texture());
    for (const info of joseonModels) {
      loader.mockClear();
      dispose(await createJoseonModel(info.key, false));
      expect(loader).not.toHaveBeenCalled();
      const root = await createJoseonModel(info.key, true);
      try {
        if (info.photo) {
          expect(loader).toHaveBeenCalledTimes(1);
          expect(loader).toHaveBeenCalledWith(expect.stringContaining(info.photo.path));
          let mapped = 0;
          root.traverse((mesh: InstanceType<typeof THREE.Object3D>) => {
            if (!(mesh instanceof THREE.Mesh) || !mesh.material.map) return;
            mapped++;
            expect(Array.from(mesh.geometry.getAttribute('uv').array as Float32Array).every(n => n >= 0 && n <= 1)).toBe(true);
          });
          expect(mapped).toBeGreaterThan(0);
          expect(root.userData.photoTextureLoaded).toBe(true);
        } else expect(loader).not.toHaveBeenCalled();
      } finally { dispose(root); }
    }
  });

  it('says the photo failed instead of claiming a textured model', async () => {
    vi.spyOn(THREE.TextureLoader.prototype, 'loadAsync').mockRejectedValue(new Error('offline'));
    const withPhoto = joseonModels.find(info => info.photo)!;
    const root = await createJoseonModel(withPhoto.key);
    try { expect(root.userData.photoTextureLoaded).toBe(false); } finally { dispose(root); }
  });
});
