import * as THREE from 'three';
import type { PhotoView, ReconstructionBuilder, Vec } from './toolkit';

/**
 * 측우기 (Cheugugi) — photo-reference teaching reconstruction of the 공주감영(금영) 측우기
 * (1837, National Treasure) seated in a granite 측우대 of the 대구 경상감영(선화당) / 관상감 type.
 * Units are centimetres; the model stands on y = 0 and +z is the front (the side museum photos show).
 *
 * Modelled from published measurements, not scanned:
 * - Gauge: bronze cylinder 31.5 cm tall, 15.3 cm across its raised bands, 14 cm inside, closed at the
 *   bottom and open at the top (a flat floor 30.7 cm below the mouth). Three sections (상·중·하단) of
 *   about 10.5 cm each meet at two raised joint bands (마디) with a fine seam line; a band also
 *   thickens the mouth rim. The engraved inscription (錦營測雨器 …) is only suggested by thin grooves on
 *   the front of the middle section — no characters are modelled.
 * - Pedestal: dressed granite block, 37 cm square body with a cap projecting about 1.2 cm, 45 cm tall,
 *   with the round socket (16 cm across, 4.3 cm deep, as recorded for the 경상감영 측우대) that the gauge
 *   stands in, so its lowest 4.3 cm is hidden in the stone. Its carved lettering (測雨臺 and the dated
 *   line beside it) is only suggested by short, unconnected strokes sunk into the front face.
 * - Ruler (주척): a thin wooden ruler with 寸 graduations leaning against the right (+x) side of the
 *   pedestal, one end on the ground — the rainwater depth was read with it.
 *
 * Photo (public/images/heritage/joseon-science/cheugugi.jpg, 1280×719): an outdoor bronze replica set
 * into a flat granite slab, taken from the front and above, dry grass behind. The camera is close, so the
 * view steepens toward the foot (the rim's ellipse is seen from about 37°, the joint bands from about
 * 43–44°) and the gauge narrows in the photo from 236 px across at the rim to 168 px at the foot; the
 * photo is also turned about 1° (the right ends of the band arcs sit lower). Only the gauge and the
 * slab's stone are taken from it; the model keeps the historical 측우대 block. The toolkit maps the
 * bounding box of ALL of a region's vertices, as seen along its view, onto the frame rect, so every
 * region holds only surfaces that lie inside one outline of the photo. Frames below are in photo pixels
 * (x, y from the top left; `px()` divides them by 1280×719):
 * - 'gauge-mouth': the whole mouth rim (outer band, flat top, inner chamfer), all round, since the photo
 *   sees the rim's whole ellipse. Elevation 37°, azimuth 0; frame x 553–786.5 (the rim's outer
 *   extremes, about a pixel inside so no grass is caught), y 145–297.5 (back edge of the rim top to the
 *   lower edge of the rim band at the front).
 * - 'gauge' / 'gauge-lower': the front 120° (±60° about +z) of the vessel wall and joint bands. A
 *   region reaching the sides (±90°) would take the photo's silhouette pixels, where the band arcs turn
 *   vertical, so the bands were smeared into V shapes and stone crept in; ±60° keeps every sample well
 *   inside the gauge. Two heights, because one orthographic frame cannot follow the photo's taper:
 *   'gauge' = upper section and upper band, elevation 43°, frame x 575.5–757.5 (where the upper band's
 *   ±60° points are in the photo), y 280.75–418.25; 'gauge-lower' = middle section, inscription grooves
 *   and lower band, elevation 44°, frame x 586–744.5 (the lower band's ±60° points), y 395.5–507. The
 *   frames were fitted so the photo's joint bands land on the modelled bands (within about 2 px), with
 *   each frame's top a little below the rim band / upper band so the light lips under them in the
 *   photo do not bend into the wall at the sector edges. Azimuth 1.25° rather than 0 compensates the
 *   photo's slight turn.
 * - 'gauge-right' / 'gauge-left', 'gauge-lower-right' / 'gauge-lower-left': the other two 120° sectors
 *   (60°–180° and 180°–300°), which the photo never sees. The vessel is round, so they take the same
 *   frames with the azimuth turned by 120° and 240°: each shows the photo's front, bands at their true
 *   height. The seams at 60°, 180° and 300° can show a faint step where the photo's lit left side meets
 *   its darker right side.
 * - 'gauge-foot': the short visible part of the lower section above the stone (and the foot hidden in
 *   the socket). The photo's lower section narrows into its mortar ring, so it takes a small swatch of
 *   that plain dark bronze (frame x 625–705, y 508–532) instead of a projection that would catch mortar.
 * - 'shadow': the inner wall and flat floor of the well, plus the carved lettering strokes and the
 *   ruler's graduations. A small swatch of the photo's near-black open mouth just below the far rim
 *   (frame x 635–705, y 160–180), matte, so the open mouth reads as a deep, dark well from above and
 *   the cut strokes and ink marks stay dark.
 * - 'pedestal-top': the cap's top, its edge chamfer, the socket wall and the socket floor. Seen straight
 *   down (elevation 90°) so the flat stone is not smeared; frame x 200–532, y 452–675, a patch of the
 *   slab's speckled granite left of the gauge, about a square of real stone (about 27 cm) in the
 *   photo's foreshortening, with no grass, sealant or gauge in it.
 * - 'pedestal-side': the block's four faces and the cap's sides, as one level view from azimuth 45°
 *   (every face is seen at 45°, and the texture runs on round each corner without a seam). Frame
 *   x 125–530, y 548–702: clean granite of the slab's near left corner, about twice as wide as deep in
 *   real stone so each face gets an even (if coarser) grain.
 * - 'ruler' has no photo view (the photo shows no ruler): the ruler stays plain wood.
 */
