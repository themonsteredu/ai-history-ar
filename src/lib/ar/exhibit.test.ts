import { describe, expect, it } from 'vitest';
import { newProject, parseProject } from '../../content/three-kingdoms/project';
import { isArExhibit, MAX_AUDIO_BYTES, newArExhibit, validateGlb } from './exhibit';

function glb(json: object) {
  const text = JSON.stringify(json); const padded = text.padEnd(Math.ceil(text.length / 4) * 4, ' ');
  const bytes = new TextEncoder().encode(padded);
  const buffer = new ArrayBuffer(bytes.length + 20); const view = new DataView(buffer);
  [0x46546c67, 2, buffer.byteLength, bytes.length, 0x4e4f534a].forEach((n, i) => view.setUint32(i * 4, n, true));
  new Uint8Array(buffer, 20).set(bytes); return buffer;
}
describe('portable AR exhibit', () => {
  it('preserves two student recordings, 3D placement and the quiz across devices', () => {
    const ar = newArExhibit(['봉황이 표현되어 있다.', '받침에는 용이 있다.']);
    ar.question = '봉황이 있는 설명점은?';
    ar.points[0].narration = { data: 'data:audio/mp4;base64,AAAAHGZ0eXA=', seconds: 12.4 };
    ar.points[1].narration = { data: 'data:audio/webm;base64,GkXfo59ChoEB', seconds: 15 };
    ar.points[0].position = [.1, .9, -.15];
    ar.model = { data: 'data:application/octet-stream;base64,Z2xURg==', format: 'glb', name: '유물.glb', credit: '교사 제공', source: 'https://www.museum.go.kr/', rotation: [90,0,0] };
    const project = { ...newProject(2, 2), ar };
    expect(parseProject(JSON.stringify(project))).toEqual(project);
  });
  it('still opens files from the already-taught lessons without AR data', () => {
    const old = newProject(4, 6); expect(parseProject(JSON.stringify(old))).toEqual(old);
  });
  it('rejects active content, oversized audio and invalid point references', () => {
    const ar = newArExhibit();
    ar.points[0].narration = { data: 'data:text/html;base64,PHNjcmlwdD4=', seconds: 10 };
    expect(isArExhibit(ar)).toBe(false);
    ar.points[0].narration.data = 'data:audio/mp4;base64,' + 'A'.repeat(MAX_AUDIO_BYTES * 2);
    expect(isArExhibit(ar)).toBe(false);
    delete ar.points[0].narration;
    ar.answerId = 'missing'; expect(isArExhibit(ar)).toBe(false);
    ar.answerId = 'point-1'; ar.points[1].id = 'point-1'; expect(isArExhibit(ar)).toBe(false);
  });
  it('blocks model files that would load images or buffers from outside the project', () => {
    expect(() => validateGlb(glb({ asset: { version: '2.0' }, buffers: [{byteLength:0}] }))).not.toThrow();
    expect(() => validateGlb(glb({ asset: { version: '2.0' }, images: [{uri:'https://other.example/image.png'}] }))).toThrow('한 파일');
    expect(() => validateGlb(glb({ buffers: [{ uri: '../secrets.bin' }] }))).toThrow('한 파일');
    expect(() => validateGlb(new ArrayBuffer(24))).toThrow();
  });
});
