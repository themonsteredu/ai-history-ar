import * as THREE from 'three';
import type { PhotoView, ReconstructionBuilder, Surface, Vec } from './toolkit';

/**
 * 자격루 (Jagyeongnu, self-striking water clock) - photo-reference teaching reconstruction of the
 * surviving 1536 (Jungjong) Borugak clock remains as displayed at Deoksugung (Gwangmyeongmun),
 * matched to public/images/heritage/joseon-science/jagyeongnu.jpg (photos.json id 2). Not a scan:
 * the photo is taken nearly straight from the front at eye level, so widths and heights come from it;
 * depths cannot be seen and are inferred. The striking cabinet, the float rods (잣대) and the pipes
 * did not survive and are not part of these remains, so they are not modelled.
 *
 * Layout (metres, y up, +z front, +x viewer's right), symmetric about x = 0, as the photo shows:
 *  - a low stepped base: a front slab the cylinders stand on, a plinth course, then a granite block
 *    stand (dressed stone courses, 1.42 m tall with its cap) set back behind the cylinders;
 *  - on the block: two light granite side pillars, each carrying a small supply vessel 소파수호
 *    (46 cm across, 40.5 cm tall), and behind them a taller central pillar carrying the large supply
 *    vessel 대파수호 (93.5 cm across, 70 cm tall) at the top centre;
 *  - in front, on the slab, two tall inflow cylinders 수수호 (196 cm tall, about 37 cm across), left
 *    and right, with a rim lip, a raised band below it and a foot band. Their coiling dragon relief comes
 *    from the photo; the cylinder is modelled plain (slightly fuller where the relief is).
 * The sizes are the recorded ones. Heights and spacings are measured in the photo with its perspective
 * taken into account (camera level, about 1.3 m above the slab; the cylinders are nearest, the small
 * vessels about 1.3x and the big vessel about 1.6x farther away), which is why the big vessel stands
 * higher and larger here than it looks in the photo.
 *
 * Photo regions (photoViews below; frames are [left, top, right, bottom] in the photo). 12 regions, one
 * draw call each (the tablet budget):
 *  - 'cylinders': the front 110 degrees of both cylinders (and the back 110, which take the same pixels
 *    through the cylinder) seen from the front, plus the recessed lids. The frame runs from 0.82 x the
 *    left cylinder's half-width left of its axis to the same right of the right cylinder's axis, so each
 *    front lands on its own cylinder in the photo.
 *  - 'cylinders-side': the two 70-degree sides of both cylinders, seen from the side, onto the middle
 *    of the left photo cylinder: no stretched silhouette (or background) pixels, the relief goes on round.
 *    Where a side meets a front there is a seam in the relief.
 *  - 'vessel-big', 'vessels-small': the part of each vessel the photo sees (rim and shoulder), framed
 *    on its outline, seen from slightly below; the small pair share one frame, and their spacing is set
 *    so both fall inside their jars in the photo. 'vessels-low': their lower bodies and insides, which the
 *    photo never shows (behind the cylinder tops / the small vessels): a swatch of shaded vessel bronze.
 *  - 'pillar-left', 'pillar-right': the side pillars' front and back faces, both on the strip of the
 *    right pillar the photo shows between the cylinders (stretched across).
 *  - 'stand': the block, cap and plinth faces (front, and through to the back) where the photo sees
 *    stone; 'stand-hidden': the strips the cylinders hide in the photo, which borrow the stone wall seen
 *    between the cylinders (same courses, so the joints line up) instead of a ghost of the cylinders.
 *  - 'stand-side': the stand's end faces, seen from the side, onto that same stretch of wall.
 *  - 'base': the front slab's top, front and ends, seen from above at about the photo's low angle.
 *  - 'stone-plain': tops, pillar sides, the central pillar (almost all hidden in the photo) and the
 *    footing: a small swatch of the wall's granite.
 */

const BASE = 0.16;                  // top of the front slab the cylinders stand on
const PLINTH_TOP = BASE + 0.15;     // plinth course under the block
const CAP_BOTTOM = BASE + 1.24;     // block body top / cap bottom
const STAND_TOP = BASE + 1.42;      // cap top
const SIDE_TOP = BASE + 2.03;       // side pillars' top = small vessels' foot
const MID_TOP = BASE + 2.31;        // central pillar's top = big vessel's foot

