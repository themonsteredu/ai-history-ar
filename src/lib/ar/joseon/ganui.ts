import * as THREE from 'three';
import type { ReconstructionBuilder, Surface, Vec } from './toolkit';

type V3 = InstanceType<typeof THREE.Vector3>;
type Obj = InstanceType<typeof THREE.Object3D>;

/**
 * 간의 (Ganui, 簡儀) — photo-reference teaching reconstruction of the Sejong-era simplified armillary
 * (1432–1437, set on the 간의대 of 경복궁), following the modern restorations (세종대왕유적관리소 영릉,
 * 세종대왕기념관), which in turn follow the Yuan 簡儀 described in 元史 天文志. No original survives, so
 * the proportions come from that written specification (units ≈ 尺, slightly shortened base); y = 0 is
 * the ground, the long base runs north–south along x (north = +x, the viewer's right), and +z (the
 * front) faces east, the side photographs usually show.
 *
 * What is modelled:
 * - Base (趺): a long rectangular bronze frame (length : width = 3 : 2) with a water channel (水渠)
 *   running round its top for levelling — filled with water here — three inner cross beams and three
 *   long beams laid out as 元史 describes, raised on short granite feet at the corners and mid-sides (the
 *   corner 礎 project beyond the frame inside and out).
 * - North support (북극운가주): two tall pillars rising from the north corners on flared "cloud" bases,
 *   leaning inward and southward parallel to the equator, joined by a cross beam and meeting in the
 *   north pole ring (上規) whose diagonal cross holds the north pivot.
 * - South support: two shorter pillars from the south corners holding the hundred-mark ring at its east
 *   and west points, plus a short post under its lowest point; the ring's inner cross holds the south
 *   pivot. Together the two pivots define the polar axis (극축), tilted 37.5° (latitude of Seoul) and
 *   rising to the north.
 * - 사유환 (四游雙環): the large double ring (6 尺 across, two rings joined at the four cardinal points)
 *   turning about the polar axis, with straight braces along the axis and the sighting bar 규형 (窺衡)
 *   pivoting at the centre between the two rings, sight vanes at both ends. Shown parked in the meridian.
 * - 적도환 (赤道環) resting on the inner part of the fixed 백각환 (百刻環); both lie perpendicular to the
 *   axis at its south end. Two 界衡 bars turn on the 적도환.
 * - Graduations are suggested only by thin ticks: 5-degree marks on both faces of the 사유환, the 28
 *   lunar-mansion (28수) divisions of the Yuan system plus 5-degree marks on the 적도환, and 100 刻 with
 *   12 hour divisions on the 백각환. No characters are modelled.
 * - Inferred / left out: the cloud-and-dragon ornament of the pillars (only a flared base), the small
 *   pole-sighting 정극환, and the separate altazimuth part (입운환) of the Yuan design, which the
 *   restorations do not always show.
 *
 * Photo regions and the framing each expects (PhotoView in catalog.ts):
 * - 'instrument': the 사유환 with its braces and 규형, the 적도환/백각환 pair, their ticks, pivots and 界衡.
 *   Expects a side-on photo of the restored instrument from the east (azimuth 0, elevation about
 *   5–20°), with the frame drawn round the rings only: from the top of the 사유환 to the bottom of the
 *   백각환, from the outer edge of the 백각환 (left) to the north end of the 사유환 (right).
 * - 'base': the frame, channel water, feet, both pairs of support pillars, the north pole ring and its
 *   cross. Same photo; frame drawn round the whole instrument from the ground line up to the top of the
 *   north pole ring and across the full length of the base.
 */
