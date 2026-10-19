import * as THREE from 'three';
import type { ReconstructionBuilder, Surface, Vec } from './toolkit';

/**
 * 농사직설 (農事直說, Nongsa jikseol, 1429) — photo-reference teaching reconstruction of a Joseon
 * thread-bound woodblock book (선장본). Not a scan: the binding, layout and proportions follow surviving
 * Joseon copies of this one-volume manual as closely as known; the exact size and frame style of any one
 * copy may differ. Units are centimetres; everything stands on y = 0 and +z is the front.
 *
 * Two copies of the same book lie on the table:
 * - Closed book (front), cover up, turned a quarter so its spine faces the viewer: 30 × 19.5 cm and under
 *   1 cm thick (the text is short, about fourteen leaves). Thick brown 능화지 cover whose pressed diamond
 *   (능화) pattern is only suggested by faint low ridges; white title slip (제첨) at the upper left of the
 *   cover with the real title 農事直說 brushed vertically (simple stroke forms, no other text); red thread
 *   in the Korean five-hole binding (오침안정법): one line along the spine 1.1 cm in from the edge, five
 *   loops over the spine edge and the end loops over the head and tail; the page block shows on three
 *   edges between the covers.
 * - Open book (behind), head away from the viewer, opened in the text. The spine lies in the middle;
 *   as in a real 선장본 opened flat, the stitched spine margin stands on its edge under the gutter, so the
 *   gutter crease rides about 1.5 cm high, the covers slope down from it like a low tent and the two visible
 *   pages bulge up from the crease before lying down on their page stacks (rise slightly exaggerated).
 *   The binding thread shows across the head and tail of the spine margin. Each page carries the
 *   woodblock layout as thin ink lines only: a double ruled frame (판광, 사주쌍변 assumed) with a wider
 *   head margin, 10 ruled columns (계선) and the half of the centre column (판심) with its fish-tail mark
 *   (어미) at the fore-edge — a 선장본 leaf is folded through the 판심, so the fold sits at the page's
 *   outer edge, not in the gutter. Text is suggested by unreadable brush-like stroke clusters, with
 *   short headings and small double-line notes (소자쌍행); no characters are written.
 *
 * Photo regions and the framing each expects (PhotoView in catalog.ts):
 * - 'cover': the closed book's front cover with its pattern ridges, title slip, title strokes and the
 *   red thread (including the loops over the spine edge). Expects a straight-down photo of the cover
 *   (elevation 90°), oriented with the book upright in the photo — head at the top, spine and stitching
 *   on the right — which for this quarter-turned book means azimuth -90°. Frame tightly around the cover
 *   outline, spine stitching included.
 * - 'pages': the two visible pages of the open book and their ink. Expects a straight-down photo of a
 *   real opened 선장본 spread (elevation 90°, azimuth 0°, head at the top), framed from the left
 *   fore-edge to the right fore-edge and head to tail, the gutter in the middle. (A reproduction that
 *   shows one whole leaf with the 판심 in the centre would put the 판심 into this model's gutter.)
 * The page-block edges, the open book's covers and its thread are left plain (paper, brown cover,
 * red thread), which already looks right without a photo.
 */

type P2 = [number, number];
type Geometry = InstanceType<typeof THREE.BufferGeometry>;
type Object3D = InstanceType<typeof THREE.Object3D>;

const W = 19.5;      // page width (spine to fore-edge)
const D = 30;        // page height (head to tail)
const TC = .08;      // cover thickness
const IN = .06;      // leaves sit this far inside the cover at head, tail and fore-edge
const THREAD = .09;  // binding-thread radius (a little thicker than real so it reads at table scale)

const smooth = (t: number) => { const c = Math.min(1, Math.max(0, t)); return c * c * (3 - 2 * c); };
function random(seed: number) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

/** Loose triangles collected into one geometry (normals are filled in by the toolkit). */
class Tris {
  readonly pos: number[] = [];
  tri(a: Vec, b: Vec, c: Vec) { this.pos.push(...a, ...b, ...c); }
  quad(a: Vec, b: Vec, c: Vec, d: Vec) { this.tri(a, b, c); this.tri(a, c, d); }
  geometry() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); return g; }
}