const CYL_X = 0.42, CYL_Z = 0.66;   // inflow cylinder axes
const SMALL_X = 0.42, SMALL_Z = -0.15; // small vessels / side pillars
const BIG_Z = -0.85;                // big vessel / central pillar

/** Inflow cylinder profile [radius, height]: foot band, the fuller relief zone, a raised band, the plain
 *  neck and the rim lip, and inside the mouth a wall down to a recessed lid. */
const CYLINDER: Array<[number, number]> = [
  [0, 0], [0.188, 0], [0.192, 0.01], [0.192, 0.05], [0.186, 0.06],
  [0.19, 0.07], [0.192, 0.3], [0.192, 1.6], [0.19, 1.74],
  [0.183, 1.77], [0.189, 1.775], [0.189, 1.8], [0.182, 1.805],
  [0.18, 1.81], [0.18, 1.915],
  [0.187, 1.92], [0.19, 1.94], [0.188, 1.958], [0.182, 1.962], [0.152, 1.962], [0.148, 1.955], [0.148, 1.86],
];
/** The lid inside the lip: a full disc, kept inside the front sectors' outline (0.82 x 0.192). */
const LID_R = 0.148, LID_Y = 1.86;

type Profile = Array<[number, number]>;
/**
 * A bronze supply vessel: outer profile (foot to lip) and inner profile (lip to inner floor), both as
 * [r / R, y / H]. In the photo the lower body of every vessel is hidden (the small ones behind the
 * cylinder tops, the big one behind the small ones), so only the part above `split` (and the inside of the
 * lip down to `innerSplit`) takes the vessel's own photo region; the rest takes 'vessels-low'.
 * `elevation` is the angle the photo looks up at it from.
 */
interface Jar { outer: Profile; inner: Profile; R: number; H: number; split: number; innerSplit: number; elevation: number }
/** 대파수호: wide basin, widest at the rolled lip, tapering to the foot. */
const BIG: Jar = {
  outer: [[0, 0], [0.6, 0], [0.63, 0.03], [0.7, 0.15], [0.77, 0.3], [0.84, 0.45], [0.895, 0.57], [0.93, 0.66],
    [0.96, 0.74], [0.985, 0.8], [1, 0.85], [0.995, 0.9], [0.975, 0.95], [0.945, 0.985], [0.93, 1]],
  inner: [[0.88, 1], [0.87, 0.96], [0.9, 0.85], [0.86, 0.6], [0.72, 0.33], [0.56, 0.15], [0, 0.13]],
  R: 0.4675, H: 0.7, split: 0.68, innerSplit: 0.9, elevation: -12,
};
/** 소파수호: round shoulder, short collar and lip. */
const SMALL: Jar = {
  outer: [[0, 0], [0.74, 0], [0.78, 0.03], [0.88, 0.135], [0.946, 0.24], [0.985, 0.34], [1, 0.47], [0.99, 0.56],
    [0.97, 0.65], [0.92, 0.76], [0.85, 0.84], [0.78, 0.88], [0.765, 0.91], [0.78, 0.95], [0.785, 1]],
  inner: [[0.72, 1], [0.7, 0.9], [0.84, 0.7], [0.8, 0.4], [0.62, 0.15], [0, 0.12]],
  R: 0.23, H: 0.405, split: 0.4, innerSplit: 0.9, elevation: -10,
};

/** The part of a profile at or above (`above`) or at or below height y, cut exactly at y. */
function cut(points: Profile, y: number, above: boolean): Profile {
  const keep = (p: [number, number]) => above ? p[1] >= y : p[1] <= y;
  const out: Profile = [];
  points.forEach((p, i) => {
    const prev = points[i - 1];
    if (prev && keep(prev) !== keep(p)) {
      const t = (y - prev[1]) / (p[1] - prev[1]);
      out.push([prev[0] + (p[0] - prev[0]) * t, y]);
    }
    if (keep(p)) out.push(p);
  });
  return out;
}
const jarParts = (jar: Jar) => ({
  seen: [...cut(jar.outer, jar.split, true), ...cut(jar.inner, jar.innerSplit, true)],
  hidden: [cut(jar.outer, jar.split, false), cut(jar.inner, jar.innerSplit, false)],
});

