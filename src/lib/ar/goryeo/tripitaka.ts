import * as THREE from 'three';

// Reference surface: Steve46814, photograph of a visitor-printing replica at
// Haeinsa, CC BY-SA 3.0. Cropped and perspective-corrected; this is not a scan.
// https://commons.wikimedia.org/wiki/File:Korea-Haeinsa_Tripitaka_Koreana_woodblock_2770-06a.jpg
// https://creativecommons.org/licenses/by-sa/3.0/
export async function createTripitakaModel() {
  const root = new THREE.Group();
  root.name = 'tripitaka-photo-based-reconstruction';
  root.userData.photoTextureLoaded = false;
  const wood = new THREE.MeshStandardMaterial({ color: 0x332927, roughness: .82, metalness: .04 });
  const edge = new THREE.MeshStandardMaterial({ color: 0x453631, roughness: .87, metalness: .03 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x393333, roughness: .66, metalness: .5 });
  const nail = new THREE.MeshStandardMaterial({ color: 0x79716a, roughness: .65, metalness: .55 });

  const part = (geometry: InstanceType<typeof THREE.BufferGeometry>, material: InstanceType<typeof THREE.Material>, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z); root.add(mesh); return mesh;
  };
  // The carved middle is thinner than the maguri at either end; their added
  // thickness keeps the surfaces apart when the blocks are stored in stacks.
  part(new THREE.BoxGeometry(2.42, .91, .095), wood, 0, 0, 0);
  for (const side of [-1, 1]) {
    part(new THREE.BoxGeometry(.18, 1.00, .175), edge, side * 1.30, 0, 0);
    for (const top of [-1, 1]) {
      for (const face of [-1, 1]) {
        part(new THREE.BoxGeometry(.175, .11, .008), iron, side * 1.30, top * .442, face * .089);
        for (const dx of [-.045, .045]) {
          const pin = part(new THREE.SphereGeometry(.012, 8, 6), nail, side * 1.30 + dx, top * .442, face * .095);
          pin.scale.z = .30;
        }
      }
    }
  }
  try {
    const texture = await new THREE.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}images/goryeo-reconstruction/tripitaka-face.jpg`);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const faceMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: .78, metalness: .01 });
    const front = part(new THREE.PlaneGeometry(2.40, .89), faceMaterial, 0, 0, .0485);
    front.name = 'photograph-of-replica-front';
    // A second photograph was unavailable. Reusing the image makes the
    // reverse face educationally useful, but it must be labeled as imagined.
    const back = part(new THREE.PlaneGeometry(2.40, .89), faceMaterial, 0, 0, -.0485);
    back.rotation.y = Math.PI;
    back.name = 'imagined-reverse-uses-same-photograph';
    root.userData.photoTextureLoaded = true;
  } catch {
    // Preserve the three-dimensional silhouette if the image is unavailable.
  }
  return root;
}
