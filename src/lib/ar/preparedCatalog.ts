import type { ExhibitModel } from './exhibit';

export const preparedHeritages = [
  { id: 1, key: 'samguk-muryeong-v1', name: '무령왕릉', detail: '벽돌 벽과 둥근 천장을 살펴보는 무덤 내부', image: 'muryeong-tomb.jpg' },
  { id: 2, key: 'samguk-incense-v1', name: '백제 금동대향로', detail: '용 받침, 연꽃 몸체, 산 모양 뚜껑과 봉황', image: 'baekje-incense-burner.jpg' },
  { id: 3, key: 'samguk-cheomseongdae-v1', name: '첨성대', detail: '층층이 쌓은 돌, 가운데 창과 꼭대기 돌', image: 'cheomseongdae.jpg' },
  { id: 4, key: 'samguk-crown-v1', name: '신라 금관', detail: '둥근 관테, 가지 장식과 드리개', image: 'silla-crown.jpg' },
  { id: 5, key: 'samguk-mural-v1', name: '고구려 고분벽화', detail: '실제 벽화 사진을 붙인 입체 전시 벽', image: 'goguryeo-mural.jpg' },
  { id: 6, key: 'samguk-gaya-v1', name: '가야 고분군', detail: '크기가 다른 둥근 봉분들이 모인 풍경', image: 'gaya-tombs.jpg' },
] as const;

export type PreparedModelKey = typeof preparedHeritages[number]['key'];
export const preparedHeritage = (key: unknown) => preparedHeritages.find(item => item.key === key);

export function preparedModel(heritageId: number, source = ''): ExhibitModel {
  const item = preparedHeritages.find(item => item.id === heritageId);
  if (!item) throw new Error('유물을 다시 골라 주세요.');
  return { format: 'preset', preset: item.key, data: '', rotation: [0, 0, 0], name: `${item.name} · 준비된 학습용 모형`, credit: '실물 사진의 특징을 단순화해 만든 학습용 3D 모형', source };
}