/**
 * Photo rows [top, bottom] for a vessel's seen part. Seen from `elevation`, a point's height on screen is
 * y cos(e) - z sin(e); the toolkit stretches the part's highest..lowest screen height onto the frame.
 * `rowTop` is the photo row of the lip's front, `rowFoot` that of the front of the foot.
 */
function jarRows(jar: Jar, rowTop: number, rowFoot: number): [number, number] {
  const e = jar.elevation * Math.PI / 180;
  const screen = (points: Profile) => points.flatMap(([r, h]) => [-1, 1].map(side => h * jar.H * Math.cos(e) - side * r * jar.R * Math.sin(e)));
  const all = screen([...jar.outer, ...jar.inner]), seen = screen(jarParts(jar).seen);
  const foot = -jar.outer[1][0] * jar.R * Math.sin(e);
  const perMetre = (rowFoot - rowTop) / (Math.max(...all) - foot);
  return [rowTop + (Math.max(...all) - Math.max(...seen)) * perMetre, rowTop + (Math.max(...all) - Math.min(...seen)) * perMetre];
}

type Face = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';
const PLAIN = 'stone-plain';

/** One flat quad (two triangles) with an explicit normal. */
function quad(b: ReconstructionBuilder, surface: Surface, region: string, corners: [Vec, Vec, Vec, Vec], normal: Vec) {
  const [p0, p1, p2, p3] = corners;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...p0, ...p1, ...p2, ...p0, ...p2, ...p3], 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(Array.from({ length: 6 }, () => normal).flat(), 3));
  b.add(g, surface, { region });
}

/**
 * A stone box built face by face, so each face takes its own photo region. `strips` splits the front
 * and back faces at the given x positions, with one region per strip (the strips the cylinders hide in
 * the photo take a different region from the ones it sees). Faces given `null` are left out.
 */
function stoneBox(b: ReconstructionBuilder, surface: Surface, [x0, x1]: [number, number], [y0, y1]: [number, number], [z0, z1]: [number, number],
  regions: Partial<Record<Face, string | null>>, strips?: Array<[number, string]>) {
  const r = (face: Face) => regions[face] === undefined ? PLAIN : regions[face];
  const cuts = strips ? strips.filter(([x]) => x > x0 && x < x1) : [];
  const spans: Array<[number, number, string | null]> = [];
  let from = x0;
  cuts.forEach(([x], i) => { spans.push([from, x, i === 0 ? r('front') : cuts[i - 1][1]]); from = x; });
  spans.push([from, x1, cuts.length ? cuts[cuts.length - 1][1] : r('front')]);
  for (const [a, c, front] of spans) {
    // Front and back strips share a region: the back takes the front's pixels through the stone.
    if (front) quad(b, surface, front, [[a, y0, z1], [c, y0, z1], [c, y1, z1], [a, y1, z1]], [0, 0, 1]);
    const back = strips ? front : r('back');
    if (back) quad(b, surface, back, [[c, y0, z0], [a, y0, z0], [a, y1, z0], [c, y1, z0]], [0, 0, -1]);
  }
  const right = r('right'), left = r('left'), top = r('top'), bottom = r('bottom');
  if (right) quad(b, surface, right, [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0]);
  if (left) quad(b, surface, left, [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0]);
  if (top) quad(b, surface, top, [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0]);
  if (bottom) quad(b, surface, bottom, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0]);
}

/** A bronze vessel standing on (x, y, z): the part the photo sees takes `region`, the rest 'vessels-low'. */
function vessel(b: ReconstructionBuilder, jar: Jar, at: Vec, region: string, segments: number) {
  const scaled = (points: Profile) => points.map(([r, h]) => [Math.max(r * jar.R, 1e-4), h * jar.H] as [number, number]);
  const { seen, hidden } = jarParts(jar);
  b.lathe(scaled(seen), 'bronze', { position: at, region, segments });
  for (const part of hidden) b.lathe(scaled(part), 'bronze', { position: at, region: 'vessels-low', segments });
}