export function build(b: ReconstructionBuilder) {
  // ---------- 측우대 (granite pedestal) ----------
  const bodyW = 37, bodyH = 39.9, capS = 19.7, capBottom = 39.5, top = 45;
  const socketR = 8, socketDepth = 4.3, socketFloor = top - socketDepth;

  b.feature('granite-pedestal-cheuudae');
  // Subdivided so the toolkit's weathering gives the dressed granite a slightly uneven, mottled face.
  const body = new THREE.BoxGeometry(bodyW, bodyH, bodyW, 24, 26, 24), bp = body.getAttribute('position');
  // Shift interior grid points within their face so the weathering does not form a regular pattern.
  const hash = (k: number) => { const v = Math.sin(k * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v) - .5; };
  for (let k = 0; k < bp.count; k++) {
    const x = bp.getX(k), y = bp.getY(k), z = bp.getZ(k);
    const ex = Math.abs(Math.abs(x) - bodyW / 2) < 1e-3, ey = Math.abs(Math.abs(y) - bodyH / 2) < 1e-3, ez = Math.abs(Math.abs(z) - bodyW / 2) < 1e-3;
    if (+ex + +ey + +ez !== 1) continue; // keep edge and corner points shared between faces
    bp.setXYZ(k, ex ? x : x + hash(k) * .9, ey ? y : y + hash(k + 7) * .9, ez ? z : z + hash(k + 13) * .9);
  }
  b.add(body, 'darkStone', { position: [0, bodyH / 2 + .06, 0], region: 'pedestal-side', weather: .07 });

  // Projecting cap with the round socket: one lofted surface whose cross-section runs from the socket
  // wall (circle) over the top (blending circle -> square), down the chamfered sides to the underside.
  b.feature('round-socket-16cm');
  type P = { r?: number; s?: number; t?: number; y: number };
  const rimR = socketR + .3, edge = capS - .3;
  // The top is split into many blend steps, finer near the socket, so its triangles stay roughly square
  // (long radial slivers made the toolkit's per-vertex mottling show as a sunburst around the socket).
  const steps = 22;
  const loft: P[] = [
    { r: socketR, y: socketFloor }, { r: socketR, y: socketFloor + 2 }, { r: socketR, y: top - .3 }, { r: rimR, y: top },
    ...Array.from({ length: steps - 1 }, (_, i) => ({ r: rimR, s: edge, t: ((i + 1) / steps) ** 1.35, y: top })),
    { s: edge, y: top }, { s: capS, y: top - .3 }, { s: capS, y: top - 1.9 }, { s: capS, y: top - 3.5 },
    { s: capS, y: capBottom + .3 }, { s: edge, y: capBottom }, { s: bodyW / 2 - .3, y: capBottom },
  ];
  const around = 128, sideRow = loft.findIndex(p => p.s === capS && p.y === top - .3);
  // One patch of the loft: columns i0..i1 around (i = 0 is the front, +z) and rows j0..j1 of the profile.
  // Smooth normals are computed on each indexed patch (and no weathering), so the toolkit keeps them: the
  // flat top shades evenly, and the cap's top edge stays crisp.
  const loftPatch = (i0: number, i1: number, j0: number, j1: number) => {
    const positions: number[] = [], index: number[] = [], rows = j1 - j0 + 1;
    for (let i = i0; i <= i1; i++) {
      const phi = i / around * Math.PI * 2, cx = Math.sin(phi), cz = Math.cos(phi), m = Math.max(Math.abs(cx), Math.abs(cz));
      for (let j = j0; j <= j1; j++) {
        const p = loft[j], t = p.t ?? (p.r !== undefined ? 0 : 1), r = p.r ?? 0, s = (p.s ?? 0) / m;
        const d = r * (1 - t) + s * t;
        positions.push(cx * d, p.y, cz * d);
      }
    }
    for (let i = 0; i < i1 - i0; i++) for (let j = 0; j < rows - 1; j++) {
      const a = i * rows + j, c = (i + 1) * rows + j;
      index.push(a, c, a + 1, a + 1, c, c + 1);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(index);
    geometry.computeVertexNormals();
    return geometry;
  };
  // Top (socket wall, top surface and edge chamfer) seen from above; the cap's sides and underside go
  // with the block's faces.
  b.add(loftPatch(0, around, 0, sideRow), 'darkStone', { region: 'pedestal-top' });
  b.add(loftPatch(0, around, sideRow, loft.length - 1), 'darkStone', { region: 'pedestal-side' });
  // Socket floor: a plug filling the cap below the 4.3 cm socket; the gauge stands on it.
  b.cylinder(socketR + .05, socketR + .05, socketFloor - capBottom - .2, [0, (socketFloor + capBottom + .2) / 2, 0], 'darkStone', { region: 'pedestal-top', segments: 64 });

  // Carved lettering on the front face, suggested only: a large central column of three cells (測雨臺)
  // and a small dated column of seven cells near the left edge. Each character cell is a dense cluster of
  // short cuts, one per sub-cell of a small grid and kept inside it, so strokes never cross or touch and
  // no character (real or invented, hanja or hangul) can be read. They are sunk into the stone with only
  // a sliver standing proud of the weathered face, so they read as cut, worn grooves (the photo's dark swatch).
  b.feature('carved-lettering-suggested');
  const face = bodyW / 2, depth = .34, proud = .09;
  const strokes = (x: number, yTop: number, cell: number, glyph: number, grid: number, width: number, cells: number, seed: number) => {
    const sub = glyph / grid;
    for (let i = 0; i < cells; i++) {
      const yc = yTop - cell * (i + .5);
      for (let row = 0; row < grid; row++) for (let col = 0; col < grid; col++) {
        const k = seed + i * 31 + row * 7 + col, pick = hash(k) + .5;
        if (pick < (grid > 2 ? .3 : .25)) continue; // leave some sub-cells empty, differently in each cell
        const kind = hash(k + 101) + .5, tilt = kind < .5 ? 0 : kind < .72 ? Math.PI / 2 : (kind < .86 ? 1 : -1) * .75;
        const len = sub * (.5 + (hash(k + 211) + .5) * .18) - width;
        const cx = x + (col - (grid - 1) / 2) * sub + hash(k + 307) * sub * .08;
        const cy = yc + ((grid - 1) / 2 - row) * sub + hash(k + 401) * sub * .08;
        b.box([len, width, depth], [cx, cy, face + proud - depth / 2], 'ink', { rotation: [0, 0, tilt], region: 'shadow', bevel: width * .3 });
      }
    }
  };
  strokes(0, bodyH - 5, 6.2, 4.6, 3, .36, 3, 11);
  strokes(-bodyW / 2 + 4.2, bodyH - 6, 2.6, 1.9, 2, .2, 7, 53);

  // ---------- 측우기 (bronze rain gauge) ----------
  // Built from separate pieces so each surface keeps its own normals (a single lathe averages them
  // across the corners, which made the flat floor shade like a dome) and so each photo region holds only
  // what one outline of the photo shows.
  const Rw = 7.38, Rb = 7.65, Ri = 7, H = 31.5, floor = .8, g0 = socketFloor, bandH = 1.8;
  const at = (y: number) => g0 + y;
  // A solid of revolution cut into three 120° sectors (front, right-back, left-back), each in its own
  // photo region: the photo's front view is reused for each sector, turned to face it.
  const sectors = (profile: Array<[number, number]>, region: string) => {
    const third = Math.PI * 2 / 3;
    [region, `${region}-right`, `${region}-left`].forEach((name, k) => {
      b.add(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 24, (k - .5) * third, third), 'darkBronze', { position: [0, g0, 0], region: name });
    });
  };

  b.feature('three-section-bronze-cylinder');
  // Foot inside the socket (never seen): closed bottom with a slight foot band, up to the stone line,
  // and the short visible part of the lower section above the stone.
  const joints = [10.5, 21], rimBase = H - 1.55;
  b.lathe([[0, 0], [Rb - .2, 0], [Rb, .2], [Rb, 1.2], [Rw, 1.45], [Rw, socketDepth]], 'darkBronze', { position: [0, g0, 0], region: 'gauge-foot', segments: 72 });
  b.lathe([[Rw, socketDepth], [Rw, joints[0] - bandH / 2]], 'darkBronze', { position: [0, g0, 0], region: 'gauge-foot', segments: 72 });
  // Walls of the middle and upper sections, from the lower joint band up to the mouth band.
  sectors([[Rw, joints[0] + bandH / 2], [Rw, joints[1] - bandH / 2]], 'gauge-lower');
  sectors([[Rw, joints[1] + bandH / 2], [Rw, rimBase]], 'gauge');

  b.feature('raised-joint-bands-madi');
  joints.forEach((yc, k) => {
    sectors([[Rw, yc - bandH / 2], [Rb, yc - bandH / 2 + .22], [Rb, yc - .09], [Rb - .13, yc], [Rb, yc + .09], [Rb, yc + bandH / 2 - .22], [Rw, yc + bandH / 2]],
      k ? 'gauge' : 'gauge-lower');
  });

  b.feature('open-mouth-for-rain');
  // Thickened mouth rim: outside band, flat top, inner chamfer.
  b.lathe([[Rw, rimBase], [Rb, rimBase + .23], [Rb, H - .18], [Rb - .18, H], [Ri + .15, H], [Ri, H - .15]], 'bronze', { position: [0, g0, 0], region: 'gauge-mouth', segments: 72 });
  // Inner wall and flat floor of the well, with a hard corner (tiny bevel) so the floor shades flat;
  // matte and as dark as the photo's open mouth.
  b.lathe([[Ri, H - .15], [Ri, floor + .03], [Ri - .03, floor], [0, floor]], 'ink', { position: [0, g0, 0], region: 'shadow', segments: 72 });

  // Inscription on the middle section, suggested by five columns (right to left) of thin grooves.
  b.feature('engraved-inscription-suggested');
  const columns = [5, 5, 3, 5, 4], colStep = .95 / Rw, cell = 1.05, yTop = at(19.3);
  columns.forEach((count, c) => {
    const theta = (2 - c) * colStep;
    for (let i = 0; i < count; i++) {
      const y = yTop - cell * (i + .5), r = Rw + .01;
      const pos: Vec = [Math.sin(theta) * r, y, Math.cos(theta) * r];
      b.box([.12, cell * .7, .08], pos, 'darkBronze', { rotation: [0, theta, 0], region: 'gauge-lower', bevel: .02 });
    }
  });

  // ---------- 주척 (measuring ruler) leaning on the pedestal ----------
  b.feature('jucheok-measuring-ruler');
  const L = 31, thick = .6, w = 1.8, lean = 20 * Math.PI / 180;
  const cos = Math.cos(lean), sin = Math.sin(lean);
  const centerY = thick / 2 * sin + L / 2 * cos; // lowest corner on the ground
  const centerX = bodyW / 2 + .08 + thick / 2 * cos + L / 2 * sin; // upper inner corner touching the stone
  const ruler = new THREE.Group();
  ruler.position.set(centerX, centerY, 11); ruler.rotation.set(0, 0, lean); b.root.add(ruler);
  b.box([thick, L, w], [0, 0, 0], 'wood', { parent: ruler, region: 'ruler', bevel: .08 });
  const cun = 2.07; // one 주척 寸 in cm
  for (let i = 1; i * cun < L - .5; i++) {
    const long = i % 5 === 0, len = long ? w * .7 : w * .35;
    b.box([.06, .1, len], [thick / 2 + .015, -L / 2 + i * cun, w / 2 - len / 2 - .05], 'ink', { parent: ruler, region: 'shadow', bevel: .01 });
  }
}

