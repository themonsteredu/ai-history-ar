import type { ExhibitModel } from '../../lib/ar/exhibit';

export function cheomseongdaeModel(): ExhibitModel {
  return {
    asset: 'cheomseongdae-nsm-2015', format: 'obj', data: '',
    name: '국립중앙과학관 신라첨성대 · 공식 3D 원본',
    credit: '국립중앙과학관 · 신라첨성대(2015) · 공공누리 제3유형(출처표시·변경금지)',
    source: 'https://col.science.go.kr/web/MetaDetail.do?menuIdx=480&metaId=meta_000002989',
    // Source coordinates use Z as vertical. Display rotation does not modify source data.
    rotation: [-90, 0, 0],
  };
}