/** Flat ink strokes laid onto a height field y(x, z) (pages, slip), split so they follow its curve. */
class Ink extends Tris {
  constructor(private readonly height: (x: number, z: number) => number) { super(); }
  private lift = ([x, z]: P2): Vec => [x, this.height(x, z), z];
  stroke(a: P2, c: P2, w: number) {
    const dx = c[0] - a[0], dz = c[1] - a[1], len = Math.hypot(dx, dz) || 1e-6;
    const ux = dx / len, uz = dz / len, nx = -uz * w / 2, nz = ux * w / 2, total = len + w;
    const ax = a[0] - ux * w / 2, az = a[1] - uz * w / 2, n = Math.max(1, Math.ceil(total / .5));
    for (let i = 0; i < n; i++) {
      const t0 = i / n * total, t1 = (i + 1) / n * total;
      const p0: P2 = [ax + ux * t0, az + uz * t0], p1: P2 = [ax + ux * t1, az + uz * t1];
      this.quad(this.lift([p0[0] + nx, p0[1] + nz]), this.lift([p1[0] + nx, p1[1] + nz]), this.lift([p1[0] - nx, p1[1] - nz]), this.lift([p0[0] - nx, p0[1] - nz]));
    }
  }
  line(points: P2[], w: number) { for (let i = 0; i + 1 < points.length; i++) this.stroke(points[i], points[i + 1], w); }
  /** Convex polygon (fan). */
  fill(points: P2[]) { for (let i = 1; i + 1 < points.length; i++) this.tri(this.lift(points[0]), this.lift(points[i]), this.lift(points[i + 1])); }
}

