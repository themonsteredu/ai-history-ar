import * as THREE from 'three';
import type { ReconstructionBuilder, Vec } from './toolkit';

/**
 * 측우기 (Cheugugi) — photo-reference teaching reconstruction of the 공주감영(금영) 측우기
 * (1837, National Treasure) seated in a granite 측우대 of the 대구 경상감영(선화당) / 관상감 type.
 * Units are centimetres; the model stands on y = 0 and +z is the front (the side museum photos show).
 *
 * Modelled from published measurements, not scanned:
 * - Gauge: bronze cylinder 31.5 cm tall, 15.3 cm across its raised bands, 14 cm inside, closed at the
 *   bottom and open at the top. Three sections (상·중·하단) of about 10.5 cm each meet at two raised
 *   joint bands (마디) with a fine seam line; a band also thickens the mouth rim and the foot.
 *   The engraved inscription (錦營測雨器 …) is only suggested by thin dark grooves on the front of the
 *   middle section — no characters are modelled.
 * - Pedestal: dressed granite block, 37 cm square body with a cap projecting about 1.2 cm, 45 cm tall,
 *   with the round socket (16 cm across, 4.3 cm deep, as recorded for the 경상감영 측우대) that the gauge
 *   stands in, so its lowest 4.3 cm is hidden in the stone. Its carved lettering (測雨臺 and the dated
 *   line) is likewise only suggested by thin grooves on the front face.
 * - Ruler (주척): a thin wooden ruler with 寸 graduations leaning against the right (+x) side of the
 *   pedestal, one end on the ground — the rainwater depth was read with it.
 *
 * Photo regions and the framing each expects (PhotoView in catalog.ts):
 * - 'gauge': the bronze vessel (and its inscription grooves). Expects a near-level front photo
 *   (elevation about 0–15°, azimuth 0) with the frame drawn tightly around the visible vessel, from its
 *   mouth rim down to where it enters the stone.
 * - 'pedestal': the granite block, cap, socket and lettering grooves. Same front photo; frame from the
 *   cap's top edge down to the ground line and across the full cap width.
 * - 'ruler': the 주척. Expects a photo of a ruler seen from its graduated face (azimuth about 90°, from
 *   the +x side), framed along its full length; untextured it shows plain wood with ink graduations.
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
  const loft: P[] = [
    { r: socketR, y: socketFloor }, { r: socketR, y: socketFloor + 2 }, { r: socketR, y: top - .3 }, { r: rimR, y: top },
    ...[1, 2, 3, 4, 5, 6, 7].map(i => ({ r: rimR, s: edge, t: i / 8, y: top })),
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
  b.add(capGeometry, 'darkStone', { region: 'pedestal', weather: .05 });
  // Socket floor: a plug filling the cap below the 4.3 cm socket; the gauge stands on it.
  b.cylinder(socketR + .05, socketR + .05, socketFloor - capBottom - .2, [0, (socketFloor + capBottom + .2) / 2, 0], 'darkStone', { region: 'pedestal', segments: 64 });

  // Carved lettering on the front face, suggested only: a large central column and a small dated
  // column near the left edge, each a run of thin grooves (one per character cell).
  const front = bodyW / 2 + .02;
  const groove = (x: number, yTop: number, cells: number, cell: number, width: number) => {
    for (let i = 0; i < cells; i++) b.box([width, cell * .78, .3], [x, yTop - cell * (i + .5), front], 'ink', { region: 'pedestal', bevel: .05 });
  };
  groove(0, bodyH - 5, 3, 6.2, .45);
  groove(-bodyW / 2 + 4.2, bodyH - 6, 7, 2.6, .22);

  // ---------- 측우기 (bronze rain gauge) ----------
  const Rw = 7.38, Rb = 7.65, Ri = 7, H = 31.5, floor = .8;
  const profile: Array<[number, number]> = [[0, 0], [Rb - .2, 0], [Rb, .2], [Rb, 1.2], [Rw, 1.45]];
  const joint = (yc: number) => {
    const h = 1.8;
    profile.push([Rw, yc - h / 2], [Rb, yc - h / 2 + .22], [Rb, yc - .09], [Rb - .13, yc], [Rb, yc + .09], [Rb, yc + h / 2 - .22], [Rw, yc + h / 2]);
  };
  joint(10.5); joint(21);
  profile.push([Rw, H - 1.55], [Rb, H - 1.32], [Rb, H - .18], [Rb - .18, H], [Ri + .15, H], [Ri, H - .15], [Ri, floor], [0, floor]);

  b.feature('three-section-bronze-cylinder');
  b.feature('raised-joint-bands-madi');
  b.feature('open-mouth-for-rain');
  b.lathe(profile, 'bronze', { position: [0, socketFloor, 0], region: 'gauge', segments: 72 });

  // Inscription on the middle section, suggested by five columns (right to left) of thin grooves.
  b.feature('engraved-inscription-suggested');
  const columns = [5, 5, 3, 5, 4], colStep = .95 / Rw, cell = 1.05, yTop = socketFloor + 19.3;
  columns.forEach((count, c) => {
    const theta = (2 - c) * colStep;
    for (let i = 0; i < count; i++) {
      const y = yTop - cell * (i + .5), r = Rw + .02;
      const pos: Vec = [Math.sin(theta) * r, y, Math.cos(theta) * r];
      b.box([.12, cell * .7, .08], pos, 'darkBronze', { rotation: [0, theta, 0], region: 'gauge', bevel: .02 });
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
