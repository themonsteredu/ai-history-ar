import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PHOTO_RECONSTRUCTION } from './preparedCatalog';

type Vec = [number, number, number];
type Rect = [number, number, number, number];
type Geometry = InstanceType<typeof THREE.BufferGeometry>;
type Surface = 'body' | 'edge' | 'dark' | 'jade' | 'earth' | 'painting';

/** Photo-referenced teaching reconstructions, NOT surveyed/scanned museum originals.
 * All textures are UV selections of the existing reference photographs; their bytes
 * and the printed recognition targets are unchanged. Hidden surfaces are inferred.
 * Geometry-only picking follows the identical mesh path, without loading images.
 */
export async function createPhotoReconstruction(id: number, image: string, withImages: boolean) {
  const root = new THREE.Group();
  root.userData.reconstruction = PHOTO_RECONSTRUCTION;
  root.userData.features = [] as string[];
  const metallic = id === 2 || id === 4;
  const palette: Record<Surface, string> = {
    body: id === 1 ? '#9c8665' : id === 6 ? '#b4a079' : metallic ? '#bb914e' : '#b7a082',
    edge: metallic ? '#e1bc73' : '#a48c6a', dark: metallic ? '#66502d' : '#635344',
    jade: '#b9d3c6', earth: '#786751', painting: '#dcc7a5',
  };
  const materials = new Map<Surface, InstanceType<typeof THREE.MeshStandardMaterial> | InstanceType<typeof THREE.MeshBasicMaterial>>();
  const originalGeometries = new Set<Geometry>();
  const photoRect: Rect = id === 1 ? [.018, .51, .145, .64]
    : id === 2 ? [.395, .507, .54, .593]
      : id === 4 ? [.355, .46, .59, .493]
        : id === 6 ? [.39, .51, .61, .635] : [.04, .42, .105, .51];
  const noise = (x: number, y: number, z: number) => Math.sin(x * 87.7 + y * 47.3 + z * 91.1) * Math.sin(x * 31.2 - y * 113.8 + z * 21.7);
  const feature = (name: string) => { root.userData.features.push(name); };
  function material(surface: Surface) {
    let found = materials.get(surface);
    if (!found) {
      found = surface === 'painting' ? new THREE.MeshBasicMaterial({ color: palette[surface], side: THREE.FrontSide })
        : new THREE.MeshStandardMaterial({ color: palette[surface], vertexColors: true, side: THREE.DoubleSide,
          roughness: surface === 'jade' ? .35 : metallic && surface !== 'dark' ? .43 : .96,
          metalness: surface === 'jade' ? .05 : metallic ? .72 : 0, envMapIntensity: metallic ? .8 : .25 });
      materials.set(surface, found);
    }
    return found;
  }
  function mesh(geometry: Geometry, surface: Surface, position: Vec = [0, 0, 0], scale: Vec = [1, 1, 1], rotation: Vec = [0, 0, 0], parent = root, weather = 0) {
    const attr = geometry.getAttribute('position');
    const colors = new Float32Array(attr.count * 3);
    const uv = geometry.getAttribute('uv');
    for (let i = 0; i < attr.count; i++) {
      const x = attr.getX(i), y = attr.getY(i), z = attr.getZ(i);
      const n = noise(x + position[0], y + position[1], z + position[2]);
      if (weather) attr.setXYZ(i, x + n * weather, y + noise(y, z, x) * weather, z + noise(z, x, y) * weather);
      const shade = 1 - (n + 1) * (id === 6 ? .13 : .07);
      colors.set([shade, shade, shade], i * 3);
      if (uv && surface === 'body') {
        // Shape/extrude UVs may lie outside 0..1. Keep every sample inside the selected artifact surface.
        const u = Math.abs(uv.getX(i)) % 1, v = Math.abs(uv.getY(i)) % 1;
        // Native normalized UV endpoints must stay at 1, not wrap to 0.
        const nu = uv.getX(i) === 1 ? 1 : u, nv = uv.getY(i) === 1 ? 1 : v;
        uv.setXY(i, photoRect[0] + nu * (photoRect[2] - photoRect[0]), 1 - photoRect[3] + nv * (photoRect[3] - photoRect[1]));
      }
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    if (weather) geometry.computeVertexNormals();
    const object = new THREE.Mesh(geometry, material(surface));
    object.position.set(...position); object.scale.set(...scale); object.rotation.set(...rotation); parent.add(object);
    originalGeometries.add(geometry); return object;
  }
  function slab(size: Vec, pos: Vec, surface: Surface = 'body', rotation: Vec = [0, 0, 0], parent = root, bevel = .004) {
    const [w, h, d] = size, shape = new THREE.Shape();
    shape.moveTo(-w / 2 + bevel, -h / 2 + bevel); shape.lineTo(w / 2 - bevel, -h / 2 + bevel);
    shape.lineTo(w / 2 - bevel, h / 2 - bevel); shape.lineTo(-w / 2 + bevel, h / 2 - bevel); shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: d - bevel * 2, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1, steps: 1, curveSegments: 1 });
    g.translate(0, 0, -d / 2 + bevel);
    return mesh(g, surface, pos, [1, 1, 1], rotation, parent, metallic ? 0 : .0008);
  }
  const ellipsoid = (size: Vec, pos: Vec, surface: Surface = 'body', parent = root, segments = 12) =>
    mesh(new THREE.SphereGeometry(1, segments, 8), surface, pos, size, [0, 0, 0], parent);
  function tube(points: Vec[], radius: number, surface: Surface = 'body', parent = root, segments = 18, radial = 5) {
    return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), segments, radius, radial, false), surface, [0, 0, 0], [1, 1, 1], [0, 0, 0], parent);
  }
  const ring = (radius: number, thickness: number, y: number, surface: Surface = 'edge', parent = root) =>
    mesh(new THREE.TorusGeometry(radius, thickness, 5, 56), surface, [0, y, 0], [1, 1, 1], [Math.PI / 2, 0, 0], parent);
  function relief(shape: InstanceType<typeof THREE.Shape>, pos: Vec, surface: Surface = 'body', parent = root, depth = .008) {
    return mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: .002, bevelSize: .002, bevelSegments: 1, steps: 1, curveSegments: 7 }), surface, pos, [1, 1, 1], [0, 0, 0], parent);
  }
  function leaf(w: number, h: number) {
    const shape = new THREE.Shape(); shape.moveTo(0, 0);
    shape.bezierCurveTo(-w * .65, h * .22, -w * .5, h * .62, 0, h);
    shape.bezierCurveTo(w * .5, h * .62, w * .65, h * .22, 0, 0); return shape;
  }

  if (id === 1) {
    feature('weathered-brick-chamber');
    slab([1.64, .075, 1.86], [0, .0375, 0], 'earth');
    // Open front and a cut-away right wall expose the burial chamber on a tablet.
    for (let row = 0; row < 9; row++) for (let col = 0; col < 8; col++) {
      const y = .12 + row * .084, x = -.70 + col * .198;
      slab([.189, .077, .10], [x, y, -.84]);
      if (col < 8) {
        slab([.11, .077, .214], [-.77, y, -.69 + col * .216]);
        if (row < 3 || col < 3) slab([.11, .077, .214], [.77, y, -.69 + col * .216]);
      }
    }
    feature('barrel-vault-cutaway');
    for (let course = 0; course < 8; course++) for (let sector = 0; sector < 13; sector++) {
      // Remove the near-right quarter of the vault so the textured interior remains visible.
      if (course > 2 && sector < 5) continue;
      const angle = (sector + .5) * Math.PI / 13;
      slab([.113, .174, .204], [.77 * Math.cos(angle), .845 + .69 * Math.sin(angle), -.70 + course * .216], 'body', [0, 0, angle]);
    }
    for (let row = 0; row < 7; row++) for (let col = 0; col < 7; col++)
      slab([.204, .018, .222], [-.634 + col * .212, .086, -.714 + row * .232], 'body', [0, 0, 0], root, .002);
    feature('arched-recess');
    const recess = new THREE.Shape(); recess.moveTo(-.13, 0); recess.lineTo(.13, 0); recess.lineTo(.13, .10);
    recess.quadraticCurveTo(.10, .22, 0, .26); recess.quadraticCurveTo(-.10, .22, -.13, .10); recess.closePath();
    relief(recess, [0, .38, -.78], 'dark', root, .001);
    // Small patterned bands are raised geometry, not invented readable inscriptions.
    for (let row = 0; row < 3; row++) for (let col = 0; col < 7; col++) {
      const x = -.61 + col * .20, y = .25 + row * .235;
      tube([[x - .065, y, -.783], [x, y + .028, -.778], [x + .065, y, -.783]], .0025, 'edge', root, 4, 3);
    }
    feature('inscription-stones-without-invented-text');
    slab([.25, .033, .19], [-.26, .118, .48], 'dark'); slab([.25, .033, .19], [.10, .118, .48], 'dark');
  } else if (id === 2) {
    feature('coiled-dragon-support');
    tube([[-.31, .075, .13], [-.23, .09, -.20], [.17, .12, -.18], [.20, .22, .10], [.10, .36, .05], [0, .51, 0]], .045, 'body', root, 40, 8);
    tube([[-.27, .09, .13], [-.29, .20, .14], [-.16, .30, .11], [-.12, .36, .14]], .031, 'body', root, 22, 7);
    ellipsoid([.065, .035, .038], [-.12, .34, .15]);
    ellipsoid([.021, .018, .014], [-.08, .363, .17], 'edge');
    for (const side of [-1, 1]) {
      tube([[side * .13, .13, -.07], [side * .25, .08, .10], [side * .30, .05, .20]], .019);
      for (let toe = 0; toe < 3; toe++) tube([[side * .29, .05, .19], [side * (.30 + toe * .025), .035, .24 + toe * .011]], .007, 'edge', root, 5, 4);
    }
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      relief(leaf(.035, .06), [Math.sin(a) * .235, .095, Math.cos(a) * .19], 'edge').rotation.y = a;
    }
    feature('layered-lotus-bowl');
    const profile = [[0, .48], [.08, .5], [.17, .55], [.27, .63], [.335, .72], [.353, .81], [.353, .85]].map(([x, y]) => new THREE.Vector2(x, y));
    mesh(new THREE.LatheGeometry(profile, 64), 'body');
    for (let row = 0; row < 3; row++) for (let i = 0; i < 10; i++) {
      const a = (i + row * .48) * Math.PI / 5, r = .175 + row * .067;
      const petal = relief(leaf(.118, .19), [Math.sin(a) * r, .55 + row * .054, Math.cos(a) * r], 'body');
      petal.rotation.set(.46 - row * .1, a, 0);
      const vein = tube([[0, .02, .012], [0, .07, .020], [0, .13, .012]], .0025, 'edge', root, 7, 3);
      vein.position.copy(petal.position); vein.rotation.copy(petal.rotation);
    }
    ring(.353, .009, .827); ring(.357, .008, .856); ring(.348, .009, .879);
    feature('sculpted-mountain-lid');
    const lidProfile = [[0, .863], [.345, .863], [.31, .98], [.24, 1.10], [.17, 1.23], [.08, 1.38], [.045, 1.42]].map(([x, y]) => new THREE.Vector2(x, y));
    const lid = new THREE.LatheGeometry(lidProfile, 64);
    const lp = lid.getAttribute('position');
    for (let i = 0; i < lp.count; i++) {
      const a = Math.atan2(lp.getX(i), lp.getZ(i)), y = lp.getY(i);
      const wobble = 1 + Math.sin(a * 11 + y * 17) * .045;
      lp.setXYZ(i, lp.getX(i) * wobble, y, lp.getZ(i) * wobble);
    }
    lid.computeVertexNormals(); mesh(lid, 'body');
    // Overlapping curved ridges replace the old straight cone silhouette.
    for (let tier = 0; tier < 4; tier++) for (let i = 0; i < 10 - tier; i++) {
      const a = (i + tier * .41) / (10 - tier) * Math.PI * 2, r = .31 - tier * .068, y = .887 + tier * .135;
      const peak = new THREE.Shape(); peak.moveTo(-.075, 0);
      peak.bezierCurveTo(-.035, .04, -.036, .17, -.011, .192);
      peak.bezierCurveTo(.012, .155, .024, .065, .076, .015); peak.quadraticCurveTo(0, -.038, -.075, 0);
      const ridge = relief(peak, [Math.sin(a) * r, y, Math.cos(a) * r]); ridge.rotation.y = a;
      const outline = tube([[-.067, .007, .017], [-.034, .067, .017], [-.011, .180, .017], [.030, .069, .017], [.067, .018, .017]], .004, 'edge', root, 16, 4);
      outline.position.copy(ridge.position); outline.rotation.copy(ridge.rotation);
    }
    // Deliberately indicative relief figures, not a claim to reproduce every original figure.
    feature('indicative-relief-figures');
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5, figure = new THREE.Group();
      figure.position.set(Math.sin(a) * .235, 1.04, Math.cos(a) * .235); figure.rotation.y = a; root.add(figure);
      ellipsoid([.020, .031, .023], [0, .076, 0], 'body', figure);
      ellipsoid([.027, .043, .022], [0, .027, 0], 'body', figure);
      tube([[-.031, .040, .016], [0, .030, .037], [.032, .049, .01]], .008, 'edge', figure, 6, 4);
    }
    feature('phoenix-with-feathered-wings');
    ellipsoid([.037, .079, .043], [0, 1.508, 0]);
    tube([[0, 1.535, .01], [0, 1.606, .025], [0, 1.637, .007]], .019, 'body', root, 14, 7);
    ellipsoid([.026, .028, .027], [0, 1.645, .013]);
    mesh(new THREE.ConeGeometry(.010, .049, 7), 'edge', [0, 1.642, .051], [1, 1, 1], [Math.PI / 2, 0, 0]);
    for (const side of [-1, 1]) {
      tube([[side * .015, 1.463, .008], [side * .018, 1.421, .025]], .008, 'edge', root, 5, 4);
      for (let feather = 0; feather < 7; feather++) {
        const shape = leaf(.035, .14 + feather * .015);
        const wing = relief(shape, [side * (.027 + feather * .012), 1.48 + feather * .012, -.009], 'body');
        wing.rotation.z = -side * (.4 + feather * .115);
      }
    }
    for (let i = 0; i < 4; i++) tube([[0, 1.469, -.022], [(i - 1.5) * .016, 1.57, -.074], [(i - 1.5) * .014, 1.735 + i * .012, -.05]], .005, 'edge', root, 16, 4);
  } else if (id === 4) {
    feature('thin-gold-circlet');
    mesh(new THREE.CylinderGeometry(.337, .337, .12, 80, 1, true), 'body', [0, .48, 0]);
    ring(.34, .004, .423); ring(.34, .004, .537);
    // Flat, thin cut-gold plates and punched dots, rather than thick rectangular branches.
    feature('three-tree-plates');
    for (const angle of [-1.12, 0, 1.12]) {
      const tree = new THREE.Group(); tree.position.set(Math.sin(angle) * .337, .53, Math.cos(angle) * .337); tree.rotation.y = angle; root.add(tree);
      slab([.039, .607, .006], [0, .3035, 0], 'body', [0, 0, 0], tree, .0015);
      for (let tier = 0; tier < 3; tier++) {
        const y = .114 + tier * .154, w = .275 - tier * .031;
        slab([w, .025, .006], [0, y, 0], 'body', [0, 0, 0], tree, .0015);
        for (const side of [-1, 1]) {
          slab([.025, .083, .006], [side * (w / 2 - .012), y + .034, 0], 'body', [0, 0, 0], tree, .0015);
          relief(leaf(.052, .064), [side * (w / 2 - .012), y + .066, -.002], 'body', tree, .003);
          for (let dot = 0; dot < 4; dot++) ellipsoid([.0022, .0022, .0015], [side * (w / 2 - .023), y + dot * .016, .005], 'edge', tree, 5);
          // Hinged spangles are separate thin discs with dark wire loops.
          const discX = side * (w / 2 - .009), discY = y - .04;
          tube([[discX, y, .014], [discX + .003, discY + .02, .022]], .0015, 'dark', tree, 4, 3);
          mesh(new THREE.CircleGeometry(.014, 14), 'edge', [discX, discY, .024], [1, 1.06, 1], [0, side * .28, .1], tree);
        }
        ellipsoid([.014, .014, .005], [0, y, .009], 'edge', tree, 10);
        const jade = mesh(new THREE.TorusGeometry(.021, .008, 7, 16, Math.PI * 1.4), 'jade', [.037, y - .026, .023], [.75, 1.30, .60], [0, 0, -.45], tree);
        jade.name = 'comma-shaped-jade';
      }
      relief(leaf(.088, .092), [0, .582, -.002], 'body', tree, .004);
      for (let dot = 0; dot < 14; dot++) ellipsoid([.002, .002, .0015], [-.012, .033 + dot * .038, .005], 'edge', tree, 5);
    }
    feature('antler-plates');
    for (const side of [-1, 1]) {
      const antler = new THREE.Shape(); antler.moveTo(-.018, 0);
      antler.bezierCurveTo(-.02, .16, .055, .29, .057, .49); antler.lineTo(.084, .58);
      antler.lineTo(.085, .37); antler.lineTo(.166, .445); antler.lineTo(.156, .397);
      antler.lineTo(.078, .30); antler.lineTo(.057, .223); antler.lineTo(-.012, .35);
      antler.lineTo(-.025, .31); antler.lineTo(.026, .169); antler.lineTo(.018, 0); antler.closePath();
      const plate = relief(antler, [side * .254, .534, -.215]); plate.scale.x = side; plate.rotation.y = side * .5;
      for (let i = 0; i < 5; i++) mesh(new THREE.CircleGeometry(.013, 12), 'edge', [side * (.27 + i * .014), .64 + i * .08, -.19], [1, 1, 1], [0, side * .5, 0]);
    }
    feature('long-chain-pendants');
    for (const side of [-1, 1]) {
      const x = side * .296, z = .187;
      ellipsoid([.033, .044, .022], [x, .377, z], 'body');
      for (let strand = 0; strand < 2; strand++) {
        const dx = x + side * strand * .023;
        for (let i = 0; i < 13; i++) {
          mesh(new THREE.TorusGeometry(.009, .0018, 4, 10), 'edge', [dx + Math.sin(i * .7) * .006, .326 - i * .024, z + .016], [1, 1.4, 1], [0, i % 2 * Math.PI / 2, .12]);
          if (i % 3 === 0) relief(leaf(.023, .055), [dx + side * .015, .28 - i * .024, z + .02], 'body', root, .003);
        }
      }
      relief(leaf(.042, .077), [x, -.055, z + .02], 'body', root, .004);
    }
    feature('jade-and-gold-spangles');
    for (let i = 0; i < 28; i++) {
      const a = i / 28 * Math.PI * 2;
      mesh(new THREE.CircleGeometry(.013, 12), 'edge', [Math.sin(a) * .347, .45 + (i % 2) * .045, Math.cos(a) * .347], [1, 1, 1], [0, a, 0]);
    }
  } else if (id === 5) {
    feature('irregular-plaster-wall');
    slab([1.60, .07, 1.10], [0, .035, 0], 'earth');
    slab([1.50, 1.17, .105], [0, .652, -.49], 'body');
    for (let row = 0; row < 6; row++) {
      slab([.095, .18, 1.01], [-.75, .17 + row * .186, 0], 'body');
      if (row < 2) slab([.095, .18, 1.01], [.75, .17 + row * .186, 0], 'body');
    }
    feature('original-mural-image-on-subdivided-surface');
    const painting = new THREE.PlaneGeometry(1.34, 1.34 * 611 / 740, 36, 28), p = painting.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      p.setZ(i, .0018 * Math.sin(x * 21) * Math.cos(y * 24));
    }
    painting.computeVertexNormals();
    mesh(painting, 'painting', [0, .655, -.432]);
    feature('exposed-masonry-edges');
    for (let col = 0; col < 7; col++) slab([.207, .055, .12], [-.642 + col * .214, 1.263, -.49], 'body');
    for (let row = 0; row < 4; row++) for (let col = 0; col < 6; col++) slab([.225, .012, .235], [-.58 + col * .232, .077, -.345 + row * .243], 'body', [0, 0, 0], root, .0015);
  } else if (id === 6) {
    feature('undulating-grass-terrain');
    const terrain = new THREE.PlaneGeometry(1.94, 1.47, 54, 42); terrain.rotateX(-Math.PI / 2);
    const p = terrain.getAttribute('position');
    const ground = (x: number, z: number) => .058 + .032 * Math.sin(x * 3.7 + .6) * Math.cos(z * 4.1) + .012 * noise(x, 0, z);
    for (let i = 0; i < p.count; i++) p.setY(i, ground(p.getX(i), p.getZ(i)));
    terrain.computeVertexNormals(); mesh(terrain, 'body');
    slab([1.94, .045, 1.47], [0, .012, 0], 'earth', [0, 0, 0], root, .009);
    feature('uneven-earth-mounds');
    const mounds = [{ x: -.23, z: -.23, r: .44, h: .45 }, { x: .43, z: -.03, r: .31, h: .28 }, { x: -.51, z: .32, r: .29, h: .25 }, { x: .03, z: .39, r: .20, h: .15 }];
    for (const [index, mound] of mounds.entries()) {
      const dome = new THREE.SphereGeometry(1, 56, 25, 0, Math.PI * 2, 0, Math.PI / 2), a = dome.getAttribute('position');
      for (let i = 0; i < a.count; i++) {
        const x = a.getX(i), y = a.getY(i), z = a.getZ(i);
        const ripple = 1 + .018 * noise(x + index, y, z) + .018 * Math.sin(z * 6);
        a.setXYZ(i, x * mound.r * ripple, ground(x * mound.r + mound.x, z * mound.r + mound.z) + y * mound.h * (1 + .016 * noise(x, y, z)), z * mound.r * ripple);
      }
      dome.computeVertexNormals(); mesh(dome, 'body', [mound.x, 0, mound.z]);
    }
    feature('worn-footpath');
    const path = new THREE.CatmullRomCurve3([[-.92, .09, .53], [-.57, .09, .63], [-.02, .08, .67], [.48, .08, .48], [.86, .075, .20]].map(p => new THREE.Vector3(...p)));
    const pathGeometry = new THREE.PlaneGeometry(.045, 1, 1, 50), pa = pathGeometry.getAttribute('position');
    for (let i = 0; i < pa.count; i++) {
      const t = pa.getY(i) + .5, center = path.getPoint(t), tangent = path.getTangent(t), offset = pa.getX(i);
      const x = center.x + tangent.z * offset, z = center.z - tangent.x * offset;
      pa.setXYZ(i, x, ground(x, z) + .002, z);
    }
    pathGeometry.computeVertexNormals(); mesh(pathGeometry, 'edge');
  } else throw new Error('사진 참고 재현 모형을 찾지 못했어요.');

  if (withImages) {
    try {
      const texture = await new THREE.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}images/heritage/three-kingdoms/${image}`);
      texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
      // Share a single original photograph between material slots; no derived raster files.
      for (const [surface, mat] of materials) if (surface === 'body' || surface === 'painting') {
        mat.map = texture; mat.color.set('#ffffff'); mat.needsUpdate = true;
        if (mat instanceof THREE.MeshStandardMaterial) { mat.bumpMap = texture; mat.bumpScale = metallic ? .002 : .008; }
      }
      root.userData.photoTextureLoaded = true;
    } catch { root.userData.photoTextureLoaded = false; }
  }
  root.updateMatrixWorld(true);
  const buckets = new Map<InstanceType<typeof THREE.Material>, Geometry[]>();
  root.traverse((object: InstanceType<typeof THREE.Object3D>) => {
    if (!(object instanceof THREE.Mesh)) return;
    const copy = object.geometry.clone().applyMatrix4(object.matrixWorld);
    const geometry = copy.index ? copy.toNonIndexed() : copy;
    if (copy !== geometry) copy.dispose();
    const list = buckets.get(object.material) || []; list.push(geometry); buckets.set(object.material, list);
  });
  root.clear(); originalGeometries.forEach(geometry => geometry.dispose());
  for (const [mat, geometries] of buckets) {
    const combined = mergeGeometries(geometries, false);
    if (!combined) throw new Error('재현 모형을 합치지 못했어요.');
    root.add(new THREE.Mesh(combined, mat)); geometries.forEach(geometry => geometry.dispose());
  }
  return root;
}
