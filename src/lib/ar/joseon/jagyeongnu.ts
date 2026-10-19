import * as THREE from 'three';
import type { ReconstructionBuilder, Vec } from './toolkit';

/**
 * 자격루 (Jagyeongnu, self-striking water clock) - photo-reference teaching reconstruction of the
 * surviving 1536 (Jungjong) Borugak clock remains, National Treasure, now in the National Palace
 * Museum of Korea (long displayed on a stepped granite stand at Deoksugung). Not a scan: forms,
 * proportions and part counts follow the real remains as far as known; hidden parts are inferred.
 *
 * Layout (metres, y up, +z front, +x viewer's right). The water runs downhill from left to right:
 *  - top tier (left): the large supply vessel 대파수호 (93 cm across, 70 cm tall);
 *  - middle tier: two small supply vessels 소파수호 (46 cm across, 40.5 cm tall), staggered
 *    front-left / back-right so both read from the front and from the three-quarter view;
 *  - lowest level (right): two inflow cylinders 수수호 (196 cm tall, 37 cm across) with coiling
 *    raised dragon relief, raised bands, a cap and a float rod 잣대 rising from the top, also staggered;
 *  - far right, clearly secondary: a simplified wooden striking cabinet (restoration-style, after the
 *    1434 Jang Yeong-sil design) with three figures and a bell, drum and gong.
 * The connecting pipes did not survive; they are inferred (big vessel -> both small vessels, each small
 * vessel -> its own cylinder). Tier heights are set so every pipe actually runs downhill.
 *
 * Photo regions (for a future entry in catalog.ts):
 *  - 'vessels': every bronze part (big and small vessels, both cylinders with dragons, pipes). Expects a
 *    front or front-left three-quarter photo of the whole display (elevation about 5-15 degrees,
 *    azimuth about 0 to -25), frame = the rectangle that just encloses all bronze parts.
 *  - 'platform': the stepped granite stand and plinth, same photo, frame = the rectangle enclosing the
 *    stone (usually the lower two thirds of the photo).
 *  - 'cabinet': the restoration cabinet; only a photo of a restored clock (e.g. the National Palace
 *    Museum restoration) fits it, framed on the cabinet front (elevation about 0-10, azimuth 0).
 * The float rods (wood) carry no region: they are lost and appear in no photo of the remains.
 */

const PL = 0.2; // plinth top: the lowest level, where the cylinders and cabinet stand
const PAD = 0.08; // granite foot pad under each cylinder
const CYL_H = 1.96, CYL_R = 0.185;
const CYL_BASE = PL + PAD;
const CYL_TOP = CYL_BASE + CYL_H;
const MID = CYL_TOP + 0.04; // middle tier top: small vessels sit just above the cylinder tops
const SV_R = 0.23, SV_H = 0.405;
const TOP = MID + SV_H - 0.045; // top tier: big vessel's outlet sits above the small vessels' rims
const BV_R = 0.465, BV_H = 0.7;
const PIPE_R = 0.017;
const BODY = 'bronze', RELIEF = 'darkBronze'; // cast bodies vs. raised relief and bands

const V = { region: 'vessels' } as const;
const P = { region: 'platform' } as const;
const C = { region: 'cabinet' } as const;
const X_AXIS = new THREE.Vector3(1, 0, 0), Y_AXIS = new THREE.Vector3(0, 1, 0);
/** Euler rotation turning the local `from` axis onto `to`. */
const aim = (from: InstanceType<typeof THREE.Vector3>, to: InstanceType<typeof THREE.Vector3>): Vec => {
  const e = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(from, to.clone().normalize()));
  return [e.x, e.y, e.z];
};

