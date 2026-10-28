import * as THREE from 'three';

// Photo-referenced teaching reconstruction, not a scan. The reverse and depth
// are inferred: the one available source image only shows the front.
export async function createBuddhaModel() {
  const root = new THREE.Group();
  root.name = '관촉사 석조미륵보살입상 사진 참고 재현';
  root.userData.reconstruction = '사진을 참고한 교육용 재현 모형. 측면과 뒷면은 추정했습니다.';
  const original = await new THREE.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}images/goryeo-photos/buddha.jpg`);
  // The source was photographed against a bright sky. Lighten the projection so
  // the original stone carving is legible on small classroom screens.
  const canvas = document.createElement('canvas');
  canvas.width = 1050; canvas.height = 1400;
  const context = canvas.getContext('2d');
  let texture = original;
  if (context) {
    context.filter = 'brightness(1.35)';
    context.drawImage(original.image as CanvasImageSource, 0, 0, canvas.width, canvas.height);
    texture = new THREE.CanvasTexture(canvas);
    original.dispose();
  }
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  // Keep the details of the actual face, hands and robes from the source photo.
  // The front is projected onto a rounded volume; the rest is neutral stone.
  const photo = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  const stone = new THREE.MeshStandardMaterial({ color: '#817e73', roughness: 1, side: THREE.DoubleSide });
  const crownStone = new THREE.MeshStandardMaterial({ color: '#55544e', roughness: 1, side: THREE.DoubleSide });
  const px = (x: number) => (x - 550) / 100;
  const py = (y: number) => (1040 - y) / 100;
  const frontDepth = (x: number, y: number) => {
    // Shallow relief gives the photo's nose and hands some real depth when turned.
    const bump = (cx: number, cy: number, sx: number, sy: number, h: number) =>
      h * Math.exp(-(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2));
    return bump(552, 414, 22, 30, .16) + bump(506, 585, 36, 68, .18) + bump(591, 660, 40, 34, .14);
  };
  // Pixel coordinates follow the visible silhouette closely, keeping trees and sky
  // outside the mesh. Interpolated sections retain the natural, irregular shape.
  const outlines: Array<[number, number, number, number]> = [
    [160, 522, 584, .34], [200, 513, 591, .38], [240, 505, 597, .42],
    [290, 497, 601, .45], [318, 494, 602, .46], [335, 487, 610, .48],
    [360, 478, 617, .52], [395, 469, 621, .55], [445, 465, 620, .55],
    [490, 466, 619, .51], [517, 468, 618, .48], [528, 426, 622, .53],
    [540, 420, 645, .55], [560, 417, 655, .58], [610, 413, 664, .62], [660, 408, 677, .66],
    [695, 408, 677, .67], [720, 430, 662, .63], [780, 431, 657, .60],
    [850, 432, 658, .59], [920, 432, 663, .59], [990, 429, 668, .58],
    [1015, 431, 669, .58],
  ];
  const columns = 48;
  // Build front and reverse separately so the back does not pretend to be photographed.
  function roundedSurface(front: boolean) {
    const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
    for (const [y, left, right, depth] of outlines) {
      for (let i = 0; i <= columns; i++) {
        const angle = -Math.PI / 2 + Math.PI * i / columns;
        const x = (left + right) / 2 + Math.sin(angle) * (right - left) / 2;
        const z = (front ? 1 : -1) * depth * Math.cos(angle)
          + (front ? frontDepth(x, y) * Math.cos(angle) : 0);
        positions.push(px(x), py(y), z);
        uvs.push(x / 1050, 1 - y / 1400);
      }
    }
    for (let row = 0; row < outlines.length - 1; row++) for (let i = 0; i < columns; i++) {
      const a = row * (columns + 1) + i, b = a + columns + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    return new THREE.Mesh(geometry, front ? photo : stone);
  }
  root.add(roundedSurface(true), roundedSurface(false));

  // The characteristic square canopy is a distinct solid, with its photographed
  // front and dark stone sides. It sits behind the tall headdress.
  function canopy(points: Array<[number, number]>, depth: number, z: number) {
    const shape = new THREE.Shape();
    points.forEach(([x, y], i) => i ? shape.lineTo(px(x), py(y)) : shape.moveTo(px(x), py(y)));
    shape.closePath();
    const frontGeometry = new THREE.ShapeGeometry(shape);
    const pos = frontGeometry.getAttribute('position');
    const uv = frontGeometry.getAttribute('uv');
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) * 100 + 550) / 1050, 1 - (1040 - pos.getY(i) * 100) / 1400);
    const panel = new THREE.Mesh(frontGeometry, photo); panel.position.z = z; root.add(panel);
    const solid = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }), crownStone);
    solid.position.z = z - depth - .003; root.add(solid);
  }
  canopy([[417, 87], [716, 110], [670, 242], [410, 220]], 1.55, -.13);
  canopy([[501, 53], [623, 64], [610, 110], [496, 100]], .82, -.10);
  return root;
}
