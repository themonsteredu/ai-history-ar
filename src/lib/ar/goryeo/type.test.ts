import { expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createTypeModel } from './type';
import { disposeObject } from '../modelScene';

it('models the documented hollow on the reverse and keeps the printing face closed', async () => {
  const load = vi.spyOn(THREE.TextureLoader.prototype, 'loadAsync').mockImplementation(async () => new THREE.Texture());
  const model = await createTypeModel();
  try {
    model.updateMatrixWorld(true);
    const fromBack = new THREE.Raycaster(new THREE.Vector3(.05, .52, -2), new THREE.Vector3(0, 0, 1));
    const fromFront = new THREE.Raycaster(new THREE.Vector3(.05, .52, 2), new THREE.Vector3(0, 0, -1));
    expect(fromBack.intersectObject(model, true)[0].object.name).toBe('reverse-cavity');
    expect(fromFront.intersectObject(model, true)[0].object.name).not.toBe('reverse-cavity');
    const rear = model.getObjectByName('reverse-cavity') as InstanceType<typeof THREE.Mesh>;
    const positions = rear.geometry.getAttribute('position');
    expect(positions.getZ(0)).toBeGreaterThan(positions.getZ(positions.count - 1));
    expect(load.mock.calls.some(([url]) => String(url).endsWith('/type-back.jpg'))).toBe(true);
  } finally { disposeObject(model); load.mockRestore(); }
});