/** Half-angle of the cylinder's front sector (the part that takes the front view). */
const FRONT_HALF = 55 * Math.PI / 180;
/**
 * A tall inflow cylinder in four sectors: the front 110 degrees take the front view (the photo itself),
 * the back 110 degrees the same pixels through the cylinder, and the two 70-degree sides a side view of
 * the photo cylinder's middle, so the relief goes on round it instead of a smear of its silhouette.
 */
function cylinder(b: ReconstructionBuilder, x: number) {
  const points = CYLINDER.map(([r, h]) => new THREE.Vector2(Math.max(r, 1e-4), h));
  const sectors: Array<[number, number, string, number]> = [
    [-FRONT_HALF, 2 * FRONT_HALF, 'cylinders', 32], [FRONT_HALF, Math.PI - 2 * FRONT_HALF, 'cylinders-side', 16],
    [Math.PI - FRONT_HALF, 2 * FRONT_HALF, 'cylinders', 32], [Math.PI + FRONT_HALF, Math.PI - 2 * FRONT_HALF, 'cylinders-side', 16],
  ];
  for (const [start, length, region, segments] of sectors) {
    b.add(new THREE.LatheGeometry(points, segments, start, length), 'bronze', { position: [x, BASE, CYL_Z], region });
  }
  // The lid takes one view as a whole (no seams across it); the photo never sees it, so it takes the rows
  // of plain bronze neck at its height.
  b.lathe([[LID_R, LID_Y], [1e-4, LID_Y]], 'bronze', { position: [x, BASE, CYL_Z], region: 'cylinders', segments: 48 });
}

/** Where the cylinders hide the stand in the photo (model x, through the 'stand' frame), with a margin. */
const HIDDEN_STRIPS: Array<[number, string]> = [[-0.625, 'stand-hidden'], [-0.175, 'stand'], [0.2, 'stand-hidden'], [0.645, 'stand']];

export function build(b: ReconstructionBuilder): void {
  b.feature('dae-pasuho-large-supply-vessel');
  b.feature('so-pasuho-small-supply-vessels');
  b.feature('susuho-inflow-cylinders-dragon-relief');
  b.feature('granite-stand-three-pillars');
  b.feature('stepped-stone-base');

  // ---------- Stepped base ----------
  // Front slab (apron) the cylinders stand on: its top and front are in the photo.
  // Its ends take the photo's slab edge too (seen edge-on they get its outermost columns).
  stoneBox(b, 'darkStone', [-1.1, 1.1], [0, BASE], [0.4, 1.07], { front: 'base', top: 'base', left: 'base', right: 'base', back: null });
  // A footing course under and just around the stand (never seen in the photo).
  stoneBox(b, 'darkStone', [-1.02, 1.02], [0, BASE], [-1.34, 0.4], { front: null });

  // ---------- Granite block stand: plinth course, body of dressed courses, overhanging cap ----------
  const stand = { front: 'stand', right: 'stand-side', left: 'stand-side', bottom: null } as const;
  stoneBox(b, 'darkStone', [-0.96, 0.96], [BASE, PLINTH_TOP], [-1.26, 0.4], stand, HIDDEN_STRIPS);
  stoneBox(b, 'darkStone', [-0.845, 0.845], [PLINTH_TOP, CAP_BOTTOM], [-1.2, 0.34], { ...stand, top: null }, HIDDEN_STRIPS);
  stoneBox(b, 'darkStone', [-0.93, 0.93], [CAP_BOTTOM, STAND_TOP], [-1.26, 0.4], { ...stand, bottom: PLAIN }, HIDDEN_STRIPS);

  // ---------- Pillars on the block ----------
  for (const [side, region] of [[-1, 'pillar-left'], [1, 'pillar-right']] as const) {
    const xs = [SMALL_X - 0.29, SMALL_X + 0.29].map(x => x * side).sort((p, q) => p - q) as [number, number];
    stoneBox(b, 'darkStone', xs, [STAND_TOP, SIDE_TOP], [SMALL_Z - 0.25, SMALL_Z + 0.25], { front: region, back: region, bottom: null });
  }
  // The central pillar is almost all hidden in the photo (a shadowed sliver between the side pillars):
  // it takes the plain granite swatch.
  stoneBox(b, 'darkStone', [-0.28, 0.28], [STAND_TOP, MID_TOP], [BIG_Z - 0.3, BIG_Z + 0.3], { bottom: null });

  // ---------- Bronze vessels ----------
  vessel(b, BIG, [0, MID_TOP, BIG_Z], 'vessel-big', 72);
  for (const side of [-1, 1]) vessel(b, SMALL, [side * SMALL_X, SIDE_TOP, SMALL_Z], 'vessels-small', 56);

  // ---------- Inflow cylinders ----------
  for (const side of [-1, 1]) cylinder(b, side * CYL_X);
}

