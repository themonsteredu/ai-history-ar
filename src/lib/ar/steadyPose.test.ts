import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { followPose } from './steadyPose';

const pose = (x: number, degrees: number, width = 2) => new THREE.Matrix4().compose(
  new THREE.Vector3(x, 0, -5), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), degrees * Math.PI / 180), new THREE.Vector3(width, width, width));

describe('steady card pose', () => {
  it('jumps straight to the first pose after the card is found', () => {
    const follower = new THREE.Group();
    expect(followPose(follower, pose(.3, 10), .016, true)).toBe(true);
    expect(follower.position.x).toBeCloseTo(.3);
    expect(follower.scale.x).toBeCloseTo(2);
  });
  it('ignores the tiny shake of a still card', () => {
    const follower = new THREE.Group();
    followPose(follower, pose(0, 0), .016, true);
    for (const [x, degrees] of [[.006, .3], [-.004, -.4], [.008, .2]]) {
      expect(followPose(follower, pose(x, degrees), .016, false)).toBe(false);
    }
    expect(follower.position.x).toBe(0);
  });
  it('follows a real move smoothly instead of snapping', () => {
    const follower = new THREE.Group();
    followPose(follower, pose(0, 0), .016, true);
    followPose(follower, pose(.5, 0), .016, false);
    expect(follower.position.x).toBeGreaterThan(0);
    expect(follower.position.x).toBeLessThan(.5);
    for (let frame = 0; frame < 60; frame++) followPose(follower, pose(.5, 0), .016, false);
    expect(follower.position.x).toBeGreaterThan(.49);
  });
  it('turns with the card when it is rotated', () => {
    const follower = new THREE.Group();
    followPose(follower, pose(0, 0), .016, true);
    for (let frame = 0; frame < 90; frame++) followPose(follower, pose(0, 40), .016, false);
    const expected = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 40 * Math.PI / 180);
    expect(follower.quaternion.angleTo(expected)).toBeLessThan(.01);
  });
});
