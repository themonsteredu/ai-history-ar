export type Vector3 = [number, number, number];
export interface ModelPart {
  id: string;
  kind: 'box' | 'cylinder' | 'ring';
  position: Vector3;
  scale: Vector3;
  rotation: Vector3;
  color: string;
}
export const partLabels = { box: '네모', cylinder: '원기둥', ring: '고리' };
export function newPart(kind: ModelPart['kind'], height = .25): ModelPart {
  return { id: crypto.randomUUID(), kind, position: [0, height, 0], scale: [.7, .3, .7], rotation: [0, 0, 0], color: '#B7A38A' };
}
export function validParts(value: unknown): value is ModelPart[] {
  const vector = (v: unknown, min: number, max: number) => Array.isArray(v) && v.length === 3 && v.every(n => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max);
  return Array.isArray(value) && value.length >= 1 && value.length <= 40 && value.every(p => p && typeof p.id === 'string' && p.id.length > 0 && p.id.length <= 60 && ['box', 'cylinder', 'ring'].includes(p.kind) && vector(p.position, -3, 3) && vector(p.scale, .05, 3) && vector(p.rotation, -360, 360) && /^#[0-9A-Fa-f]{6}$/.test(p.color)) && new Set(value.map(p => p.id)).size === value.length;
}
