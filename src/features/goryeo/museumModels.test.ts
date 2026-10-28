import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MAX_MODEL_BYTES, validateGlb } from '../../lib/ar/exhibit';

describe('박물관 실물 3D 자료',()=>{
 it.each(['vase','incense','lacquer'])('%s 모델은 독립적인 웹용 GLB이다',name=>{
  const bytes=readFileSync(`public/ar/goryeo-models/${name}.glb`);
  expect(bytes.byteLength).toBeLessThan(MAX_MODEL_BYTES);
  const buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer;
  const doc=validateGlb(buffer);
  expect(doc.meshes.length).toBeGreaterThan(0);
  expect(doc.images.length).toBeGreaterThan(0);
 });
});
