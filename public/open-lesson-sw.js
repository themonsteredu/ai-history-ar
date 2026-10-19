/*
 * Offline help for the Joseon open lesson only. '수업 준비하기' registers this file with the lesson page's
 * own path as its scope (/joseon/open-class or /teacher/joseon/open-class), so no other page is controlled.
 *
 * - Page loads: network first; after 3.5 s or with no network, the saved app shell (index.html). A page load
 *   refreshes the saved shell of the same build only; a new build's shell is saved by '수업 준비하기' after
 *   all of its files, so the saved shell never points at files that are not on the tablet.
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
const STATIC = /\.(?:jpe?g|png|webp|gif|svg|ico|mind|otf|ttf|woff2?|json)$/i;

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('open-lesson-') && name !== ASSETS && name !== FILES).map(name => caches.delete(name)));
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(() => undefined);
    await self.clients.claim();
  })());
});

const isAsset = url => new URL(url).pathname.startsWith(`${BASE}assets/`);
// The host answers any missing file (an old build's, after a deploy) with index.html.
const isPage = response => (response.headers.get('content-type') || '').includes('text/html');
/** The build an index.html starts: its entry script's address. */
const entryOf = html => { const src = /<script\b[^>]*\bsrc="([^"]+)"/i.exec(html); return src ? new URL(src[1], SHELL).href : ''; };

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

async function refreshShell(response) {
  const html = await response.text(), saved = await caches.match(SHELL, { cacheName: FILES });
  if (!saved || entryOf(await saved.text()) === entryOf(html)) await saveShell(html);
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
  if (!port || !data || data.type !== 'prepare' || !Array.isArray(data.urls)) return;
  event.waitUntil(prepare(data, port).catch(error => port.postMessage({ type: 'error', reason: error && error.name === 'QuotaExceededError' ? 'full' : 'failed' })));
});

function lessonUrl(value) {
  try {
    const url = new URL(value, self.location.href); url.hash = '';
    return url.origin === self.location.origin && url.pathname.startsWith(BASE) && !url.pathname.startsWith(`${BASE}api/`) && url.href !== LISTS && url.href !== self.location.href ? url.href : '';
  } catch { return ''; }
}

async function prepare({ urls, page, build }, port) {
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
