import * as THREE from 'three';
import type { PhotoView, ReconstructionBuilder, Rect, Surface, Vec } from './toolkit';

/**
 * 농사직설 (農事直說, Nongsa jikseol, 1429) — photo-reference teaching reconstruction of a Joseon
 * thread-bound book (선장본). Not a scan: the binding, layout and proportions follow surviving Joseon
 * copies of this one-volume manual as closely as known. Units are centimetres; everything stands on
 * y = 0 and +z is the front.
 *
 * Two copies lie on the table:
 * - Closed book (front right): the photographed old copy (public/images/heritage/joseon-science/
 *   nongsajikseol.jpg), cover up. Its cover is nearly square, as in the photo: 23.2 cm from the spine
 *   to the fore-edge and 24 cm from head to tail (the photo's cover measures about 1084 × 1121 px; the
 *   copy's real size is not known, only its proportions), and under 1 cm thick (the text is short).
 *   The worn cover, its brushed title 農事直說, the notes written on it and its stains all come from the
 *   photo; nothing is modelled on the cover except the binding. The cord of the five-hole binding
 *   (오침안정법) lies where the photo shows it: a stitch line about 2 cm in from the spine edge,
 *   following the photo's slightly wavy course, five loops over the spine edge at the photo's (uneven)
 *   hole spacing, and the end loops over the head and tail. The page block shows on three edges
 *   between the covers. The book is turned 33° about the vertical so that, seen from the default
 *   'app' view (camera at +x, +y, +z), its head points away and the cover reads upright, spine on
 *   the right as in the photo.
 * - Open book (behind, to the left): a printed copy opened in the text, head away from the viewer,
 *   about as tall as the closed copy (pages 15.6 × 24 cm: the spread is laid out at 0.8 in plan, its
 *   heights unscaled, which also keeps the two books compact enough to read well in the app view).
 *   The spine lies in the middle; as in a real 선장본 opened flat, the stitched spine margin stands on its
 *   edge under the gutter, so the gutter crease rides about 1.5 cm high, the covers slope down from it
 *   like a low tent and the two visible pages bulge up from the crease before lying down on their page
 *   stacks (rise slightly exaggerated). The binding thread shows across the head and tail of the spine
 *   margin. Each page carries the woodblock layout as thin ink lines only: a double ruled frame (판광,
 *   사주쌍변 assumed) with a wider head margin, 10 ruled columns (계선) and the half of the centre column
 *   (판심) with its fish-tail mark (어미) at the fore-edge — a 선장본 leaf is folded through the 판심, so
 *   the fold sits at the page's outer edge, not in the gutter. Text is suggested by unreadable
 *   brush-like stroke clusters, with short headings and small double-line notes (소자쌍행); no
 *   characters are written. There is no photo of it, so it stays plain (paper, ink, brown cover, red
 *   thread).
 *
 * Photo regions (photoViews below). The photo is the closed copy's front cover taken straight on, so
 * every region is seen from straight above (elevation 90°) with azimuth = the book's turn (head at the
 * photo's top, spine on its right) plus 0.5°, because the cover sits tilted about half a degree
 * clockwise in the photo (its top, bottom and spine edges and the stitch line all lean that way).
 * - 'cover': the closed book's top cover. Frame = the tilted cover's bounding box in the photo, inset
 *   a few pixels so no grey background or the museum label reaches the cover.
 * - 'binding': the cord lying on the cover (stitch line, the five loops up to the spine edge and the
 *   knots at the holes). Its frame is computed from the cord's own outline with the same mapping as the
 *   cover, so the cord takes the photo's cord pixels.
 * - 'binding-wrap': the cord where it turns over the spine edge, head and tail (outside the photo's
 *   cover outline). A small swatch of the photo's cord (one loop).
 * - 'cover-under': the closed book's back cover, of which only the thin edge is seen. A small plain
 *   swatch of the photographed cover, so it keeps the cover's real tone.
 */

type P2 = [number, number];
type Geometry = InstanceType<typeof THREE.BufferGeometry>;
type Object3D = InstanceType<typeof THREE.Object3D>;

const W = 19.5;      // open book: page width (spine to fore-edge), as modelled
const D = 30;        // open book: page height (head to tail), as modelled
const OPEN_SCALE = .8; // the open book is laid out at this scale across the table (pages 15.6 × 24 cm), heights unscaled
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

/** Flat ink strokes laid onto a height field y(x, z) (pages), split so they follow its curve. */
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

