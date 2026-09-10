import { describe, expect, it } from 'vitest';
import { classroomEntryUrl, createClassroomQr } from './classroomQr';

/** Independent exact-symbol reader for version 5/M byte mode. No encoder internals.
 * Reads format bits, unmasks the zigzag data and deinterleaves the two data blocks.
 * Camera damage/error correction is the mobile scanner's job, not this fixture's.
 */
function readEntrySymbol(matrix: boolean[][]) {
  const n = matrix.length;
  expect(n).toBe(37);
  const positions = [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]];
  const encodedFormat = positions.reduce((sum, [x, y], bit) => sum | (Number(matrix[y][x]) << bit), 0);
  const format = (encodedFormat ^ 0x5412) >> 10;
  expect(format >> 3).toBe(0); // Medium error correction.
  const mask = format & 7;
  const masked = (x: number, y: number) => [
    (x + y) % 2, y % 2, x % 3, (x + y) % 3,
    (Math.floor(y / 2) + Math.floor(x / 3)) % 2,
    x * y % 2 + x * y % 3, (x * y % 2 + x * y % 3) % 2,
    ((x + y) % 2 + x * y % 3) % 2,
  ][mask] === 0;
  const fixed = (x: number, y: number) => x === 6 || y === 6 ||
    (x < 9 && y < 9) || (x >= n - 8 && y < 9) || (x < 9 && y >= n - 8) ||
    (Math.abs(x - 30) <= 2 && Math.abs(y - 30) <= 2);
  const bits: number[] = [];
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let v = 0; v < n; v++) {
      const y = ((right + 1) & 2) === 0 ? n - 1 - v : v;
      for (const x of [right, right - 1]) if (!fixed(x, y)) bits.push(Number(matrix[y][x] !== masked(x, y)));
    }
  }
  expect(bits.length).toBe(1079); // 134 codewords and 7 remainder bits.
  const codewords = Array.from({ length: 134 }, (_, i) => bits.slice(i * 8, i * 8 + 8).reduce((b, bit) => b * 2 + bit, 0));
  const data = [0, 1].flatMap(block => Array.from({ length: 43 }, (_, i) => codewords[i * 2 + block]));
  const stream = data.flatMap(b => Array.from({ length: 8 }, (_, bit) => (b >> (7 - bit)) & 1));
  let offset = 0;
  const take = (count: number) => { const value = stream.slice(offset, offset + count).reduce((b, bit) => b * 2 + bit, 0); offset += count; return value; };
  expect(take(4)).toBe(4); // Byte mode.
  const count = take(8);
  return new TextDecoder().decode(new Uint8Array(Array.from({ length: count }, () => take(8))));
}

describe('local classroom entry QR', () => {
  it('uses only the fixed public production route and normalized Hub code', () => {
    expect(classroomEntryUrl('  CLASS26  ')).toBe('https://ai-history-ar.vercel.app/three-kingdoms/ar-maker?hub_code=class26');
    for (const invalid of ['', 'abc', 'a'.repeat(13), 'ab12&token=x', '<script>', '우리반', 'https://other.test']) {
      expect(classroomEntryUrl(invalid)).toBeUndefined(); expect(createClassroomQr(invalid)).toBeUndefined();
    }
  });
  it('round-trips actual QR module data to the exact entry link for minimum and maximum code lengths', () => {
    for (const code of ['abcd', 'class26', 'ab12cd34ef56']) {
      const qr = createClassroomQr(code)!;
      expect(readEntrySymbol(qr.modules)).toBe(qr.url);
      expect(new URL(qr.url).searchParams.size).toBe(1);
      expect(qr.size - qr.modules.length).toBe(8); // Four white modules on every side.
      expect(qr.svg).toContain('fill="#fff"'); expect(qr.svg).toContain('fill="#000"');
      expect(qr.svg).not.toContain('<image'); expect(qr.svg).not.toContain('<script');
      const dark = qr.modules.flat().filter(Boolean).length;
      expect((qr.path.match(/M/g) || []).length).toBe(dark);
    }
  });
});
