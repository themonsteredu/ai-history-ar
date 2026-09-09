import { expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { cameraCardTransform, photoToModelPosition } from './modelScene';
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

it('maps imported official-sample photo points through the registered mesh without downloading its texture', async () => {
  expect(await photoToModelPosition(cheomseongdaeModel(), [.5, .5])).toEqual([0, .5, .265]);
  expect(loadCheomseongdaeOriginal).toHaveBeenCalledWith(expect.any(AbortSignal), false);
});