/** A straight round rod (thread run) from a to c. */
function rodGeometry(a: Vec, c: Vec): Geometry {
  const va = new THREE.Vector3(...a), vc = new THREE.Vector3(...c), dir = vc.clone().sub(va), len = dir.length();
  const g: Geometry = new THREE.CylinderGeometry(THREAD, THREAD, len, 8, 1, true);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
  g.translate((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2);
  return g;
}
/** A knot / turn of the thread: a small ball. */
function knotGeometry(p: Vec): Geometry { const g: Geometry = new THREE.SphereGeometry(THREAD, 10, 8); g.translate(...p); return g; }
function rod(b: ReconstructionBuilder, a: Vec, c: Vec, surface: Surface, opts: { region?: string; parent?: Object3D } = {}) { b.add(rodGeometry(a, c), surface, opts); }
const knot = (b: ReconstructionBuilder, p: Vec, opts: { region?: string; parent?: Object3D } = {}) => b.add(knotGeometry(p), 'thread', opts);

/** z positions of the open book's five binding holes (오침): end holes 2.6 cm from head and tail, evenly spaced. */
const HOLES = [0, 1, 2, 3, 4].map(i => -D / 2 + 2.6 + i * (D - 5.2) / 4);

// ---------- Closed book: the photographed copy, and how its photo lies on it ----------
const CW = 23.2, CD = 24;    // cover: spine to fore-edge, head to tail (as the photo's cover frame, 1084 × 1121 px)
const CTB = .62;             // its page block
const CTOP = 2 * TC + CTB;   // top of the closed book
const TURN = 33;             // the closed book's turn about the vertical, degrees (head away from the app camera)
const TILT = .5;             // the cover sits this many degrees clockwise in the photo
const PHOTO_W = 1280, PHOTO_H = 1362;
/** Bounding box of the tilted cover in the photo, pixels [left, top, right, bottom], inset a few pixels
 *  (the top kept below the museum label, which overlaps the cover's head edge down to y = 126). */
const COVER_PX: Rect = [99, 131, 1183, 1252];
/** The photo's stitch line, pixels: where it meets the head edge, its crossing with each of the five
 *  loops (top to bottom), and where it meets the tail edge. */
const STITCH_PX: P2[] = [[1103, 134], [1098, 242], [1089, 448], [1087, 688], [1086, 945], [1088, 1156], [1093, 1256]];
/** Plain swatches in the photo, pixels: a stretch of one loop's cord, and bare cover paper. */
const CORD_PX: Rect = [1120, 446, 1170, 449];
const COVER_PLAIN_PX: Rect = [452, 1052, 492, 1092];

// The photo view seen in the closed book's own frame (x toward the spine, z toward the tail): straight
// down, the photo's right axis turned TILT from the book's x. `toView` gives (right, up) coordinates.
const tilt = TILT * Math.PI / 180, ct = Math.cos(tilt), st = Math.sin(tilt);
const toView = (x: number, z: number): P2 => [x * ct - z * st, -x * st - z * ct];
const fromView = ([sx, sy]: P2): P2 => [sx * ct - sy * st, -sx * st - sy * ct];
const CORNERS = ([[-1, -1], [1, -1], [1, 1], [-1, 1]] as P2[]).map(([i, k]) => toView(i * CW / 2, k * CD / 2));
const VIEW = {
  x0: Math.min(...CORNERS.map(p => p[0])), x1: Math.max(...CORNERS.map(p => p[0])),
  y0: Math.min(...CORNERS.map(p => p[1])), y1: Math.max(...CORNERS.map(p => p[1])),
};
/** Photo pixel → point on the closed book's cover (the inverse of the toolkit's mapping of 'cover'). */
function fromPhoto([px, py]: P2): P2 {
  const [l, t, r, b] = COVER_PX;
  return fromView([VIEW.x0 + (px - l) / (r - l) * (VIEW.x1 - VIEW.x0), VIEW.y1 - (py - t) / (b - t) * (VIEW.y1 - VIEW.y0)]);
}
/** Photo frame (0..1) that lands on a part of the cover with the same mapping as 'cover', from the part's geometry. */
function frameOver(geometries: Geometry[]): Rect {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const g of geometries) {
    const p = g.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const [sx, sy] = toView(p.getX(i), p.getZ(i));
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
  }
  const [l, t, r, b] = COVER_PX, u = (sx: number) => (l + (sx - VIEW.x0) / (VIEW.x1 - VIEW.x0) * (r - l)) / PHOTO_W;
  const v = (sy: number) => (t + (VIEW.y1 - sy) / (VIEW.y1 - VIEW.y0) * (b - t)) / PHOTO_H;
  return [u(x0), v(y1), u(x1), v(y0)];
}
const px = ([l, t, r, b]: Rect): Rect => [l / PHOTO_W, t / PHOTO_H, r / PHOTO_W, b / PHOTO_H];

/** The closed book's binding cord, in the book's frame: the part lying on the cover ('binding') and the
 *  turns over the spine edge, head and tail ('binding-wrap'). */
