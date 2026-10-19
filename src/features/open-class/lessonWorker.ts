import { joseonModels, joseonTargets } from '../../lib/ar/joseon/catalog';
import { cssUrls, lessonFileUrls, lessonPhotoPaths, lessonScope, prepKey, readPrepRecord, WORKER_FILE, type PrepPage, type PrepProblem, type PrepStatus } from './lessonPrep';

const base = import.meta.env.BASE_URL;

/** What the lesson loads only when needed; imported once while online so the files' hashed names are known. */
export const lessonChunkLoaders: Array<() => Promise<unknown>> = [
  () => import('../../components/HeritageModelView'),
  () => import('../../lib/ar/modelScene'),
  () => import('../../lib/ar/softwarePreview'),
  () => import('three/examples/jsm/environments/RoomEnvironment.js'),
  () => import('mind-ar/dist/mindar-image-three.prod.js'),
  () => import('../../lib/ar/joseon'),
  () => import('../../lib/ar/joseon/cheugugi'),
  () => import('../../lib/ar/joseon/jagyeongnu'),
  () => import('../../lib/ar/joseon/ganui'),
  () => import('../../lib/ar/joseon/angbuilgu'),
  () => import('../../lib/ar/joseon/honcheonui'),
  () => import('../../lib/ar/joseon/nongsajikseol'),
];

// The lesson polls the server every 6 s; a bigger timing buffer keeps the early chunk loads listed for the whole lesson.
try { performance.setResourceTimingBufferSize?.(5000); } catch { /* the default buffer still lists the first files */ }

/** The button is for path-routed builds only: main.tsx switches to hash routing for any other base, where every page shares one address. */
export const lessonPrepShown = base === '/';

function lessonWorkerAllowed() {
  try { return lessonPrepShown && !import.meta.env.DEV && window.isSecureContext && 'serviceWorker' in navigator && 'caches' in window; }
  catch { return false; }
}

function activeWorker(registration: ServiceWorkerRegistration): Promise<ServiceWorker | undefined> {
  const next = registration.installing || registration.waiting;
  if (!next) return Promise.resolve(registration.active || undefined);
  return new Promise(resolve => {
    const timer = window.setTimeout(() => resolve(registration.active || undefined), 20000);
    next.addEventListener('statechange', () => {
      if (next.state === 'activated' || next.state === 'redundant') { clearTimeout(timer); resolve(next.state === 'activated' ? next : registration.active || undefined); }
    });
  });
}

// Read fresh each time: it changes while the files download.
const offline = () => navigator.onLine === false;

class PrepError extends Error { constructor(readonly reason: PrepProblem) { super(reason); } }

function askWorker(worker: ServiceWorker, page: PrepPage, urls: string[], onProgress: (done: number, total: number) => void) {
  return new Promise<{ failed: number }>((resolve, reject) => {
    const channel = new MessageChannel();
    let timer = 0;
    const finish = () => { clearTimeout(timer); channel.port1.close(); };
    // No word from the worker for a while means the browser stopped it; the button can simply be pressed again.
    const wait = () => { clearTimeout(timer); timer = window.setTimeout(() => { finish(); reject(new PrepError('failed')); }, 90000); };
    channel.port1.onmessage = ({ data }) => {
      wait();
      if (data?.type === 'progress') onProgress(data.done, data.total);
      else if (data?.type === 'done') { finish(); resolve({ failed: Number(data.failed) || 0 }); }
      else if (data?.type === 'error') { finish(); reject(new PrepError(data.reason === 'full' ? 'full' : 'failed')); }
    };
    wait();
    worker.postMessage({ type: 'prepare', page, build: currentBuild(), urls }, [channel.port2]);
  });
}

const currentBuild = () => document.querySelector<HTMLScriptElement>('script[type="module"][src]')?.src || '';
const shellUrl = () => `${window.location.origin}${base}index.html`;
const targetsUrl = () => `${window.location.origin}${base}${joseonTargets.file}`;

