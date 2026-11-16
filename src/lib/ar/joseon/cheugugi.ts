import * as THREE from 'three';
import type { PhotoView, ReconstructionBuilder } from './toolkit';

/**
 * 측우기 (Cheugugi) — photo-reference teaching reconstruction: a three-section bronze rain gauge standing
 * in the round socket of a stone 측우대 whose front is carved 測雨臺 with the dated line 乾隆庚寅五月造
 * beside it. Units are centimetres; the model stands on y = 0 and +z is the front (the side the card
 * photo shows).
 *
 * Shape, from published measurements (not scanned):
 * - Gauge: bronze cylinder 31.5 cm tall, 15.3 cm across its raised bands, 14 cm inside, closed at the
 *   bottom and open at the top. Three sections of about 10.5 cm meet at two raised joint bands (마디); a
 *   band also thickens the mouth rim. Its lowest 4.3 cm stands in the stone socket.
 * - Pedestal: a plain dressed block 37 cm square and 46 cm tall with a round socket in its top, as in the
 *   card photo (no projecting cap).
 *
 * Surface: everything is painted from the card photo (public/images/heritage/joseon-science/cheugugi-front.jpg),
 * through the pieces scripts/build_cheugugi_atlas.py cuts from it into cheugugi-atlas.jpg. The photo shows
 * only the front, so the faces it cannot see reuse those same pixels and keep the same stone and bronze:
 * - 'stone-front': the block's front face, straightened, with the carved letters as photographed.
 * - 'stone-right' / 'stone-back' / 'stone-left': the same face with the letters filled in by the
 *   surrounding stone (the atlas's `plain` piece). Right and left are mirrored so that each face starts
 *   with the pixels its neighbour ends with, and the stone runs round the corners without a jump.
 * - 'stone-top': the top and underside, a square of the plain stone, turned so its front edge continues
 *   the front face's top edge.
 * - 'gauge-0' … 'gauge-3': the cylinder wall, joint bands and rim band in four quarters. Each takes the
 *   photo's front quarter (±45°, bands straightened); every other quarter is mirrored, so neighbours
 *   meet on the same pixels all the way round.
 * - 'gauge-rim': the flat top of the mouth rim, from the rim's bronze.
 * - 'dark': the inside of the gauge, its hidden foot and the socket, from the dark inside of the mouth.
 * The toolkit maps the bounding box of ALL of a region's vertices, as seen along its view, onto the frame.
 */
