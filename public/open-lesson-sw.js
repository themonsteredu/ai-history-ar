/*
 * Offline help for the Joseon open lesson only. '수업 준비하기' registers this file with the lesson page's
 * own path as its scope (/joseon/open-class or /teacher/joseon/open-class), so no other page is controlled.
 *
 * - Page loads: network first; after 3.5 s or with no network, the saved app shell (index.html). Only
 *   '수업 준비하기' saves a shell, after all of its build's files, so the saved shell never points at files that
 *   are not on the tablet. A page load refreshes the saved shell of the same build. Once the site serves a newer
 *   build, the saved shell is forgotten, so an older lesson never opens again: the tablet loads the lesson from
 *   the network until it is prepared again.
 * - A lesson page sends {type: 'check', build} with a MessagePort as it opens. The answer is 'outdated' when the
 *   site serves a newer build than the page (which then came from the tablet on slow Wi-Fi): the saved shell is
 *   already forgotten and the page reloads once. Otherwise 'current', or 'unknown' when the site cannot be asked.
 * - /assets/ (hashed names, never change): saved copy first, saved on first use.
 * - Photos, .mind, fonts, json, icons: the saved copy when there is one, checked for a newer one in the
 *   background; files that were never saved go to the network as usual.
 * - /api/, other sites and anything but GET: never touched.
 *
 * The button sends {type: 'prepare', page, build, urls} with a MessagePort; progress and the result come
 * back on the port. To retire this worker, publish a version whose activate handler deletes the
 * open-lesson-* caches and calls self.registration.unregister().
 */
const VERSION = 'v1';
const ASSETS = `open-lesson-assets-${VERSION}`;
const FILES = `open-lesson-files-${VERSION}`;
const BASE = new URL('./', self.location.href).pathname;
const SHELL = new URL('index.html', self.location.href).href;
// Which files each lesson page asked for last; anything in neither list is an old build's leftover.
const LISTS = new URL('__open-lesson__/lists.json', self.location.href).href;
const NAV_TIMEOUT = 3500;
// How long asking the site for its current build may take before the answer is 'cannot tell'.
const SITE_TIMEOUT = 20000;
const STATIC = /\.(?:jpe?g|png|webp|gif|svg|ico|mind|otf|ttf|woff2?|json)$/i;

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('open-lesson-') && name !== ASSETS && name !== FILES).map(name => caches.delete(name)));
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(() => undefined);
    await self.clients.claim();
  })());
  // A tablet prepared before this version may hold an older lesson: forget it now rather than at its next slow
  // page load. Not waited for, so that activation never waits on slow Wi-Fi.
  siteBuild().then(forgetOlderShell).catch(() => undefined);
});

const isAsset = url => new URL(url).pathname.startsWith(`${BASE}assets/`);
// The host answers any missing file (an old build's, after a deploy) with index.html.
const isPage = response => (response.headers.get('content-type') || '').includes('text/html');
/** The build an index.html starts (its entry script's address), or '' for a page that is not a build of this site, such as a Wi-Fi sign-in page. */
const entryOf = html => {
  const src = /<script\b[^>]*\bsrc="([^"]+)"/i.exec(html);
  try {
    const url = src && new URL(src[1], SHELL);
    return url && url.origin === self.location.origin && url.pathname.startsWith(`${BASE}assets/index-`) && url.pathname.endsWith('.js') ? url.href : '';
  } catch { return ''; }
};

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE) || url.pathname.startsWith(`${BASE}api/`) || url.href === LISTS) return;
  if (request.mode === 'navigate') event.respondWith(navigate(event));
  else if (isAsset(url.href)) event.respondWith(fromAssets(event));
  else if (STATIC.test(url.pathname)) event.respondWith(fromFiles(event));
});

/** Every lesson address serves the same index.html, so one saved copy opens any of them. */
async function saveShell(html) {
  // A fresh Response drops `redirected` (refused for a page load) and the network's encoding headers.
  await (await caches.open(FILES)).put(SHELL, new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
}

// Counts the '수업 준비하기' runs in progress: the shell a run saves at its end must not be forgotten meanwhile.
let preparing = 0;

/** Forgets the saved shell unless it is of the build the site serves (`siteEntry`, '' when unknown). */
async function forgetOlderShell(siteEntry) {
  if (!siteEntry || preparing) return;
  const saved = await caches.match(SHELL, { cacheName: FILES });
  if (saved && entryOf(await saved.text()) !== siteEntry && !preparing) await (await caches.open(FILES)).delete(SHELL);
}

/** A page the network brought: refresh the saved shell of the same build, or forget it when the site has moved on. */
async function refreshShell(response) {
  const html = await response.text(), entry = entryOf(html), saved = await caches.match(SHELL, { cacheName: FILES });
  if (!entry || !saved) return;
  if (entryOf(await saved.text()) === entry) await saveShell(html);
  else await forgetOlderShell(entry);
}

/** The build the site serves now, or '' when that cannot be told (no network, too slow, or not a page of this site). */
async function siteBuild() {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), SITE_TIMEOUT);
  try {
    const response = await fetch(SHELL, { cache: 'no-cache', signal: controller.signal });
    return response.ok && isPage(response) ? entryOf(await response.text()) : '';
  } catch { return ''; } finally { clearTimeout(timer); }
}

/** Answers a lesson page that is opening with `build`; see 'check' at the top. */
async function check(build) {
  const entry = await siteBuild();
  if (!entry) return 'unknown';
  if (entry === build) return 'current';
  await forgetOlderShell(entry);
  return 'outdated';
}

