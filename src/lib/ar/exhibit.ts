export const MAX_AUDIO_BYTES = 600_000;
export const MAX_RECORDING_SECONDS = 30;
export const MAX_MODEL_BYTES = 12_000_000;
export const MAX_PROJECT_BYTES = 23_000_000;

export interface Narration { data: string; seconds: number }
export interface ExhibitPoint {
  id: string;
  title: string;
  text: string;
  position: [number, number, number];
  photoPosition: [number, number];
  narration?: Narration;
}
export interface ExhibitModel {
  data: string;
  format: 'glb' | 'stl' | 'obj';
  asset?: 'cheomseongdae-nsm-2015';
  name: string;
  credit: string;
  source: string;
  rotation: [number, number, number];
}
export interface ArExhibit {
  points: ExhibitPoint[];
  question: string;
  answerId: string;
  model?: ExhibitModel;
}
export function newArExhibit(sentences: string[] = []): ArExhibit {
  return {
    points: [
      { id: 'point-1', title: '첫 번째 설명', text: sentences[0] || '', position: [0, .8, .2], photoPosition: [.5, .25] },
      { id: 'point-2', title: '두 번째 설명', text: sentences[1] || '', position: [0, .2, .2], photoPosition: [.5, .75] },
    ], question: '', answerId: 'point-1',
  };
}
const short = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max;
const vector = (v: unknown, length: number, min: number, max: number) => Array.isArray(v) && v.length === length && v.every(n => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max);
export function isAudioData(value: unknown): value is string {
  return short(value, Math.ceil(MAX_AUDIO_BYTES / 3) * 4 + 100) && /^data:audio\/(mp4|webm|ogg|wav|mpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}
export function isArExhibit(value: unknown): value is ArExhibit {
  if (!value || typeof value !== 'object') return false;
  const ar = value as ArExhibit;
  if (!Array.isArray(ar.points) || ar.points.length !== 2 || !short(ar.question, 300) || !short(ar.answerId, 40)) return false;
  if (!ar.points.every(point => point && short(point.id, 40) && point.id.trim() && short(point.title, 80) && short(point.text, 1500) && vector(point.position, 3, -3, 3) && vector(point.photoPosition, 2, 0, 1) &&
    (point.narration === undefined || (point.narration && isAudioData(point.narration.data) && typeof point.narration.seconds === 'number' && point.narration.seconds > 0 && point.narration.seconds <= MAX_RECORDING_SECONDS + 1)))) return false;
  if (new Set(ar.points.map(point => point.id)).size !== 2 || !ar.points.some(point => point.id === ar.answerId)) return false;
  const model = ar.model;
  return model === undefined || (!!model && typeof model === 'object' && short(model.name, 180) && short(model.credit, 300) && short(model.source, 2000) && vector(model.rotation, 3, -360, 360) &&
    ((model.asset === 'cheomseongdae-nsm-2015' && model.format === 'obj' && model.data === '') ||
      (model.asset === undefined && ['glb', 'stl'].includes(model.format) && short(model.data, Math.ceil(MAX_MODEL_BYTES / 3) * 4 + 100) && /^data:application\/octet-stream;base64,[A-Za-z0-9+/]+={0,2}$/.test(model.data))));
}
export function arExhibitReady(ar: ArExhibit) {
  return ar.points.every(point => point.title.trim() && point.text.trim()) && !!ar.question.trim() && ar.points.some(point => point.id === ar.answerId);
}
export function safeSourceLink(value: string) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; } catch { return ''; }
}
export function readDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('파일을 읽지 못했어요. 다시 골라 주세요.'));
    reader.readAsDataURL(blob);
  });
}
export function dataUrlBytes(data: string) {
  const binary = atob(data.slice(data.indexOf(',') + 1));
  return Uint8Array.from(binary, char => char.charCodeAt(0)).buffer;
}
/** Only self-contained glTF is accepted; model files may not request remote resources. */
export function validateGlb(buffer: ArrayBuffer) {
  if (buffer.byteLength < 24 || buffer.byteLength > MAX_MODEL_BYTES) throw new Error('12MB 이하의 GLB 파일을 골라 주세요.');
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== buffer.byteLength || view.getUint32(16, true) !== 0x4e4f534a) throw new Error('올바른 GLB 파일이 아니에요.');
  const jsonSize = view.getUint32(12, true);
  if (jsonSize > buffer.byteLength - 20) throw new Error('3D 파일이 손상되었어요.');
  const document = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, jsonSize)));
  const external = [...(document.buffers || []), ...(document.images || [])].some(item => item.uri && !/^data:(application\/(octet-stream|gltf-buffer)|image\/(png|jpeg|webp));base64,[A-Za-z0-9+/]+={0,2}$/.test(item.uri));
  if (external) throw new Error('그림과 모형이 한 파일에 포함된 GLB로 저장해 주세요.');
  if ((document.extensionsRequired || []).some((name: string) => ['KHR_draco_mesh_compression', 'EXT_meshopt_compression', 'KHR_texture_basisu'].includes(name))) throw new Error('압축하지 않은 GLB 파일을 골라 주세요.');
  return document;
}