export function build(b: ReconstructionBuilder) {
  // ---------- 측우대 (stone pedestal) ----------
  const W = 37, top = 46, half = W / 2;
  const socketR = 8.3, socketDepth = 4.3, socketFloor = top - socketDepth;

  b.feature('stone-pedestal-cheuudae');
  b.feature('carved-front-inscription-from-photo');
  // Four faces, subdivided so the toolkit's weathering gives the dressed stone a slightly uneven surface.
  // Neighbouring faces share their edge positions, so the weathering moves both the same way.
  const face = (region: string, turn: number) => {
    const g = new THREE.PlaneGeometry(W, top, 24, 28);
    g.translate(0, top / 2, half); g.rotateY(turn);
    b.add(g, 'darkStone', { region, weather: .07 });
  };
  face('stone-front', 0); face('stone-right', Math.PI / 2); face('stone-back', Math.PI); face('stone-left', -Math.PI / 2);

  // Top with the round socket: rings blending from the socket's circle out to the square edge.
  b.feature('round-socket');
  const around = 96, steps = 14, positions: number[] = [], index: number[] = [];
  for (let i = 0; i <= around; i++) {
    const phi = i / around * Math.PI * 2, cx = Math.sin(phi), cz = Math.cos(phi), m = Math.max(Math.abs(cx), Math.abs(cz));
    for (let j = 0; j <= steps; j++) {
      const t = (j / steps) ** 1.35, d = socketR * (1 - t) + half / m * t;
      positions.push(cx * d, top, cz * d);
    }
  }
  for (let i = 0; i < around; i++) for (let j = 0; j < steps; j++) {
    const a = i * (steps + 1) + j, c = (i + 1) * (steps + 1) + j;
    index.push(a, c, a + 1, a + 1, c, c + 1);
  }
  const topFace = new THREE.BufferGeometry();
  topFace.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  topFace.setIndex(index);
  b.add(topFace, 'darkStone', { region: 'stone-top', weather: .07 });
  const under = new THREE.PlaneGeometry(W, W, 8, 8);
  under.rotateX(Math.PI / 2);
  b.add(under, 'darkStone', { region: 'stone-top' });
  // Socket wall and floor: in shadow under the gauge.
  b.lathe([[0, socketFloor], [socketR, socketFloor], [socketR, top]], 'ink', { region: 'dark', segments: 64 });

  // ---------- 측우기 (bronze rain gauge) ----------
  const Rw = 7.38, Rb = 7.65, Ri = 7, H = 31.5, floor = .8, g0 = socketFloor, bandH = 1.8;
  const joints = [10.5, 21], rimBase = H - 1.55, rimTop = H - .18;
  // A solid of revolution cut into four quarters, each in its own photo region (see the header).
  const quarters = (profile: Array<[number, number]>) => {
    for (let k = 0; k < 4; k++) {
      b.add(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 18, (k - .5) * Math.PI / 2, Math.PI / 2), 'darkBronze', { position: [0, g0, 0], region: `gauge-${k}` });
    }
  };

  b.feature('three-section-bronze-cylinder');
  // Separate pieces, so each surface keeps its own normals. Together they span exactly socket line → rim.
  quarters([[Rw, socketDepth], [Rw, joints[0] - bandH / 2]]);
  quarters([[Rw, joints[0] + bandH / 2], [Rw, joints[1] - bandH / 2]]);
  quarters([[Rw, joints[1] + bandH / 2], [Rw, rimBase]]);

  b.feature('raised-joint-bands-madi');
  joints.forEach(yc => quarters([[Rw, yc - bandH / 2], [Rb, yc - bandH / 2 + .22], [Rb, yc - .09], [Rb - .13, yc], [Rb, yc + .09], [Rb, yc + bandH / 2 - .22], [Rw, yc + bandH / 2]]));

  b.feature('open-mouth-for-rain');
  quarters([[Rw, rimBase], [Rb, rimBase + .23], [Rb, rimTop]]);
  // Flat top of the thickened rim, with its inner chamfer.
  b.lathe([[Rb, rimTop], [Rb - .18, H], [Ri + .15, H], [Ri, H - .15]], 'bronze', { position: [0, g0, 0], region: 'gauge-rim', segments: 72 });
  // Inner wall and flat floor of the well, and the foot hidden in the socket.
  b.lathe([[Ri, H - .15], [Ri, floor + .03], [Ri - .03, floor], [0, floor]], 'ink', { position: [0, g0, 0], region: 'dark', segments: 72 });
  b.lathe([[0, 0], [Rb - .2, 0], [Rb, .2], [Rb, 1.2], [Rw, 1.45], [Rw, socketDepth]], 'ink', { position: [0, g0, 0], region: 'dark', segments: 72 });
}

/**
 * Where each piece sits in cheugugi-atlas.jpg (1208×1400 px; printed by scripts/build_cheugugi_atlas.py),
 * taken a pixel and a half inside its edge. Swapping left and right mirrors a piece; swapping top and
 * bottom turns it upside down.
 */
const AW = 1208, AH = 1400, IN = 1.5;
const piece = (left: number, top: number, right: number, bottom: number, mirror = false, flip = false): [number, number, number, number] => {
  const l = (left + IN) / AW, r = (right - IN) / AW, t = (top + IN) / AH, d = (bottom - IN) / AH;
  return [mirror ? r : l, flip ? d : t, mirror ? l : r, flip ? t : d];
};
const FRONT = [8, 8, 600, 744] as const, PLAIN = [608, 8, 1200, 744] as const, GAUGE = [8, 752, 264, 1392] as const;
export const photoViews: Record<string, PhotoView> = {
  'stone-front': { elevation: 0, azimuth: 0, frame: piece(...FRONT) },
  'stone-right': { elevation: 0, azimuth: 90, frame: piece(...PLAIN, true) },
  'stone-back': { elevation: 0, azimuth: 180, frame: piece(...PLAIN) },
  'stone-left': { elevation: 0, azimuth: 270, frame: piece(...PLAIN, true) },
  'stone-top': { elevation: 90, azimuth: 0, frame: piece(608, 8, 1200, 600, false, true) },
  'gauge-0': { elevation: 0, azimuth: 0, frame: piece(...GAUGE) },
  'gauge-1': { elevation: 0, azimuth: 90, frame: piece(...GAUGE, true) },
  'gauge-2': { elevation: 0, azimuth: 180, frame: piece(...GAUGE) },
  'gauge-3': { elevation: 0, azimuth: 270, frame: piece(...GAUGE, true) },
  'gauge-rim': { elevation: 90, azimuth: 0, frame: piece(272, 752, 368, 784) },
  dark: { elevation: 30, azimuth: 0, frame: piece(272, 792, 368, 824) },
};
