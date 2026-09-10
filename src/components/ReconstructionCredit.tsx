import type { ExhibitModel } from '../lib/ar/exhibit';
import { preparedHeritage } from '../lib/ar/preparedCatalog';
import { reconstructionSources } from '../content/three-kingdoms/reconstructionSources';

export function ReconstructionCredit({ model }: { model?: ExhibitModel }) {
  const id = preparedHeritage(model?.preset)?.id;
  const source = id ? reconstructionSources[id] : undefined;
  if (!source) return null;
  return <p className="ar-help">사진 참고 3D 재현 · 실측·스캔 원본 아님. 사진 일부를 입체 표면에 적용했어요.
    {' '}<a href={source.url} target="_blank" rel="noreferrer">사진: {source.author} · {source.license}</a>
    {source.licenseUrl && <> · <a href={source.licenseUrl} target="_blank" rel="noreferrer">금관 재현물도 CC BY-SA 4.0</a></>}
  </p>;
}