/** A straight round rod (thread run) from a to c, optionally under a parent group. */
function rod(b: ReconstructionBuilder, a: Vec, c: Vec, surface: Surface, opts: { region?: string; parent?: Object3D } = {}) {
  const va = new THREE.Vector3(...a), vc = new THREE.Vector3(...c), dir = vc.clone().sub(va), len = dir.length();
  const g: Geometry = new THREE.CylinderGeometry(THREAD, THREAD, len, 8, 1, true);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
  g.translate((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2);
  b.add(g, surface, opts);
}
const knot = (b: ReconstructionBuilder, p: Vec, opts: { region?: string; parent?: Object3D } = {}) => b.sphere(THREAD, p, 'thread', { ...opts, segments: 10 });

/** z positions of the five binding holes (오침): end holes 2.6 cm from head and tail, evenly spaced. */
const HOLES = [0, 1, 2, 3, 4].map(i => -D / 2 + 2.6 + i * (D - 5.2) / 4);

// ---------- 농사직설 title, four characters as simple brush strokes in a unit cell (u right, v down) ----------
const TITLE: P2[][][] = [
  // 農
  [[[.22, .13], [.22, .43]], [[.22, .13], [.78, .13], [.78, .43]], [[.22, .28], [.78, .28]], [[.22, .43], [.78, .43]],
    [[.4, .03], [.4, .43]], [[.6, .03], [.6, .43]], [[.16, .53], [.86, .53]], [[.25, .53], [.25, .79], [.1, .98]],
    [[.37, .64], [.76, .64]], [[.33, .76], [.86, .76]], [[.41, .78], [.41, .97], [.53, .9]], [[.56, .78], [.93, .99]], [[.73, .87], [.85, .8]]],
  // 事
  [[[.28, .07], [.72, .07]], [[.33, .17], [.33, .33]], [[.33, .17], [.67, .17], [.67, .33]], [[.33, .33], [.67, .33]],
    [[.25, .45], [.75, .45], [.75, .76]], [[.1, .6], [.9, .6]], [[.25, .76], [.75, .76]], [[.5, .01], [.5, .95], [.39, .88]]],
  // 直
  [[[.2, .12], [.8, .12]], [[.5, .01], [.5, .24]], [[.33, .24], [.33, .8]], [[.33, .24], [.69, .24], [.69, .8]],
    [[.33, .43], [.69, .43]], [[.33, .62], [.69, .62]], [[.33, .8], [.69, .8]], [[.18, .3], [.18, .94], [.88, .94]]],
  // 說
  [[[.17, .03], [.23, .1]], [[.05, .17], [.35, .17]], [[.09, .29], [.31, .29]], [[.09, .41], [.31, .41]],
    [[.09, .53], [.09, .8]], [[.09, .53], [.31, .53], [.31, .8]], [[.09, .8], [.31, .8]],
    [[.56, .04], [.62, .14]], [[.86, .04], [.79, .14]], [[.5, .2], [.5, .43]], [[.5, .2], [.88, .2], [.88, .43]], [[.5, .43], [.88, .43]],
    [[.63, .43], [.61, .72], [.46, .96]], [[.77, .43], [.77, .86], [.97, .92], [.97, .8]]],
];

/** Closed book, built upright in its own frame (head at -z, spine and stitching at +x, cover up). */
function closedBook(b: ReconstructionBuilder, g: Object3D) {
  const TB = .62, TOP = 2 * TC + TB, cover = { parent: g, region: 'cover' };

  b.feature('page-block-edges');
  b.box([W, TC, D], [0, TC / 2, 0], 'cover', { parent: g, bevel: .025 });
  // Leaves: flush at the spine, a hair inside the covers elsewhere; slightly overlapping both covers.
  b.box([W - IN, TB + .02, D - 2 * IN], [IN / 2, TC + TB / 2, 0], 'paper', { parent: g, bevel: .012 });
  b.box([W, TC, D], [0, TOP - TC / 2, 0], 'cover', { ...cover, bevel: .025 });

  // Faint pressed 능화 lattice: low V ridges in the cover material, clipped to the cover.
  b.feature('neunghwa-pattern-cover');
  const ridges = new Tris(), y0 = TOP - .004, rh = .024, hw = .07, x0 = -W / 2 + .45, x1 = W / 2 - .45, z0 = -D / 2 + .45, z1 = D / 2 - .45;
  for (const sign of [1, -1]) {
    const a = sign * 38 * Math.PI / 180, dx = Math.sin(a), dz = Math.cos(a), nx = dz, nz = -dx;
    const cs = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].map(([x, z]) => x * nx + z * nz);
    for (let c = Math.ceil(Math.min(...cs) / 2.3) * 2.3; c <= Math.max(...cs); c += 2.3) {
      // Clip the line p = n*c + d*t to the rectangle (Liang-Barsky).
      let t0 = -1e9, t1 = 1e9; const px = nx * c, pz = nz * c;
      for (const [p, d, lo, hi] of [[px, dx, x0, x1], [pz, dz, z0, z1]]) {
        if (Math.abs(d) < 1e-9) { if (p < lo || p > hi) t0 = 1e9; continue; }
        const ta = (lo - p) / d, tb = (hi - p) / d; t0 = Math.max(t0, Math.min(ta, tb)); t1 = Math.min(t1, Math.max(ta, tb));
      }
      if (t1 - t0 < .3) continue;
      const ax = px + dx * t0, az = pz + dz * t0, bx = px + dx * t1, bz = pz + dz * t1;
      ridges.quad([ax - nx * hw, y0, az - nz * hw], [bx - nx * hw, y0, bz - nz * hw], [bx, y0 + rh, bz], [ax, y0 + rh, az]);
      ridges.quad([ax, y0 + rh, az], [bx, y0 + rh, bz], [bx + nx * hw, y0, bz + nz * hw], [ax + nx * hw, y0, az + nz * hw]);
    }
  }
  b.add(ridges.geometry(), 'cover', cover);

  // Title slip (제첨) at the upper left, with 農事直說 brushed top to bottom.
  b.feature('title-slip-nongsa-jikseol');
  const SW = 3.6, SL = 17, sx0 = -W / 2 + 1.05, sz0 = -D / 2 + 1.4, slipTop = TOP + .03;
  b.box([SW, .035, SL], [sx0 + SW / 2, slipTop - .0175, sz0 + SL / 2], 'paper', { ...cover, bevel: .006 });
  const title = new Ink(() => slipTop + .012), cw = SW - 1.0, chH = 3.3;
  TITLE.forEach((glyph, k) => {
    const cx = sx0 + .5, cz = sz0 + 1.0 + k * (chH + .4);
    for (const stroke of glyph) title.line(stroke.map(([u, v]) => [cx + u * cw, cz + v * chH] as P2), k === 3 ? .17 : .2);
  });
  b.add(title.geometry(), 'ink', cover);

  // Five-hole binding: one run along the spine, five loops over the spine edge, end loops over head and tail.
  b.feature('five-hole-red-thread-binding');
  const o = THREAD * .55, yT = TOP + o, xh = W / 2 - 1.1, xs = W / 2 + o;
  rod(b, [xh, yT, -D / 2 - o], [xh, yT, D / 2 + o], 'thread', cover);
  for (const zEnd of [-D / 2 - o, D / 2 + o]) { rod(b, [xh, yT, zEnd], [xh, THREAD, zEnd], 'thread', cover); knot(b, [xh, yT, zEnd], cover); }
  for (const z of HOLES) {
    rod(b, [xh, yT, z], [xs, yT, z], 'thread', cover);
    rod(b, [xs, yT, z], [xs, THREAD, z], 'thread', cover);
    knot(b, [xs, yT, z], cover);
  }
}