function fontFiles() {
  const found: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of Array.from(rules)) if (rule instanceof CSSFontFaceRule) found.push(...cssUrls(rule.cssText, sheet.href || window.location.href));
  }
  return found;
}

/** The app shell, every built file this page has loaded, the fonts, the six photo textures (and print photos for the teacher) and the AR card targets. */
function lessonFiles(page: PrepPage) {
  // Only built files from the timing list: a page visited earlier in this tab may have loaded big files the lesson never uses.
  const built = performance.getEntriesByType('resource').map(entry => entry.name).filter(name => name.startsWith(`${window.location.origin}${base}assets/`));
  const tags = Array.from(document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>('script[src], link[rel~="stylesheet"][href], link[rel="modulepreload"][href], link[rel~="icon"][href]'))
    .map(tag => tag instanceof HTMLScriptElement ? tag.src : tag.href);
  const photos = lessonPhotoPaths(joseonModels.map(info => info.photo), page).map(path => `${base}${path}`);
  return lessonFileUrls([shellUrl(), targetsUrl(), ...built, ...tags, ...fontFiles(), ...photos], window.location.origin, base);
}

async function prepareLesson(page: PrepPage, onProgress: (done: number, total: number) => void): Promise<PrepStatus> {
  if (!lessonWorkerAllowed()) return { kind: 'unsupported' };
  if (offline()) return { kind: 'error', reason: 'offline' };
  try {
    const registration = await navigator.serviceWorker.register(`${base}${WORKER_FILE}`, { scope: lessonScope(page, base), updateViaCache: 'none' });
    const worker = await activeWorker(registration);
    if (!worker) return { kind: 'error', reason: 'failed' };
    // Asks the browser not to clear the saved files when the tablet runs low on space; a refusal changes nothing.
    void navigator.storage?.persist?.().catch(() => false);
    await Promise.all(lessonChunkLoaders.map(load => load()));
    const { failed } = await askWorker(worker, page, lessonFiles(page), onProgress);
    if (failed) return { kind: 'error', reason: offline() ? 'offline' : 'partial', missing: failed };
    const at = new Date();
    try { window.localStorage.setItem(prepKey(page), JSON.stringify({ at: at.toISOString(), build: currentBuild() })); } catch { /* shown for this visit */ }
    return { kind: 'done', at };
  } catch (error) {
    return { kind: 'error', reason: error instanceof PrepError ? error.reason : offline() ? 'offline' : 'failed' };
  }
}

/** On opening the page: prepared for this very build, with the worker and the saved shell and AR targets still there? */
export async function preparedStatus(page: PrepPage): Promise<PrepStatus> {
  if (!lessonWorkerAllowed()) return { kind: 'unsupported' };
  try {
    const record = readPrepRecord(window.localStorage.getItem(prepKey(page)));
    if (!record || !await navigator.serviceWorker.getRegistration(lessonScope(page, base))) return { kind: 'idle' };
    if (record.build !== currentBuild()) return { kind: 'stale' };
    if (!await caches.match(shellUrl()) || !await caches.match(targetsUrl())) return { kind: 'idle' };
    return { kind: 'done', at: new Date(record.at) };
  } catch { return { kind: 'idle' }; }
}

// One run at a time, shared by every button on the page (the student page swaps its button when joining).
const listeners = new Set<(status: PrepStatus) => void>();
let running: PrepStatus | undefined;
function publish(status: PrepStatus) { running = status.kind === 'working' ? status : undefined; listeners.forEach(listener => listener(status)); }
export function watchPrep(listener: (status: PrepStatus) => void) {
  listeners.add(listener); if (running) listener(running);
  return () => { listeners.delete(listener); };
}
export function startPrep(page: PrepPage) {
  if (running) return;
  publish({ kind: 'working', done: 0, total: 0 });
  void prepareLesson(page, (done, total) => publish({ kind: 'working', done, total })).then(publish);
}
