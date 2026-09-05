import { useState } from 'react';
import { Link } from 'react-router-dom';
import ArExhibitEditor from '../components/ArExhibitEditor';
import { cheomseongdaeModel } from '../content/three-kingdoms/arModels';
import { heritageResearchCases } from '../content/three-kingdoms/webActivities';
import { newArExhibit, type ArExhibit } from '../lib/ar/exhibit';
import '../styles/heritage-project.css';

const heritage = heritageResearchCases[2];

export default function ArPreviewPage() {
  const [busy, setBusy] = useState(false);
  const [exhibit, setExhibit] = useState<ArExhibit>(() => ({
    ...newArExhibit(heritage.sources.flatMap(source => source.facts).slice(0, 2).map(fact => fact.text)),
    model: cheomseongdaeModel(),
  }));
  return <main className="page-width heritage-project" style={{ paddingBlock: '2rem' }}>
    <header className="project-paper">
      <Link to="/three-kingdoms/lesson/9" aria-disabled={busy} onClick={event => { if (busy) event.preventDefault(); }}>← 9차시 수업으로</Link>
      <p>수업 전 직접 체험하기</p>
      <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>첨성대 AR 미리보기</h1>
      <ol><li>설명점을 고르고 내 목소리를 녹음해요.</li><li>‘친구 화면으로 체험’을 눌러 설명점을 눌러 봐요.</li><li>인식용 사진을 받아 출력한 뒤, ‘카메라 AR 켜기’로 비춰요.</li></ol>
      <p className="ar-help">여기는 연습 화면이에요. 설명과 녹음은 이 화면을 닫으면 사라집니다. 학생의 수업 작업은 9차시에서 만들고 저장해 주세요.</p>
    </header>
    <ArExhibitEditor value={exhibit} onChange={setExhibit} onBusy={setBusy} heritage={heritage.heritage} heritageId={heritage.id} image={`${import.meta.env.BASE_URL}images/heritage/three-kingdoms/${heritage.image}`} />
  </main>;
}
