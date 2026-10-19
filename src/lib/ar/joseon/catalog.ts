import type { JoseonPhoto } from './toolkit';
import photos from './photos.json';

export const JOSEON_RECONSTRUCTION = 'photo-reference-v2' as const;
export interface JoseonModelInfo { id: number; key: string; name: string; file: string; metallic: boolean; photo?: JoseonPhoto }

/**
 * Six Sejong-era science artifacts as photo-reference teaching reconstructions (not scans or measured
 * originals). A model with no `photo` yet shows its shape only and says so; adding the photo and its
 * views is all it takes to texture it.
 */
/** The real photograph of an artifact (photos.json: file and credit). How it lies on the model is in the artifact's own file (`photoViews`). */
const photoFor = (id: number): JoseonPhoto | undefined => {
  const photo = (photos as Array<Omit<JoseonPhoto, 'views'> & { id: number }>).find(item => item.id === id);
  if (!photo) return;
  const { id: _id, ...rest } = photo;
  return { ...rest, views: {} };
};

export const joseonModels: JoseonModelInfo[] = [
  { id: 1, key: 'joseon-cheugugi-v1', name: '측우기', file: 'cheugugi', metallic: true },
  { id: 2, key: 'joseon-jagyeongnu-v1', name: '자격루', file: 'jagyeongnu', metallic: true },
  { id: 3, key: 'joseon-ganui-v1', name: '간의', file: 'ganui', metallic: true },
  { id: 4, key: 'joseon-angbuilgu-v1', name: '앙부일구', file: 'angbuilgu', metallic: true },
  { id: 5, key: 'joseon-honcheonui-v1', name: '혼천의', file: 'honcheonui', metallic: true },
  { id: 6, key: 'joseon-nongsajikseol-v1', name: '농사직설', file: 'nongsajikseol', metallic: false },
].map(item => ({ ...item, photo: photoFor(item.id) }));
/** Printed photo cards for camera tracking: one compiled target per artifact, in id order. */
export const joseonTargets = { ready: true, file: 'ar/joseon-science-targets.mind' };
export type JoseonModelKey = string;
export const joseonModel = (key: unknown) => joseonModels.find(item => item.key === key);
export const joseonModelFor = (artifactId: number) => joseonModels.find(item => item.id === artifactId);
/** The image the 3D model is painted with (a smaller copy when the printed photo is large), for loading or prefetching. Same rule as ReconstructionBuilder.finish. */
export const joseonTextureUrl = (info: JoseonModelInfo): string | undefined => info.photo && `${import.meta.env.BASE_URL}${info.photo.texture || info.photo.path}`;
export const isJoseonModelKey = (key: unknown): key is JoseonModelKey => !!joseonModel(key);
