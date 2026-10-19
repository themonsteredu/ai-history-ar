/** Pure parts of '수업 준비하기' (keeping the lesson on the tablet): which files to keep and what to tell the class. */
export type PrepPage = 'student' | 'teacher';
export type PrepProblem = 'offline' | 'partial' | 'full' | 'outdated' | 'failed';
export type PrepStatus =
  | { kind: 'idle' } | { kind: 'working'; done: number; total: number } | { kind: 'done'; at: Date }
  | { kind: 'stale' } | { kind: 'unsupported' } | { kind: 'error'; reason: PrepProblem; missing?: number };

export const WORKER_FILE = 'open-lesson-sw.js';
export const prepKey = (page: PrepPage) => `history-ar-open-prep:${page}`;
/** Each lesson page is its own worker scope, so no other page of the site is ever controlled. */
export const lessonScope = (page: PrepPage, base: string) => `${base}${page === 'teacher' ? 'teacher/' : ''}joseon/open-class`;

/** When this tablet was prepared, and for which build (the entry script's hashed address). */
export interface PrepRecord { at: string; build: string }
export function readPrepRecord(raw: string | null): PrepRecord | undefined {
  try {
    const value = JSON.parse(raw || 'null');
    return typeof value?.at === 'string' && typeof value.build === 'string' && !Number.isNaN(Date.parse(value.at)) ? { at: value.at, build: value.build } : undefined;
  } catch { return undefined; }
}

/** The photo files a page needs: the model texture (a smaller file may stand in for the photo), plus the full photo the teacher prints. */
export function lessonPhotoPaths(photos: ReadonlyArray<{ path: string; texture?: string } | undefined>, page: PrepPage) {
  return photos.flatMap(photo => photo ? [photo.texture || photo.path, ...(page === 'teacher' ? [photo.path] : [])] : []);
}

/** Same-origin files under the site base as absolute URLs (no #hash), unique and sorted; never the server API, the worker itself or a page address. */
export function lessonFileUrls(candidates: Iterable<string | null | undefined>, origin: string, base: string): string[] {
  const found = new Set<string>();
  for (const value of candidates) {
    if (!value) continue;
    let url: URL;
    try { url = new URL(value, origin + base); } catch { continue; }
    url.hash = '';
    if (url.origin !== origin || !url.pathname.startsWith(base) || url.pathname.startsWith(`${base}api/`) || url.pathname === `${base}${WORKER_FILE}` || !/\.[a-z0-9]+$/i.test(url.pathname)) continue;
    found.add(url.href);
  }
  return [...found].sort();
}

/** The url(...) references in a piece of CSS (an @font-face rule), resolved against the stylesheet's address. */
export function cssUrls(css: string, sheetHref: string): string[] {
  return [...css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)].flatMap(match => {
    try { return [new URL(match[2], sheetHref).href]; } catch { return []; }
  });
}

/** '오후 2:05', with the date in front when it was not today. */
export function prepTime(at: Date, now = new Date()) {
  const time = at.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
  return at.toDateString() === now.toDateString() ? time : `${at.getMonth() + 1}월 ${at.getDate()}일 ${time}`;
}

export function prepStatusText(status: PrepStatus, now = new Date()) {
  switch (status.kind) {
    case 'working': return status.total ? `준비 중… ${status.done}/${status.total}` : '준비 중…';
    case 'done': return `준비 완료 · ${prepTime(status.at, now)} · 인터넷이 느려도 화면과 3D·AR이 열려요`;
    case 'stale': return '사이트가 새로 바뀌었어요. 수업 준비하기를 한 번 더 눌러 주세요.';
    case 'unsupported': return '이 브라우저에서는 미리 담아 둘 수 없어요. 인터넷으로 그대로 쓰면 돼요.';
    case 'error':
      if (status.reason === 'offline') return '지금은 인터넷이 안 돼요. 인터넷이 될 때 다시 눌러 주세요.';
      if (status.reason === 'partial') return `파일 ${status.missing || 0}개를 받지 못했어요. 인터넷이 잘 될 때 한 번 더 눌러 주세요.`;
      if (status.reason === 'full') return '태블릿 저장 공간이 모자라요. 안 쓰는 사진이나 앱을 지우고 다시 눌러 주세요.';
      if (status.reason === 'outdated') return '사이트가 새로 바뀌었어요. 화면을 새로 고친 뒤 다시 눌러 주세요.';
      return '준비하지 못했어요. 화면을 새로 고친 뒤 다시 눌러 주세요.';
    default: return '수업 전에 한 번 눌러 두면 인터넷이 느려도 화면과 3D·AR이 열려요.';
  }
}
