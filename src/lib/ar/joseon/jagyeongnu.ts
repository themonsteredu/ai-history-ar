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
 * Photo regions (photoViews below; frames are [left, top, right, bottom] in the photo):
 *  - 'cylinders': front and back quarters of both cylinders, seen from the front. The frame runs
 *    from 0.71 x the left cylinder's half-width left of its axis to the same right of the right
 *    cylinder's axis, so each quarter lands on the middle of its own cylinder in the photo. The back
 *    quarter takes the same pixels through the cylinder (a mirrored copy of the relief).
 *  - 'cylinders-side': the left and right quarters, seen from the side, onto the middle of the right
 *    cylinder in the photo: no stretched silhouette pixels, the relief goes on round the cylinder.
 *  - 'vessel-big', 'vessels-small': each vessel layer framed on its own outline (the small pair share
 *    one frame, the model's spacing chosen so both fall inside their jars in the photo).
 *  - 'pillar-left', 'pillar-right': the side pillars' faces, framed on the strips of them the photo
 *    shows between the cylinders (the rest is hidden behind the cylinders, so it is stretched across).
 *  - 'pillar-centre': the central pillar's faces, framed on the shadowed part seen between the side pillars.
 *  - 'stand': the block, cap and plinth faces (front, and through to the back) where the photo sees
 *    stone; 'stand-hidden': the strips the cylinders hide in the photo, which borrow the stone wall seen
 *    between the cylinders (same courses, so the joints line up) instead of a ghost of the cylinders.
 *  - 'stand-side': the stand's end faces, seen from the side, onto that same stretch of wall.
 *  - 'base': the front slab's top and front, seen from above at the photo's low angle.
 *  - 'stone-plain': tops, ends and backs the photo never shows: a small swatch of the wall's granite.
 */

const BASE = 0.16;                  // top of the front slab the cylinders stand on
const PLINTH_TOP = BASE + 0.15;     // plinth course under the block
const CAP_BOTTOM = BASE + 1.24;     // block body top / cap bottom
const STAND_TOP = BASE + 1.42;      // cap top
const SIDE_TOP = BASE + 2.03;       // side pillars' top = small vessels' foot
const MID_TOP = BASE + 2.31;        // central pillar's top = big vessel's foot

const CYL_X = 0.4, CYL_Z = 0.66;    // inflow cylinder axes
const SMALL_X = 0.39, SMALL_Z = -0.15; // small vessels / side pillars
const BIG_Z = -0.85;                // big vessel / central pillar

/** Inflow cylinder profile [radius, height]: foot band, the fuller relief zone, a raised band, the plain
 *  neck and the rim lip, down to a shallow recessed lid. */
const CYLINDER: Array<[number, number]> = [
  [0, 0], [0.188, 0], [0.192, 0.01], [0.192, 0.05], [0.186, 0.06],
  [0.19, 0.07], [0.192, 0.3], [0.192, 1.6], [0.19, 1.74],
  [0.183, 1.77], [0.189, 1.775], [0.189, 1.8], [0.182, 1.805],
  [0.18, 1.81], [0.18, 1.915],
  [0.187, 1.92], [0.19, 1.94], [0.188, 1.958], [0.182, 1.962], [0.135, 1.962], [0.13, 1.95],
];
/** The lid inside the lip: a full disc, kept inside the side quarters' outline (0.71 x 0.192). */
const LID_R = 0.13, LID_Y = 1.95;

/** Large supply vessel, [r / R, y / H]: wide basin, widest at the rolled lip, tapering to the foot. */
const BIG_JAR: Array<[number, number]> = [
  [0, 0], [0.6, 0], [0.63, 0.03], [0.7, 0.15], [0.78, 0.3], [0.86, 0.45], [0.92, 0.57], [0.955, 0.66],
  [0.98, 0.74], [0.995, 0.8], [1, 0.85], [0.995, 0.9], [0.975, 0.95], [0.945, 0.985], [0.93, 1],
  [0.88, 1], [0.87, 0.96], [0.9, 0.85], [0.86, 0.6], [0.72, 0.33], [0.56, 0.15], [0, 0.13],
];
const BIG_R = 0.4675, BIG_H = 0.7;
/** Small supply vessel, [r / R, y / H]: round shoulder, short collar and lip. */
const SMALL_JAR: Array<[number, number]> = [
  [0, 0], [0.74, 0], [0.78, 0.03], [0.88, 0.135], [0.946, 0.24], [0.985, 0.34], [1, 0.47], [0.99, 0.56],
  [0.97, 0.65], [0.92, 0.76], [0.85, 0.84], [0.79, 0.88], [0.78, 0.91], [0.8, 0.95], [0.81, 1],
  [0.74, 1], [0.72, 0.9], [0.84, 0.7], [0.8, 0.4], [0.62, 0.15], [0, 0.12],
];
const SMALL_R = 0.23, SMALL_H = 0.405;

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

/** A bronze vessel of revolution standing on (x, y, z). */
function vessel(b: ReconstructionBuilder, profile: Array<[number, number]>, R: number, H: number, at: Vec, region: string, segments: number) {
  b.lathe(profile.map(([r, h]) => [Math.max(r * R, 1e-4), h * H] as [number, number]), 'bronze', { position: at, region, segments });
}

/** A tall inflow cylinder in four quarters: front and back take the front view, the sides a side view. */
function cylinder(b: ReconstructionBuilder, x: number) {
  const points = CYLINDER.map(([r, h]) => new THREE.Vector2(Math.max(r, 1e-4), h));
  const quarter = Math.PI / 2;
  [-0.25, 0.25, 0.75, 1.25].forEach((start, i) => {
    const g = new THREE.LatheGeometry(points, 24, start * Math.PI, quarter);
    b.add(g, 'bronze', { position: [x, BASE, CYL_Z], region: i % 2 ? 'cylinders-side' : 'cylinders' });
  });
  // The lid takes one view as a whole (no seams across it); the photo never sees it, it gets the lip's tone.
  b.lathe([[LID_R, LID_Y], [1e-4, LID_Y]], 'bronze', { position: [x, BASE, CYL_Z], region: 'cylinders-side', segments: 48 });
}

/** Where the cylinders hide the stand in the photo (model x, through the 'stand' frame), with a margin. */
const HIDDEN_STRIPS: Array<[number, string]> = [[-0.625, 'stand-hidden'], [-0.185, 'stand'], [0.235, 'stand-hidden'], [0.66, 'stand']];

export function build(b: ReconstructionBuilder): void {
  b.feature('dae-pasuho-large-supply-vessel');
  b.feature('so-pasuho-small-supply-vessels');
  b.feature('susuho-inflow-cylinders-dragon-relief');
  b.feature('granite-stand-three-pillars');
  b.feature('stepped-stone-base');

  // ---------- Stepped base ----------
  // Front slab (apron) the cylinders stand on: its top and front are in the photo.
  stoneBox(b, 'darkStone', [-1.1, 1.1], [0, BASE], [0.4, 1.07], { front: 'base', top: 'base', back: null });
  // The same slab running on under and behind the stand (never seen in the photo).
  stoneBox(b, 'darkStone', [-1.1, 1.1], [0, BASE], [-1.45, 0.4], { front: null });

  // ---------- Granite block stand: plinth course, body of dressed courses, overhanging cap ----------
  const stand = { front: 'stand', right: 'stand-side', left: 'stand-side', bottom: null } as const;
  stoneBox(b, 'darkStone', [-0.96, 0.96], [BASE, PLINTH_TOP], [-1.26, 0.4], stand, HIDDEN_STRIPS);
  stoneBox(b, 'darkStone', [-0.845, 0.845], [PLINTH_TOP, CAP_BOTTOM], [-1.2, 0.34], { ...stand, top: null }, HIDDEN_STRIPS);
  stoneBox(b, 'darkStone', [-0.93, 0.93], [CAP_BOTTOM, STAND_TOP], [-1.26, 0.4], { ...stand, bottom: PLAIN }, HIDDEN_STRIPS);

  // ---------- Pillars on the block ----------
  for (const [side, region] of [[-1, 'pillar-left'], [1, 'pillar-right']] as const) {
    const xs = [SMALL_X - 0.26, SMALL_X + 0.26].map(x => x * side).sort((p, q) => p - q) as [number, number];
    stoneBox(b, 'darkStone', xs, [STAND_TOP, SIDE_TOP], [SMALL_Z - 0.25, SMALL_Z + 0.25], { front: region, back: region, bottom: null });
  }
  stoneBox(b, 'darkStone', [-0.28, 0.28], [STAND_TOP, MID_TOP], [BIG_Z - 0.3, BIG_Z + 0.3], { front: 'pillar-centre', back: 'pillar-centre', bottom: null });

  // ---------- Bronze vessels ----------
  vessel(b, BIG_JAR, BIG_R, BIG_H, [0, MID_TOP, BIG_Z], 'vessel-big', 72);
  for (const side of [-1, 1]) vessel(b, SMALL_JAR, SMALL_R, SMALL_H, [side * SMALL_X, SIDE_TOP, SMALL_Z], 'vessels-small', 56);

  // ---------- Inflow cylinders ----------
  for (const side of [-1, 1]) cylinder(b, side * CYL_X);
}

/* Photo measurements (fractions of the photo): cylinder axes and half-widths at the relief zone. */
const PHOTO_CYL_L = { c: 0.332, h: 0.0809 }, PHOTO_CYL_R = { c: 0.6775, h: 0.0781 };
const Q = Math.SQRT1_2; // a quarter cylinder spans +-0.71 of the radius across the view
const CYL_TOP = 0.295, CYL_BOTTOM = 0.936; // just inside both rims (the right one sits a little lower)

/** How the photo (photos.json, id 2) lies on each region: the view it was taken from and where the region sits in it. */
export const photoViews: Record<string, PhotoView> = {
  cylinders: { elevation: 0, azimuth: 0, frame: [PHOTO_CYL_L.c - Q * PHOTO_CYL_L.h, CYL_TOP, PHOTO_CYL_R.c + Q * PHOTO_CYL_R.h, CYL_BOTTOM] },
  'cylinders-side': { elevation: 0, azimuth: 90, frame: [PHOTO_CYL_L.c - Q * PHOTO_CYL_L.h, CYL_TOP, PHOTO_CYL_L.c + Q * PHOTO_CYL_L.h, CYL_BOTTOM] },
  // The vessels are above the camera: seen from about 12 and 8 degrees below (their rims curve down at
  // the ends in the photo). Frame bottoms run past the visible foot to where the back of the foot falls.
  'vessel-big': { elevation: -12, azimuth: 0, frame: [0.333, 0.1403, 0.588, 0.3132] },
  'vessels-small': { elevation: -8, azimuth: 0, frame: [0.2873, 0.207, 0.6863, 0.319] },
  'pillar-left': { elevation: 0, azimuth: 0, frame: [0.41, 0.313, 0.453, 0.461] },
  'pillar-right': { elevation: 0, azimuth: 0, frame: [0.523, 0.306, 0.583, 0.461] },
  'pillar-centre': { elevation: 0, azimuth: 0, frame: [0.455, 0.29, 0.52, 0.461] },
  stand: { elevation: 0, azimuth: 0, frame: [0.1063, 0.463, 0.8857, 0.894] },
  'stand-hidden': { elevation: 0, azimuth: 0, frame: [0.42, 0.463, 0.59, 0.894] },
  'stand-side': { elevation: 0, azimuth: 90, frame: [0.42, 0.463, 0.59, 0.894] },
  base: { elevation: 35, azimuth: 0, frame: [0.0298, 0.894, 0.9802, 1] },
  [PLAIN]: { elevation: 40, azimuth: 30, frame: [0.47, 0.585, 0.5, 0.605] },
};
