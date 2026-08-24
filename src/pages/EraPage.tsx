import { Link } from "react-router-dom";
import { EraArtwork } from "../components/EraArtwork";
import { Icon } from "../components/Icon";
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
            <p className="eyebrow">{era.eyebrow}</p>
            <h1>{era.title}</h1>
            <blockquote>“{era.coreQuestion}”</blockquote>
            <p>{era.description}</p>
            <div className="era-hero__meta">
              <span><Icon name="clock" size={18} />40분 × 10차시</span>
              <span><Icon name="users" size={18} />6개 탐구 모둠</span>
              <span><Icon name="check" size={18} />{era.verificationLabel}</span>
            </div>
          </div>
          <EraArtwork eraId={era.id} compact />
        </div>
      </section>

      <section className="page-width era-content">
        <div className="section-heading section-heading--split">
          <div>
            <p className="eyebrow">10차시 수업 여정</p>
            <h2>한 차시씩, 검증의 흔적을 쌓습니다</h2>
          </div>
          <span className="student-view-label"><Icon name="users" size={18} />학생 수업 안내</span>
        </div>
        <div className="lesson-list">
          {era.lessons.map((lesson) => <LessonCard era={era} key={lesson.id} lesson={lesson} />)}
        </div>
      </section>

      <section className="group-section">
        <div className="page-width">
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">6개 모둠 탐구 주제</p>
              <h2>같은 시대, 서로 다른 질문</h2>
            </div>
            <p>주조색과 시각 소재를 분리해 AR 카드가 서로 닮지 않도록 설계합니다.</p>
          </div>
          <div className="group-grid">
            {era.groups.map((group) => (
              <article className="group-card" key={group.id} style={{ "--group-color": group.color } as React.CSSProperties}>
                <div className="group-card__top">
                  <span>{group.id}모둠</span>
                  <span>{group.category}</span>
                </div>
                <h3>{group.heritage}</h3>
                <blockquote>“{group.inquiryQuestion}”</blockquote>
                <p>{group.visualCue}</p>
                <div className="group-card__color"><i />주조색 · {group.colorName}</div>
                {group.alternative ? <p className="group-card__alternative">대안: {group.alternative}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