/** Outer then inner profile of a wide bowl-shaped jar, as [r / R, y / H]. */
const JAR: Array<[number, number]> = [
  [0, 0], [0.52, 0], [0.55, 0.015], [0.55, 0.06], [0.5, 0.075], [0.56, 0.1], [0.7, 0.2], [0.83, 0.32],
  [0.93, 0.45], [0.985, 0.57], [1, 0.65], [0.985, 0.73], [0.955, 0.82], [0.94, 0.88], [0.965, 0.93],
  [1, 0.962], [1, 1], [0.93, 1], [0.905, 0.96], [0.915, 0.86], [0.945, 0.68], [0.9, 0.46],
  [0.78, 0.29], [0.6, 0.17], [0.42, 0.135], [0, 0.125],
];

/** A bronze supply vessel standing on (x, y, z); returns its outlet point (pointing +x). */
function jar(b: ReconstructionBuilder, x: number, y: number, z: number, R: number, H: number): Vec {
  b.lathe(JAR.map(([r, h]) => [r * R, h * H] as [number, number]), BODY, { ...V, position: [x, y, z], segments: 64 });
  b.ring(R * 0.995, R * 0.022, [x, y + H * 0.65, z], RELIEF, { ...V, segments: 64 }); // raised belly band
  // Outlet spout low on the body (where the supply pipe left the vessel).
  const sy = y + H * 0.17, r0 = R * 0.6, len = R * 0.06 + 0.07;
  b.cylinder(PIPE_R * 1.5, PIPE_R * 1.5, len + R * 0.06, [x + r0 + (len + R * 0.06) / 2, sy, z], 'bronze', { ...V, rotation: [0, 0, Math.PI / 2], segments: 16 });
  b.cylinder(PIPE_R * 2, PIPE_R * 2, 0.025, [x + R * 0.68, sy, z], 'bronze', { ...V, rotation: [0, 0, Math.PI / 2], segments: 16 }); // collar
  return [x + r0 + len + R * 0.06 - 0.01, sy, z];
}