/** Photo regions (see the header comment for what each holds and why). Frames are photo pixels / 1280×719. */
const px = (left: number, top: number, right: number, bottom: number): [number, number, number, number] =>
  [left / 1280, top / 719, right / 1280, bottom / 719];
export const photoViews: Record<string, PhotoView> = {
  gauge: { elevation: 43, azimuth: 1.25, frame: px(575.5, 280.75, 757.5, 418.25) },
  'gauge-right': { elevation: 43, azimuth: 121.25, frame: px(575.5, 280.75, 757.5, 418.25) },
  'gauge-left': { elevation: 43, azimuth: 241.25, frame: px(575.5, 280.75, 757.5, 418.25) },
  'gauge-lower': { elevation: 44, azimuth: 1.25, frame: px(586, 395.5, 744.5, 507) },
  'gauge-lower-right': { elevation: 44, azimuth: 121.25, frame: px(586, 395.5, 744.5, 507) },
  'gauge-lower-left': { elevation: 44, azimuth: 241.25, frame: px(586, 395.5, 744.5, 507) },
  'gauge-mouth': { elevation: 37, azimuth: 0, frame: px(553, 145, 786.5, 297.5) },
  'gauge-foot': { elevation: 44, azimuth: 0, frame: px(625, 508, 705, 532) },
  shadow: { elevation: 37, azimuth: 0, frame: px(635, 160, 705, 180) },
  'pedestal-top': { elevation: 90, azimuth: 0, frame: px(200, 452, 532, 675) },
  'pedestal-side': { elevation: 0, azimuth: 45, frame: px(125, 548, 530, 702) },
};
