import * as THREE from 'three';

/**
 * 고려 금속활자 覆: a teaching reconstruction, not a scan.
 * The printing face and the reverse use separate photographs of the same
 * National Museum of Korea object (Deoksu 4462). The museum records its size
 * as 1 x 1.2 x .7 cm and describes an oval recess in its reverse. The recess
 * depth and side profile are an approximation; this is not a 3D scan.
 * https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?relicId=1348&schM=view
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

  // Scale the measured thickness against the 1.2 cm long printing face.
  // Keep the front intact and open an oval only in the rear of the body.
  const depth = .7 / 1.2;
  const bodyShape = shape.clone();
  const hollow = new THREE.Path();
  hollow.absellipse(0, .50, .31, .33, 0, Math.PI * 2, true);
  bodyShape.holes.push(hollow);
  const sideGeometry = new THREE.ExtrudeGeometry(bodyShape, {
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
  const body = new THREE.Mesh(sideGeometry, sideMaterial); body.name = 'type-body'; group.add(body);

  // An elliptical, smoothly indented rear. Its contour is guided by the
  // museum's reverse photograph; exact cavity depth was not published.
  const sectors = 64, rings = 12, vertices: number[] = [], uvs: number[] = [], indices: number[] = [];
  for (let ring = 0; ring <= rings; ring++) {
    const r = ring / rings;
    for (let side = 0; side <= sectors; side++) {
      const angle = side * Math.PI * 2 / sectors, x = r * Math.cos(angle), y = r * Math.sin(angle);
      vertices.push(.31 * x, .50 + .33 * y, -depth + .16 * (1 - r * r));
      // The photographed recess occupies the centre of the museum photo.
      uvs.push((655 + 135 * x) / 1304, 1 - (423 - 105 * y) / 936);
    }
  }
  for (let ring = 0; ring < rings; ring++) for (let side = 0; side < sectors; side++) {
    const a = ring * (sectors + 1) + side, b = a + sectors + 1;
    indices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const rearGeometry = new THREE.BufferGeometry();
  rearGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  rearGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  rearGeometry.setIndex(indices); rearGeometry.computeVertexNormals();
  const rearMaterial = new THREE.MeshStandardMaterial({ color: '#514c46', roughness: .9, metalness: .2, side: THREE.DoubleSide });
  const rear = new THREE.Mesh(rearGeometry, rearMaterial); rear.name = 'reverse-cavity'; group.add(rear);

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
  try {
    const reversePhoto = await new THREE.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}images/goryeo-photos/type-back.jpg`);
    reversePhoto.colorSpace = THREE.SRGBColorSpace; reversePhoto.anisotropy = 4;
    rearMaterial.map = reversePhoto; rearMaterial.color.set('#ffffff'); rearMaterial.needsUpdate = true;
  } catch { /* The shape remains visible when the reverse photograph is offline. */ }
  return group;
}
