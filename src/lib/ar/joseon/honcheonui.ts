import * as THREE from 'three';
import type { PhotoView, ReconstructionBuilder, Surface, Vec } from './toolkit';

type V3 = InstanceType<typeof THREE.Vector3>;
type Obj = InstanceType<typeof THREE.Object3D>;

/**
 * 혼천의 (Honcheonui, 渾天儀) — photo-reference teaching reconstruction of a Joseon armillary sphere,
 * matched to the bronze restoration at King Sejong's tomb (영릉, photos.json id 5) and following the
 * Sejong-era 혼천의 (1433, after the Chinese 渾儀 tradition described in 세종실록) and the armillary of
 * 송이영's 혼천시계 (1669). No Sejong original survives, so ring order and angles follow those
 * descriptions; proportions, legs and the central post follow the photo. Not a scan or a measured copy.
 * Unit = centre radius of the meridian ring; y = 0 is the top of the plinth the instrument stands on (the
 * plinth itself is not modelled). North is +x (the viewer's right) and the front (+z) faces east, so the
 * front view shows the meridian ring face-on with the polar axis rising to the right at 37.5°.
 *
 * What is modelled (outer to inner):
 * - 육합의 (六合儀, fixed): the 지평환 (horizon ring), a broad upright band (a short hoop) level with the
 *   sphere's centre and just outside the other rings; the 자오환 (meridian ring), vertical in the
 *   north–south plane, passing inside the band at due north and south; and the fixed equator ring
 *   (천상적도환) of the same size, crossing the horizon at due east and west, seen almost edge-on from the
 *   front as in the photo.
 * - 극축 (polar axis): a rod pivoted in the meridian ring at the celestial poles, raised 37.5° (the
 *   latitude of 한양) toward the north, with a toothed wheel on its northern end outside the meridian
 *   ring, as on the restoration. Both inner sets turn on it and carry bearing collars on it.
 * - 삼진의 (三辰儀, turns about the axis): a ring through both poles carrying the 적도환 (equator) and the
 *   황도환 (ecliptic, 23.5° to the equator); a small sun (태양) rides on the ecliptic in a clamp, as on the
 *   혼천시계.
 * - 사유의 (四遊儀, turns about the axis): a double ring with the 규형 (窺衡) sighting tube between its two
 *   rings; turned edge-on to the front, as in the photo, so the rings and tube read as a bundle of rods
 *   along the polar axis.
 * - 지구의 (earth globe) on the axis at the centre, bronze like the rest of the restoration. Inferred: so
 *   the globe and the sighting tube can share the centre, the tube is split and joins a pivot collar.
 * - Stand (as in the photo): four heavy cast legs on the diagonals, each an S-curved scroll leg carved
 *   with dragon-and-cloud work (broad shoulder under the band, bulging knee, slimmer shank, scrolled
 *   foot), carrying the horizon band on their tops; and a central post — round foot, openwork stem and
 *   a wide cloud cradle — holding the lowest point of the meridian ring. The carving itself comes from
 *   the photo texture; the legs and post stand directly on the plinth (no cross-shaped base or water
 *   channel in this restoration).
 * - Graduations are thin ticks only; no characters are modelled. Inferred / left out: the 백도환
 *   (moon path) and moon of the 혼천시계, the clock mechanism, and exact ring widths.
 *
 * Photo regions (see `photoViews` below). The photo is taken from the front, slightly toward the south
 * (azimuth about −9°), with the camera about level with the horizon band and looking down on the feet.
 * - 'band': the horizon band, from its front face.
 * - 'leg-fl', 'leg-fr': the two front legs, each from the direction the camera saw it. 'leg-bl' and
 *   'leg-br' are hidden in the photo; the four legs are identical castings, so each back leg borrows the
 *   pixels of the front leg turned by 90° onto it.
 * - 'post': the central cradle post.
 * - 'rings': all thin rings, the axis and its fittings and the globe. Background shows between them in
 *   the photo, so they take only a small solid patch of the band's green patina.
 */
