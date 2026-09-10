import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { preparedHeritage, type PreparedModelKey } from './preparedCatalog';
import { createPhotoReconstruction } from './photoReconstruction';

type Vec = [number, number, number];
type Geometry = InstanceType<typeof THREE.BufferGeometry>;
type Material = InstanceType<typeof THREE.Material>;
type Object3D = InstanceType<typeof THREE.Object3D>;

/** Five photo-reference reconstructions; the legacy tower remains readable for old exports. */
export async function createPreparedModel(key: PreparedModelKey, withImages = true) {
  const item = preparedHeritage(key);
  if (!item) throw new Error('준비된 유물 모형을 찾지 못했어요.');
  if (item.id !== 3) {
    const reconstruction = await createPhotoReconstruction(item.id, item.image, withImages);
    reconstruction.name = `${item.name} · 사진 참고 3D 재현`;
    return reconstruction;
  }
  const root = new THREE.Group();
  root.name = item.name;
  const materials = new Map<string, InstanceType<typeof THREE.MeshStandardMaterial>>();
  const stone = ['#b3a58c', '#c2b298', '#aa9d85', '#cabb9f', '#b6aa94'];
  function mesh(geometry: Geometry, color: string, position: Vec) {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .91, side: THREE.DoubleSide }));
    const object = new THREE.Mesh(geometry, materials.get(color)!);
    object.position.set(...position); root.add(object); return object;
  }
  const box = (size: Vec, position: Vec, color: string) => mesh(new THREE.BoxGeometry(...size), color, position);

    box([1.02, .12, 1.02], [0, .06, 0], '#b5a58d');
    for (let row = 0; row < 27; row++) {
      const bottom = .43 - Math.sin(row / 27 * Math.PI / 2) * .145;
      const top = .43 - Math.sin((row + 1) / 27 * Math.PI / 2) * .145;
      for (let col = 0; col < 12; col++) {
        const a = col / 12 * Math.PI * 2 + (row % 2) * Math.PI / 12;
        if (row >= 11 && row <= 14 && (a < .52 || a > 5.75)) continue;
        mesh(new THREE.CylinderGeometry(top, bottom, .046, 4, 1, false, a + .012, Math.PI / 6 - .024), stone[(row * 2 + col) % stone.length], [0, .12 + (row + .5) * .048, 0]);
      }
    }
    box([.19, .18, .018], [0, .745, .25], '#29261f');
    for (const side of [-1, 1]) {
      box([.1, .10, .75], [side * .285, 1.46, 0], stone[1]);
      box([.75, .10, .1], [0, 1.40, side * .285], stone[0]);
    }
  // Combine stationary pieces by material to keep draw calls low on classroom tablets.
  root.updateMatrixWorld(true);
  const buckets = new Map<Material, Geometry[]>();
  const originals = new Set<Geometry>();
  root.traverse((object: Object3D) => {
    if (!(object instanceof THREE.Mesh) || Array.isArray(object.material)) return;
    const copy = object.geometry.clone().applyMatrix4(object.matrixWorld);
    const geometry = copy.index ? copy.toNonIndexed() : copy;
    if (geometry !== copy) copy.dispose();
    const list = buckets.get(object.material) || []; list.push(geometry); buckets.set(object.material, list);
    originals.add(object.geometry);
  });
  root.clear(); originals.forEach(geometry => geometry.dispose());
  for (const [mat, geometries] of buckets) {
    const combined = mergeGeometries(geometries, false);
    if (combined) { root.add(new THREE.Mesh(combined, mat)); geometries.forEach(geometry => geometry.dispose()); }
    else geometries.forEach(geometry => root.add(new THREE.Mesh(geometry, mat)));
  }
  return root;
}
