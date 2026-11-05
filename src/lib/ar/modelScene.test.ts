import { expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { cameraCardTransform, canUseSoftwarePreview, disposeObject, photoToModelPosition, readModel, scaleObservation, turnObservation } from './modelScene';
import { preparedHeritages, preparedModel } from './preparedCatalog';
import { cheomseongdaeModel } from '../../content/three-kingdoms/arModels';
import { loadCheomseongdaeOriginal } from '../../content/three-kingdoms/cheomseongdaeOriginal';

vi.mock('../../content/three-kingdoms/cheomseongdaeOriginal', () => ({
  loadCheomseongdaeOriginal: vi.fn(async () => new THREE.Mesh(new THREE.BoxGeometry(1, 1, 2), new THREE.MeshBasicMaterial())),
}));

it('stands a model out of a desk card, but keeps it upright on a computer screen', () => {
  expect(cameraCardTransform(true, 1, 'table')).toEqual({ rotationX: Math.PI / 2, offsetY: 0 });
  expect(cameraCardTransform(true, 1, 'upright')).toEqual({ rotationX: 0, offsetY: -.5 });
});

it('keeps photo-only exhibits flat and centered in both card orientations', () => {
  expect(cameraCardTransform(false, 1.4, 'table')).toEqual({ rotationX: 0, offsetY: -.7 });
  expect(cameraCardTransform(false, 1.4, 'upright')).toEqual({ rotationX: 0, offsetY: -.7 });
});

it('turns and enlarges the model together with its explanation positions', () => {
  const spinner = new THREE.Group();
  turnObservation(spinner, Math.PI);
  scaleObservation(spinner, 1.25);
  spinner.updateMatrixWorld(true);
  const pin = new THREE.Vector3(0, .5, .4).applyMatrix4(spinner.matrixWorld);
  expect(pin.z).toBeCloseTo(-.5);
  expect(pin.y).toBeCloseTo(.625);
  scaleObservation(spinner, 100);
  expect(spinner.scale.x).toBe(1.8);
  scaleObservation(spinner, .0001);
  expect(spinner.scale.x).toBe(.65);
});

it('allows the lightweight Goryeo teaching models to use the software viewer but not large museum scans', () => {
  const sample = { format: 'glb', asset: 'goryeo-type' } as const;
  expect(canUseSoftwarePreview(sample as Parameters<typeof canUseSoftwarePreview>[0])).toBe(true);
  expect(canUseSoftwarePreview({ ...sample, asset: 'goryeo-incense' } as Parameters<typeof canUseSoftwarePreview>[0])).toBe(false);
});

it('maps imported official-sample photo points through the registered mesh without downloading its texture', async () => {
  expect(await photoToModelPosition(cheomseongdaeModel(), [.5, .5])).toEqual([0, .5, .265]);
  expect(loadCheomseongdaeOriginal).toHaveBeenCalledWith(expect.any(AbortSignal), false);
});

it('the shared classroom/individual loader opens every preset and the registered original, not only primitives', async () => {
  for (const item of preparedHeritages) {
    const descriptor = item.id === 3 ? cheomseongdaeModel() : preparedModel(item.id);
    const content = await readModel(descriptor, false);
    try {
      expect(new THREE.Box3().setFromObject(content).isEmpty()).toBe(false);
      if (item.id !== 3) expect(content.userData.reconstruction).toBe('photo-reference-v2');
    } finally { disposeObject(content); }
  }
});