function navigate(event) {
  const network = Promise.resolve(event.preloadResponse).catch(() => undefined)
    .then(preloaded => preloaded || fetch(event.request))
    .then(response => {
      if (response.ok && isPage(response)) event.waitUntil(refreshShell(response.clone()).catch(() => undefined));
      return response;
    });
  event.waitUntil(network.catch(() => undefined));
  return caches.match(SHELL, { cacheName: FILES }).then(shell => {
    if (!shell) return network;
    const answer = network.then(response => response.status >= 500 ? shell : response, () => shell);
    return Promise.race([answer, new Promise(resolve => setTimeout(resolve, NAV_TIMEOUT, shell))]);
  });
}

async function fromAssets(event) {
  const cache = await caches.open(ASSETS);
  const saved = await cache.match(event.request, { ignoreVary: true });
  if (saved) return saved;
  const response = await fetch(event.request);
  if (response.ok && !isPage(response)) event.waitUntil(cache.put(event.request, response.clone()).catch(() => undefined));
  return response;
}

async function fromFiles(event) {
  const cache = await caches.open(FILES);
  const saved = await cache.match(event.request, { ignoreVary: true });
  if (!saved) return fetch(event.request);
  event.waitUntil(refresh(cache, event.request.url, saved).catch(() => undefined));
  return saved;
}

/** Same file as the saved one? Asked with the server's validators, so an unchanged file costs a 304. */
function sameFile(saved, response) {
  const tag = saved.headers.get('etag'), modified = saved.headers.get('last-modified');
  return tag ? tag === response.headers.get('etag') : !!modified && modified === response.headers.get('last-modified');
}

async function refresh(cache, url, saved) {
  const response = await fetch(url, { cache: 'no-cache' });
  if (response.ok && !isPage(response) && !sameFile(saved, response)) await cache.put(url, response);
}

self.addEventListener('message', event => {
  const data = event.data, port = event.ports && event.ports[0];
  if (!port || !data) return;
  if (data.type === 'check' && typeof data.build === 'string') {
    event.waitUntil(check(data.build).catch(() => 'unknown').then(type => port.postMessage({ type })));
    return;
  }
  if (data.type !== 'prepare' || !Array.isArray(data.urls)) return;
  event.waitUntil(prepare(data, port).catch(error => port.postMessage({ type: 'error', reason: error && error.name === 'QuotaExceededError' ? 'full' : 'failed' })));
});

function lessonUrl(value) {
  try {
    const url = new URL(value, self.location.href); url.hash = '';
    return url.origin === self.location.origin && url.pathname.startsWith(BASE) && !url.pathname.startsWith(`${BASE}api/`) && url.href !== LISTS && url.href !== self.location.href ? url.href : '';
  } catch { return ''; }
}

async function prepare(request, port) {
  preparing++;
  try { await prepareFiles(request, port); } finally { preparing--; }
}

async function prepareFiles({ urls, page, build }, port) {
  const list = [...new Set(urls.map(lessonUrl).filter(Boolean))], rest = list.filter(url => url !== SHELL);
  const [assets, files] = await Promise.all([caches.open(ASSETS), caches.open(FILES)]);
  let done = 0, next = 0, failed = 0, shell;
  if (list.includes(SHELL)) {
    try { shell = await (await usable(fetch(SHELL, { cache: 'no-cache' }), true)).text(); } catch { failed++; }
    // A page opened before the last deploy lists the old build's files: it has to be reloaded first.
    if (shell !== undefined && build && entryOf(shell) !== build) { port.postMessage({ type: 'error', reason: 'outdated' }); return; }
  }
  const report = () => port.postMessage({ type: 'progress', done, total: list.length });
  report();
  // Four at a time: quick on good Wi-Fi without crowding out the other tablets.
  const worker = async () => {
    while (next < rest.length) {
      const url = rest[next++];
      try { await store(url, assets, files); }
      catch (error) { if (error && error.name === 'QuotaExceededError') throw error; failed++; }
      done++; report();
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, rest.length) }, worker));
  // The shell and the removal of old builds' files wait for a complete run, so an offline reload always finds the files its shell asks for.
  if (!failed && shell !== undefined) {
    await saveShell(shell); done++; report();
    if (page === 'student' || page === 'teacher') await prune(page, build, list, assets, files);
  }
  port.postMessage({ type: 'done', done, total: list.length, failed });
}

/** An answer worth keeping: the page when `html` is asked for, otherwise the file itself and not index.html in its place. */
async function usable(answer, html = false) {
  const response = await answer;
  if (!response.ok || isPage(response) !== html) throw new Error(`HTTP ${response.status}`);
  return response;
}

async function store(url, assets, files) {
  if (isAsset(url)) {
    if (await assets.match(url)) return;
    return assets.put(url, await usable(fetch(url)));
  }
  // Unhashed files may have changed in place, so ask the server (a cheap 304 when they have not).
  const response = await usable(fetch(url, { cache: 'no-cache' }));
  const saved = await files.match(url);
  if (!saved || !sameFile(saved, response)) await files.put(url, response);
}

async function prune(page, build, list, assets, files) {
  const saved = await files.match(LISTS);
  const lists = saved ? await saved.json().catch(() => ({})) : {};
  lists[page] = list;
  // The other page's list stays only while it belongs to the same build.
  for (const other of ['student', 'teacher']) if (other !== page && !(Array.isArray(lists[other]) && build && lists[other].includes(build))) delete lists[other];
  await files.put(LISTS, new Response(JSON.stringify(lists), { headers: { 'content-type': 'application/json' } }));
  const keep = new Set([SHELL, LISTS, ...(lists.student || []), ...(lists.teacher || [])]);
  for (const cache of [assets, files]) for (const request of await cache.keys()) if (!keep.has(request.url)) await cache.delete(request);
}
