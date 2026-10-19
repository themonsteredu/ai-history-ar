import { JOSEON_RECONSTRUCTION, joseonModel } from './catalog';
import { ReconstructionBuilder } from './toolkit';

const builders: Record<string, () => Promise<{ build: (b: ReconstructionBuilder) => void }>> = {
  cheugugi: () => import('./cheugugi'),
  jagyeongnu: () => import('./jagyeongnu'),
  ganui: () => import('./ganui'),
  angbuilgu: () => import('./angbuilgu'),
  honcheonui: () => import('./honcheonui'),
  nongsajikseol: () => import('./nongsajikseol'),
};

/** Builds one Joseon artifact reconstruction; `withImages` false gives the same geometry for point picking. */
export async function createJoseonModel(key: string, withImages = true) {
  const info = joseonModel(key);
  if (!info) throw new Error('준비된 유물 모형을 찾지 못했어요.');
  const { build } = await builders[info.file]();
  const builder = new ReconstructionBuilder();
  build(builder);
  const root = await builder.finish(info.photo, withImages);
  root.name = `${info.name} · 사진 참고 3D 재현`;
  root.userData.reconstruction = JOSEON_RECONSTRUCTION;
  root.userData.metallic = info.metallic;
  return root;
}