// ---------- Open book ----------
const HB = 1.2;            // height of the stitched spine margin standing on its edge under the gutter
const SB = .39;            // half its thickness (the closed book's half thickness)
const SR = 6.5;            // where the covers come down onto the table
const G = 1.8, BUL = 1.25;  // pages bulge up next to the crease, then settle onto their stacks
const YC = HB + TC + .2;   // the crease between the two visible pages
const STACK = { left: .42, right: .28 }; // unread / already-read leaves (opened in the first half)

const coverY = (s: number) => s <= SB ? HB : HB * (1 - smooth((s - SB) / (SR - SB)));
function pageY(s: number, stack: number) {
  const settled = (q: number) => coverY(q) + TC + stack + BUL * (1 - smooth((q - G) / 8));
  if (s >= G) return settled(s);
  return YC + (settled(G) - YC) * (1 - (1 - s / G) ** 2.4);
}

/** Column plans in reading order: X text, H heading, n small double-line note cell. */
const PLANS = {
  right: ['XXXXXXXXXXXXXXXXXX', 'XXXXXXXXXXXXXXXXXX', 'XXXXXXXXXXnnnnnnnn', 'nnnnXXXXXXXXXXXXXX', 'XXXXXXXXXXXXXXXXXX',
    'XXXXXXXX', 'HH', 'XXXXXXXXXXXXXXXXXX', 'XXXXXXXXXXXXXnnnnn', 'nnnXXXXXXXXXXXXXXX'],
  left: ['XXXXXXXXXXXXXXXXXX', 'XXXXXXXXXXXXXXXXXX', 'XXXXXXnnnnnnXXXXXX', 'XXXXXXXXXXXXXXXXXX', 'XXXXXXXXXXXXX',
    'HHH', 'XXXXXXXXXXXXXXXXXX', 'XXXXXXXXXXXXXXXXXX', 'XXXXXXXXXnnnnnnnnn', 'XXXXXXXXXXX'],
};