/** One climbing dragon in raised relief coiling round a cylinder, head at the top facing `headAngle`. */
function dragon(b: ReconstructionBuilder, cx: number, cz: number, headAngle: number) {
  const y0 = CYL_BASE + 0.42, y1 = CYL_BASE + 1.56, turns = 1.15, rr = CYL_R + 0.006;
  const phase = headAngle - turns * Math.PI * 2;
  const at = (t: number, r = rr): Vec => {
    const a = phase + t * turns * Math.PI * 2 + Math.sin(t * Math.PI * 3) * 0.3;
    const y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI * 4) * 0.06;
    return [cx + Math.sin(a) * r, y, cz + Math.cos(a) * r];
  };
  // Body thickest at the middle, thinning to the neck and the tail.
  for (const [t0, t1, radius, n] of [[-0.16, 0.08, 0.015, 10], [0.04, 0.32, 0.028, 14], [0.28, 0.82, 0.04, 26], [0.78, 1.0, 0.032, 10]] as const) {
    const pts: Vec[] = [];
    for (let i = 0; i <= n; i++) pts.push(at(t0 + (t1 - t0) * i / n));
    b.tube(pts, radius, RELIEF, { ...V, segments: n * 4, radial: 10 });
  }
  // Head: an elongated skull along the direction of travel, snout, lower jaw, horns and whiskers.
  const p0 = at(1.0, CYL_R + 0.03), p1 = at(1.06, CYL_R + 0.03);
  const out = new THREE.Vector3(p0[0] - cx, 0, p0[2] - cz).normalize();
  const dir = new THREE.Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
  dir.addScaledVector(out, -dir.dot(out)).normalize();
  const along = (d: number, o: number, up = 0): Vec => [p0[0] + dir.x * d + out.x * o, p0[1] + dir.y * d + up, p0[2] + dir.z * d + out.z * o];
  const skull = new THREE.SphereGeometry(1, 16, 10);
  b.add(skull, RELIEF, { ...V, position: along(0.03, 0.012), rotation: aim(X_AXIS, dir), scale: [0.075, 0.05, 0.046] });
  b.add(skull.clone(), RELIEF, { ...V, position: along(0.1, 0.008, 0.005), rotation: aim(X_AXIS, dir), scale: [0.048, 0.03, 0.032] });
  b.add(skull.clone(), RELIEF, { ...V, position: along(0.08, 0.0, -0.038), rotation: aim(X_AXIS, dir), scale: [0.045, 0.016, 0.026] });
  for (const s of [-1, 1]) {
    b.tube([along(0.02, 0.025, 0.02), along(-0.03, 0.03 + s * 0.012, 0.075), along(-0.08, 0.012 + s * 0.02, 0.11)], 0.01, RELIEF, { ...V, segments: 8, radial: 5 });
  }
  b.tube([along(0.13, 0.02), along(0.07, 0.03, -0.06), along(-0.02, 0.012, -0.1)], 0.006, RELIEF, { ...V, segments: 8, radial: 4 });
  // Four legs, each ending in a clawed foot.
  for (const [t, s] of [[0.16, -1], [0.36, 1], [0.62, -1], [0.84, 1]] as const) {
    const p = at(t), q = at(t + 0.04, CYL_R + 0.004);
    const foot: Vec = [q[0], q[1] + s * 0.11, q[2]];
    b.tube([p, foot], 0.017, RELIEF, { ...V, segments: 4, radial: 6 });
    b.sphere(0.026, foot, RELIEF, { ...V, scale: [1.3, 0.8, 1.3], segments: 10 });
  }
  // Cloud scrolls on the side the dragon is not passing: clusters of raised curls.
  for (const t of [0.08, 0.3, 0.52, 0.74, 0.95]) {
    const a = phase + t * turns * Math.PI * 2 + Math.PI, y = y0 + (y1 - y0) * t;
    for (const [da, dy, r] of [[0, 0, 0.03], [0.27, 0.03, 0.022], [-0.25, -0.02, 0.02]] as const) {
      const n = new THREE.Vector3(Math.sin(a + da), 0, Math.cos(a + da));
      b.ring(r, 0.008, [cx + n.x * (CYL_R + 0.002), y + dy, cz + n.z * (CYL_R + 0.002)], RELIEF, { ...V, rotation: aim(Y_AXIS, n), radial: 5, segments: 20 });
    }
  }
}

/** A tall bronze inflow cylinder on a granite pad; returns the top of its inlet funnel. */
function cylinder(b: ReconstructionBuilder, x: number, z: number, headAngle: number): Vec {
  b.box([0.46, PAD, 0.46], [x, PL + PAD / 2, z], 'stone', { ...P, bevel: 0.012 });
  const yb = CYL_BASE, R = CYL_R;
  b.lathe([
    [0, 0], [0.24, 0], [0.24, 0.035], [0.22, 0.05], [0.22, 0.085], [0.195, 0.1], [R, 0.115],
    [R, CYL_H - 0.075], [R + 0.012, CYL_H - 0.06], [R + 0.022, CYL_H - 0.035], [R + 0.022, CYL_H],
    [R - 0.01, CYL_H + 0.006], [0.1, CYL_H + 0.02], [0.03, CYL_H + 0.026], [0, CYL_H + 0.026],
  ], BODY, { ...V, position: [x, yb, z], segments: 56 });
  for (const y of [0.27, 0.33, CYL_H - 0.21, CYL_H - 0.15]) b.band(R + 0.006, 0.034, 0.016, [x, yb + y, z], RELIEF, { ...V, segments: 56 });
  dragon(b, x, z, headAngle);
  // Float rod (잣대): a slim measuring stick rising out of the cap. Lost; inferred.
  b.box([0.032, 0.5, 0.032], [x, CYL_TOP + 0.2, z], 'wood', { bevel: 0.004 });
  b.sphere(0.024, [x, CYL_TOP + 0.45, z], 'wood', { segments: 10 });
  // Small inlet funnel on the cap, on the side facing the small vessels (-x).
  const fx = x - 0.1, fy = CYL_TOP + 0.012;
  b.lathe([[0.022, 0], [0.024, 0.03], [0.034, 0.05], [0.03, 0.05], [0.018, 0.032]], 'bronze', { ...V, position: [fx, fy, z], segments: 16 });
  return [fx, fy + 0.05, z];
}

