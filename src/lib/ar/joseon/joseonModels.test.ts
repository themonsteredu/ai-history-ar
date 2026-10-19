import { afterEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createJoseonModel } from '.';
import { joseonModels, joseonTextureUrl } from './catalog';

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
          expect(loader).toHaveBeenCalledWith(joseonTextureUrl(info));
          expect(joseonTextureUrl(info)).toMatch(new RegExp(`${info.photo.texture || info.photo.path}$`));
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

describe('Joseon artifact photos', () => {
  it('has one credited, unchanged photo file per artifact', async () => {
    const { readFileSync } = await import('node:fs');
    const { createHash } = await import('node:crypto');
    const photos = (await import('./photos.json')).default as Array<{ id: number; path: string; source: string; author: string; license: string; licenseUrl: string; sha256?: string }>;
    expect(photos.map(photo => photo.id).sort()).toEqual([1, 2, 3, 4, 5, 6]);
    for (const photo of photos) {
      expect(photo.source).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(photo.author.trim()).not.toBe('');
      expect(photo.license.trim()).not.toBe('');
      expect(photo.licenseUrl).toMatch(/^https:\/\//);
      const bytes = readFileSync(`public/${photo.path}`);
      if (photo.sha256) expect(createHash('sha256').update(bytes).digest('hex'), photo.path).toBe(photo.sha256);
    }
    expect(joseonModels.every(info => info.photo)).toBe(true);
  });
});

/** Width and height from a JPEG's frame header. */
function jpegSize(bytes: Uint8Array) {
  for (let i = 2; i + 8 < bytes.length;) {
    if (bytes[i] !== 0xff) { i++; continue; }
    const marker = bytes[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { width: bytes[i + 7] << 8 | bytes[i + 8], height: bytes[i + 5] << 8 | bytes[i + 6] };
    i += 2 + (bytes[i + 2] << 8 | bytes[i + 3]);
  }
  throw new Error('JPEG 크기를 읽지 못했어요.');
}

describe('Joseon model textures', () => {
  it('paints a large photo from a smaller copy with the same framing, and keeps the printed photo as is', async () => {
    const { readFileSync } = await import('node:fs');
    const photos = (await import('./photos.json')).default as Array<{ id: number; path: string; texture?: string }>;
    expect(photos.find(photo => photo.id === 4)?.texture).toBe('images/heritage/joseon-science/angbuilgu.jpg');
    for (const photo of photos) {
      const printed = readFileSync(`public/${photo.path}`), texture = readFileSync(`public/${photo.texture || photo.path}`);
      expect(texture.length, photo.path).toBeLessThan(700_000);
      const a = jpegSize(printed), b = jpegSize(texture);
      expect(b.width, photo.path).toBeLessThanOrEqual(1280);
      // Photo regions are placed in 0..1 photo coordinates, so only the aspect ratio has to match.
      expect(Math.abs(a.width / a.height - b.width / b.height), photo.path).toBeLessThan(.005);
      if (photo.texture) expect(texture.length).toBeLessThan(printed.length / 4);
    }
  });
});

describe('printed AR cards', () => {
  it('were compiled from exactly the current six photos', async () => {
    const { readFileSync } = await import('node:fs');
    const { createHash } = await import('node:crypto');
    const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
    const targets = (await import('./targets.json')).default;
    const photos = (await import('./photos.json')).default as Array<{ id: number; path: string }>;
    expect(sha(readFileSync(targets.file))).toBe(targets.sha256);
    expect(targets.photos).toEqual([...photos].sort((a, b) => a.id - b.id).map(photo => ({ id: photo.id, sha256: sha(readFileSync(`public/${photo.path}`)) })));
  });
});