export function build(b: ReconstructionBuilder) {
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const arr = (p: V3): Vec => [p.x, p.y, p.z];
  const phi = 37.5 * Math.PI / 180, eps = 23.5 * Math.PI / 180;

  // ---------- layout (unit = centre radius of the meridian ring) ----------
  const H = 1.5, C = v(0, H, 0);
  const A = v(Math.cos(phi), Math.sin(phi), 0); // polar axis toward the north celestial pole (north = +x)
  const E1 = v(0, 0, 1); // east (the front)
  const E2 = v(-Math.sin(phi), Math.cos(phi), 0); // highest point of the equator, above the south horizon
  const R6 = 1, w6 = .045, t6 = .055; // 육합의 rings: centre radius, axial width, radial thickness
  const RB = 1.072, hB = .21, tB = .034; // 지평환: upright band (hoop) just outside the meridian ring
  const R3 = .82, w3 = .036, t3 = .05; // 삼진의
  const R4 = .68, w4 = .026, t4 = .045, g4 = .05; // 사유의 double ring, gap g4
  const globeR = .18, collarR = .23;

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
    b.add(g, 'darkBronze', { parent }); // engraved lines stay plain dark bronze
  };
  /** Engraved graduations on the flat face(s) of a band ring lying in its frame's x/z plane. */
  const ringTicks = (parent: Obj, R: number, t: number, w: number, n: number, longEvery: number, faces: number[]) => {
    const list: Tick[] = [];
    for (const side of faces) for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, long = i % longEvery === 0;
      const r1 = R + t / 2 - .005, r0 = r1 - (long ? t * .6 : t * .32);
      const u = v(Math.cos(a), 0, Math.sin(a));
      list.push({ c: u.clone().multiplyScalar((r0 + r1) / 2).setY(side * (w / 2 + .001)), u, n: v(0, 1, 0), s: [(r1 - r0) / 2, .0025, .004] });
    }
    tickMesh(list, parent);
  };
  const ringBand = (parent: Obj, R: number, w: number, t: number) => b.band(R, w, t, [0, 0, 0], 'bronze', { parent, region: 'rings', segments: 120 });

  // ---------- 육합의 (fixed outer set) ----------
  b.feature('yukhabui-horizon-meridian-and-equator-rings');
  b.band(RB, hB, tB, arr(C), 'bronze', { region: 'band', segments: 128 });
  const meridian = frame(C, v(1, 0, 0), v(0, 0, 1));
  ringBand(meridian, R6, w6, t6);
  ringTicks(meridian, R6, t6, w6, 72, 6, [1, -1]);
  const equator6 = frame(C, E1, A);
  ringBand(equator6, R6, w6, t6);
  ringTicks(equator6, R6, t6, w6, 72, 6, [1]);
  // Small blocks tying the meridian ring to the inside of the band at due north and south.
  for (const s of [-1, 1]) b.box([RB - tB / 2 - R6 - t6 / 2 + .01, hB * .6, w6 + .02], [s * (R6 + t6 / 2 + (RB - tB / 2 - R6 - t6 / 2) / 2), H, 0], 'bronze', { region: 'rings', bevel: .004 });

  // ---------- 극축 (polar axis) ----------
  b.feature('polar-axis-at-seoul-latitude');
  rod(C.clone().addScaledVector(A, -R6), C.clone().addScaledVector(A, R6), .02, 'bronze', 'rings');
  for (const s of [-1, 1]) {
    const p = C.clone().addScaledVector(A, s * R6);
    rod(p.clone().addScaledVector(E1, -.05), p.clone().addScaledVector(E1, .05), .036, 'bronze', 'rings'); // pivot boss in the meridian
    for (const d of [R3, R4]) {
      const q = C.clone().addScaledVector(A, s * d);
      rod(q.clone().addScaledVector(A, -.03), q.clone().addScaledVector(A, .03), .034, 'bronze', 'rings');
    }
  }
  // Toothed wheel on the northern end of the axis, outside the meridian ring (as on the restoration).
  const wheelAt = C.clone().addScaledVector(A, R6 + t6 / 2 + .09);
  rod(C.clone().addScaledVector(A, R6), wheelAt, .018, 'bronze', 'rings');
  const teeth = 18, wheelR = .115, wheelShape = new THREE.Shape();
  for (let i = 0; i <= teeth * 4; i++) {
    const a = i / (teeth * 4) * Math.PI * 2, r = (i % 4 === 1 || i % 4 === 2) ? wheelR : wheelR - .022;
    if (i === 0) wheelShape.moveTo(r * Math.cos(a), r * Math.sin(a)); else wheelShape.lineTo(r * Math.cos(a), r * Math.sin(a));
  }
  b.extrude(wheelShape, .02, 'bronze', { position: [wheelAt.x, wheelAt.y, wheelAt.z - .01], region: 'rings', bevel: .002 });
  b.cylinder(.03, .03, .05, arr(wheelAt), 'bronze', { rotation: [Math.PI / 2, 0, 0], region: 'rings', segments: 16 });

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
  const sunA = -.9, sunR = R3 - t3 / 2 - .026;
  b.box([.028, w3 + .012, t3 + .012], [Math.cos(sunA) * R3, 0, Math.sin(sunA) * R3], 'gold', { parent: ecliptic, rotation: [0, -sunA, 0], bevel: .004 });
  b.sphere(.032, [Math.cos(sunA) * sunR, 0, Math.sin(sunA) * sunR], 'gold', { parent: ecliptic, segments: 18 });

  // ---------- 사유의 (inner double ring with the 규형 sighting tube) ----------
  b.feature('sayuui-ring-with-gyuhyeong-sighting-tube');
  const beta = 84 * Math.PI / 180, theta = 25 * Math.PI / 180;
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
  for (const [x, z] of [[R4, 0], [-R4, 0], [0, R4], [0, -R4]]) b.box(x ? [t4, span, .045] : [.045, span, t4], [x, 0, z], 'bronze', { parent: sayu, region: 'rings', bevel: .007 });
  const gyu = new THREE.Group(); gyu.rotation.y = Math.PI / 2 - theta; sayu.add(gyu);
  const tubeIn = collarR, tubeOut = R4 - t4 / 2 + .008, tubeR = .022;
  for (const s of [-1, 1]) {
    b.cylinder(tubeR, tubeR, tubeOut - tubeIn, [s * (tubeIn + tubeOut) / 2, 0, 0], 'bronze', { parent: gyu, rotation: [0, 0, Math.PI / 2], region: 'rings', segments: 16 });
    b.cylinder(tubeR + .009, tubeR + .009, .04, [s * (tubeOut - .05), 0, 0], 'bronze', { parent: gyu, rotation: [0, 0, Math.PI / 2], region: 'rings', segments: 16 });
  }
  b.ring(collarR, .015, [0, 0, 0], 'bronze', { parent: sayu, region: 'rings', segments: 48, radial: 8 });

  // ---------- 지구의 (earth globe on the axis) ----------
  b.feature('earth-globe-at-the-centre');
  b.sphere(globeR, arr(C), 'bronze', { region: 'rings', segments: 32 });
  const globe = frame(C, D, A);
  b.ring(globeR, .004, [0, 0, 0], 'darkBronze', { parent: globe, segments: 48 });

  // ---------- stand: four carved scroll legs and a central cradle post ----------
  b.feature('four-carved-dragon-scroll-legs-and-cradle-post');
  /** Solid lofted along a centre line in the local x/y plane; each station is [x, y, a, b]: an ellipse with
   *  half-width a in that plane and b along z. Stations are smoothed with a Catmull-Rom spline. */
  const loft = (stations: Array<[number, number, number, number]>, parent: Obj, region: string, steps = 5, radial = 18) => {
    const cr = (p0: number, p1: number, p2: number, p3: number, t: number) => .5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);
    const pts: number[][] = [];
    for (let i = 0; i < stations.length - 1; i++) for (let k = 0; k < steps; k++) {
      const s = [stations[Math.max(0, i - 1)], stations[i], stations[i + 1], stations[Math.min(stations.length - 1, i + 2)]];
      pts.push([0, 1, 2, 3].map(c => cr(s[0][c], s[1][c], s[2][c], s[3][c], k / steps)));
    }
    pts.push([...stations[stations.length - 1]]);
    const pos: number[] = [], idx: number[] = [], n = pts.length;
    for (let i = 0; i < n; i++) {
      const [x, y, a, bb] = pts[i], p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(n - 1, i + 1)];
      const l = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1, nx = (p1[1] - p0[1]) / l, ny = -(p1[0] - p0[0]) / l;
      for (let j = 0; j <= radial; j++) {
        const t = j / radial * Math.PI * 2;
        pos.push(x + nx * a * Math.cos(t), y + ny * a * Math.cos(t), bb * Math.sin(t));
      }
    }
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < radial; j++) {
      const k = i * (radial + 1) + j, k2 = k + radial + 1;
      idx.push(k, k2, k + 1, k + 1, k2, k2 + 1);
    }
    for (const i of [0, n - 1]) { // flat caps
      const centre = pos.length / 3;
      pos.push(pts[i][0], pts[i][1], 0);
      for (let j = 0; j < radial; j++) idx.push(centre, i * (radial + 1) + j, i * (radial + 1) + j + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx); g.computeVertexNormals();
    return b.add(g, 'bronze', { parent, region });
  };
  const legTop = H - hB / 2 + .005, r0 = 1.04;
  // [radial x, height y, radial half-width, tangential half-width]: shoulder, knee, shank, ankle.
  const legStations: Array<[number, number, number, number]> = [
    [r0, legTop, .14, .08], [r0 + .03, 1.3, .155, .085], [r0 + .06, 1.16, .17, .09], [r0 + .065, 1.0, .17, .09],
    [r0 + .03, .84, .155, .085], [r0 - .02, .68, .13, .075], [r0 - .05, .52, .11, .067], [r0 - .06, .36, .095, .06],
    [r0 - .055, .24, .09, .058], [r0 - .04, .14, .09, .058],
  ];
  const legRegions = ['leg-fr', 'leg-fl', 'leg-bl', 'leg-br'];
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2, region = legRegions[i];
    const g = new THREE.Group(); g.rotation.y = -a; b.root.add(g); // local x = outward, z = tangential
    loft(legStations, g, region);
    // Scrolled foot: a volute lying across the leg, with a curl in relief on each face.
    const footR = .085, footX = r0 - .02;
    b.cylinder(footR, footR, .13, [footX, footR, 0], 'bronze', { parent: g, rotation: [Math.PI / 2, 0, 0], region, segments: 22 });
    for (const s of [-1, 1]) b.ring(.052, .013, [footX, footR, s * .065], 'bronze', { parent: g, rotation: [Math.PI / 2, 0, 0], region, segments: 24, radial: 6, arc: Math.PI * 1.5 });
  }
  // Central post: round foot, openwork stem (solid here) and a wide cloud cradle under the meridian ring.
  b.lathe([[0, 0], [.17, 0], [.175, .03], [.165, .06], [.13, .085], [.1, .1], [0, .1]], 'bronze', { region: 'post', segments: 32 });
  b.lathe([[0, .09], [.1, .09], [.125, .15], [.13, .21], [.11, .26], [.085, .3], [.1, .335], [0, .335]], 'bronze', { region: 'post', segments: 24 });
  const rOut = R6 + t6 / 2, tipA = Math.asin(.34 / rOut), cradle = new THREE.Shape();
  cradle.moveTo(-.18, .32); cradle.lineTo(.18, .32);
  cradle.quadraticCurveTo(.3, .38, .34, H - rOut * Math.cos(tipA));
  cradle.absarc(0, H, rOut, -Math.PI / 2 + tipA, -Math.PI / 2 - tipA, true);
  cradle.quadraticCurveTo(-.3, .38, -.18, .32);
  b.extrude(cradle, .14, 'bronze', { position: [0, 0, -.07], region: 'post', bevel: .012 });
}

/** How the photo (photos.json id 5, 1280×719) lies on each region: the view it was taken from and where the region sits in it. */
export const photoViews: Record<string, PhotoView> = {
  'leg-fl': { elevation: 11, azimuth: -2, frame: [.4234, .4534, .4812, .9235] },
  'leg-fr': { elevation: 11, azimuth: -18, frame: [.7016, .4534, .7719, .9165] },
  'leg-bl': { elevation: 11, azimuth: -92, frame: [.4234, .4534, .4812, .9235] },
  'leg-br': { elevation: 11, azimuth: 72, frame: [.7016, .4534, .7719, .9165] },
  band: { elevation: 1, azimuth: -9, frame: [.4023, .3894, .7469, .4506] },
  post: { elevation: 15, azimuth: -9, frame: [.5195, .7115, .6227, .8540] },
  rings: { elevation: 1, azimuth: -9, frame: [.5, .399, .547, .417] },
};
