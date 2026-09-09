import { Link, useLocation } from "react-router-dom";
import { EraArtwork } from "../components/EraArtwork";
import { LessonCard } from "../components/LessonCard";
import { getEra } from "../content/catalog";
import type { EraId } from "../types/curriculum";
import { DataInquiryOverview } from '../components/DataInquiryOverview';
import { StudioOverview } from '../features/ar-studio/StudioOverview';
import { makerPath } from '../features/ar-studio/maker';

export function EraPage({ eraId }: { eraId: EraId }) {
  const era = getEra(eraId);
  const { search } = useLocation();

  if (!era) return null;

  return (
    <>
      <section className={`era-hero era-hero--${era.id}`} style={{ "--era-accent": era.accent, "--era-soft": era.accentSoft } as React.CSSProperties}>
        <div className="page-width era-hero__grid">
          <div>
            <Link className="back-link" to="/"><span aria-hidden="true">←</span> 시대 선택</Link>
            <p className="eyebrow">초등학교 5학년 · {era.shortName} · {era.id === 'three-kingdoms' ? '총 6차시 · 차시당 40분' : `${era.lessons.length}차시`}</p>
            <h1>{era.shortName} 수업</h1>
            <p>차시를 고른 뒤 수업 PPT를 띄우거나 활동 화면을 바로 실행하세요.</p>
            {era.id === 'three-kingdoms' && <div className="era-hero__maker-entry">
              <Link className="button" to={makerPath(search)}>AR 만들기 바로 시작</Link>
              <span>사진에 점 찍기 · 설명과 녹음 · 3D 모형 만들기</span>
            </div>}
          </div>
          <EraArtwork eraId={era.id} compact />
        </div>
      </section>

      <section className="page-width era-content">
        {era.id === 'three-kingdoms' && <DataInquiryOverview />}
        {era.id === 'three-kingdoms' && <StudioOverview />}
        {era.id !== 'three-kingdoms' && <>
        <div className="section-heading section-heading--split">
          <div>
            <p className="eyebrow">수업 화면 선택</p>
            <h2>몇 차시를 시작할까요?</h2>
          </div>
          <p>차시 목적에 따라 교사 공동 화면·활동지·학생 활동 화면을 다르게 사용합니다.</p>
        </div>
        <div className="lesson-list">
          {era.lessons.filter(lesson => era.id !== 'three-kingdoms' || lesson.id >= 8).map((lesson) => <LessonCard era={era} key={lesson.id} lesson={lesson} />)}
        </div>
        </>}
        {era.id === 'three-kingdoms' && <details className="data-inquiry-legacy"><summary>이전 수업·저장 작업 이어서 열기</summary><p>이전에 만든 작업을 이어갈 때 사용하세요. 새 수업은 위의 1~6차시로 진행합니다.</p><div className="lesson-list">{era.lessons.map(lesson => <LessonCard era={era} key={lesson.id} lesson={lesson} />)}</div></details>}
      </section>

    </>
  );
}
