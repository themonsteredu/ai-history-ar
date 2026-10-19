import * as THREE from 'three';

type Object3D = InstanceType<typeof THREE.Object3D>;
type Matrix4 = InstanceType<typeof THREE.Matrix4>;

/** MindAR's own One Euro filter, tuned for a still card on a desk: less shake, a little more lag. */
export const steadyTrackingFilter = { filterMinCF: .0001, filterBeta: .01, missTolerance: 10 } as const;

const target = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), scale: new THREE.Vector3() };

/**
 * Moves `follower` toward the tracked card pose. Changes smaller than about half a percent of the card
 * width or about half a degree are camera noise and are ignored; larger ones are eased in over a few
 * frames, so the model stops trembling but still follows the card when it really moves.
 * Returns true when the follower changed.
 */
export function followPose(follower: Object3D, pose: Matrix4, seconds: number, fresh: boolean) {
  pose.decompose(target.position, target.quaternion, target.scale);
  if (fresh) {
    follower.position.copy(target.position); follower.quaternion.copy(target.quaternion); follower.scale.copy(target.scale);
    return true;
  }
  const cardWidth = Math.max(1e-6, Math.abs(target.scale.x));
  const moved = follower.position.distanceTo(target.position) / cardWidth;
  const turned = follower.quaternion.angleTo(target.quaternion);
  if (moved < .005 && turned < .009) return false;
  // Big jumps (the card was moved quickly) are followed faster than small drifts.
  const rate = moved > .08 || turned > .15 ? 18 : 9;
  const k = 1 - Math.exp(-Math.max(0, Math.min(seconds, .1)) * rate);
  follower.position.lerp(target.position, k);
  follower.quaternion.slerp(target.quaternion, k);
  follower.scale.lerp(target.scale, k);
  return true;
}