/** Woodblock page layout (frame, column rules, half 판심 with fish-tail, text strokes) on one page. */
function pageLayout(ink: Ink, side: 1 | -1, plan: string[], seed: number, ox: number, oz: number) {
  const X = (s: number) => ox + side * s, Z = (z: number) => oz + z;
  const sB = 4.0, sF = W - IN, zT = -D / 2 + 5.0, zB = D / 2 - 3.5, gap = .25;
  const sIn = sB + gap, sP = sF - 1.0, cw = (sP - sIn) / 10, top = zT + gap, bot = zB - gap, ch = (bot - top) / 18;
  // Double frame (outer heavy, inner fine); it runs out to the fold at the fore-edge.
  ink.stroke([X(sB), Z(zT)], [X(sB), Z(zB)], .14);
  ink.stroke([X(sB), Z(zT)], [X(sF), Z(zT)], .14);
  ink.stroke([X(sB), Z(zB)], [X(sF), Z(zB)], .14);
  ink.stroke([X(sIn), Z(top)], [X(sIn), Z(bot)], .05);
  ink.stroke([X(sIn), Z(top)], [X(sF), Z(top)], .05);
  ink.stroke([X(sIn), Z(bot)], [X(sF), Z(bot)], .05);
  for (let k = 1; k <= 10; k++) ink.stroke([X(sIn + k * cw), Z(top)], [X(sIn + k * cw), Z(bot)], k === 10 ? .05 : .032);
  // Half of the 판심 at the fold: upper and lower black fish-tails (상하내향흑어미), notches facing inward.
  const u = top + 3.2, l = bot - 3.4;
  ink.fill([[X(sP), Z(u)], [X(sF), Z(u)], [X(sF), Z(u + .5)], [X(sP), Z(u + 1)]]);
  ink.fill([[X(sP), Z(l)], [X(sF), Z(l + .5)], [X(sF), Z(l + 1)], [X(sP), Z(l + 1)]]);
  // Text: brush-like stroke clusters that suggest characters without forming any.
  const rnd = random(seed);
  // Each "character" is a dense cluster of short strokes built like a Hanja (side-by-side or stacked
  // parts), so a column reads as printed text from a distance while no actual character is formed.
  const glyph = (cx: number, cz: number, hw: number, hh: number, w: number) => {
    const layout = rnd(), parts: Array<[number, number, number, number]> =
      layout < .45 ? [[-1, -.35, -1, 1], [-.15, 1, -1, 1]] : layout < .75 ? [[-1, 1, -1, -.15], [-1, 1, .05, 1]] : [[-1, 1, -1, 1]];
    for (const [u0, u1, v0, v1] of parts) {
      // Hanja are dense: many crossing strokes with slants and dots. Sparse straight strokes read as Hangul,
      // which did not exist yet in 1429, so every part gets enough strokes to look printed in classical Chinese.
      const count = (parts.length > 1 ? 4 : 8) + Math.floor(rnd() * 4), at = (a: number, b: number) => a + (b - a) * rnd();
      for (let i = 0; i < count; i++) {
        const kind = rnd();
        let a: P2, c: P2;
        if (kind < .34) { const v = at(v0 + .1, v1 - .1), l = at(u0, u0 + (u1 - u0) * .4), r = at(l + (u1 - u0) * .4, u1); a = [l, v]; c = [r, v + (rnd() - .5) * .12]; }
        else if (kind < .6) { const u = at(u0 + .1, u1 - .1), t = at(v0, v0 + (v1 - v0) * .4), e = at(t + (v1 - v0) * .45, v1); a = [u, t]; c = [u + (rnd() - .5) * .15, e]; }
        else { const u = at(u0, u1), v = at(v0, v1), d = rnd() < .5 ? 1 : -1, l = rnd() < .3 ? .12 : .3 + rnd() * .4; a = [u, v]; c = [u + d * l, v + l]; }
        ink.stroke([cx + a[0] * hw, cz + a[1] * hh], [cx + c[0] * hw, cz + c[1] * hh], w);
      }
    }
  };
  plan.forEach((column, r) => {
    const k = side > 0 ? 9 - r : r, sc = sIn + (k + .5) * cw;
    [...column].forEach((cell, j) => {
      const zc = top + (j + .5) * ch;
      if (cell === 'X') glyph(X(sc), Z(zc), cw * .32, ch * .38, .07);
      else if (cell === 'H') glyph(X(sc), Z(zc), cw * .35, ch * .41, .09);
      else if (cell === 'n') for (const du of [-.22, .22]) for (const dv of [-.25, .25]) glyph(X(sc + du * cw), Z(zc + dv * ch), cw * .16, ch * .2, .045);
    });
  });
}

