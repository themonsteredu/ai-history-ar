import type { ExhibitModel } from './exhibit';

export const PHOTO_RECONSTRUCTION = 'photo-reference-v2' as const;
export const reconstructionCredit = '실물 사진을 참고해 제작한 3D 재현 모형 · 실측·스캔 원본 아님';

export const preparedHeritages = [
  { id: 1, key: 'samguk-muryeong-v1', name: '무령왕릉', detail: '사진의 벽돌 질감을 입힌 무덤 내부 · 안이 보이도록 천장과 벽 일부를 열었어요.', image: 'muryeong-tomb.jpg' },
  { id: 2, key: 'samguk-incense-v1', name: '백제 금동대향로', detail: '금동 표면, 용 받침, 겹친 연꽃과 산봉우리, 날개를 편 봉황을 살펴봐요.', image: 'baekje-incense-burner.jpg' },
  { id: 3, key: 'samguk-cheomseongdae-v1', name: '첨성대', detail: '층층이 쌓은 돌, 가운데 창과 꼭대기 돌', image: 'cheomseongdae.jpg' },
  { id: 4, key: 'samguk-crown-v1', name: '신라 금관', detail: '얇은 금판, 나뭇가지와 사슴뿔 장식, 곡옥과 길게 늘어진 드리개를 살펴봐요.', image: 'silla-crown.jpg' },
  { id: 5, key: 'samguk-mural-v1', name: '고구려 고분벽화', detail: '실제 벽화 사진을 굴곡이 있는 벽면에 입힌 무덤 내부 재현이에요.', image: 'goguryeo-mural.jpg' },
  { id: 6, key: 'samguk-gaya-v1', name: '가야 고분군', detail: '사진의 잔디 질감을 입힌 봉분과 완만한 지형을 돌려 봐요.', image: 'gaya-tombs.jpg' },
] as const;

export type PreparedModelKey = typeof preparedHeritages[number]['key'];
export const preparedHeritage = (key: unknown) => preparedHeritages.find(item => item.key === key);

export function preparedModel(heritageId: number, source = ''): ExhibitModel {
  const item = preparedHeritages.find(item => item.id === heritageId);
  if (!item) throw new Error('유물을 다시 골라 주세요.');
  return { format: 'preset', preset: item.key, data: '', rotation: [0, 0, 0],
    ...(heritageId === 3 ? {} : { reconstruction: PHOTO_RECONSTRUCTION }),
    name: `${item.name} · ${heritageId === 3 ? '이전 학습용 모형' : '사진 참고 3D 재현'}`,
    credit: heritageId === 3 ? '실물 사진의 특징을 단순화해 만든 학습용 3D 모형' : reconstructionCredit, source };
}
