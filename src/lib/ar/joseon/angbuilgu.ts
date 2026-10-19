import * as THREE from 'three';
import type { ReconstructionBuilder, Vec } from './toolkit';

/**
 * 앙부일구 (Angbuilgu, "cauldron facing the sky" hemispherical sundial) — photo-reference teaching
 * reconstruction matched to the bronze replica at Gyeongbokgung (public/images/heritage/joseon/
 * angbuilgu.jpg) and the Treasure-listed originals it copies. Not a scan: forms, part counts and
 * proportions follow the photo; parts the photo cannot see are inferred.
 * Units: the rim's outer radius is 1. The model stands on y = 0; +z is south (the front), +x is east,
 * so the gnomon's spine lies in the y-z (meridian) plane.
 *
 * Modelled parts:
 * - Bowl (仰釜): a true hemisphere, inner radius 0.78, open to the sky; its centre sits at the rim's top
 *   plane, where the gnomon's tip is. The inner surface is left smooth: the hour lines (시각선) and the
 *   13 seasonal lines (절기선) come from the photo. Its bottom clears the cross base by a hair.
 * - Rim: a wide flat band (0.22 of the radius) whose 24 solar terms / 24 directions engraving is only
 *   suggested by two concentric border grooves — no characters are modelled.
 * - Gnomon (영침): a pointed leaf/flame plate with a notched shoulder, a raised border, a central spine
 *   and two scroll curls at its foot, rising from the south inner wall so that its spine is parallel to
 *   the Earth's axis (37.5° above the northern horizon, Hanyang's latitude) and its point ends at the
 *   hemisphere's centre. The plate holds the polar axis and the east-west line, so it faces the
 *   southern sky (as the photo shows it, broad-on, from the south-east).
 * - Four scroll (dragon-like) legs: a scroll head under the rim's outer edge, a neck curving inward and a
 *   curled foot, leaning inward as in the photo. They stand on the raised end blocks of a cross-shaped
 *   (十字) base of two crossing bars (arms north-south and east-west), whose tops carry the
 *   cross-shaped water channel used to level the dial. The rest of the stand's carving is inferred.
 *
 * Photo regions and the framing each expects (PhotoView in catalog.ts). The Gyeongbokgung photo is a
 * close-up taken from above the south-east (about 50° east of south), with strong perspective, so one
 * orthographic view cannot fit every part; each part gets its own view and frame (fitted to landmarks):
 * - 'bowl': the rim (top, edge, underside). Elevation ~50°, azimuth 50°; frame = the rim's outer ellipse
 *   (left/right extremes, far top edge, near lower edge of the edge face).
 * - 'bowl-inside': the part of the inner surface that the photo sees through the opening. Frame = the
 *   opening's inner ellipse; elevation (52°) chosen so the drain hole at the bottom lands on the photo's
 *   hole. PHOTO_VIEW below must mirror this view: it decides which triangles are "seen".
 * - 'bowl-shade': the inner surface the photo never saw — hidden behind the near rim (the south wall
 *   around the gnomon's foot, which carries no grid on the real dial) or behind the gnomon itself. It
 *   takes a tiny plain swatch of the photo's inner surface beside the gnomon (frame = a few pixels), so
 *   it keeps the bowl's real tone instead of a smeared copy of the rim or a ghost of the gnomon.
 * - 'gnomon': the 영침. Frame fitted to the photo's gnomon (tip, both shoulders, lower lobes); its
 *   foot, hidden behind the rim in the photo, borrows nearby pixels.
 * - 'stand' / 'stand-east': the south and east legs below the rim's shadow line — the photo's left and
 *   right legs. Frames fitted to each leg's head, stem and foot (and drawn ~5% narrower so the
 *   silhouettes do not pick up the stone behind).
 * - 'stand-north' / 'stand-west': the same frames with the azimuth turned 180°: the sundial is
 *   symmetric, so the hidden north and west legs borrow the pixels of the legs opposite them.
 * - 'stand-base': the cross base (bars, channel rails, end blocks). A small swatch of the photo's dark
 *   bar surface beside the south leg (frame = a few pixels).
 * The outer belly and the leg necks under the rim are never seen in the photo and stay plain dark
 * bronze. Untextured, the rim shows plain bronze and everything else dark
 * bronze.
 */

