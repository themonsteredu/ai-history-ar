import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

// Runs public/open-lesson-sw.js against small stand-ins for the worker globals.
const source = readFileSync(new URL('../../../public/open-lesson-sw.js', import.meta.url), 'utf8');
const site = 'https://ai-history-ar.vercel.app';
type Handler = (event: unknown) => void;
const urlOf = (key: string | { url: string }) => typeof key === 'string' ? new URL(key, site).href : key.url;

function memoryCache() {
  const items = new Map<string, Response>();
  return {
    items,
    match: async (key: string | { url: string }) => items.get(urlOf(key))?.clone(),
    put: async (key: string | { url: string }, response: Response) => { items.set(urlOf(key), response); },
    keys: async () => [...items.keys()].map(url => ({ url })),
    delete: async (key: { url: string }) => items.delete(key.url),
  };
}

let handlers: Record<string, Handler>, stores: Map<string, ReturnType<typeof memoryCache>>, network: Mock<(request: string | { url: string }, init?: unknown) => Promise<Response>>;
const store = (name: string) => { if (!stores.has(name)) stores.set(name, memoryCache()); return stores.get(name)!; };
const html = (text: string) => new Response(text, { headers: { 'content-type': 'text/html' } });

beforeEach(() => {
  handlers = {}; stores = new Map();
  network = vi.fn(async (request: string | { url: string }, _init?: unknown) => new Response(`network ${urlOf(request)}`, { headers: { etag: '"new"' } }));
  const self = {
    location: new URL(`${site}/open-lesson-sw.js`), registration: {}, clients: { claim: async () => undefined },
    skipWaiting: () => undefined, addEventListener: (type: string, handler: Handler) => { handlers[type] = handler; },
  };
  const caches = {
    open: async (name: string) => store(name), keys: async () => [...stores.keys()], delete: async (name: string) => stores.delete(name),
    match: async (key: string, options: { cacheName: string }) => store(options.cacheName).match(key),
  };
  runInNewContext(source, { self, caches, fetch: (request: string, init?: unknown) => network(request, init), Response, URL, Promise, setTimeout: (fn: (value: unknown) => void, _ms: number, value: unknown) => setTimeout(fn, 20, value) });
});

function request(path: string, init: { method?: string; mode?: string; headers?: Record<string, string> } = {}) {
  let answer: Promise<Response> | undefined;
  const waits: Promise<unknown>[] = [];
  handlers.fetch({ request: { url: new URL(path, site).href, method: init.method || 'GET', mode: init.mode || 'cors', headers: new Headers(init.headers) }, preloadResponse: Promise.resolve(undefined), respondWith: (value: Promise<Response>) => { answer = value; }, waitUntil: (value: Promise<unknown>) => { waits.push(value); } });
  return { answer, settled: async () => { await answer?.catch(() => undefined); await Promise.all(waits); await Promise.all(waits); } };
}