function openBook(b: ReconstructionBuilder, ox: number, oz: number) {
  const zh = D / 2 - IN;
  b.feature('open-spread-ruled-frame');
  b.feature('pansim-fish-tail-marks');
  b.feature('small-double-line-notes');

  // Covers: each slopes from the spine margin down to the table, then lies flat to the fore-edge,
  // and turns down along the spine margin (the margin's outer layers).
  const covers = new Tris(), cs = [SB - TC, SB, .9, 1.5, 2.2, 3, 3.8, 4.6, 5.4, 6, SR, W];
  for (const side of [1, -1]) {
    for (let i = 0; i + 1 < cs.length; i++) {
      const xa = ox + side * cs[i], xb = ox + side * cs[i + 1], ya = coverY(cs[i]), yb = coverY(cs[i + 1]);
      covers.quad([xa, ya + TC, oz - D / 2], [xa, ya + TC, oz + D / 2], [xb, yb + TC, oz + D / 2], [xb, yb + TC, oz - D / 2]);
      covers.quad([xa, ya, oz - D / 2], [xb, yb, oz - D / 2], [xb, yb, oz + D / 2], [xa, ya, oz + D / 2]);
      for (const z of [oz - D / 2, oz + D / 2]) covers.quad([xa, ya, z], [xb, yb, z], [xb, yb + TC, z], [xa, ya + TC, z]);
    }
    const xf = ox + side * W;
    covers.quad([xf, 0, oz - D / 2], [xf, 0, oz + D / 2], [xf, TC, oz + D / 2], [xf, TC, oz - D / 2]);
    b.box([TC, HB + TC, D], [ox + side * (SB - TC / 2), (HB + TC) / 2, oz], 'cover', { bevel: .02 });
  }
  b.add(covers.geometry(), 'cover');
  // The leaves' stitched margins, pressed together on edge under the gutter.
  b.box([2 * (SB - TC) + .02, HB + TC, D - 2 * IN], [ox, (HB + TC) / 2, oz], 'paper', { bevel: .02 });

  // Page stacks (edges only) and the two visible pages on top of them.
  const ss = [0, .1, .25, .45, .7, 1, 1.5, 2, 2.6, 3.3, 4, 4.8, 5.7, 6.7, 7.8, 9, 10.3, 11.6, 13.2, 15, 17, W - IN];
  const edges = new Tris(), ink = new Ink(x => pageY(Math.abs(x - ox), x < ox ? STACK.left : STACK.right) + .03);
  for (const side of [1, -1] as const) {
    const stack = side > 0 ? STACK.right : STACK.left, bottom = (s: number) => coverY(s) + TC - .005;
    for (let i = 0; i + 1 < ss.length; i++) {
      const xa = ox + side * ss[i], xb = ox + side * ss[i + 1];
      for (const z of [oz - zh, oz + zh]) edges.quad([xa, bottom(ss[i]), z], [xb, bottom(ss[i + 1]), z], [xb, pageY(ss[i + 1], stack), z], [xa, pageY(ss[i], stack), z]);
    }
    const sf = W - IN, xf = ox + side * sf;
    edges.quad([xf, bottom(sf), oz - zh], [xf, bottom(sf), oz + zh], [xf, pageY(sf, stack), oz + zh], [xf, pageY(sf, stack), oz - zh]);

    // Visible page: indexed strip with smooth normals so the bulge shades softly.
    const pos: number[] = [], nor: number[] = [], idx: number[] = [];
    ss.forEach((s, i) => {
      const e = .02, s0 = Math.max(0, s - e), s1 = s + e, slope = (pageY(s1, stack) - pageY(s0, stack)) / (s1 - s0);
      const n = new THREE.Vector3(-side * slope, 1, 0).normalize();
      for (const z of [oz - zh, oz + zh]) { pos.push(ox + side * s, pageY(s, stack), z); nor.push(n.x, n.y, n.z); }
      // Wind the strip so its front face is the top (mirrored on the left page), matching the normals.
      if (i && side > 0) idx.push(2 * i - 2, 2 * i - 1, 2 * i + 1, 2 * i - 2, 2 * i + 1, 2 * i);
      if (i && side < 0) idx.push(2 * i - 2, 2 * i + 1, 2 * i - 1, 2 * i - 2, 2 * i, 2 * i + 1);
    });
    const sheet = new THREE.BufferGeometry();
    sheet.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    sheet.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    sheet.setIndex(idx);
    b.add(sheet, 'paper', { region: 'pages' });
    pageLayout(ink, side, side > 0 ? PLANS.right : PLANS.left, side > 0 ? 1429 : 1430, ox, oz);
  }
  b.add(edges.geometry(), 'paper');
  b.add(ink.geometry(), 'ink', { region: 'pages' });

  // Binding thread on the margin's outer faces: run along the holes, five loops down over the spine
  // edge, and the end loops across the head and tail of the margin (the parts seen at the gutter ends).
  const yh = .9, xo = SB + THREAD * .55, ze = D / 2 + THREAD * .55;
  for (const side of [1, -1]) {
    const x = ox + side * xo;
    rod(b, [x, yh, oz - ze], [x, yh, oz + ze], 'thread');
    for (const z of HOLES) { rod(b, [x, yh, oz + z], [x, THREAD, oz + z], 'thread'); knot(b, [x, yh, oz + z]); }
    for (const z of [-ze, ze]) knot(b, [x, yh, oz + z]);
  }
  for (const z of [-ze, ze]) rod(b, [ox - xo, yh, oz + z], [ox + xo, yh, oz + z], 'thread');
}

export function build(b: ReconstructionBuilder) {
  // Open book behind, closed book in front turned a quarter (head to the right, spine toward the viewer).
  const OZ = -10.65, gap = 1.8;
  openBook(b, 0, OZ);
  const closed = new THREE.Group();
  closed.position.set(2.5, 0, OZ + D / 2 + gap + W / 2);
  closed.rotation.y = -Math.PI / 2;
  b.root.add(closed);
  closedBook(b, closed);
}
