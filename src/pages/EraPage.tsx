import { Link } from "react-router-dom";
import { EraArtwork } from "../components/EraArtwork";
import { LessonCard } from "../components/LessonCard";
import { getEra } from "../content/catalog";
import type { EraId } from "../types/curriculum";

export function EraPage({ eraId }: { eraId: EraId }) {
  const era = getEra(eraId);

  if (!era) return null;

  return (
    <>
      <section className={`era-hero era-hero--${era.id}`} style={{ "--era-accent": era.accent, "--era-soft": era.accentSoft } as React.CSSProperties}>
        <div className="page-width era-hero__grid">
          <div>
            <Link className="back-link" to="/"><span aria-hidden="true">←</span> 시대 선택</Link>
            <p className="eyebrow">초등학교 5학년 · {era.shortName} · {era.lessons.length}차시</p>
            <h1>{era.shortName} 수업</h1>
            <p>차시를 고른 뒤 수업 PPT를 띄우거나 웹앱 활동을 바로 실행하세요.</p>
          </div>
          <EraArtwork eraId={era.id} compact />
        </div>
      </section>

      <section className="page-width era-content">
        <div className="section-heading section-heading--split">
          <div>
            <p className="eyebrow">수업 화면 선택</p>
            <h2>몇 차시를 시작할까요?</h2>
          </div>
          <p>차시 목적에 따라 교사 공동 화면·활동지·학생 웹앱을 다르게 사용합니다.</p>
        </div>
        <div className="lesson-list">
          {era.lessons.map((lesson) => <LessonCard era={era} key={lesson.id} lesson={lesson} />)}
        </div>
      </section>

    </>
  );
}
