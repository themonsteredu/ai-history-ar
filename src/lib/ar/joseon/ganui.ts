import * as THREE from 'three';
import type { PhotoView, ReconstructionBuilder, Surface, Vec } from './toolkit';

type V3 = InstanceType<typeof THREE.Vector3>;
type Obj = InstanceType<typeof THREE.Object3D>;

/**
 * 간의 (Ganui, 簡儀) — photo-reference teaching reconstruction of the Sejong-era simplified armillary
 * (1432–1437, set on the 간의대 of 경복궁), laid out after the full-size outdoor restoration at King
 * Sejong's tomb site (영릉, 여주) that the photo shows, which follows the Yuan 簡儀 of 元史 天文志. No
 * original survives. Units ≈ 尺 (the 사유환 is 6 尺 across, the base about 18 尺 long); y = 0 is the
 * ground, the long base runs north–south along x (north = +x, the viewer's right) and +z (the front)
 * faces east, the side the photo was taken from.
 *
 * What is modelled:
 * - Base (趺): a long dark-bronze frame (bars with the levelling water channel 水渠 cut along their top,
 *   shown dry as in the photo), two long and three cross beams inside, a lower plinth band, short stone
 *   feet and the stone floor visible through the grid.
 * - South support: on each long side a dragon-wrapped A-frame (one leg from the south corner, one from
 *   the middle of the base) with a dragon head at the apex; the 백각환 is pinned to the middle legs at
 *   its east and west points.
 * - North support (북극운가주): two tall dragon pillars from the north corners curving inward to the
 *   north pole ring (정극환 자리) that holds the north pivot, each braced by a second dragon leg from
 *   the middle of the base; a dragon cross beam (橫輄) joins the two crossings.
 * - Polar axis (극축) tilted 37.5° (latitude of Seoul), rising to the north. On it: the 사유환 (四游雙環,
 *   two thin rings joined at the cardinal points) with its straight braces (直距) and the sighting bar
 *   규형 (窺衡) set across them, shown turned a little out of the meridian as in the photo; at the south
 *   end the fixed 백각환 (百刻環) with the 적도환 (赤道環) and two 界衡 bars on it.
 * - Between the north legs: the altazimuth part (立運儀) — the flat horizon ring 지평환 (陰緯環) lying on
 *   the beams and the vertical 입운환 (立運環) turning on an upright axle inside it; the axle's upper
 *   pivot bar between the middle legs is inferred (hidden in the photo).
 * - Graduations are suggested only by thin ticks (5-degree marks, the 28 lunar-mansion divisions, 100 刻
 *   with 12 hour divisions). No characters are modelled. The dragons are suggested by a body coiling
 *   round each pillar and a simple head; their scales come from the photo.
 *
 * Photo regions (see photoViews below): only the thick dragon pillars, the dragon cross beam and the
 * front face of the base are textured from the photo, each from the direction the camera saw it. The
 * rings, thin bars and the inside of the base have the building, trees and sky behind them in the photo,
 * so they keep the plain dark bronze surface (they are dark iron-grey in the photo too). The back pair
 * of each support is hidden in the photo and takes its front twin's pixels through a mirrored view.
 */
