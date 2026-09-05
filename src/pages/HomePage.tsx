import { Link } from "react-router-dom";
import { EraArtwork } from "../components/EraArtwork";
import { Icon } from "../components/Icon";
import { eras } from "../content/catalog";

export function HomePage() {
  const scrollToCourses = () => {
    document.getElementById("courses")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <section className="home-hero">
        <div className="home-hero__visual" aria-hidden="true">
          <img
            alt=""
            decoding="async"
            fetchPriority="high"
            height="945"
            src={`${import.meta.env.BASE_URL}images/home-cover-ink-v2.jpg`}
            width="1680"
          />
        </div>
        <div className="page-width home-hero__grid">
          <div className="home-hero__copy">
            <p className="home-hero__kicker">초등학교 5학년 · 역사 탐구 프로젝트</p>
            <h1>
              AI의 역사 설명을<br />
              믿는 데서 끝내지 않는다
            </h1>
            <p className="home-hero__lead">
              문화유산을 살펴보고, 출처를 확인하고, 우리 말로 설명합니다.<br />
              삼국시대와 조선시대를 만나는 {eras.reduce((total, era) => total + era.lessons.length, 0)}차시 AR 역사 수업입니다.
            </p>
            <div className="home-hero__actions">
              <button className="button home-hero__primary" type="button" onClick={scrollToCourses}>
                역사 수업 시작하기 <Icon name="arrow" size={18} />
              </button>
              <Link className="home-hero__teacher" to="/teacher"><Icon name="lock" size={15} />설정</Link>
            </div>
            <p className="home-hero__meta">{eras.map((era) => `${era.shortName} ${era.lessons.length}차시`).join(" · ")} · 6모둠 문화유산 탐구</p>
          </div>
        </div>
      </section>

      <section className="course-section page-width" id="courses">
        <div className="section-heading section-heading--split">
          <div>
            <p className="eyebrow">수업 시작</p>
            <h2>시대를 선택하세요</h2>
          </div>
          <p>시대를 고르면 차시별 수업 PPT와 활동 화면이 바로 열립니다.</p>
        </div>
        <div className="era-card-grid">
          {eras.map((era, index) => (
            <article className={`era-card era-card--${era.id}`} key={era.id}>
              <div className="era-card__art">
                <EraArtwork eraId={era.id} />
                <span className="era-card__index">0{index + 1}</span>
              </div>
              <div className="era-card__body">
                <p className="era-card__eyebrow">{era.eyebrow}</p>
                <h3>{era.shortName}</h3>
                <p>수업 PPT · 활동 화면 · {era.lessons.length}차시</p>
                <Link className="era-card__link" to={era.route}>수업 열기 <Icon name="arrow" size={19} /></Link>
              </div>
            </article>
          ))}
        </div>
      </section>

    </>
  );
}
