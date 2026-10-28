import * as THREE from 'three';

/**
 * 고려 금속활자 覆: a teaching reconstruction, not a scan.
 * The printing face uses the museum's photograph. The thickness, sides and
 * back are conjectural because this photograph only shows the printing face.
 * Units are display units; the face points toward +z and the bottom is y=0.
 */
export async function createTypeModel(): Promise<InstanceType<typeof THREE.Group>> {
  const group = new THREE.Group();
  group.name = '고려 금속활자 사진 참고 재현';
  group.userData.reconstruction = true;
  group.userData.photoFace = true;
  group.userData.estimatedSides = true;

  // Outline traced from the photograph, excluding the grey display surface.
  // Pixel coordinates are in the original 1400 x 1121 image.
  const outline: [number, number][] = [
    [537, 380], [559, 373], [595, 374], [621, 365], [650, 371],
    [682, 365], [718, 361], [751, 360], [793, 364], [827, 361],
    [861, 369], [883, 388], [893, 417], [899, 459], [907, 505],
    [910, 555], [911, 609], [911, 664], [910, 719], [904, 756],
    [895, 780], [878, 789], [842, 790], [795, 790], [749, 790],
    [706, 790], [657, 790], [613, 791], [568, 792], [529, 791],
    [515, 782], [510, 758], [509, 716], [510, 671], [512, 627],
    [512, 583], [514, 539], [515, 492], [518, 451], [520, 418],
    [525, 393],
  ];
  const left = 508, top = 360, width = 404, height = 432;
  const unit = 1 / height;
  const shape = new THREE.Shape();
  outline.forEach(([x, y], i) => {
    const px = (x - left - width / 2) * unit;
    const py = (top + height - y) * unit;
    if (i === 0) shape.moveTo(px, py); else shape.lineTo(px, py);
  });
  shape.closePath();

  // An uneven, rounded edge makes the object read as a worn cast piece.
  // The photograph supplies the front; the solid's depth is an estimate.
  const depth = .38;
  const sideGeometry = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: .012, bevelSize: .012,
    bevelSegments: 3, curveSegments: 8, steps: 1,
  });
  sideGeometry.translate(0, 0, -depth);
  const sideMaterial = new THREE.MeshStandardMaterial({
    color: '#514c46', roughness: .9, metalness: .32,
  });
  // Deterministic mottling evokes aged metal without inventing inscriptions.
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const context = canvas.getContext('2d');
    if (context) {
      const pixels = context.createImageData(256, 256);
      let seed = 965274;
      for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const fine = ((seed >>> 24) / 255 - .5) * 25;
        const cloud = 11 * Math.sin(x * .073 + Math.sin(y * .055) * 2) * Math.cos(y * .049);
        const dark = (Math.sin(x * .11 + y * .06) > .94 ? -16 : 0);
        const i = (y * 256 + x) * 4, value = 118 + fine + cloud + dark;
        pixels.data[i] = value + 5; pixels.data[i + 1] = value + 2;
        pixels.data[i + 2] = value - 4; pixels.data[i + 3] = 255;
      }
      context.putImageData(pixels, 0, 0);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1.2, 1.2);
      sideMaterial.map = texture;
      sideMaterial.bumpMap = texture;
      sideMaterial.bumpScale = .007;
      sideMaterial.color.set('#b0aaa2');
    }
  }
  group.add(new THREE.Mesh(sideGeometry, sideMaterial));

  const faceGeometry = new THREE.ShapeGeometry(shape);
  const pos = faceGeometry.getAttribute('position');
  const uv = faceGeometry.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) {
    const imageX = left + width / 2 + pos.getX(i) / unit;
    const imageY = top + height - pos.getY(i) / unit;
    uv.setXY(i, imageX / 1400, 1 - imageY / 1121);
  }
  uv.needsUpdate = true;
  const faceMaterial = new THREE.MeshStandardMaterial({ color: '#77716a', roughness: .85, metalness: .08 });
  const face = new THREE.Mesh(faceGeometry, faceMaterial);
  face.position.z = .013;
  group.add(face);

  try {
    const photo = await new THREE.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}images/goryeo-photos/type.jpg`);
    photo.colorSpace = THREE.SRGBColorSpace;
    photo.anisotropy = 4;
    faceMaterial.map = photo;
    faceMaterial.bumpMap = photo;
    faceMaterial.bumpScale = .006;
    faceMaterial.color.set('#ffffff');
    faceMaterial.needsUpdate = true;
    group.userData.photoTextureLoaded = true;
  } catch {
    group.userData.photoTextureLoaded = false;
  }
  return group;
}
