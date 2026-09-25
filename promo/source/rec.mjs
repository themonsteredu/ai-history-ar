import { chromium } from 'playwright';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
export const FF = process.env.FFMPEG || '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';
const DPR = Number(process.env.DPR || 2);
export const BASE = process.env.BASE || 'http://127.0.0.1:5173'; // 로컬 개발 서버만 사용
export async function session(fn) {
  // 3D 유물(WebGL)을 헤드리스에서 그리기 위해 SwiftShader 사용
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: DPR });
  // 외부 서버·수업 API는 절대 호출하지 않음 (학급 서버, 진로 기록 허브 등)
  await ctx.route(/\/api\//, r => r.abort());
  await ctx.route(url => !/^(http:\/\/127\.0\.0\.1|http:\/\/localhost|data:|blob:)/.test(url.href), r => r.abort());
  const page = await ctx.newPage();
  page.on('dialog', d => d.accept());
  try { await fn(page); } finally { await b.close(); }
}
export async function record(page, name, actions) {
  const dir = `clips/${name}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', async f => {
    const i = frames.length; frames.push(f.metadata.timestamp);
    fs.writeFileSync(`${dir}/${String(i).padStart(5,'0')}.jpg`, Buffer.from(f.data, 'base64'));
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1600*DPR, maxHeight: 900*DPR, everyNthFrame: 1 });
  const start = Date.now() / 1000;
  await actions();
  const end = Date.now() / 1000;
  await cdp.send('Page.stopScreencast');
  let list = '';
  frames.forEach((t, i) => { const next = i + 1 < frames.length ? frames[i + 1] : end; list += `file '${String(i).padStart(5,'0')}.jpg'\nduration ${Math.max(0.001, next - t).toFixed(4)}\n`; });
  list += `file '${String(frames.length - 1).padStart(5,'0')}.jpg'\n`;
  fs.writeFileSync(`${dir}/list.txt`, list);
  execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${dir}/list.txt`, '-vf', `fps=30,scale=${1600*DPR}:${900*DPR}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-crf', '14', '-preset', 'medium', `clips/${name}.mp4`]);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(name, frames.length, 'frames', (end - start).toFixed(1), 's');
}
// 스톱모션 녹화: 3D(WebGL)가 소프트웨어 렌더링이라 느릴 때, 한 단계마다 화면을 찍어 30fps로 이어 붙임
export async function stopMotion(page, name, actions) {
  const dir = `clips/${name}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  let i = 0, list = '';
  const snap = async (hold = 1) => {
    const f = `${String(i++).padStart(5,'0')}.jpg`;
    await page.screenshot({ path: `${dir}/${f}`, type: 'jpeg', quality: 92 });
    list += `file '${f}'\nduration ${(hold / 30).toFixed(5)}\n`;
  };
  await actions(snap);
  list += `file '${String(i - 1).padStart(5,'0')}.jpg'\n`;
  fs.writeFileSync(`${dir}/list.txt`, list);
  execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${dir}/list.txt`, '-vf', `fps=30,scale=${1600*DPR}:${900*DPR}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-crf', '14', '-preset', 'medium', `clips/${name}.mp4`]);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(name, i, 'shots');
}