function bindingCord() {
  const o = THREAD * .55, yT = CTOP + o, edge = CW / 2 - .04, xs = CW / 2 + o, zEnd = CD / 2 - .04, zOut = CD / 2 + o;
  const course = STITCH_PX.map(fromPhoto), head = course[0][0], tail = course[course.length - 1][0], holes = course.slice(1, -1);
  // Stitch line along the photo's course, from just inside the head edge to just inside the tail edge.
  const line: P2[] = [[head, -zEnd], ...holes, [tail, zEnd]];
  const top: Geometry[] = [], wrap: Geometry[] = [];
  for (let i = 0; i + 1 < line.length; i++) top.push(rodGeometry([line[i][0], yT, line[i][1]], [line[i + 1][0], yT, line[i + 1][1]]));
  for (const [x, z] of holes) {
    top.push(knotGeometry([x, yT, z]));                                    // the cord entering the hole
    top.push(rodGeometry([x, yT, z], [edge, yT, z]));                      // loop across the cover to the spine edge
    wrap.push(knotGeometry([xs, yT, z]), rodGeometry([xs, yT, z], [xs, THREAD, z])); // over the spine edge and down
  }
  for (const [x, z, s] of [[head, -zEnd, -1], [tail, zEnd, 1]]) {
    wrap.push(rodGeometry([x, yT, z], [x, yT, s * zOut]), knotGeometry([x, yT, s * zOut]), rodGeometry([x, yT, s * zOut], [x, THREAD, s * zOut]));
  }
  return { top, wrap };
}

/** Closed book, built upright in its own frame (head at -z, spine and stitching at +x, cover up). */
function closedBook(b: ReconstructionBuilder, g: Object3D) {
  b.feature('photographed-cover-handwritten-title');
  b.feature('page-block-edges');
  b.box([CW, TC, CD], [0, TC / 2, 0], 'cover', { parent: g, region: 'cover-under', bevel: .025 });
  // Leaves: flush at the spine, a hair inside the covers elsewhere; slightly overlapping both covers.
  b.box([CW - IN, CTB + .02, CD - 2 * IN], [IN / 2, TC + CTB / 2, 0], 'paper', { parent: g, bevel: .012 });
  // Front cover: the photo carries its title, notes, stains and wear.
  b.box([CW, TC, CD], [0, CTOP - TC / 2, 0], 'cover', { parent: g, region: 'cover', bevel: .025 });

  b.feature('five-hole-thread-binding');
  const cord = bindingCord();
  cord.top.forEach(geometry => b.add(geometry, 'thread', { parent: g, region: 'binding' }));
  cord.wrap.forEach(geometry => b.add(geometry, 'thread', { parent: g, region: 'binding-wrap' }));
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

/** Open book, built in its own frame (spine along z at x = 0, head at -z) under `g`. */
function openBook(b: ReconstructionBuilder, g: Object3D) {
  const ox = 0, oz = 0, on = { parent: g };
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
    b.box([TC, HB + TC, D], [ox + side * (SB - TC / 2), (HB + TC) / 2, oz], 'cover', { ...on, bevel: .02 });
  }
  b.add(covers.geometry(), 'cover', on);
  // The leaves' stitched margins, pressed together on edge under the gutter.
  b.box([2 * (SB - TC) + .02, HB + TC, D - 2 * IN], [ox, (HB + TC) / 2, oz], 'paper', { ...on, bevel: .02 });

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
    b.add(sheet, 'paper', on);
    pageLayout(ink, side, side > 0 ? PLANS.right : PLANS.left, side > 0 ? 1429 : 1430, ox, oz);
  }
  b.add(edges.geometry(), 'paper', on);
  b.add(ink.geometry(), 'ink', on);

  // Binding thread on the margin's outer faces: run along the holes, five loops down over the spine
  // edge, and the end loops across the head and tail of the margin (the parts seen at the gutter ends).
  const yh = .9, xo = SB + THREAD * .55, ze = D / 2 + THREAD * .55;
  for (const side of [1, -1]) {
    const x = ox + side * xo;
    rod(b, [x, yh, oz - ze], [x, yh, oz + ze], 'thread', on);
    for (const z of HOLES) { rod(b, [x, yh, oz + z], [x, THREAD, oz + z], 'thread', on); knot(b, [x, yh, oz + z], on); }
    for (const z of [-ze, ze]) knot(b, [x, yh, oz + z], on);
  }
  for (const z of [-ze, ze]) rod(b, [ox - xo, yh, oz + z], [ox + xo, yh, oz + z], 'thread', on);
}

export function build(b: ReconstructionBuilder) {
  // Open book behind on the left; the photographed closed copy in front on the right, turned so that its
  // cover reads upright from the app view (head away from the camera, spine on the right).
  const open = new THREE.Group();
  open.scale.set(OPEN_SCALE, 1, OPEN_SCALE);
  b.root.add(open);
  openBook(b, open);
  const closed = new THREE.Group();
  closed.position.set(21.5, 0, 25);
  closed.rotation.y = TURN * Math.PI / 180;
  b.root.add(closed);
  closedBook(b, closed);
}

/** How the photo (photos.json, id 6: the closed copy's front cover, straight on) lies on each region. */
const SEEN = { elevation: 90, azimuth: TURN + TILT };
const CORD = bindingCord();
export const photoViews: Record<string, PhotoView> = {
  cover: { ...SEEN, frame: px(COVER_PX) },
  binding: { ...SEEN, frame: frameOver(CORD.top) },
  'binding-wrap': { ...SEEN, frame: px(CORD_PX) },
  'cover-under': { ...SEEN, frame: px(COVER_PLAIN_PX) },
};
[...CORD.top, ...CORD.wrap].forEach(geometry => geometry.dispose());
