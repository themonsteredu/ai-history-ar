import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { preparedHeritage, type PreparedModelKey } from './preparedCatalog';

type Vec = [number, number, number];
type Geometry = InstanceType<typeof THREE.BufferGeometry>;
type Material = InstanceType<typeof THREE.Material>;
type Object3D = InstanceType<typeof THREE.Object3D>;

/** Original lightweight teaching models, built locally. No remote model service or student modelling. */
export async function createPreparedModel(key: PreparedModelKey, withImages = true) {
  const item = preparedHeritage(key);
  if (!item) throw new Error('준비된 유물 모형을 찾지 못했어요.');
  const root = new THREE.Group();
  root.name = item.name;
  const materials = new Map<string, InstanceType<typeof THREE.MeshStandardMaterial>>();
  const stone = ['#b3a58c', '#c2b298', '#aa9d85', '#cabb9f', '#b6aa94'];
  const gold = '#bd9146', brightGold = '#d8b66b';
  function material(color: string, metal = 0) {
    const id = `${color}:${metal}`;
    if (!materials.has(id)) materials.set(id, new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: metal ? .42 : .91, side: THREE.DoubleSide }));
    return materials.get(id)!;
  }
  function mesh(geometry: Geometry, color: string, position: Vec, scale: Vec = [1, 1, 1], rotation: Vec = [0, 0, 0], metal = 0, parent = root) {
    const object = new THREE.Mesh(geometry, material(color, metal));
    object.position.set(...position); object.scale.set(...scale); object.rotation.set(...rotation); parent.add(object); return object;
  }
  const box = (size: Vec, position: Vec, color: string, rotation: Vec = [0, 0, 0], metal = 0, parent = root) => mesh(new THREE.BoxGeometry(...size), color, position, [1, 1, 1], rotation, metal, parent);
  const sphere = (size: Vec, position: Vec, color: string, metal = 0, parent = root) => mesh(new THREE.SphereGeometry(1, 16, 12), color, position, size, [0, 0, 0], metal, parent);
  const ring = (radius: number, tube: number, position: Vec, color: string, metal = 0, parent = root) => mesh(new THREE.TorusGeometry(radius, tube, 8, 40), color, position, [1, 1, 1], [Math.PI / 2, 0, 0], metal, parent);
  function tube(points: Vec[], radius: number, color: string, metal = 0, parent = root) {
    return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 36, radius, 6, false), color, [0, 0, 0], [1, 1, 1], [0, 0, 0], metal, parent);
  }

  if (item.id === 1) {
    // An open-front view of a brick burial chamber; proportions are instructional, not a survey.
    box([1.7, .09, 1.9], [0, .045, 0], '#8f8370');
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 8; col++) {
        const color = stone[(row + col * 2) % stone.length];
        box([.18, .098, .12], [-.69 + col * .198, .145 + row * .108, -.81], color);
        if (col < 7) for (const side of [-1, 1]) box([.12, .098, .218], [side * .76, .145 + row * .108, -.69 + col * .24], color);
      }
    }
    for (let z = 0; z < 7; z++) for (let segment = 0; segment < 14; segment++) {
      const angle = (segment + .5) / 14 * Math.PI;
      box([.12, .17, .23], [.76 * Math.cos(angle), .87 + .76 * Math.sin(angle), -.69 + z * .24], stone[(z + segment) % stone.length], [0, 0, angle]);
    }
    for (let row = 0; row < 6; row++) for (let col = 0; col < 6; col++) box([.22, .018, .27], [-.6 + col * .24, .10, -.69 + row * .29], stone[(col + row) % stone.length]);
    box([.25, .035, .19], [-.29, .135, .43], '#6a645c');
    box([.25, .035, .19], [.12, .135, .43], '#6a645c');
  } else if (item.id === 2) {
    ring(.25, .045, [0, .065, 0], gold, .65);
    tube([[-.3, .09, .15], [-.28, .17, -.13], [.08, .19, -.19], [.17, .36, .04], [0, .53, 0]], .058, gold, .65);
    tube([[-.19, .11, .13], [-.33, .27, .13], [-.21, .39, .14], [-.1, .35, .14]], .026, brightGold, .6);
    sphere([.095, .04, .055], [-.12, .34, .14], gold, .65);
    for (const side of [-1, 1]) tube([[side * .08, .18, 0], [side * .2, .10, .16], [side * .29, .06, .23]], .026, gold, .6);
    const profile = [[0, .51], [.10, .53], [.21, .59], [.3, .69], [.355, .81], [.36, .87]].map(([x, y]) => new THREE.Vector2(x, y));
    mesh(new THREE.LatheGeometry(profile, 40), gold, [0, 0, 0], [1, 1, 1], [0, 0, 0], .65);
    for (let row = 0; row < 2; row++) for (let i = 0; i < 10; i++) {
      const a = (i + row * .5) / 10 * Math.PI * 2, radius = .245 + row * .075;
      const petal = sphere([.06, .15, .025], [Math.sin(a) * radius, .68 + row * .1, Math.cos(a) * radius], i % 2 ? gold : brightGold, .6);
      petal.rotation.set(.35, a, 0);
    }
    ring(.365, .019, [0, .87, 0], brightGold, .6); ring(.36, .013, [0, .91, 0], gold, .6);
    mesh(new THREE.ConeGeometry(.35, .58, 36), gold, [0, 1.2, 0], [1, 1, 1], [0, 0, 0], .6);
    for (let row = 0; row < 3; row++) for (let i = 0; i < 9 - row * 2; i++) {
      const a = (i + row * .37) / (9 - row * 2) * Math.PI * 2, radius = .27 - row * .083;
      mesh(new THREE.ConeGeometry(.075 - row * .012, .22, 7), i % 2 ? gold : brightGold, [Math.sin(a) * radius, 1.015 + row * .15, Math.cos(a) * radius], [1, 1, .8], [0, a, .12], .6);
    }
    sphere([.06, .10, .075], [0, 1.58, 0], gold, .65);
    sphere([.04, .045, .05], [0, 1.69, .015], brightGold, .65);
    mesh(new THREE.ConeGeometry(.022, .07, 8), gold, [0, 1.69, .078], [1, 1, 1], [Math.PI / 2, 0, 0], .6);
    for (const side of [-1, 1]) {
      const wing = new THREE.Shape(); wing.moveTo(0, 0); wing.bezierCurveTo(side * .06, .11, side * .17, .10, side * .22, .27); wing.bezierCurveTo(side * .26, .06, side * .14, -.04, 0, 0);
      mesh(new THREE.ExtrudeGeometry(wing, { depth: .015, bevelEnabled: true, bevelSize: .007, bevelThickness: .005, bevelSegments: 1, steps: 1, curveSegments: 10 }), brightGold, [side * .025, 1.56, -.025], [1, 1, 1], [0, 0, 0], .65);
    }
    tube([[0, 1.53, -.04], [0, 1.67, -.11], [0, 1.84, -.08]], .025, gold, .6);
  } else if (item.id === 3) {
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
  } else if (item.id === 4) {
    mesh(new THREE.CylinderGeometry(.34, .34, .14, 48, 1, true), gold, [0, .43, 0], [1, 1, 1], [0, 0, 0], .7);
    ring(.34, .011, [0, .5, 0], brightGold, .7); ring(.34, .011, [0, .36, 0], brightGold, .7);
    for (const angle of [-1.12, 0, 1.12]) {
      const tree = new THREE.Group(); tree.position.set(Math.sin(angle) * .34, .5, Math.cos(angle) * .34); tree.rotation.y = angle; root.add(tree);
      box([.046, .68, .018], [0, .34, 0], brightGold, [0, 0, 0], .65, tree);
      for (let tier = 0; tier < 3; tier++) {
        const y = .16 + tier * .175, width = .30 - tier * .045;
        box([width, .033, .018], [0, y, 0], brightGold, [0, 0, 0], .65, tree);
        for (const side of [-1, 1]) {
          box([.031, .10, .018], [side * width / 2, y + .05, 0], brightGold, [0, 0, 0], .65, tree);
          sphere([.028, .036, .009], [side * width / 2, y + .12, 0], brightGold, .65, tree);
          sphere([.024, .028, .007], [side * (width / 2 - .025), y - .035, .018], gold, .7, tree);
        }
        mesh(new THREE.TorusGeometry(.024, .01, 7, 15, Math.PI * 1.45), '#bfd1b4', [.054, y - .045, .035], [1, 1.4, .55], [0, 0, -.4], .1, tree);
      }
      sphere([.04, .06, .012], [0, .72, 0], brightGold, .65, tree);
    }
    for (const side of [-1, 1]) {
      tube([[side * .25, .51, -.20], [side * .3, .74, -.22], [side * .35, .92, -.23], [side * .29, 1.11, -.25]], .018, gold, .6);
      for (let i = 0; i < 3; i++) tube([[side * (.28 + i * .02), .69 + i * .14, -.22], [side * (.40 + i * .012), .80 + i * .14, -.20]], .013, brightGold, .6);
      tube([[side * .28, .4, .18], [side * .31, .2, .24], [side * .32, .03, .25]], .009, gold, .7);
      for (let i = 0; i < 5; i++) sphere([.024, .042, .009], [side * .32, .34 - i * .07, .25], brightGold, .65);
    }
    for (let i = 0; i < 20; i++) { const a = i * Math.PI / 10; sphere([.025, .028, .008], [Math.sin(a) * .342, .41, Math.cos(a) * .342], brightGold, .7).rotation.y = a; }
  } else if (item.id === 5) {
    box([1.6, .08, 1.15], [0, .04, 0], '#b19a78');
    box([1.5, 1.16, .09], [0, .66, -.5], '#d1bb95');
    box([.09, 1.16, 1.08], [-.75, .66, 0], '#a58c70');
    box([.09, .28, 1.08], [.75, .22, 0], '#a58c70');
    for (let row = 0; row < 5; row++) box([.105, .012, 1.07], [-.751, .20 + row * .205, 0], '#786d5b');
    const painting = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 1.09, 8, 8), new THREE.MeshBasicMaterial({ color: '#d7c5a0', side: THREE.DoubleSide }));
    painting.position.set(0, .66, -.449); root.add(painting);
    if (withImages) {
      // Use the existing licensed mural photograph. Geometry-only ray casting never fetches images.
      try {
        const texture = await new THREE.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}images/heritage/three-kingdoms/${item.image}`);
        texture.colorSpace = THREE.SRGBColorSpace; painting.material.map = texture; painting.material.color.set('#ffffff'); painting.material.needsUpdate = true;
      } catch { /* Keep the wall usable; the original photograph is also available beside the model. */ }
    }
  } else {
    mesh(new THREE.CylinderGeometry(1, 1, .065, 48), '#8b8261', [0, .0325, 0], [1, 1, .78]);
    const mounds = [
      { x: -.31, z: -.22, r: .46, h: .53, color: '#9d965e' },
      { x: .40, z: -.02, r: .32, h: .31, color: '#a99a62' },
      { x: -.40, z: .34, r: .30, h: .28, color: '#a79e70' },
      { x: .08, z: .38, r: .20, h: .18, color: '#938952' },
    ];
    for (const mound of mounds) mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mound.color, [mound.x, .065, mound.z], [mound.r, mound.h, mound.r]);
    tube([[-.83, .071, .48], [-.55, .071, .60], [-.04, .071, .62], [.43, .071, .48], [.75, .071, .22]], .028, '#c9b895');
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