export function build(b: ReconstructionBuilder) {
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const arr = (p: V3): Vec => [p.x, p.y, p.z];

  // ---------- layout ----------
  const footH = .45, plinthH = .4, frameH = .6, B = footH + plinthH + frameH;
  const L = 18.5, W = 10.2, hx = L / 2, hz = W / 2, bw = .55, zc = hz - bw / 2;
  const phi = 37.5 * Math.PI / 180, cp = Math.cos(phi), sp = Math.sin(phi);
  /** Polar axis (toward the north celestial pole) and the in-meridian / east–west directions normal to it. */
  const axis = v(cp, sp, 0), ax = v(sp, -cp, 0), az = v(0, 0, 1);
  const PS = v(-3.1, 6.55, 0); // south bearing: centre of the 백각환
  const dBaek = 3.6, dTop = 4.2; // from the 사유환 centre along the axis to the 백각환 / north pole ring
  const C = PS.clone().addScaledVector(axis, dBaek);
  const T = C.clone().addScaledVector(axis, dTop);
  const xCross = 4.84, yCross = 7.55; // where the north pillars cross their middle legs

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
    return b.add(g, surface, { parent });
  };
  const rod = (p0: V3, p1: V3, r: number, surface: Surface, region?: string, segments = 16) => {
    const d = p1.clone().sub(p0), len = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(v(0, 1, 0), d.normalize());
    const e = new THREE.Euler().setFromQuaternion(q), mid = p0.clone().add(p1).multiplyScalar(.5);
    return b.add(new THREE.CylinderGeometry(r, r, len, segments, 1, false), surface, { position: arr(mid), rotation: [e.x, e.y, e.z], region });
  };
  /** A thick dragon pillar: a core along the curve with the dragon's body coiling round it. */
  const pillar = (pts: V3[], region: string, turns: number, phase = 0) => {
    b.tube(pts.map(arr), .5, 'bronze', { region, segments: 36, radial: 12 });
    const curve = new THREE.CatmullRomCurve3(pts), coil: Vec[] = [];
    const n = 72;
    for (let i = 0; i <= n; i++) {
      const t = .03 + i / n * .92, p = curve.getPoint(t), tan = curve.getTangent(t);
      const side = new THREE.Vector3(0, 0, 1).cross(tan).normalize(), other = tan.clone().cross(side).normalize();
      const a = phase + t * turns * Math.PI * 2;
      coil.push(arr(p.addScaledVector(side, Math.cos(a) * .44).addScaledVector(other, Math.sin(a) * .44)));
    }
    b.tube(coil, .2, 'bronze', { region, segments: 150, radial: 8 });
  };
  /** A simple dragon head: skull, snout and two swept-back horns; `dir` = ±1 faces −x / +x. */
  const head = (c: V3, dir: number, region: string) => {
    b.sphere(.62, arr(c), 'bronze', { region, scale: [1.1, 1, .85], segments: 16 });
    b.sphere(.42, [c.x + dir * .75, c.y + .22, c.z], 'bronze', { region, scale: [1.3, .75, .8], segments: 14 });
    for (const s of [-1, 1]) rod(v(c.x - dir * .1, c.y + .4, c.z + s * .25), v(c.x - dir * .85, c.y + 1.05, c.z + s * .35), .07, 'bronze', region, 8);
  };
  const block = (x: number, z: number, region: string) => b.box([1.15, .3, 1.05], [x, B + .15, z], 'bronze', { region, bevel: .03 });

  // ---------- 趺: base frame with the levelling water channel ----------
  b.feature('base-frame-with-water-channel');
  for (const x of [-7.7, -2.6, 2.6, 7.7]) for (const sz of [-1, 1]) b.box([1.2, footH, 1.1], [x, footH / 2, sz * (hz - .45)], 'stone', { bevel: .1 });
  const pY = footH + plinthH / 2;
  for (const sz of [-1, 1]) b.box([L + .3, plinthH, .8], [0, pY, sz * (hz + .15 - .4)], 'darkBronze', { bevel: .02 });
  for (const sx of [-1, 1]) b.box([.8, plinthH, W + .3 - 1.6], [sx * (hx + .15 - .4), pY, 0], 'darkBronze', { bevel: .02 });
  b.box([L - .6, .1, W - .6], [0, footH + plinthH - .05, 0], 'stone', { bevel: .01 }); // stone floor inside the grid
  // Frame bars with the channel: a bar, then an outer and an inner lip with the dry channel between them.
  const chD = .1, lipW = .19, barH = frameH - chD, barY = footH + plinthH + barH / 2, lipY = B - chD / 2;
  for (const sz of [-1, 1]) {
    const region = sz > 0 ? 'base-front' : undefined, z = sz * zc;
    b.box([L, barH, bw], [0, barY, z], 'darkBronze', { region, bevel: .015 });
    b.box([L, chD, lipW], [0, lipY, z + sz * (bw - lipW) / 2], 'darkBronze', { region, bevel: .01 });
    b.box([L - 2 * bw + 2 * lipW, chD, lipW], [0, lipY, z - sz * (bw - lipW) / 2], 'darkBronze', { region, bevel: .01 });
  }
  for (const sx of [-1, 1]) {
    const x = sx * (hx - bw / 2);
    b.box([bw, barH, W - 2 * bw], [x, barY, 0], 'darkBronze', { bevel: .015 });
    b.box([lipW, chD, W - 2 * bw + 2 * lipW], [x + sx * (bw - lipW) / 2, lipY, 0], 'darkBronze', { bevel: .01 });
    b.box([lipW, chD, W - 2 * bw], [x - sx * (bw - lipW) / 2, lipY, 0], 'darkBronze', { bevel: .01 });
  }
  // Inner beams: three cross beams and two long beams, a little lower than the frame.
  const beamH = frameH - .06, beamY = footH + plinthH + beamH / 2;
  for (const x of [-3.9, -.85, 3.8]) b.box([.42, beamH, W - 2 * bw], [x, beamY, 0], 'darkBronze', { bevel: .015 });
  for (const sz of [-1, 1]) b.box([L - 2 * bw, beamH, .38], [0, beamY, sz * 1.7], 'darkBronze', { bevel: .015 });

  // ---------- south support: a dragon A-frame on each long side ----------
  b.feature('south-dragon-a-frames');
  const apex = v(-4.4, 9.2, 0);
  for (const s of [1, -1]) {
    const z = s * zc, region = s > 0 ? 'south-front' : 'south-back';
    block(-7.25, z, region); block(-.4, z, region);
    pillar([v(-7.25, B + .2, z), v(-6.0, 5.4, z), v(-4.78, 9.1, z)], region, 2.2, 0);
    pillar([v(-.4, B + .2, z), v(-2.05, 5.6, z), v(-4.05, 9.1, z)], region, 2.4, 1.3);
    b.sphere(.74, [apex.x, apex.y, z], 'bronze', { region, scale: [1.25, .95, 1], segments: 18 });
    head(v(-5.55, 7.45, z + s * .35), -1, region);
  }

  // ---------- 북극운가주: north pillars, their middle legs and the dragon cross beam ----------
  b.feature('north-dragon-pillars-and-pole-ring');
  const topR = 1.15, topRadial = .2, topAxial = .3;
  for (const s of [1, -1]) {
    const z = s * zc, region = s > 0 ? 'north-front' : 'north-back';
    block(7.0, z, region); block(.65, z, region);
    pillar([v(7.0, B + .2, z), v(6.0, 4.6, z), v(xCross, yCross, s * 4.72), v(3.95, 9.8, s * 3.5), v(T.x + .05, T.y - .15, s * (topR + .45))], region, 3, .6);
    pillar([v(.65, B + .2, z), v(2.75, 4.65, z), v(xCross, yCross, s * 4.72)], region, 2, 2.1);
    b.sphere(.66, [xCross, yCross, s * 4.72], 'bronze', { region, segments: 16 });
    head(v(3.75, 7.1, s * 5.05), -1, region);
  }
  b.tube([[xCross, yCross, -4.6], [xCross, yCross, 0], [xCross, yCross, 4.6]], .34, 'bronze', { region: 'crossbar', segments: 24, radial: 12 });

  // ---------- polar frame: local y = polar axis, local z = east–west ----------
  const polar = new THREE.Group();
  polar.position.copy(C);
  polar.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(ax, axis, az));
  b.root.add(polar);
  const world = (x: number, y: number, z: number) => C.clone().addScaledVector(ax, x).addScaledVector(axis, y).addScaledVector(az, z);

  // North pole ring with its diagonal cross and hub (the north pivot); the pillar tops hold its east and west points.
  b.band(topR, topAxial, topRadial, [0, dTop, 0], 'darkBronze', { parent: polar });
  for (const a of [Math.PI / 4, -Math.PI / 4]) b.box([2 * topR, topAxial * .7, .14], [0, dTop, 0], 'darkBronze', { parent: polar, rotation: [0, a, 0], bevel: .02 });
  b.cylinder(.22, .22, topAxial + .12, [0, dTop, 0], 'darkBronze', { parent: polar, segments: 20 });
  for (const sz of [-1, 1]) rod(world(0, dTop, sz * (topR + topRadial / 2 - .04)), v(T.x + .05, T.y - .15, sz * (topR + .3)), .14, 'darkBronze');

  // ---------- 극축 + 사유환 with 규형 ----------
  b.feature('polar-axis-at-seoul-latitude');
  b.feature('sayuhwan-double-ring-with-gyuhyeong-sighting-bar');
  const R4 = 2.86, r4Radial = .26, r4Axial = .09, r4Gap = .08;
  const sayu = new THREE.Group(); sayu.rotation.y = .35; polar.add(sayu); // turns about the polar axis
  const ringZ = r4Gap / 2 + r4Axial / 2;
  for (const sz of [-1, 1]) {
    b.band(R4, r4Axial, r4Radial, [0, 0, sz * ringZ], 'darkBronze', { parent: sayu, rotation: [Math.PI / 2, 0, 0], segments: 96 });
    // Straight brace (直距) along the axis on each ring, carrying the sighting bar's pivot.
    b.box([.2, 2 * (R4 - r4Radial / 2) + .02, r4Axial], [0, 0, sz * ringZ], 'darkBronze', { parent: sayu, bevel: .015 });
  }
  // The rings are joined at the four cardinal points (子午卯酉).
  for (const [x, y] of [[0, R4], [0, -R4], [R4, 0], [-R4, 0]]) b.box(x ? [r4Radial + .03, .22, 2 * r4Axial + r4Gap + .03] : [.22, r4Radial + .03, 2 * r4Axial + r4Gap + .03], [x, y, 0], 'darkBronze', { parent: sayu, bevel: .015 });
  // Pivot pins through the pole ring (north) and the 백각환 hub (south): the polar axis.
  b.cylinder(.1, .1, dTop + .1 - (R4 - .1), [0, (dTop + .1 + R4 - .1) / 2, 0], 'darkBronze', { parent: polar, segments: 14 });
  b.cylinder(.1, .1, dBaek + .1 - (R4 - .1), [0, -(dBaek + .1 + R4 - .1) / 2, 0], 'darkBronze', { parent: polar, segments: 14 });
  // 규형: the sighting bar between the two rings, pivoting on a central axle; set across the braces.
  const gyu = new THREE.Group(); gyu.rotation.z = Math.PI / 2; sayu.add(gyu);
  const gyuL = 2 * (R4 - r4Radial / 2) - .04;
  b.box([.2, gyuL, r4Gap - .004], [0, 0, 0], 'darkBronze', { parent: gyu, bevel: .015 });
  for (const sy of [-1, 1]) b.box([.26, .03, .26], [0, sy * (gyuL / 2 - .2), 0], 'darkBronze', { parent: gyu, bevel: .008 });
  b.cylinder(.14, .14, 2 * r4Axial + r4Gap + .14, [0, 0, 0], 'darkBronze', { parent: sayu, rotation: [Math.PI / 2, 0, 0], segments: 18 });

  // ---------- 백각환 + 적도환 at the south end ----------
  b.feature('baekgakhwan-hundred-mark-ring');
  b.feature('jeokdohwan-equatorial-ring');
  const baekR = 3.1, baekRadial = .45, baekAxial = .2, baekOuter = baekR + baekRadial / 2;
  b.band(baekR, baekAxial, baekRadial, [0, -dBaek, 0], 'darkBronze', { parent: polar, segments: 96 });
  const baekIn = baekR - baekRadial / 2;
  for (const a of [0, Math.PI / 2]) b.box([2 * baekIn + .04, baekAxial * .9, .16], [0, -dBaek, 0], 'darkBronze', { parent: polar, rotation: [0, a, 0], bevel: .02 });
  b.cylinder(.2, .2, baekAxial + .06, [0, -dBaek, 0], 'darkBronze', { parent: polar, segments: 18 });
  // East and west pins from the ring out to the middle legs of the south A-frames.
  for (const sz of [-1, 1]) rod(world(0, -dBaek, sz * (baekOuter - .05)), v(PS.x + .15, PS.y, sz * (zc - .35)), .13, 'darkBronze');
  const jeokRadial = .22, jeokAxial = .18, jeokR = baekIn + jeokRadial / 2, jeokY = -dBaek + baekAxial / 2 + jeokAxial / 2 + .002;
  b.band(jeokR, jeokAxial, jeokRadial, [0, jeokY, 0], 'darkBronze', { parent: polar, segments: 96 });
  // Two 界衡 sighting bars turning on the 적도환 about the south pivot.
  const gyeY = jeokY + jeokAxial / 2 + .04;
  for (const a of [.5, 2.4]) {
    const g = new THREE.Group(); g.position.set(0, gyeY, 0); g.rotation.y = a; polar.add(g);
    b.box([jeokR + jeokRadial / 2 - .05, .08, .1], [(jeokR + jeokRadial / 2 - .05) / 2, 0, 0], 'darkBronze', { parent: g, bevel: .01 });
  }
  b.cylinder(.13, .13, .1, [0, gyeY, 0], 'darkBronze', { parent: polar, segments: 14 });

  // ---------- 입운의: 지평환 (horizon ring) and 입운환 (vertical ring) between the north legs ----------
  b.feature('ipunhwan-vertical-ring-in-jipyeonghwan-horizon-ring');
  const xa = 3.9, jipR = 3.2, topBar = 6.25;
  b.band(jipR, .2, .34, [xa, B + .1, 0], 'darkBronze', { segments: 96 });
  b.cylinder(.08, .08, topBar - B, [xa, (topBar + B) / 2, 0], 'darkBronze', { segments: 12 });
  const ipR = 2.05, ipY = B + .32 + ipR;
  b.band(ipR, .09, .2, [xa, ipY, 0], 'darkBronze', { rotation: [0, -.28, Math.PI / 2], segments: 80 });
  b.cylinder(.09, .09, 2 * zc - .9, [xa, topBar, 0], 'darkBronze', { rotation: [Math.PI / 2, 0, 0], segments: 12 });

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
  ticks(tickList, 'bronze', polar);
  // 사유환: 5-degree marks on the outer face of each ring, longer every 30.
  const sayuTicks: Tick[] = [];
  for (const sz of [-1, 1]) for (let d = 0; d < 365; d += 5) {
    const t = d / 365.25 * Math.PI * 2, r1 = R4 + r4Radial / 2 - .02, r0 = r1 - (d % 30 === 0 ? .14 : .08), zf = sz * (ringZ + r4Axial / 2 + .006);
    sayuTicks.push({ c: v(Math.cos(t) * (r0 + r1) / 2, Math.sin(t) * (r0 + r1) / 2, zf), u: v(Math.cos(t), Math.sin(t), 0), v: v(0, 0, sz), s: [(r1 - r0) / 2, .008, .011] });
  }
  ticks(sayuTicks, 'bronze', sayu);
}

/**
 * Where each textured part sits in the photo (ganui.jpg, the 영릉 restoration seen from the east side,
 * a little south of the middle, the camera about 6 尺 above the base). The frames were fitted by
 * projecting the model through a pinhole camera matched to the photo (base corners, ring outlines and
 * pillar feet) and choosing, per region, the view direction whose straight projection lands closest.
 * Back regions use the mirrored direction (azimuth 180° − front) and the same frame, so the hidden back
 * pair carries its visible front twin's pixels.
 */
export const photoViews: Record<string, PhotoView> = {
  'south-front': { elevation: 4, azimuth: 10, frame: [.2, .19, .6, .87] },
  'south-back': { elevation: 4, azimuth: 170, frame: [.2, .19, .6, .87] },
  'north-front': { elevation: 4, azimuth: -18, frame: [.58, .12, .91, .87] },
  'north-back': { elevation: 4, azimuth: 198, frame: [.58, .12, .91, .87] },
  crossbar: { elevation: 2, azimuth: -20, frame: [.655, .35, .8, .41] },
  'base-front': { elevation: 0, azimuth: 0, frame: [.155, .862, .995, .925] },
};