/* Photo measurements (fractions of the photo): cylinder axes and half-widths (edges traced row by row). */
const PHOTO_CYL_L = { c: 0.328, h: 0.077 }, PHOTO_CYL_R = { c: 0.665, h: 0.077 };
const F = Math.sin(FRONT_HALF), S = Math.cos(FRONT_HALF); // front / side sectors span +-0.82 / +-0.57 of the radius
const CYL_TOP = 0.295, CYL_BOTTOM = 0.936; // just inside both rims (the right one sits a little lower)
// Vessel rows start a couple of pixels inside the rims, which curve down at the ends, so no background creeps in.
const BIG_ROWS = jarRows(BIG, 0.1415, 0.289), SMALL_ROWS = jarRows(SMALL, 0.2095, 0.3085);

/** How the photo (photos.json, id 2) lies on each region: the view it was taken from and where the region sits in it. */
export const photoViews: Record<string, PhotoView> = {
  cylinders: { elevation: 0, azimuth: 0, frame: [PHOTO_CYL_L.c - F * PHOTO_CYL_L.h, CYL_TOP, PHOTO_CYL_R.c + F * PHOTO_CYL_R.h, CYL_BOTTOM] },
  // Both cylinders' sides (seen from +x; the -x sides take the same pixels through) on the middle of the
  // left photo cylinder, which has clear background all round its top.
  'cylinders-side': { elevation: 0, azimuth: 90, frame: [PHOTO_CYL_L.c - S * PHOTO_CYL_L.h, CYL_TOP, PHOTO_CYL_L.c + S * PHOTO_CYL_L.h, CYL_BOTTOM] },
  // The vessels are above the camera: seen from about 12 and 10 degrees below (their rims curve down at
  // the ends in the photo). Rows from the lip's front (top) and the front of the foot (computed below).
  'vessel-big': { elevation: BIG.elevation, azimuth: 0, frame: [0.34, BIG_ROWS[0], 0.58, BIG_ROWS[1]] },
  'vessels-small': { elevation: SMALL.elevation, azimuth: 0, frame: [0.2903, SMALL_ROWS[0], 0.6803, SMALL_ROWS[1]] },
  // Lower bodies and insides, never seen: a swatch of the left small vessel's shaded lower body.
  'vessels-low': { elevation: 0, azimuth: 0, frame: [0.333, 0.262, 0.338, 0.266] },
  // The side pillars show only narrow strips between the cylinders; the right one's strip is the wider and
  // cleaner (the left one is cut by the cylinder's relief), so both faces take it, stretched across.
  'pillar-left': { elevation: 0, azimuth: 0, frame: [0.524, 0.306, 0.576, 0.461] },
  'pillar-right': { elevation: 0, azimuth: 0, frame: [0.524, 0.306, 0.576, 0.461] },
  stand: { elevation: 0, azimuth: 0, frame: [0.1063, 0.463, 0.8857, 0.894] },
  'stand-hidden': { elevation: 0, azimuth: 0, frame: [0.43, 0.463, 0.575, 0.894] },
  'stand-side': { elevation: 0, azimuth: 90, frame: [0.43, 0.463, 0.575, 0.894] },
  base: { elevation: 35, azimuth: 0, frame: [0.0485, 0.894, 0.9505, 1] },
  [PLAIN]: { elevation: 40, azimuth: 30, frame: [0.181, 0.656, 0.1872, 0.6607] },
};