describe('open lesson service worker', () => {
  it('leaves the server API, other sites, other methods and ranges to the browser', () => {
    expect(request('/api/open-lesson/rooms/1234').answer).toBeUndefined();
    expect(request('/api/ar-studio/join', { method: 'POST' }).answer).toBeUndefined();
    expect(request('/assets/index-a.js', { method: 'POST' }).answer).toBeUndefined();
    expect(request('https://gemini.google.com/app').answer).toBeUndefined();
    expect(request('/ar/joseon-science-targets.mind', { headers: { range: 'bytes=0-9' } }).answer).toBeUndefined();
    expect(network).not.toHaveBeenCalled();
  });

  it('serves built files from the tablet first and keeps new ones', async () => {
    await store('open-lesson-assets-v1').put('/assets/three-a.js', new Response('saved three'));
    expect(await (await request('/assets/three-a.js').answer!).text()).toBe('saved three');
    const fresh = request('/assets/modelScene-b.js');
    expect(await (await fresh.answer!).text()).toBe(`network ${site}/assets/modelScene-b.js`);
    await fresh.settled();
    expect(store('open-lesson-assets-v1').items.has(`${site}/assets/modelScene-b.js`)).toBe(true);
    expect(network).toHaveBeenCalledTimes(1);
  });

  it('serves saved photos and checks for a newer copy, but never saves files the lesson did not ask for', async () => {
    await store('open-lesson-files-v1').put('/images/heritage/joseon-science/ganui.jpg', new Response('old photo', { headers: { etag: '"old"' } }));
    const photo = request('/images/heritage/joseon-science/ganui.jpg');
    expect(await (await photo.answer!).text()).toBe('old photo');
    await photo.settled();
    expect(await store('open-lesson-files-v1').items.get(`${site}/images/heritage/joseon-science/ganui.jpg`)!.text()).toBe(`network ${site}/images/heritage/joseon-science/ganui.jpg`);
    const other = request('/images/heritage/three-kingdoms/x.jpg');
    expect(await (await other.answer!).text()).toContain('network');
    await other.settled();
    expect(store('open-lesson-files-v1').items.has(`${site}/images/heritage/three-kingdoms/x.jpg`)).toBe(false);
  });

  it('opens a page from the network and saves it as the shell', async () => {
    network.mockImplementation(async () => html('new shell'));
    const page = request('/joseon/open-class?code=1234', { mode: 'navigate' });
    expect(await (await page.answer!).text()).toBe('new shell');
    await page.settled();
    expect(await store('open-lesson-files-v1').items.get(`${site}/index.html`)!.text()).toBe('new shell');
  });

  it('opens the saved shell when the network is down or too slow', async () => {
    await store('open-lesson-files-v1').put('/index.html', html('saved shell'));
    network.mockImplementation(async () => { throw new TypeError('offline'); });
    expect(await (await request('/joseon/open-class', { mode: 'navigate' }).answer!).text()).toBe('saved shell');
    network.mockImplementation(() => new Promise<Response>(resolve => setTimeout(() => resolve(html('late shell')), 200)));
    const slow = request('/joseon/open-class', { mode: 'navigate' });
    expect(await (await slow.answer!).text()).toBe('saved shell');
    await slow.settled();
    expect(await store('open-lesson-files-v1').items.get(`${site}/index.html`)!.text()).toBe('late shell');
  });

  it('saves the asked files with progress, then drops an old build', async () => {
    await store('open-lesson-assets-v1').put('/assets/index-old.js', new Response('old build'));
    const messages: Array<{ type: string; done?: number; total?: number; failed?: number }> = [];
    const waits: Promise<unknown>[] = [];
    const urls = [`${site}/index.html`, `${site}/assets/index-new.js`, '/ar/joseon-science-targets.mind', '/api/open-lesson/rooms/1', 'https://example.com/x.js'];
    handlers.message({ data: { type: 'prepare', page: 'student', build: `${site}/assets/index-new.js`, urls }, ports: [{ postMessage: (message: never) => messages.push(message) }], waitUntil: (value: Promise<unknown>) => waits.push(value) });
    await Promise.all(waits);
    expect(messages[0]).toEqual({ type: 'progress', done: 0, total: 3 });
    expect(messages.at(-1)).toEqual({ type: 'done', done: 3, total: 3, failed: 0 });
    expect([...store('open-lesson-assets-v1').items.keys()]).toEqual([`${site}/assets/index-new.js`]);
    expect(store('open-lesson-files-v1').items.has(`${site}/ar/joseon-science-targets.mind`)).toBe(true);
    expect(store('open-lesson-files-v1').items.get(`${site}/index.html`)!.headers.get('content-type')).toContain('text/html');
  });

  it('keeps the old build when a file could not be fetched', async () => {
    await store('open-lesson-assets-v1').put('/assets/index-old.js', new Response('old build'));
    network.mockImplementation(async url => urlOf(url).endsWith('.mind') ? new Response('', { status: 503 }) : new Response('ok'));
    const messages: Array<{ type: string; failed?: number }> = [];
    const waits: Promise<unknown>[] = [];
    handlers.message({ data: { type: 'prepare', page: 'student', build: '', urls: [`${site}/index.html`, `${site}/assets/index-new.js`, `${site}/ar/joseon-science-targets.mind`] }, ports: [{ postMessage: (message: never) => messages.push(message) }], waitUntil: (value: Promise<unknown>) => waits.push(value) });
    await Promise.all(waits);
    expect(messages.at(-1)).toMatchObject({ type: 'done', failed: 1 });
    expect(store('open-lesson-assets-v1').items.has(`${site}/assets/index-old.js`)).toBe(true);
  });
});
