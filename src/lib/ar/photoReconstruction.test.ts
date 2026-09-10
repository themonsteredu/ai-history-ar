import { afterEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createPreparedModel } from './preparedModels';
import { PHOTO_RECONSTRUCTION, preparedHeritages } from './preparedCatalog';

afterEach(() => vi.restoreAllMocks());
function dispose(root: InstanceType<typeof THREE.Group>) {
  const resources = new Set<InstanceType<typeof THREE.Material> | InstanceType<typeof THREE.Texture>>();
  root.traverse((mesh: InstanceType<typeof THREE.Object3D>) => {
    if (!(mesh instanceof THREE.Mesh)) return;
    mesh.geometry.dispose(); resources.add(mesh.material);
    if (mesh.material.map) resources.add(mesh.material.map);
  });
  resources.forEach(resource => resource.dispose());
}

describe('photo-reference reconstructions', () => {
  it('loads exactly the corresponding local reference photograph on real three-dimensional geometry for all five', async () => {
    const loader = vi.spyOn(THREE.TextureLoader.prototype, 'loadAsync').mockImplementation(async () => new THREE.Texture());
    for (const heritage of preparedHeritages.filter(item => item.id !== 3)) {
      loader.mockClear();
      const root = await createPreparedModel(heritage.key);
      try {
        expect(loader).toHaveBeenCalledTimes(1);
        expect(loader).toHaveBeenCalledWith(expect.stringContaining(`/images/heritage/three-kingdoms/${heritage.image}`));
        expect(root.userData.reconstruction).toBe(PHOTO_RECONSTRUCTION);
        expect(root.userData.photoTextureLoaded).toBe(true);
        expect(root.userData.features.length).toBeGreaterThanOrEqual(3);
        let mapped = 0;
        const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
        expect(size.z).toBeGreaterThan(.5); // Not a photograph billboard.
        root.traverse((mesh: InstanceType<typeof THREE.Object3D>) => {
          if (!(mesh instanceof THREE.Mesh)) return;
          expect(mesh.geometry.getAttribute('normal').count).toBe(mesh.geometry.getAttribute('position').count);
          expect(mesh.geometry.getAttribute('color').count).toBe(mesh.geometry.getAttribute('position').count);
          if (!mesh.material.map) return;
          mapped++;
          expect(mesh.material.map.colorSpace).toBe(THREE.SRGBColorSpace);
          const uv = mesh.geometry.getAttribute('uv');
          expect(Array.from(uv.array as Float32Array).every(n => Number.isFinite(n) && n >= 0 && n <= 1)).toBe(true);
          const photoBounds = new THREE.Box3().setFromObject(mesh).getSize(new THREE.Vector3());
          expect(Math.max(photoBounds.x, photoBounds.y)).toBeGreaterThan(.5);
        });
        expect(mapped).toBeGreaterThan(0);
      } finally { dispose(root); }
    }
  });

  it('does not download textures for point projection and reports unavailable textures instead of claiming realism', async () => {
    const loader = vi.spyOn(THREE.TextureLoader.prototype, 'loadAsync').mockRejectedValue(new Error('offline'));
    const picking = await createPreparedModel('samguk-incense-v1', false);
    expect(loader).not.toHaveBeenCalled();
    const fallback = await createPreparedModel('samguk-incense-v1', true);
    try {
      expect(fallback.userData.photoTextureLoaded).toBe(false);
      expect(new THREE.Box3().setFromObject(fallback)).toEqual(new THREE.Box3().setFromObject(picking));
    } finally { dispose(picking); dispose(fallback); }
  });

  it('keeps signed extruded brick-face texture triangles from collapsing into single-pixel samples', async () => {
    vi.spyOn(THREE.TextureLoader.prototype, 'loadAsync').mockImplementation(async () => new THREE.Texture());
    const root = await createPreparedModel('samguk-muryeong-v1');
    let capTriangles = 0;
    try {
      root.traverse((mesh: InstanceType<typeof THREE.Object3D>) => {
        if (!(mesh instanceof THREE.Mesh) || !mesh.material.map) return;
        const normal = mesh.geometry.getAttribute('normal'), uv = mesh.geometry.getAttribute('uv');
        for (let i = 0; i < normal.count; i += 3) {
          if (Math.abs(normal.getZ(i)) < .999 || Math.abs(normal.getZ(i + 1)) < .999 || Math.abs(normal.getZ(i + 2)) < .999) continue;
          const area = (uv.getX(i + 1) - uv.getX(i)) * (uv.getY(i + 2) - uv.getY(i)) - (uv.getX(i + 2) - uv.getX(i)) * (uv.getY(i + 1) - uv.getY(i));
          expect(Math.abs(area)).toBeGreaterThan(1e-9); capTriangles++;
        }
      });
      expect(capTriangles).toBeGreaterThan(100);
    } finally { dispose(root); }
  });
});
