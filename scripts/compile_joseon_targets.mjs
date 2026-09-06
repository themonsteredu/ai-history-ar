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
const sources = JSON.parse(await fs.readFile(path.join(root, 'src/content/joseon/images.json'), 'utf8'));
const images = [];
for (const source of sources) {
  const img = await loadImage(path.join(root, 'public/images/heritage/joseon', source.file));
  // Preserve the source aspect ratio, matching the uncropped printed photograph.
  const scale = Math.min(1, 1000 / Math.max(img.width, img.height));
  const canvas = createCanvas(Math.round(img.width*scale), Math.round(img.height*scale));
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  images.push(canvas);
}
const compiler = new CanvasCompiler(); let last = -1;
await compiler.compileImageTargets(images, progress => { const tick=Math.floor(progress/10); if(tick>last){last=tick;console.log(`AR features ${Math.min(100,tick*10)}%`);} });
const bytes = compiler.exportData();
await fs.writeFile(path.join(root, 'public/ar/joseon-targets.mind'), bytes);
const data = compiler.importData(bytes);
if (data.length !== 6) throw new Error('Expected six compiled heritage targets');
console.log(`Saved six Joseon AR targets (${bytes.length} bytes).`);
