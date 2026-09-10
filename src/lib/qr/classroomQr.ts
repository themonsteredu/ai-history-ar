import { qrcodegen } from './vendor/nayuki';

const ENTRY_PAGE = 'https://ai-history-ar.vercel.app/three-kingdoms/ar-maker';
export function classroomEntryUrl(code: string): string | undefined {
  const normalized = code.trim().toLowerCase();
  if (!/^[a-z0-9]{4,12}$/.test(normalized)) return;
  const url = new URL(ENTRY_PAGE); url.searchParams.set('hub_code', normalized);
  return url.href;
}

/** Pure local encoding: no QR service, credentials, student names or session tokens. */
export function createClassroomQr(code: string) {
  const url = classroomEntryUrl(code);
  if (!url) return;
  const bytes = Array.from(new TextEncoder().encode(url));
  // Version 5 / medium ECC holds the longest permitted canonical entry URL.
  const qr = qrcodegen.QrCode.encodeSegments([qrcodegen.QrSegment.makeBytes(bytes)], qrcodegen.QrCode.Ecc.MEDIUM, 5, 5, -1, false);
  const modules = Array.from({ length: qr.size }, (_, y) => Array.from({ length: qr.size }, (_, x) => qr.getModule(x, y)));
  const border = 4, size = qr.size + border * 2;
  const path = modules.flatMap((row, y) => row.flatMap((dark, x) => dark ? [`M${x + border},${y + border}h1v1h-1z`] : [])).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="900" height="900" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
  return { url, code: code.trim().toLowerCase(), size, path, modules, svg };
}
