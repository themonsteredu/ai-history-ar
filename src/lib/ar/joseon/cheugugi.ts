import * as THREE from 'three';
import type { ReconstructionBuilder, Vec } from './toolkit';

/**
 * 측우기 (Cheugugi) — photo-reference teaching reconstruction of the 공주감영(금영) 측우기
 * (1837, National Treasure) seated in a granite 측우대 of the 대구 경상감영(선화당) / 관상감 type.
 * Units are centimetres; the model stands on y = 0 and +z is the front (the side museum photos show).
 *
 * Modelled from published measurements, not scanned:
 * - Gauge: bronze cylinder 31.5 cm tall, 15.3 cm across its raised bands, 14 cm inside, closed at the
 *   bottom and open at the top (a flat floor 30.7 cm below the mouth). Three sections (상·중·하단) of
 *   about 10.5 cm each meet at two raised joint bands (마디) with a fine seam line; a band also
 *   thickens the mouth rim. Untextured, the body is dark patinated bronze and the raised bands a little
 *   lighter, as the worn high points are on the real vessel. The engraved inscription (錦營測雨器 …) is
 *   only suggested by thin grooves on the front of the middle section — no characters are modelled.
 * - Pedestal: dressed granite block, 37 cm square body with a cap projecting about 1.2 cm, 45 cm tall,
 *   with the round socket (16 cm across, 4.3 cm deep, as recorded for the 경상감영 측우대) that the gauge
 *   stands in, so its lowest 4.3 cm is hidden in the stone. Its carved lettering (測雨臺 and the dated
 *   line beside it) is only suggested by short, unconnected strokes sunk into the front face.
 * - Ruler (주척): a thin wooden ruler with 寸 graduations leaning against the right (+x) side of the
 *   pedestal, one end on the ground — the rainwater depth was read with it.
 *
 * Photo regions and the framing each expects (PhotoView in catalog.ts). The toolkit maps the bounding
 * box of ALL of a region's vertices, as seen along the view, onto the frame rect, so every region below
 * holds only surfaces that lie inside its visible outline and the frame is simply drawn tightly around
 * that outline in the photo:
 * - 'gauge': the outside of the vessel above the stone, its joint bands, mouth rim and inscription
 *   grooves. Expects a near-level front photo (elevation about 0–15°, azimuth 0). Frame left/right at
 *   the outer edges of the bands, top at the highest point of the mouth rim (for an elevated photo the
 *   back edge of the rim), bottom where the front of the vessel meets the stone. The foot hidden in the
 *   socket and the inside of the vessel are deliberately NOT in this region, so they do not stretch it.
 * - 'gauge-inside': the inner wall and flat floor of the vessel plus the foot hidden in the socket —
 *   surfaces a museum photo never shows. Optional: give it a tiny frame (about 0.02 × 0.02) on a dark
 *   patch inside the mouth or in shadow on the vessel, so the well takes that colour (like
 *   'bowl-shade' of 앙부일구). Without a view it stays plain dark bronze, which already reads as a
 *   shadowed well.
 * - 'pedestal': the granite block, cap, socket and lettering strokes. Same front photo; frame left/right
 *   at the cap's outer edges (the widest part), top at the back edge of the cap's top surface (its front
 *   edge for a level photo), bottom at the front ground line of the block.
 * - 'ruler': the 주척. Expects a photo of a ruler seen from its graduated face (azimuth about 90°, from
 *   the +x side), framed tightly along its full length; untextured it shows plain wood with ink marks.
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
  b.add(body, 'darkStone', { position: [0, bodyH / 2 + .06, 0], region: 'pedestal', weather: .07 });

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
  const around = 128, positions: number[] = [], index: number[] = [];
  for (let i = 0; i <= around; i++) {
    const phi = i / around * Math.PI * 2, cx = Math.sin(phi), cz = Math.cos(phi), m = Math.max(Math.abs(cx), Math.abs(cz));
    for (const p of loft) {
      const t = p.t ?? (p.r !== undefined ? 0 : 1), r = p.r ?? 0, s = (p.s ?? 0) / m;
      const d = r * (1 - t) + s * t;
      positions.push(cx * d, p.y, cz * d);
    }
  }
  const n = loft.length;
  for (let i = 0; i < around; i++) for (let j = 0; j < n - 1; j++) {
    const a = i * n + j, c = (i + 1) * n + j;
    index.push(a, c, a + 1, a + 1, c, c + 1);
  }
  const capGeometry = new THREE.BufferGeometry();
  capGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  capGeometry.setIndex(index);
  // Smooth normals computed on the indexed loft (and no weathering), so the toolkit keeps them: the flat
  // top shades evenly instead of showing the circle-to-square slivers as a radial streak pattern.
  capGeometry.computeVertexNormals();
  b.add(capGeometry, 'darkStone', { region: 'pedestal' });
  // Socket floor: a plug filling the cap below the 4.3 cm socket; the gauge stands on it.
  b.cylinder(socketR + .05, socketR + .05, socketFloor - capBottom - .2, [0, (socketFloor + capBottom + .2) / 2, 0], 'darkStone', { region: 'pedestal', segments: 64 });

  // Carved lettering on the front face, suggested only: a large central column of three cells (測雨臺)
  // and a small dated column of seven cells near the left edge. Each character cell is a dense cluster of
  // short cuts, one per sub-cell of a small grid and kept inside it, so strokes never cross or touch and
  // no character (real or invented, hanja or hangul) can be read. They are sunk into the stone with only
  // a sliver standing proud of the weathered face, so they read as cut, worn grooves.
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
        b.box([len, width, depth], [cx, cy, face + proud - depth / 2], 'ink', { rotation: [0, 0, tilt], region: 'pedestal', bevel: width * .3 });
      }
    }
  };
  strokes(0, bodyH - 5, 6.2, 4.6, 3, .36, 3, 11);
  strokes(-bodyW / 2 + 4.2, bodyH - 6, 2.6, 1.9, 2, .2, 7, 53);

  // ---------- 측우기 (bronze rain gauge) ----------
  // Built from separate pieces so each surface keeps its own normals (a single lathe averages them
  // across the corners, which made the flat floor shade like a dome) and so the photo region holds only
  // what a photo shows.
  const Rw = 7.38, Rb = 7.65, Ri = 7, H = 31.5, floor = .8, g0 = socketFloor, bandH = 1.8;
  const at = (y: number) => g0 + y;

  b.feature('three-section-bronze-cylinder');
  // Foot inside the socket (never seen): closed bottom with a slight foot band, up to the stone line.
  b.lathe([[0, 0], [Rb - .2, 0], [Rb, .2], [Rb, 1.2], [Rw, 1.45], [Rw, socketDepth]], 'darkBronze', { position: [0, g0, 0], region: 'gauge-inside', segments: 72 });
  // Visible wall of the three sections, from the stone line up to the mouth band.
  const joints = [10.5, 21], rimBase = H - 1.55;
  const spans: Array<[number, number]> = [[socketDepth, joints[0] - bandH / 2], [joints[0] + bandH / 2, joints[1] - bandH / 2], [joints[1] + bandH / 2, rimBase]];
  for (const [y0, y1] of spans) b.cylinder(Rw, Rw, y1 - y0, [0, at((y0 + y1) / 2), 0], 'darkBronze', { region: 'gauge', segments: 72, open: true });

  b.feature('raised-joint-bands-madi');
  for (const yc of joints) {
    b.lathe([[Rw, yc - bandH / 2], [Rb, yc - bandH / 2 + .22], [Rb, yc - .09], [Rb - .13, yc], [Rb, yc + .09], [Rb, yc + bandH / 2 - .22], [Rw, yc + bandH / 2]],
      'bronze', { position: [0, g0, 0], region: 'gauge', segments: 72 });
  }

  b.feature('open-mouth-for-rain');
  // Thickened mouth rim: outside band, flat top, inner chamfer.
  b.lathe([[Rw, rimBase], [Rb, rimBase + .23], [Rb, H - .18], [Rb - .18, H], [Ri + .15, H], [Ri, H - .15]], 'bronze', { position: [0, g0, 0], region: 'gauge', segments: 72 });
  // Inner wall and flat floor of the well, with a hard corner (tiny bevel) so the floor shades flat.
  b.lathe([[Ri, H - .15], [Ri, floor + .03], [Ri - .03, floor], [0, floor]], 'darkBronze', { position: [0, g0, 0], region: 'gauge-inside', segments: 72 });

  // Inscription on the middle section, suggested by five columns (right to left) of thin grooves.
  b.feature('engraved-inscription-suggested');
  const columns = [5, 5, 3, 5, 4], colStep = .95 / Rw, cell = 1.05, yTop = at(19.3);
  columns.forEach((count, c) => {
    const theta = (2 - c) * colStep;
    for (let i = 0; i < count; i++) {
      const y = yTop - cell * (i + .5), r = Rw + .01;
      const pos: Vec = [Math.sin(theta) * r, y, Math.cos(theta) * r];
      b.box([.12, cell * .7, .08], pos, 'bronze', { rotation: [0, theta, 0], region: 'gauge', bevel: .02 });
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
    b.box([.06, .1, len], [thick / 2 + .015, -L / 2 + i * cun, w / 2 - len / 2 - .05], 'ink', { parent: ruler, region: 'ruler', bevel: .01 });
  }
}
