import * as THREE from 'three';
import type { ReconstructionBuilder, Surface, Vec } from './toolkit';

type V3 = InstanceType<typeof THREE.Vector3>;
type Obj = InstanceType<typeof THREE.Object3D>;

/**
 * 혼천의 (Honcheonui, 渾天儀) — photo-reference teaching reconstruction of a Joseon armillary sphere,
 * following the modern restorations of the Sejong-era 혼천의 (1433, built after the Chinese 渾儀
 * tradition described in 세종실록) and the armillary of 송이영's 혼천시계 (1669, National Treasure,
 * 고려대학교 박물관). No Sejong original survives, so ring order, angles and part counts follow those
 * descriptions and the proportions are a teaching reconstruction, not a measured copy. Unit = radius of
 * the outer rings; y = 0 is the ground, north is +x (the viewer's right) and the front (+z) faces east,
 * so the front view shows the meridian ring face-on with the polar axis rising to the right at 37.5°.
 *
 * What is modelled (outer to inner):
 * - 육합의 (六合儀, fixed): the 지평환 (horizon ring), a broad flat band level with the sphere's centre,
 *   with 24 direction marks (24방위) and 5° ticks; the 자오환 (meridian ring), vertical in the
 *   north–south plane and passing through the horizon band at due north and south; and the east–west
 *   ring, read here as the fixed 천상적도환 (天常赤道環) that crosses the horizon at due east and west
 *   and the meridian 52.5° above the southern horizon. All three have the same radius and are joined
 *   where they cross.
 * - 극축 (polar axis): a rod pivoted in the meridian ring at the celestial poles, raised 37.5° (the
 *   latitude of 한양) toward the north; both inner sets turn on it and carry bearing collars on it.
 * - 삼진의 (三辰儀, turns about the axis): a ring through both poles carrying the 적도환 (equator, square
 *   to the axis) and the 황도환 (ecliptic, crossing the equator at the equinoxes at 23.5°, fixed to the
 *   polar ring at the solstices), shown turned 50° from the meridian. A small sun (태양) rides on the
 *   ecliptic in a clamp, as on the 혼천시계.
 * - 사유의 (四遊儀, turns about the axis): a double ring joined at four points, with the 규형 (窺衡)
 *   sighting tube held between the two rings across the diameter. Shown turned 40° the other way.
 * - 지구의 (earth globe) on the polar axis at the centre, as on the 혼천시계. Inferred: so the globe and
 *   the sighting tube can share the centre, the tube is split and its halves join a pivot collar that
 *   rings the globe.
 * - Stand: four dragons (용주) on cloud plinths, each coiling up to carry the horizon ring on the back of
 *   its neck and with one claw, head turned outward; a cross-shaped base (십자 받침) on the diagonals
 *   with a water channel (수평 홈) along both arms for levelling; and a central post whose cradle holds
 *   the lowest point of the meridian ring. The dragons are suggested by curved tapering bodies and
 *   simple heads; scales, whiskers and cloud carving are left out.
 * - Graduations are thin ticks only; no characters are modelled. Inferred / left out: the 백도환
 *   (moon path) and moon of the 혼천시계, the clock mechanism, and exact ring widths.
 *
 * Photo regions and the framing each expects (PhotoView in catalog.ts):
 * - 'rings': every ring, the polar axis and its collars, the sighting tube, globe, sun and all ticks.
 *   Expects a photo of the armillary from the front or front-oblique (azimuth about 0–40°, elevation
 *   about 10–25°), with the frame drawn round the ring sphere only: from the top of the meridian ring
 *   to its lowest point, and across the outer edges of the horizon ring.
 * - 'stand': dragons, plinths, cross base, water and central post. Same photo; frame drawn round the
 *   whole instrument from the ground line to the top of the dragons' heads (just under the horizon
 *   ring) and across the full spread of the base or the dragons, whichever is wider.
 */