/** A pedestal body built from bevelled granite courses in running bond, so the joints read. */
function courses(b: ReconstructionBuilder, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, rows: number, seed: number) {
  const h = (y1 - y0) / rows, w = x1 - x0;
  for (let r = 0; r < rows; r++) {
    const split = x0 + w * ((r + seed) % 2 ? 0.58 : 0.42);
    for (const [a, c] of [[x0, split], [split, x1]]) {
      b.box([c - a, h, z1 - z0], [(a + c) / 2, y0 + h * (r + 0.5), (z0 + z1) / 2], 'darkStone', { ...P, bevel: 0.018 });
    }
  }
}

function platform(b: ReconstructionBuilder) {
  // Ground course and plinth under the whole group.
  b.box([4.36, 0.08, 1.5], [0.07, 0.04, 0], 'darkStone', { ...P, bevel: 0.01 });
  b.box([4.26, PL - 0.08, 1.4], [0.07, 0.08 + (PL - 0.08) / 2, 0], 'stone', { ...P, bevel: 0.02 });
  // Top tier (left) and middle tier pedestals, each with a base course and an overhanging cap slab.
  const tx0 = -2.0, tx1 = -0.95, mx1 = 0.3;
  b.box([tx1 - tx0 + 0.06, 0.14, 1.26], [(tx0 + tx1) / 2, PL + 0.07, 0], 'darkStone', { ...P, bevel: 0.015 });
  courses(b, tx0, tx1, -0.6, 0.6, PL + 0.14, TOP - 0.12, 4, 0);
  b.box([tx1 - tx0 + 0.08, 0.12, 1.28], [(tx0 + tx1) / 2, TOP - 0.06, 0], 'stone', { ...P, bevel: 0.025 });
  b.box([mx1 - tx1 + 0.03, 0.14, 1.18], [(tx1 + mx1) / 2 + 0.015, PL + 0.07, 0], 'darkStone', { ...P, bevel: 0.015 });
  courses(b, tx1, mx1, -0.56, 0.56, PL + 0.14, MID - 0.1, 4, 1);
  b.box([mx1 - tx1 + 0.04, 0.1, 1.2], [(tx1 + mx1) / 2 + 0.02, MID - 0.05, 0], 'stone', { ...P, bevel: 0.022 });
  return { bigX: (tx0 + tx1) / 2 };
}

/** Square hip roof of dark tiles (a 4-sided lathe), flat-shaded. */
function hipRoof(b: ReconstructionBuilder, x: number, y: number, z: number, hx: number, hz: number) {
  const profile = [[1, 0], [0.98, 0.025], [0.86, 0.06], [0.55, 0.14], [0.12, 0.22], [0, 0.225]].map(([r, h]) => new THREE.Vector2(r, h));
  const g = new THREE.LatheGeometry(profile, 4, Math.PI / 4).toNonIndexed();
  g.deleteAttribute('normal');
  b.add(g, 'ink', { ...C, position: [x, y, z], scale: [hx / Math.SQRT1_2, 1, hz / Math.SQRT1_2] });
}

