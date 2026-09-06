import { describe, expect, it } from 'vitest';
import { decodeMuseumBmp } from './cheomseongdaeOriginal';
import { cheomseongdaeModel } from './arModels';
import { newProject, parseProject } from './project';
import { newArExhibit } from '../../lib/ar/exhibit';

describe('unchanged museum model presentation', () => {
  it('decodes the BMP row padding, BGR channels and bottom-up orientation without changing pixels', () => {
    const buffer = new ArrayBuffer(70); const view = new DataView(buffer);
    view.setUint16(0,0x4d42,true); view.setUint32(10,54,true); view.setInt32(18,2,true); view.setInt32(22,2,true); view.setUint16(28,24,true);
    new Uint8Array(buffer,54).set([0,0,255,0,255,0,0,0,255,0,0,255,255,255,0,0]);
    const decoded = decodeMuseumBmp(buffer);
    expect([decoded.width,decoded.height]).toEqual([2,2]);
    expect([...decoded.pixels]).toEqual([255,0,0,255,0,255,0,255,0,0,255,255,255,255,255,255]);
  });
  it('rejects truncated textures rather than reading outside the original file', () => {
    expect(() => decodeMuseumBmp(new ArrayBuffer(20))).toThrow();
  });
  it('keeps the registered source credit across portable file edits', () => {
    const ar = newArExhibit(); ar.model = { ...cheomseongdaeModel(), credit: 'removed', source: 'https://other.example/' };
    const imported = parseProject(JSON.stringify({ ...newProject(3,3), ar }));
    expect(imported.ar?.model?.credit).toBe(cheomseongdaeModel().credit);
    expect(imported.ar?.model?.source).toBe(cheomseongdaeModel().source);
  });
});
