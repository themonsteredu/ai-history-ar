import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

/** Provider originals are gzip-compressed for transport, with byte-for-byte verified recovery.
 * No decimation, mesh remodeling, recoloring or texture resizing is applied. */
async function original(kind: 'obj' | 'bmp', expectedBytes: number, signal: AbortSignal) {
  if (typeof DecompressionStream === 'undefined') throw new Error('공식 3D 원본은 최신 Safari 또는 Chrome에서 열어 주세요.');
  const responses = await Promise.all([1, 2].map(part => fetch(`${import.meta.env.BASE_URL}ar/models/cheomseongdae-original-${kind}-${part}.gzpart`, { signal, credentials: 'omit', cache: 'force-cache' })));
  if (responses.some(response => !response.ok || !response.body)) throw new Error('첨성대 3D 원본을 내려받지 못했어요. 인터넷 연결을 확인하고 다시 열어 주세요.');
  let part = 0;
  let reader: ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>> | undefined;
  // Concatenate transport parts with backpressure, without buffering another
  // full copy of the model in memory. Original gzip bytes remain unchanged.
  const compressed = new ReadableStream<Uint8Array<ArrayBuffer>>({
    async pull(controller) {
      try {
        while (part < responses.length) {
          reader ??= responses[part].body!.getReader();
          const chunk = await reader.read();
          if (chunk.done) { reader.releaseLock(); reader = undefined; part++; continue; }
          controller.enqueue(chunk.value); return;
        }
        controller.close();
      } catch (error) { controller.error(error); }
    },
    async cancel(reason) {
      await reader?.cancel(reason);
      await Promise.all(responses.slice(part + (reader ? 1 : 0)).map(response => response.body!.cancel(reason)));
    },
  });
  const bytes = await new Response(compressed.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  if (bytes.byteLength !== expectedBytes) throw new Error('3D 원본을 끝까지 받지 못했어요. 다시 열어 주세요.');
  return bytes;
}

/** Decode the original, uncompressed 24-bit BMP without changing pixel values. */
export function decodeMuseumBmp(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  if (buffer.byteLength < 54 || view.getUint16(0, true) !== 0x4d42 || view.getUint16(28, true) !== 24 || view.getUint32(30, true) !== 0) throw new Error('원본 표면 그림의 형식을 읽지 못했어요.');
  const offset = view.getUint32(10, true), width = view.getInt32(18, true), signedHeight = view.getInt32(22, true), height = Math.abs(signedHeight);
  const stride = Math.ceil(width * 3 / 4) * 4;
  if (width <= 0 || width > 4096 || height <= 0 || height > 4096 || offset + stride * height > buffer.byteLength) throw new Error('표면 그림 파일이 손상되었어요.');
  const source = new Uint8Array(buffer); const pixels = new Uint8Array(width * height * 4);
  for (let row = 0; row < height; row++) {
    const sourceRow = signedHeight > 0 ? row : height - row - 1;
    for (let col = 0; col < width; col++) {
      const input = offset + sourceRow * stride + col * 3, output = (row * width + col) * 4;
      pixels[output] = source[input + 2]; pixels[output + 1] = source[input + 1]; pixels[output + 2] = source[input]; pixels[output + 3] = 255;
    }
  }
  return { pixels, width, height };
}

export async function loadCheomseongdaeOriginal(signal: AbortSignal) {
  const [obj, bmp] = await Promise.all([original('obj', 44_426_112, signal), original('bmp', 50_331_702, signal)]);
  signal.throwIfAborted();
  const object = new OBJLoader().parse(new TextDecoder().decode(obj));
  const { pixels, width, height } = decodeMuseumBmp(bmp);
  const texture = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false; texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter; texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  object.traverse((item: any) => {
    if (!item.isMesh) return;
    const materials = Array.isArray(item.material) ? item.material : [item.material];
    materials.forEach((material: any) => { material.map = texture; material.needsUpdate = true; });
  });
  return object;
}