/** Simplified restoration-style striking cabinet (after the 1434 design): figures, bell, drum, gong. */
function cabinet(b: ReconstructionBuilder) {
  const cx = 1.82, cz = -0.3, w = 0.66, d = 0.72, lowTop = 1.22, upTop = 1.7, front = cz + d / 2;
  b.box([w, lowTop - PL, d], [cx, (PL + lowTop) / 2, cz], 'wood', { ...C, bevel: 0.012 });
  // Framed double doors on the lower front: stiles, rails and two bronze pulls.
  const lh = lowTop - PL;
  for (const sx of [-1, 0, 1]) b.box([0.05, lh - 0.02, 0.02], [cx + sx * (w / 2 - 0.03), PL + lh / 2, front + 0.006], 'wood', { ...C, bevel: 0.005 });
  for (const fy of [0.04, 0.5, 0.96]) b.box([w - 0.04, 0.045, 0.02], [cx, PL + lh * fy, front + 0.006], 'wood', { ...C, bevel: 0.005 });
  for (const sx of [-1, 1]) b.cylinder(0.022, 0.022, 0.016, [cx + sx * 0.06, PL + lh * 0.62, front + 0.014], 'darkBronze', { ...C, rotation: [Math.PI / 2, 0, 0], segments: 12 });
  b.box([w + 0.06, 0.05, d + 0.06], [cx, lowTop + 0.025, cz], 'wood', { ...C, bevel: 0.01 });
  const fl = lowTop + 0.05;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    b.box([0.05, upTop - fl, 0.05], [cx + sx * (w / 2 - 0.025), (fl + upTop) / 2, cz + sz * (d / 2 - 0.025)], 'thread', { ...C, bevel: 0.006 });
  }
  b.box([w - 0.02, upTop - fl, 0.03], [cx, (fl + upTop) / 2, cz - d / 2 + 0.02], 'wood', { ...C, bevel: 0.006 });
  for (const sx of [-1, 1]) b.box([0.03, upTop - fl, d - 0.06], [cx + sx * (w / 2 - 0.02), (fl + upTop) / 2, cz], 'wood', { ...C, bevel: 0.006 });
  b.box([w + 0.04, 0.05, 0.05], [cx, upTop - 0.02, front - 0.025], 'thread', { ...C, bevel: 0.006 }); // lintel
  b.box([w + 0.1, 0.05, d + 0.1], [cx, upTop + 0.025, cz], 'wood', { ...C, bevel: 0.01 });
  hipRoof(b, cx, upTop + 0.05, cz, w / 2 + 0.12, d / 2 + 0.12);
  // Crossbar the bell and gong hang from.
  const bz = cz - 0.17, barY = upTop - 0.06;
  b.box([w - 0.06, 0.03, 0.03], [cx, barY, bz], 'wood', { ...C, bevel: 0.004 });
  // Bell (left), drum (middle), gong (right).
  const bellX = cx - 0.2;
  b.lathe([[0, 0], [0.055, 0], [0.052, 0.02], [0.042, 0.08], [0.03, 0.105], [0.012, 0.115], [0, 0.115]], 'darkBronze', { ...C, position: [bellX, barY - 0.165, bz], segments: 24 });
  b.cylinder(0.008, 0.008, 0.05, [bellX, barY - 0.035, bz], 'darkBronze', { ...C, segments: 8 });
  const drumY = fl + 0.19;
  b.cylinder(0.075, 0.075, 0.1, [cx + 0.02, drumY, bz], 'thread', { ...C, rotation: [Math.PI / 2, 0, 0], segments: 24 });
  for (const s of [-1, 1]) b.cylinder(0.072, 0.072, 0.008, [cx + 0.02, drumY, bz + s * 0.052], 'paper', { ...C, rotation: [Math.PI / 2, 0, 0], segments: 24 });
  b.box([0.03, drumY - 0.07 - fl, 0.03], [cx + 0.02, fl + (drumY - 0.07 - fl) / 2, bz], 'wood', { ...C, bevel: 0.004 });
  const gongX = cx + 0.22, gongY = barY - 0.15;
  b.cylinder(0.065, 0.065, 0.014, [gongX, gongY, bz], 'darkBronze', { ...C, rotation: [Math.PI / 2, 0, 0], segments: 28 });
  for (const s of [-1, 1]) b.cylinder(0.004, 0.004, 0.09, [gongX + s * 0.035, barY - 0.06, bz], 'thread', { ...C, segments: 5 });
  // Three time-telling figures in front of their instruments, each holding a striker.
  for (const [i, tx, ty] of [[-1, bellX + 0.04, barY - 0.12], [0, cx + 0.02, drumY], [1, gongX - 0.02, gongY]] as const) {
    const fx = cx + i * 0.21 - 0.04, fz = cz + 0.12;
    b.lathe([[0.055, 0], [0.05, 0.06], [0.04, 0.14], [0.028, 0.18], [0, 0.19]], 'thread', { ...C, position: [fx, fl, fz], segments: 16 });
    b.sphere(0.032, [fx, fl + 0.215, fz], 'paper', { ...C, segments: 14 });
    b.cylinder(0.03, 0.034, 0.03, [fx, fl + 0.255, fz], 'ink', { ...C, segments: 12 });
    b.tube([[fx + 0.025, fl + 0.15, fz], [fx + 0.05, fl + 0.13, fz - 0.03], [tx - 0.01, ty, bz + 0.07]], 0.008, 'wood', { ...C, segments: 8, radial: 5 });
  }
}