export function build(b: ReconstructionBuilder) {
  const N = 1; // north toward +x
  const phi = 37.5 * Math.PI / 180, cp = Math.cos(phi), sp = Math.sin(phi);
  /** Polar axis (toward the north celestial pole) and the in-meridian / east–west directions normal to it. */
  const axis = new THREE.Vector3(N * cp, sp, 0);
  const ax = new THREE.Vector3(sp, -N * cp, 0), az = new THREE.Vector3(0, 0, 1);
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const arr = (p: V3): Vec => [p.x, p.y, p.z];

  // ---------- layout ----------
  const footH = .35, frameH = .6, B = footH + frameH, bw = .7, chW = .15, chD = .1;
  const R4 = 3, r4Radial = .23, r4Axial = .11, r4Gap = .1; // 사유환: 6 尺 across, 2 寸 wide, 1 寸 thick, 1 寸 apart
  const dTop = 3.35, dBaek = 3.62; // from ring centre along the axis to the north pole ring / 백각환
  const PS = v(0, B + 3.15, 0); // south bearing (centre of the 백각환), provisional x
  const C = PS.clone().addScaledVector(axis, dBaek);
  const T = C.clone().addScaledVector(axis, dTop);
  const northRun = (T.y - B) * Math.tan(phi); // north pillars lean parallel to the equator (52.5° from level)
  let xN = T.x + N * northRun, xS = PS.x - N * 3;
  const shift = -(xN + xS) / 2;
  [PS, C, T].forEach(p => { p.x += shift; });
  xN += shift; xS += shift;
  const L = Math.abs(xN - xS) + bw, W = L * 2 / 3, zc = W / 2 - bw / 2;

  const rod = (p0: V3, p1: V3, r0: number, r1: number, surface: Surface, region: string, parent?: Obj, segments = 20) => {
    const d = p1.clone().sub(p0), len = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(v(0, 1, 0), d.normalize());
    const e = new THREE.Euler().setFromQuaternion(q), mid = p0.clone().add(p1).multiplyScalar(.5);
    return b.add(new THREE.CylinderGeometry(r1, r0, len, segments, 1, false), surface, { position: arr(mid), rotation: [e.x, e.y, e.z], region, parent });
  };
  /** Many small oriented boxes merged into one geometry (graduation ticks); `s` holds half sizes along u, v, u×v. */
  type Tick = { c: V3; u: V3; v: V3; s: [number, number, number] };
  const ticks = (list: Tick[], surface: Surface, parent: Obj) => {
    const pos: number[] = [];
    const quads = [[0, 2, 3, 1], [4, 5, 7, 6], [0, 1, 5, 4], [2, 6, 7, 3], [0, 4, 6, 2], [1, 3, 7, 5]];
    for (const t of list) {
      const w = new THREE.Vector3().crossVectors(t.u, t.v);
      const corner = (i: number) => t.c.clone().addScaledVector(t.u, (i & 1 ? 1 : -1) * t.s[0]).addScaledVector(t.v, (i & 2 ? 1 : -1) * t.s[1]).addScaledVector(w, (i & 4 ? 1 : -1) * t.s[2]);
      const k = [0, 1, 2, 3, 4, 5, 6, 7].map(corner);
      for (const [a, c1, c2, d] of quads) for (const p of [k[a], k[c1], k[c2], k[a], k[c2], k[d]]) pos.push(p.x, p.y, p.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return b.add(g, surface, { parent, region: 'instrument' });
  };
  const rectRing = (ox: number, oz: number, ix: number, iz: number) => {
    const s = new THREE.Shape(); s.moveTo(-ox, -oz); s.lineTo(ox, -oz); s.lineTo(ox, oz); s.lineTo(-ox, oz); s.closePath();
    const h = new THREE.Path(); h.moveTo(-ix, -iz); h.lineTo(-ix, iz); h.lineTo(ix, iz); h.lineTo(ix, -iz); h.closePath();
    s.holes.push(h); return s;
  };
  const flat: Vec = [-Math.PI / 2, 0, 0]; // extrude shapes drawn in x/z upward along y

  // ---------- 趺: base frame with the levelling water channel ----------
  b.feature('base-frame-with-water-channel');
  const hx = L / 2, hz = W / 2, lip = (bw - chW) / 2;
  b.extrude(rectRing(hx, hz, hx - bw, hz - bw), frameH - chD, 'darkBronze', { position: [0, footH, 0], rotation: flat, region: 'base', bevel: 0 });
  b.extrude(rectRing(hx, hz, hx - lip, hz - lip), chD, 'darkBronze', { position: [0, B - chD, 0], rotation: flat, region: 'base', bevel: 0 });
  b.extrude(rectRing(hx - bw + lip, hz - bw + lip, hx - bw, hz - bw), chD, 'darkBronze', { position: [0, B - chD, 0], rotation: flat, region: 'base', bevel: 0 });
  b.extrude(rectRing(hx - lip - .003, hz - lip - .003, hx - bw + lip + .003, hz - bw + lip + .003), chD - .035, 'water', { position: [0, B - chD, 0], rotation: flat, region: 'base', bevel: 0 });
  // Inner beams as 元史 lays them out: three cross beams (橫輄) and three long beams (縱輄) — two in the
  // south part running north to the south cross beam, one in the north part running south to the middle one.
  const xLow = PS.x + 3.4 * ax.x; // south cross beam, under the lowest point of the 백각환
  const xMid = xLow + N * 3.4, xNorth = xLow + N * 6.2, inSouth = -N * (hx - bw), inNorth = N * (hx - bw);
  for (const x of [xLow, xMid, xNorth]) b.box([.5, frameH - .02, W - 2 * bw], [x, footH + frameH / 2 - .01, 0], 'darkBronze', { region: 'base', bevel: .02 });
  const longBeam = (x0: number, x1: number, z: number) => b.box([Math.abs(x1 - x0), frameH - .08, .42], [(x0 + x1) / 2, footH + .01 + (frameH - .08) / 2, z], 'darkBronze', { region: 'base', bevel: .02 });
  for (const sz of [-1, 1]) longBeam(inSouth, xLow, sz * W / 6);
  longBeam(xMid, inNorth, 0);
  // Short granite feet: corner plinths project 2 寸 beyond the frame inside and out, plus mid-side feet.
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box([bw + .4, footH, bw + .4], [sx * (hx - bw / 2), footH / 2, sz * zc], 'darkStone', { region: 'base', bevel: .03 });
  for (const sz of [-1, 1]) b.box([bw + .2, footH, bw + .3], [0, footH / 2, sz * zc], 'darkStone', { region: 'base', bevel: .03 });
  b.box([bw + .2, footH, .9], [xLow, footH / 2, 0], 'darkStone', { region: 'base', bevel: .03 });

  // ---------- polar frame: local y = polar axis, local z = east–west ----------
  const polar = new THREE.Group();
  polar.position.copy(C);
  polar.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(ax, axis, az));
  b.root.add(polar);
  const world = (x: number, y: number, z: number) => C.clone().addScaledVector(ax, x).addScaledVector(axis, y).addScaledVector(az, z);

  // ---------- 북극운가주: north pillars and the north pole ring ----------
  b.feature('north-cloud-pillars-and-pole-ring');
  const topR = 1.2, topRadial = .15, topAxial = .3;
  b.band(topR, topAxial, topRadial, [0, dTop, 0], 'bronze', { parent: polar, region: 'base' });
  for (const a of [Math.PI / 4, -Math.PI / 4]) b.box([2 * topR, topAxial * .8, topRadial], [0, dTop, 0], 'bronze', { parent: polar, rotation: [0, a, 0], region: 'base', bevel: .02 });
  b.cylinder(.15, .15, topAxial + .1, [0, dTop, 0], 'bronze', { parent: polar, region: 'base', segments: 20 });
  const pillarTop = (sz: number) => world(0, dTop, sz * (topR + topRadial / 2 - .02));
  const cloudBase = (x: number, sz: number) => b.lathe([[0, 0], [.5, 0], [.52, .05], [.47, .13], [.39, .17], [.41, .23], [.35, .31], [.27, .36], [.28, .42], [.21, .52], [0, .52]], 'bronze', { position: [x, B, sz * zc], region: 'base', segments: 28 });
  for (const sz of [-1, 1]) {
    cloudBase(xN, sz);
    rod(v(xN, B + .3, sz * zc), pillarTop(sz), .2, .17, 'bronze', 'base');
  }
  // Cross beam (橫輄) between the pillars and a short strut from it up to the pole ring.
  const along = (sz: number, s: number) => v(xN, B + .3, sz * zc).lerp(pillarTop(sz), s);
  const sBeam = .72;
  rod(along(-1, sBeam), along(1, sBeam), .14, .14, 'bronze', 'base');
  rod(v(along(1, sBeam).x, along(1, sBeam).y, 0), world(topR + topRadial / 2 - .05, dTop, 0), .12, .1, 'bronze', 'base');

  // ---------- south support ----------
  b.feature('south-support-pillars');
  const baekR = 3.2, baekRadial = .5, baekAxial = .22, baekOuter = baekR + baekRadial / 2;
  for (const sz of [-1, 1]) {
    cloudBase(xS, sz);
    rod(v(xS, B + .3, sz * zc), world(0, -dBaek, sz * (baekOuter - .05)), .18, .15, 'bronze', 'base');
  }
  const low = world(baekOuter - .04, -dBaek, 0);
  rod(v(low.x, B - .02, 0), low, .16, .13, 'bronze', 'base');

  // ---------- 극축 + 사유환 with 규형 ----------
  b.feature('polar-axis-at-seoul-latitude');
  b.feature('sayuhwan-double-ring-with-gyuhyeong-sighting-bar');
  const sayu = new THREE.Group(); polar.add(sayu); // turns about local y (the polar axis); parked in the meridian
  const ringZ = r4Gap / 2 + r4Axial / 2;
  for (const sz of [-1, 1]) {
    b.band(R4, r4Axial, r4Radial, [0, 0, sz * ringZ], 'bronze', { parent: sayu, rotation: [Math.PI / 2, 0, 0], region: 'instrument', segments: 96 });
    // Straight brace (直距) along the axis on each ring, carrying the sighting bar's pivot.
    b.box([.16, 2 * (R4 - r4Radial / 2) + .02, r4Axial], [0, 0, sz * ringZ], 'bronze', { parent: sayu, region: 'instrument', bevel: .015 });
  }
  // The rings are joined at the four cardinal points (子午卯酉).
  for (const [x, y] of [[0, R4], [0, -R4], [R4, 0], [-R4, 0]]) b.box(x ? [r4Radial + .03, .24, 2 * r4Axial + r4Gap + .03] : [.24, r4Radial + .03, 2 * r4Axial + r4Gap + .03], [x, y, 0], 'bronze', { parent: sayu, region: 'instrument', bevel: .015 });
  // Pivot pins through the pole ring (north) and the 백각환 cross (south): the polar axis.
  b.cylinder(.06, .06, dTop + .15 - (R4 - .1), [0, (dTop + .15 + R4 - .1) / 2, 0], 'bronze', { parent: polar, region: 'instrument', segments: 16 });
  b.cylinder(.07, .07, dBaek + .15 - (R4 - .1), [0, -(dBaek + .15 + R4 - .1) / 2, 0], 'bronze', { parent: polar, region: 'instrument', segments: 16 });
  // 규형: the sighting bar between the two rings, pivoting on a central axle.
  const gyu = new THREE.Group(); gyu.rotation.z = 1.2; sayu.add(gyu);
  const gyuL = 2 * (R4 - r4Radial / 2) - .04;
  b.box([.2, gyuL, r4Gap - .004], [0, 0, 0], 'bronze', { parent: gyu, region: 'instrument', bevel: .015 });
  for (const sy of [-1, 1]) b.box([.26, .03, .28], [0, sy * (gyuL / 2 - .2), 0], 'bronze', { parent: gyu, region: 'instrument', bevel: .008 });
  b.cylinder(.13, .13, 2 * r4Axial + r4Gap + .12, [0, 0, 0], 'bronze', { parent: sayu, rotation: [Math.PI / 2, 0, 0], region: 'instrument', segments: 20 });

  // ---------- 백각환 + 적도환 at the south end ----------
  b.feature('baekgakhwan-hundred-mark-ring');
  b.feature('jeokdohwan-equatorial-ring');
  b.band(baekR, baekAxial, baekRadial, [0, -dBaek, 0], 'bronze', { parent: polar, region: 'instrument', segments: 96 });
  const baekIn = baekR - baekRadial / 2;
  for (const a of [0, Math.PI / 2]) b.box([2 * baekIn + .04, baekAxial * .9, .16], [0, -dBaek, 0], 'bronze', { parent: polar, rotation: [0, a, 0], region: 'instrument', bevel: .02 });
  b.cylinder(.17, .17, baekAxial + .06, [0, -dBaek, 0], 'bronze', { parent: polar, region: 'instrument', segments: 20 });
  const jeokRadial = .22, jeokAxial = .2, jeokR = baekIn + jeokRadial / 2, jeokY = -dBaek + baekAxial / 2 + jeokAxial / 2 + .002;
  b.band(jeokR, jeokAxial, jeokRadial, [0, jeokY, 0], 'bronze', { parent: polar, region: 'instrument', segments: 96 });
  // Two 界衡 sighting bars turning on the 적도환 about the south pivot.
  const gyeY = jeokY + jeokAxial / 2 + .04;
  for (const a of [.5, 2.4]) {
    const g = new THREE.Group(); g.position.set(0, gyeY, 0); g.rotation.y = a; polar.add(g);
    b.box([jeokR + jeokRadial / 2 - .05, .08, .1], [(jeokR + jeokRadial / 2 - .05) / 2, 0, 0], 'bronze', { parent: g, region: 'instrument', bevel: .01 });
  }
  b.cylinder(.12, .12, .1, [0, gyeY, 0], 'bronze', { parent: polar, region: 'instrument', segments: 16 });

  // ---------- graduations (thin ticks only) ----------
  const tickList: Tick[] = [];
  const radialTick = (r0: number, r1: number, t: number, y: number) => {
    const u = v(Math.cos(t), 0, Math.sin(t));
    tickList.push({ c: v(Math.cos(t) * (r0 + r1) / 2, y + .006, Math.sin(t) * (r0 + r1) / 2), u, v: v(0, 1, 0), s: [(r1 - r0) / 2, .008, .011] });
  };
  // 백각환: 100 刻 on the exposed outer face, longer marks at the 12 hour divisions.
  const baekTop = -dBaek + baekAxial / 2, baekVis = jeokR + jeokRadial / 2 + .02;
  for (let i = 0; i < 100; i++) radialTick(baekOuter - (i % 5 === 0 ? .2 : .11), baekOuter - .02, i / 100 * Math.PI * 2, baekTop);
  for (let i = 0; i < 12; i++) radialTick(baekVis, baekOuter - .02, (i + .5) / 12 * Math.PI * 2, baekTop + .004);
  // 적도환: the 28 lunar mansions (授時曆 widths, in 度 of 365¼) and 5-degree marks.
  const mansions = [12, 9, 15, 5, 5, 18, 11, 26.25, 8, 12, 10, 17, 16, 9, 16, 12, 14, 11, 16, 2, 9, 33, 4, 15, 7, 18, 18, 17];
  const jeokTop = jeokY + jeokAxial / 2, jIn = jeokR - jeokRadial / 2, jOut = jeokR + jeokRadial / 2;
  let deg = 0;
  for (const m of mansions) { radialTick(jIn + .02, jOut - .02, deg / 365.25 * Math.PI * 2, jeokTop); deg += m; }
  for (let d = 0; d < 365; d += 5) radialTick(jOut - .08, jOut - .02, d / 365.25 * Math.PI * 2, jeokTop - .002);
  ticks(tickList, 'darkBronze', polar);
  // 사유환: 5-degree marks on the outer face of each ring, longer every 30.
  const sayuTicks: Tick[] = [];
  for (const sz of [-1, 1]) for (let d = 0; d < 365; d += 5) {
    const t = d / 365.25 * Math.PI * 2, r1 = R4 + r4Radial / 2 - .02, r0 = r1 - (d % 30 === 0 ? .15 : .08), zf = sz * (ringZ + r4Axial / 2 + .006);
    sayuTicks.push({ c: v(Math.cos(t) * (r0 + r1) / 2, Math.sin(t) * (r0 + r1) / 2, zf), u: v(Math.cos(t), Math.sin(t), 0), v: v(0, 0, sz), s: [(r1 - r0) / 2, .008, .011] });
  }
  ticks(sayuTicks, 'darkBronze', sayu);
}