/** Direction of the 'bowl-inside' photo view (must mirror catalog.ts) — splits seen/unseen inner wall. */
const PHOTO_VIEW = { elevation: 52, azimuth: 50 };
/** That view's frame (the photo's inner opening ellipse) and, in photo coordinates, the outline of the
 *  photo's gnomon: the wall behind it was never photographed, so it takes 'bowl-shade' too instead of
 *  a ghost of the gnomon painted onto the wall. */
const PHOTO_OPENING = [.183, .075, .814, .612];
const PHOTO_GNOMON: Array<[number, number]> = [
  [.497, .274], [.485, .31], [.47, .38], [.458, .45], [.445, .5], [.452, .53], [.445, .6], [.35, .575],
  [.275, .515], [.283, .475], [.3, .455], [.33, .44], [.365, .432], [.4, .39], [.44, .34], [.475, .295],
];

const RO = 1;            // rim outer radius
const RI = .78;          // bowl inner radius = rim inner edge
const RB = .81;          // bowl outer radius (wall .03)
const H = .91;           // rim top height = hemisphere centre height
const POLE = 37.5 * Math.PI / 180; // latitude of Hanyang: the gnomon's angle above the north horizon

export function build(b: ReconstructionBuilder) {
  // ---------- Bowl: inner hemisphere, split into the part the photo sees and the part it cannot ----------
  b.feature('hemispherical-bowl-angbu');
  const el = PHOTO_VIEW.elevation * Math.PI / 180, az = PHOTO_VIEW.azimuth * Math.PI / 180;
  const view = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  const right = new THREE.Vector3(Math.cos(az), 0, -Math.sin(az)), up = new THREE.Vector3().crossVectors(view, right);
  const [ol, ot, or, ob] = PHOTO_OPENING;
  const behindGnomon = (x: number, y: number, z: number) => {
    const px = (ol + or) / 2 + (x * right.x + z * right.z) / RI * (or - ol) / 2;
    const py = (ot + ob) / 2 - (x * up.x + y * up.y + z * up.z) / (RI * Math.sin(el)) * (ob - ot) / 2;
    // Inside the outline, or within a small margin of it (the photo's edge pixels are part gnomon).
    let inside = false, near = Infinity;
    for (let i = 0, j = PHOTO_GNOMON.length - 1; i < PHOTO_GNOMON.length; j = i++) {
      const [xi, yi] = PHOTO_GNOMON[i], [xj, yj] = PHOTO_GNOMON[j];
      if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
      const dx = xj - xi, dy = yj - yi, k = Math.max(0, Math.min(1, ((px - xi) * dx + (py - yi) * dy) / (dx * dx + dy * dy)));
      near = Math.min(near, Math.hypot(px - xi - k * dx, py - yi - k * dy));
    }
    return inside || near < .012;
  };
  const seen = (x: number, y: number, z: number) => {
    if (y >= -1e-6) return true;
    const s = -y / view.y, qx = x + s * view.x, qz = z + s * view.z;
    return qx * qx + qz * qz <= RI * RI && !behindGnomon(x, y, z);
  };
  const sphere = new THREE.SphereGeometry(RI, 160, 52, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const inner = sphere.toNonIndexed(); sphere.dispose();
  const ip = inner.getAttribute('position'), inn = inner.getAttribute('normal');
  const parts = { seen: { p: [] as number[], n: [] as number[] }, hidden: { p: [] as number[], n: [] as number[] } };
  for (let t = 0; t < ip.count; t += 3) {
    let cx = 0, cy = 0, cz = 0;
    for (let k = 0; k < 3; k++) { cx += ip.getX(t + k) / 3; cy += ip.getY(t + k) / 3; cz += ip.getZ(t + k) / 3; }
    const target = seen(cx, cy, cz) ? parts.seen : parts.hidden;
    for (let k = 0; k < 3; k++) {
      target.p.push(ip.getX(t + k), ip.getY(t + k) + H, ip.getZ(t + k));
      target.n.push(inn.getX(t + k), inn.getY(t + k), inn.getZ(t + k));
    }
  }
  inner.dispose();
  const makeGeometry = (part: { p: number[]; n: number[] }) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(part.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(part.n, 3));
    return g;
  };
  b.add(makeGeometry(parts.seen), 'darkBronze', { region: 'bowl-inside' });
  // The unseen part takes a plain swatch of the photo's inner surface (bowl-shade).
  b.add(makeGeometry(parts.hidden), 'darkBronze', { region: 'bowl-shade' });

  // Outer belly (never seen by the photo): plain dark bronze.
  const rimJoinY = H - .062, rimJoinR = Math.sqrt(RB * RB - (H - rimJoinY) ** 2);
  const belly: Array<[number, number]> = [];
  const a1 = Math.asin((rimJoinY - H) / RB);
  for (let i = 0; i <= 28; i++) {
    const a = -Math.PI / 2 + (a1 + Math.PI / 2) * i / 28;
    belly.push([Math.max(1e-4, RB * Math.cos(a)), H + RB * Math.sin(a)]);
  }
  b.lathe(belly, 'darkBronze', { segments: 96 });

  // ---------- Rim: wide flat band with two border grooves ----------
  b.feature('wide-rim-solar-term-band');
  const groove = (r: number, w = .004, d = .004): Array<[number, number]> => [[r - w, H], [r, H - d], [r + w, H]];
  const rim: Array<[number, number]> = [
    [RI, H], [RI + .006, H + .002], [RI + .016, H + .002], [RI + .02, H],
    ...groove(RI + .03),
    ...groove(RO - .035),
    [RO - .006, H], [RO, H - .006], [RO, H - .032], [RO - .006, H - .038],
    [.93, H - .044], [.86, H - .05], [rimJoinR + .012, H - .055], [rimJoinR, rimJoinY],
  ];
  b.lathe(rim, 'bronze', { region: 'bowl', segments: 160 });

  // ---------- Gnomon (영침): leaf plate along the polar axis, tip at the hemisphere centre ----------
  b.feature('leaf-gnomon-pointing-to-pole');
  // Local 2D frame: s runs from the tip (0) down the polar axis toward the south wall, w east-west.
  // The plate contains the polar axis and the east-west line, so its face looks up at the southern sky.
  const axis = new THREE.Vector3(0, -Math.sin(POLE), Math.cos(POLE));
  const east = new THREE.Vector3(1, 0, 0);
  const normal = new THREE.Vector3().crossVectors(axis, east);
  const toBowl = new THREE.Matrix4().makeBasis(axis, east, normal).setPosition(0, H, 0);
  const L = .795; // base edge buried in the bowl wall (inner .78, outer .81)
  // Half-width of the leaf along the axis: long pointed blade, a notched shoulder, a waist, a flared foot.
  const halfWidth: Array<[number, number]> = [
    [0, 0], [.08, .02], [.17, .045], [.27, .078], [.35, .108], [.40, .132], [.415, .104], [.46, .158],
    [.52, .182], [.575, .16], [.62, .112], [.665, .082], [.72, .092], [L, .108],
  ];
  const outline = (inset: number) => {
    const pts = halfWidth.filter(([s, w]) => w - inset > .012 || inset === 0).map(([s, w]) => new THREE.Vector2(s, w - inset));
    if (inset) { pts[0].x += inset * .6; pts[pts.length - 1].x -= inset; }
    return [...pts, ...pts.slice().reverse().map(p => new THREE.Vector2(p.x, -p.y))];
  };
  const plateShape = new THREE.Shape(outline(0));
  const leafGeometry = (shape: InstanceType<typeof THREE.Shape>, depth: number, bevel: number) => {
    const g = new THREE.ExtrudeGeometry(shape, { depth: depth - bevel * 2, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, steps: 1, curveSegments: 8 });
    g.translate(0, 0, -(depth - bevel * 2) / 2);
    return g.applyMatrix4(toBowl);
  };
  b.add(leafGeometry(plateShape, .016, 0), 'darkBronze', { region: 'gnomon' });
  // Raised border: the outline with its inset cut out.
  const frameShape = new THREE.Shape(outline(0));
  frameShape.holes.push(new THREE.Path(outline(.026).reverse()));
  b.add(leafGeometry(frameShape, .034, .004), 'darkBronze', { region: 'gnomon' });
  // Spine along the polar axis, from the point to the foot.
  const spine = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(.12, .012), new THREE.Vector2(L, .017), new THREE.Vector2(L, -.017), new THREE.Vector2(.12, -.012)]);
  b.add(leafGeometry(spine, .04, .004), 'darkBronze', { region: 'gnomon' });
  // Scroll curls at the foot, one each side of the spine.
  const inPlate = (s: number, w: number): Vec => {
    const p = new THREE.Vector3(0, 0, 0).addScaledVector(axis, s).addScaledVector(east, w);
    return [p.x, p.y + H, p.z];
  };
  for (const side of [1, -1]) {
    const pts: Vec[] = [];
    for (let i = 0; i <= 22; i++) {
      const t = i / 22, ang = (side > 0 ? Math.PI * .1 : -Math.PI * .1) - side * t * Math.PI * 1.7, r = .056 * (1 - .62 * t);
      pts.push(inPlate(.665 + r * Math.cos(ang) * .9, side * .118 + r * Math.sin(ang)));
    }
    b.tube(pts, .014, 'darkBronze', { region: 'gnomon', segments: 36, radial: 7 });
  }

  // ---------- Cross-shaped base (십자 받침) with the water channel ----------
  // The bars are thin and mostly hidden under the bowl in the photo, so they take a swatch of the
  // photo's dark bar surface ('stand-base') rather than a projection that would catch the stone floor.
  const armRegion = ['stand-east', 'stand', 'stand-west', 'stand-north'];
  b.feature('cross-base-water-channel');
  const slabH = .05, railH = .028, bw = .14, ch = .05, blockIn = .60, blockOut = .86, blockH = .10;
  const railW = (bw - ch) / 2, railC = ch / 2 + railW / 2;
  // Each arm: a slab, two rails forming the channel, and a raised end block the leg stands on.
  for (const dir of [0, 1, 2, 3]) {
    const ux = [1, 0, -1, 0][dir], uz = [0, 1, 0, -1][dir], region = 'stand-base';
    const along = (r0: number, r1: number, size: [number, number], offset: number, y: number) => {
      const mid = (r0 + r1) / 2, len = r1 - r0;
      const pos: Vec = [ux * mid + uz * offset, y, uz * mid + ux * offset];
      const dims: Vec = ux ? [len, size[1], size[0]] : [size[0], size[1], len];
      b.box(dims, pos, 'darkBronze', { region, bevel: .005 });
    };
    along(bw / 2, blockIn, [bw, slabH], 0, slabH / 2);
    for (const side of [1, -1]) along(bw / 2, blockIn, [railW, railH], side * railC, slabH + railH / 2);
    along(blockIn, blockOut, [bw + .012, blockH], 0, blockH / 2);
  }
  // The crossing under the bowl (never seen in the photo): the floor square and four rail corners that
  // complete the channel's cross shape.
  b.box([bw, slabH, bw], [0, slabH / 2, 0], 'darkBronze', { region: 'stand-base', bevel: .004 });
  for (const sx of [1, -1]) for (const sz of [1, -1]) {
    b.box([railW, railH, railW], [sx * railC, slabH + railH / 2, sz * railC], 'darkBronze', { region: 'stand-base', bevel: .004 });
  }

  // ---------- Four scroll legs ----------
  // Profile in the radial-vertical plane (u outward, v up): a scroll "dragon head" under the rim's outer
  // edge, a neck curving inward, a slim stem, and a curled foot standing on the arm's end block.
  b.feature('four-scroll-dragon-legs');
  const leg = new THREE.Shape();
  const footY = blockH, topY = H - .025;
  leg.moveTo(.655, footY);
  leg.lineTo(.79, footY);
  leg.bezierCurveTo(.825, footY + .02, .825, .19, .775, .215);
  leg.bezierCurveTo(.745, .25, .76, .36, .82, .44);
  leg.bezierCurveTo(.88, .52, .99, .56, .985, .68);
  leg.bezierCurveTo(.98, .78, .968, .84, .958, topY);
  leg.lineTo(.832, topY);
  leg.lineTo(.826, .8);
  leg.bezierCurveTo(.83, .72, .875, .66, .852, .6);
  leg.bezierCurveTo(.79, .56, .71, .49, .685, .4);
  leg.bezierCurveTo(.67, .31, .675, .245, .675, .195);
  leg.bezierCurveTo(.67, .15, .64, .14, .655, footY);
  // The rim hides the leg's neck in the photo, so the leg is cut at LEG_CUT: below it takes the photo,
  // the neck above stays plain dark bronze. Both halves are extruded from the same outline (no bevel),
  // so they meet flush.
  const legDepth = .1, LEG_CUT = .71;
  type V2 = InstanceType<typeof THREE.Vector2>;
  const outline2: V2[] = leg.getPoints(14).map((p: V2) => new THREE.Vector2(p.x, p.y));
  if (outline2[0].distanceTo(outline2[outline2.length - 1]) < 1e-6) outline2.pop();
  const clipAt = (below: boolean) => {
    const inside = (p: V2) => below ? p.y <= LEG_CUT : p.y >= LEG_CUT;
    const out: V2[] = [];
    outline2.forEach((cur: V2, i: number) => {
      const prev = outline2[(i + outline2.length - 1) % outline2.length];
      const cross = () => { const t = (LEG_CUT - prev.y) / (cur.y - prev.y); return new THREE.Vector2(prev.x + t * (cur.x - prev.x), LEG_CUT); };
      if (inside(cur)) { if (!inside(prev)) out.push(cross()); out.push(cur.clone()); } else if (inside(prev)) out.push(cross());
    });
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(out), { depth: legDepth, bevelEnabled: false, steps: 1 });
    return g.translate(0, 0, -legDepth / 2);
  };
  const legLower = clipAt(true), legUpper = clipAt(false);
  const face = legDepth / 2 + .002;
  const spiral = (cu: number, cv: number, r0: number, turns: number, start: number, z: number): Vec[] => {
    const pts: Vec[] = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30, ang = start + t * turns * Math.PI * 2, r = r0 * (1 - .72 * t);
      pts.push([cu + r * Math.cos(ang), cv + r * Math.sin(ang), z]);
    }
    return pts;
  };
  // Rotation about y that turns the profile's +u axis onto each arm (east, south, west, north). Each leg
  // is its own photo region: the south and east legs are seen in the photo; the north and west ones use
  // the same photo turned 180° (the sundial is symmetric), so they borrow the pixels of the leg opposite.
  [0, -Math.PI / 2, Math.PI, Math.PI / 2].forEach((psi, dir) => {
    const region = armRegion[dir];
    const holder = new THREE.Group(); holder.rotation.y = psi; b.root.add(holder);
    b.add(legLower, 'darkBronze', { parent: holder, region });
    b.add(legUpper, 'darkBronze', { parent: holder });
    for (const z of [face, -face]) {
      // Scroll "eye" on the head and a smaller curl at the foot, carved in relief on both faces.
      b.tube(spiral(.935, .69, .052, 1.4, -Math.PI / 2, z), .011, 'darkBronze', { parent: holder, region, segments: 40, radial: 6 });
      b.tube(spiral(.742, .162, .034, 1.2, Math.PI / 2, z), .009, 'darkBronze', { parent: holder, region, segments: 28, radial: 6 });
    }
  });
}