export function build(b: ReconstructionBuilder): void {
  b.feature('dae-pasuho-large-supply-vessel');
  b.feature('so-pasuho-small-supply-vessels');
  b.feature('susuho-inflow-cylinders-dragon-relief');
  b.feature('float-rods-jatdae');
  b.feature('water-pipes-inferred');
  b.feature('stepped-granite-platform');
  b.feature('striking-cabinet-restoration');

  const { bigX } = platform(b);

  // Big supply vessel on the top tier.
  const bigOut = jar(b, bigX, TOP, 0, BV_R, BV_H);

  // Two small supply vessels on the middle tier.
  const sA: Vec = [-0.6, MID, 0.27], sB: Vec = [-0.05, MID, -0.27];
  const outA = jar(b, sA[0], sA[1], sA[2], SV_R, SV_H);
  const outB = jar(b, sB[0], sB[1], sB[2], SV_R, SV_H);

  // Two inflow cylinders at the lowest level.
  const inA = cylinder(b, 0.6, 0.27, 0.25);
  const inB = cylinder(b, 1.08, -0.27, 0.45);

  // Inferred water path. Big vessel -> branch -> both small vessels (pipes rest on the rims).
  const rimY = MID + SV_H + PIPE_R + 0.004;
  const j: Vec = [-0.86, bigOut[1] - 0.004, 0];
  b.tube([bigOut, [-0.95, bigOut[1] - 0.002, 0], j], PIPE_R, 'bronze', { ...V, segments: 8, radial: 8 });
  b.sphere(PIPE_R * 1.7, j, 'bronze', { ...V, segments: 12 });
  b.tube([j, [-0.83, j[1] - 0.006, 0.1], [sA[0] - 0.2, rimY, sA[2] - 0.07], [sA[0] - 0.1, rimY - 0.02, sA[2] - 0.02]], PIPE_R, 'bronze', { ...V, segments: 16, radial: 8 });
  b.tube([j, [-0.62, j[1] - 0.012, -0.1], [sB[0] - 0.225, rimY, sB[2] + 0.035], [sB[0] - 0.12, rimY - 0.02, sB[2] + 0.01]], PIPE_R, 'bronze', { ...V, segments: 20, radial: 8 });
  // Each small vessel -> its own cylinder, entering the cap funnel from above.
  for (const [from, to] of [[outA, inA], [outB, inB]] as const) {
    b.tube([from, [from[0] + 0.25, from[1], from[2]], [to[0] - 0.09, from[1] - 0.002, to[2]], [to[0] - 0.02, from[1] - 0.012, to[2]], [to[0], to[1] + 0.004, to[2]]], PIPE_R, 'bronze', { ...V, segments: 24, radial: 8 });
  }

  cabinet(b);
}
