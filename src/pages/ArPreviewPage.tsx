import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ArExhibitEditor from '../components/ArExhibitEditor';
import { cheomseongdaeModel } from '../content/three-kingdoms/arModels';
import { researchForEra, heritageImageUrl, eraName, imageCreditForEra } from '../content/heritageCatalog';
import type { EraId } from '../types/curriculum';
import { newArExhibit, type ArExhibit } from '../lib/ar/exhibit';
import '../styles/heritage-project.css';

export default function ArPreviewPage({ eraId = "three-kingdoms" }: { eraId?: EraId }) {
  const heritageResearchCases = researchForEra(eraId);
  const [searchParams] = useSearchParams();
  const [heritageId, setHeritageId] = useState(eraId === "joseon" ? 1 : 3);
  const [busy, setBusy] = useState(false);
  const [exhibits, setExhibits] = useState<Record<number, ArExhibit>>(() => Object.fromEntries(heritageResearchCases.map(item => [item.id, newArExhibit(item.sources.flatMap(source => source.facts).filter(fact => fact.kind === 'confirmed').slice(0, 2).map(fact => fact.text))])));
  const heritage = heritageResearchCases.find(item => item.id === heritageId)!;
  const exhibit = exhibits[heritageId];
  const credit = imageCreditForEra(eraId, heritageId);
  const setExhibit = (value: ArExhibit) => setExhibits(current => ({ ...current, [heritageId]: value }));
  const lessonParams = new URLSearchParams(searchParams); lessonParams.set('view', 'activity');
  return <main className="page-width heritage-project" style={{ paddingBlock: '2rem' }}>
    <header className="project-paper">
      <Link to={`/${eraId}/lesson/9?${lessonParams}`} aria-disabled={busy} onClick={event => { if (busy) event.preventDefault(); }}>← 9차시 수업으로</Link>
      <p>수업 전 직접 체험하기</p>
      <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>{eraName(eraId)} AR 체험실</h1>
      <p>유물을 골라 설명점에 목소리를 붙여 보세요. 처음에는 사진으로 바로 시작해요.</p>
      <div className="ar-heritage-selector" role="group" aria-label="체험할 유물 선택">{heritageResearchCases.map(item => <button type="button" key={item.id} disabled={busy} aria-pressed={heritageId === item.id} onClick={() => setHeritageId(item.id)}><img src={heritageImageUrl(eraId, item.id)} alt="" /><span>{item.heritage}</span></button>)}</div>
      {eraId === "three-kingdoms" && heritageId === 3 && !exhibit.model && <div className="ar-preview-model"><button type="button" disabled={busy} onClick={() => setExhibit({ ...exhibit, model: cheomseongdaeModel() })}>첨성대 입체 모형 불러오기</button><p className="ar-help">공식 3D 원본을 처음 열 때 약 36MB를 내려받아요.</p></div>}
      {(eraId === "joseon" || heritageId !== 3) && !exhibit.model && <p className="ar-help">이 유물은 사진과 녹음으로 체험해요. 입체 모형은 선생님이 준비한 3D 파일을 넣어 사용할 수 있어요.</p>}
      <p className="ar-help">여기는 연습 화면이에요. 설명과 녹음은 이 화면을 닫으면 사라집니다. 학생의 수업 작업은 9차시에서 만들고 저장해 주세요.</p>
      {credit && <p className="ar-help">사진: {credit.alt} · <a href={credit.source} target="_blank" rel="noreferrer">{credit.credit}</a> · <a href={credit.licenseUrl} target="_blank" rel="noreferrer">이용 조건</a></p>}
    </header>
    <ArExhibitEditor eraId={eraId} key={heritageId} value={exhibit} onChange={setExhibit} onBusy={setBusy} heritage={heritage.heritage} heritageId={heritage.id} image={heritageImageUrl(eraId, heritage.id)} />
  </main>;
}
