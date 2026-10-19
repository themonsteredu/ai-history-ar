/** Compile AR features locally with MindAR's CPU compiler; tracking engine stays shared. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const root = process.cwd();
const require = createRequire(import.meta.url);
const mindRoot = path.dirname(require.resolve('mind-ar/package.json'));
const mindRequire = createRequire(path.join(mindRoot, 'package.json'));
const { createCanvas, loadImage } = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
  ? createRequire(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'runtime.cjs'))('@napi-rs/canvas')
  : mindRequire('canvas');
const fromMind = relative => import(pathToFileURL(path.join(mindRoot, relative)).href);
const { CompilerBase } = await fromMind('src/image-target/compiler-base.js');
const { buildTrackingImageList } = await fromMind('src/image-target/image-list.js');
const { extractTrackingFeatures } = await fromMind('src/image-target/tracker/extract-utils.js');
await fromMind('src/image-target/detector/kernels/cpu/index.js');
const tf = mindRequire('@tensorflow/tfjs');
await tf.setBackend('cpu'); await tf.ready();
class CanvasCompiler extends CompilerBase {
  createProcessCanvas(img) { return createCanvas(img.width, img.height); }
  async compileTrack({ progressCallback, targetImages, basePercent }) {
    return targetImages.map((img,index) => {
      const images = buildTrackingImageList(img);
      return extractTrackingFeatures(images, step => progressCallback(basePercent + (100-basePercent) * (index + (step+1)/images.length) / targetImages.length));
    });
  }
}
// The open lesson's six artifact photos, in artifact id order (1..6), are the printed AR cards.
const sources = JSON.parse(await fs.readFile(path.join(root, 'src/lib/ar/joseon/photos.json'), 'utf8')).sort((a, b) => a.id - b.id);
if (sources.length !== 6) throw new Error('Six artifact photos are needed before compiling the AR cards.');
const images = [];
for (const source of sources) {
  const img = await loadImage(path.join(root, 'public', source.path));
  // Preserve the source aspect ratio, matching the uncropped printed photograph.
  const scale = Math.min(1, 1000 / Math.max(img.width, img.height));
  const canvas = createCanvas(Math.round(img.width*scale), Math.round(img.height*scale));
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  images.push(canvas);
}
const compiler = new CanvasCompiler(); let last = -1;
await compiler.compileImageTargets(images, progress => { const tick=Math.floor(progress/10); if(tick>last){last=tick;console.log(`AR features ${Math.min(100,tick*10)}%`);} });
const bytes = compiler.exportData();
await fs.writeFile(path.join(root, 'public/ar/joseon-science-targets.mind'), bytes);
const data = compiler.importData(bytes);
// Record which photo bytes the targets were built from, so a changed photo without a rebuild fails the tests.
const { createHash } = await import('node:crypto');
const sha = buffer => createHash('sha256').update(buffer).digest('hex');
const photos = await Promise.all(sources.map(async source => ({ id: source.id, sha256: sha(await fs.readFile(path.join(root, 'public', source.path))) })));
await fs.writeFile(path.join(root, 'src/lib/ar/joseon/targets.json'), JSON.stringify({ file: 'public/ar/joseon-science-targets.mind', sha256: sha(Buffer.from(bytes)), photos }, null, 2) + '\n');
if (data.length !== 6) throw new Error('Expected six compiled heritage targets');
console.log(`Saved six Joseon science AR targets (${bytes.length} bytes).`);