export function build(b: ReconstructionBuilder) {
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const arr = (p: V3): Vec => [p.x, p.y, p.z];
  const phi = 37.5 * Math.PI / 180, eps = 23.5 * Math.PI / 180;

  // ---------- layout (unit = radius of the outer 육합의 rings) ----------
  const H = 1.5, C = v(0, H, 0);
  const A = v(Math.cos(phi), Math.sin(phi), 0); // polar axis toward the north celestial pole (north = +x)
  const E1 = v(0, 0, 1); // east (the front)
  const E2 = v(-Math.sin(phi), Math.cos(phi), 0); // highest point of the equator, above the south horizon
  const R6 = 1, w6 = .058, t6 = .08; // 육합의 rings: centre radius, axial width, radial thickness
  const RH = 1.11, tH = .22, wH = .05; // 지평환: broad flat band, inner edge 1.0 so the vertical rings pass into it
  const R3 = .84, w3 = .042, t3 = .065; // 삼진의
  const R4 = .7, w4 = .028, t4 = .06, g4 = .05; // 사유의 double ring, gap g4
  const globeR = .15, collarR = .205;

  /** A group at `origin` whose local x / y axes are the given directions (y = ring normal). */
  const frame = (origin: V3, xAxis: V3, yAxis: V3, parent?: Obj) => {
    const y = yAxis.clone().normalize();
    const x = xAxis.clone().addScaledVector(y, -xAxis.dot(y)).normalize();
    const z = new THREE.Vector3().crossVectors(x, y);
    const g = new THREE.Group();
    g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    g.position.copy(origin);
    (parent || b.root).add(g);
    return g;
  };
  const rod = (p0: V3, p1: V3, r: number, surface: Surface, region: string, segments = 16) => {
    const d = p1.clone().sub(p0), len = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(v(0, 1, 0), d.normalize());
    const e = new THREE.Euler().setFromQuaternion(q), mid = p0.clone().add(p1).multiplyScalar(.5);
    return b.add(new THREE.CylinderGeometry(r, r, len, segments, 1, false), surface, { position: arr(mid), rotation: [e.x, e.y, e.z], region });
  };
  type Tick = { c: V3; u: V3; n: V3; s: [number, number, number] };
  const tickMesh = (list: Tick[], parent: Obj) => {
    const pos: number[] = [];
    const quads = [[0, 2, 3, 1], [4, 5, 7, 6], [0, 1, 5, 4], [2, 6, 7, 3], [0, 4, 6, 2], [1, 3, 7, 5]];
    for (const t of list) {
      const w = new THREE.Vector3().crossVectors(t.u, t.n);
      const corner = (i: number) => t.c.clone().addScaledVector(t.u, (i & 1 ? 1 : -1) * t.s[0]).addScaledVector(t.n, (i & 2 ? 1 : -1) * t.s[1]).addScaledVector(w, (i & 4 ? 1 : -1) * t.s[2]);
      const k = [0, 1, 2, 3, 4, 5, 6, 7].map(corner);
      for (const [a, c1, c2, d] of quads) for (const p of [k[a], k[c1], k[c2], k[a], k[c2], k[d]]) pos.push(p.x, p.y, p.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    b.add(g, 'darkBronze', { parent, region: 'rings' });
  };
  /** Engraved graduations on the flat face(s) of a band ring lying in its frame's x/z plane. */
  const ringTicks = (parent: Obj, R: number, t: number, w: number, n: number, longEvery: number, faces: number[]) => {
    const list: Tick[] = [];
    for (const side of faces) for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, long = i % longEvery === 0;
      const r1 = R + t / 2 - .006, r0 = r1 - (long ? t * .6 : t * .32);
      const u = v(Math.cos(a), 0, Math.sin(a));
      list.push({ c: u.clone().multiplyScalar((r0 + r1) / 2).setY(side * (w / 2 + .001)), u, n: v(0, 1, 0), s: [(r1 - r0) / 2, .003, .0045] });
    }
    tickMesh(list, parent);
  };
  const ringBand = (parent: Obj, R: number, w: number, t: number) => b.band(R, w, t, [0, 0, 0], 'bronze', { parent, region: 'rings', segments: 120 });

  // ---------- 육합의 (fixed outer set) ----------
  b.feature('yukhabui-horizon-meridian-and-equator-rings');
  const horizon = frame(C, v(1, 0, 0), v(0, 1, 0));
  ringBand(horizon, RH, wH, tH);
  ringTicks(horizon, RH, tH, wH, 72, 3, [1]);
  b.ring(RH - tH / 2 + .03, .004, [0, wH / 2, 0], 'darkBronze', { parent: horizon, region: 'rings', segments: 120 });
  const meridian = frame(C, v(1, 0, 0), v(0, 0, 1));
  ringBand(meridian, R6, w6, t6);
  ringTicks(meridian, R6, t6, w6, 72, 6, [1, -1]);
  const equator6 = frame(C, E1, A);
  ringBand(equator6, R6, w6, t6);
  ringTicks(equator6, R6, t6, w6, 72, 6, [1]);

  // ---------- 극축 (polar axis) ----------
  b.feature('polar-axis-at-seoul-latitude');
  rod(C.clone().addScaledVector(A, -R6), C.clone().addScaledVector(A, R6), .022, 'bronze', 'rings');
  for (const s of [-1, 1]) {
    const p = C.clone().addScaledVector(A, s * R6);
    rod(p.clone().addScaledVector(E1, -.055), p.clone().addScaledVector(E1, .055), .04, 'bronze', 'rings'); // pivot boss in the meridian
    for (const d of [R3, R4]) {
      const q = C.clone().addScaledVector(A, s * d);
      rod(q.clone().addScaledVector(A, -.035), q.clone().addScaledVector(A, .035), .038, 'bronze', 'rings');
    }
  }

  // ---------- 삼진의 (middle set, turns about the axis) ----------
  b.feature('samjinui-equator-and-ecliptic-rings');
  const alpha = 50 * Math.PI / 180;
  const D = E2.clone().multiplyScalar(Math.cos(alpha)).addScaledVector(E1, Math.sin(alpha));
  const Q = new THREE.Vector3().crossVectors(D, A).normalize();
  const colure = frame(C, D, Q);
  ringBand(colure, R3, w3, t3);
  ringTicks(colure, R3, t3, w3, 36, 3, [1, -1]);
  const equator3 = frame(C, D, A);
  ringBand(equator3, R3, w3, t3);
  ringTicks(equator3, R3, t3, w3, 72, 6, [1]);
  const Ae = A.clone().multiplyScalar(Math.cos(eps)).addScaledVector(D, -Math.sin(eps));
  const ecliptic = frame(C, Q, Ae);
  ringBand(ecliptic, R3, w3, t3);
  ringTicks(ecliptic, R3, t3, w3, 24, 6, [1]);
  // The sun (태양) riding on the ecliptic in a small clamp, as on the 혼천시계 armillary.
  const sunA = -.9, sunR = R3 - t3 / 2 - .028;
  b.box([.03, w3 + .014, t3 + .014], [Math.cos(sunA) * R3, 0, Math.sin(sunA) * R3], 'gold', { parent: ecliptic, rotation: [0, -sunA, 0], region: 'rings', bevel: .004 });
  b.sphere(.036, [Math.cos(sunA) * sunR, 0, Math.sin(sunA) * sunR], 'gold', { parent: ecliptic, region: 'rings', segments: 18 });

  // ---------- 사유의 (inner double ring with the 규형 sighting tube) ----------
  b.feature('sayuui-ring-with-gyuhyeong-sighting-tube');
  const beta = -40 * Math.PI / 180, theta = 60 * Math.PI / 180;
  const P = E2.clone().multiplyScalar(Math.cos(beta)).addScaledVector(E1, Math.sin(beta));
  const n4 = new THREE.Vector3().crossVectors(P, A).normalize();
  const o4 = g4 / 2 + w4 / 2;
  for (const s of [-1, 1]) {
    const f = frame(C.clone().addScaledVector(n4, s * o4), P, n4);
    ringBand(f, R4, w4, t4);
    ringTicks(f, R4, t4, w4, 72, 6, [s]);
  }
  const sayu = frame(C, P, n4); // local x = P, local z = -A
  const span = 2 * o4 + w4;
  for (const [x, z] of [[R4, 0], [-R4, 0], [0, R4], [0, -R4]]) b.box(x ? [t4, span, .05] : [.05, span, t4], [x, 0, z], 'bronze', { parent: sayu, region: 'rings', bevel: .008 });
  const gyu = new THREE.Group(); gyu.rotation.y = Math.PI / 2 - theta; sayu.add(gyu);
  const tubeIn = collarR, tubeOut = R4 - t4 / 2 + .008, tubeR = .024;
  for (const s of [-1, 1]) {
    b.cylinder(tubeR, tubeR, tubeOut - tubeIn, [s * (tubeIn + tubeOut) / 2, 0, 0], 'bronze', { parent: gyu, rotation: [0, 0, Math.PI / 2], region: 'rings', segments: 16 });
    b.cylinder(tubeR + .01, tubeR + .01, .04, [s * (tubeOut - .05), 0, 0], 'bronze', { parent: gyu, rotation: [0, 0, Math.PI / 2], region: 'rings', segments: 16 });
  }
  b.ring(collarR, .016, [0, 0, 0], 'bronze', { parent: sayu, region: 'rings', segments: 48, radial: 8 });

  // ---------- 지구의 (earth globe on the axis) ----------
  b.feature('earth-globe-at-the-centre');
  b.sphere(globeR, arr(C), 'paper', { region: 'rings', segments: 32 });
  const globe = frame(C, D, A);
  b.ring(globeR, .004, [0, 0, 0], 'darkBronze', { parent: globe, region: 'rings', segments: 48 });

  // ---------- stand: four dragon pillars on a cross base with a water channel ----------
  b.feature('dragon-pillars-on-cross-base-with-water-channel');
  const armL = 2.9, armW = .3, slabH = .1, rimH = .045, rimW = .07;
  for (const a of [Math.PI / 4, -Math.PI / 4]) {
    const g = new THREE.Group(); g.rotation.y = a; b.root.add(g);
    b.box([armL, slabH, armW], [0, slabH / 2, 0], 'darkBronze', { parent: g, region: 'stand', bevel: .015 });
    for (const s of [-1, 1]) {
      b.box([armL - 2 * rimW, rimH, rimW], [0, slabH + rimH / 2 - .003, s * (armW / 2 - rimW / 2)], 'darkBronze', { parent: g, region: 'stand', bevel: .008 });
      b.box([rimW, rimH, armW], [s * (armL / 2 - rimW / 2), slabH + rimH / 2 - .003, 0], 'darkBronze', { parent: g, region: 'stand', bevel: .008 });
    }
    b.box([armL - 2 * rimW + .004, rimH * .55, armW - 2 * rimW + .004], [0, slabH + rimH * .55 / 2 - .003, 0], 'water', { parent: g, region: 'stand', bevel: .002 });
  }
  const baseTop = slabH + rimH - .003, ringUnder = H - wH / 2;
  /** Tube whose radius follows `radius(t)` along its length (t = 0 at the first point, 1 at the last). */
  const taperedTube = (pts: Vec[], radius: (t: number) => number, parent: Obj, segments = 64, radial = 12) => {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
    const g = new THREE.TubeGeometry(curve, segments, 1, radial, false), pos = g.getAttribute('position');
    for (let i = 0; i <= segments; i++) {
      const c = curve.getPointAt(i / segments), r = radius(i / segments);
      for (let j = 0; j <= radial; j++) {
        const k = i * (radial + 1) + j;
        pos.setXYZ(k, c.x + (pos.getX(k) - c.x) * r, c.y + (pos.getY(k) - c.y) * r, c.z + (pos.getZ(k) - c.z) * r);
      }
    }
    return b.add(g, 'bronze', { parent, region: 'stand' });
  };
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    const g = new THREE.Group(); g.rotation.y = -a; b.root.add(g); // local x = outward, z = tangential
    b.lathe([[0, 0], [.16, 0], [.165, .03], [.13, .055], [.14, .085], [.1, .12], [.08, .15], [0, .15]], 'darkBronze', { position: [1.3, baseTop - .005, 0], parent: g, region: 'stand', segments: 28 });
    // Coiling dragon body rising from its cloud plinth; the ring rests on the back of its neck.
    const body: Vec[] = [[1.3, baseTop + .1, 0], [1.25, .4, .08], [1.36, .58, .09], [1.42, .76, -.02], [1.33, .93, -.09], [1.24, 1.08, -.03], [1.22, 1.22, .05], [1.18, 1.36, .02], [RH, ringUnder - .03, 0]];
    taperedTube(body, t => .045 + .027 * Math.sin(Math.PI * Math.min(1, t * 1.25)) + (t > .8 ? (t - .8) * .05 : 0), g);
    b.cylinder(.08, .065, .04, [RH, ringUnder - .02, 0], 'bronze', { parent: g, region: 'stand', segments: 20 });
    // Neck and head turned outward just under the ring's edge.
    taperedTube([[1.19, 1.27, .03], [1.25, 1.35, .01], [1.32, 1.39, 0]], t => .05 - t * .01, g, 12, 10);
    b.sphere(.075, [1.33, 1.395, 0], 'bronze', { parent: g, region: 'stand', scale: [1.45, .85, .95], segments: 18 });
    b.sphere(.045, [1.44, 1.39, 0], 'bronze', { parent: g, region: 'stand', scale: [1.35, .8, .9], segments: 14 });
    b.sphere(.03, [1.42, 1.345, 0], 'bronze', { parent: g, region: 'stand', scale: [1.7, .6, .8], segments: 12 });
    // Foreleg reaching up, its claw pressing on the underside of the horizon ring.
    taperedTube([[1.25, 1.12, -.05], [1.15, 1.25, -.09], [1.06, 1.39, -.08], [1.04, ringUnder - .02, -.07]], t => .03 - t * .008, g, 16, 8);
    b.sphere(.04, [1.04, ringUnder - .012, -.07], 'bronze', { parent: g, region: 'stand', scale: [1.3, .5, 1.3], segments: 12 });
  }
  // Central post under the lowest point of the meridian ring.
  const mBottom = H - R6 - t6 / 2;
  b.lathe([[0, slabH - .01], [.27, slabH - .01], [.27, .15], [.22, .18], [.2, .21], [.13, .25], [.1, .28], [.07, .31], [.065, mBottom - .06], [.095, mBottom - .035], [.07, mBottom], [0, mBottom]], 'darkBronze', { region: 'stand', segments: 32 });
  b.box([.12, .07, .1], [0, mBottom + .01, 0], 'darkBronze', { region: 'stand', bevel: .01 });
}
