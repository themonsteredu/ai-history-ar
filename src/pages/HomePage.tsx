import { Link } from "react-router-dom";
import { EraArtwork } from "../components/EraArtwork";
import { Icon } from "../components/Icon";
import { eras } from "../content/catalog";

const phases = [
  {
    number: "01",
    title: "의심하기",
    lessons: "1–3차시",
    description: "AI가 알려준 설명에서 오류와 단정적인 표현을 직접 발견합니다.",
  },
  {
    number: "02",
    title: "확인하고 만들기",
    lessons: "4–7차시",
    description: "믿을 수 있는 자료로 확인하고, 검증한 내용으로 AR 카드를 설계합니다.",
  },
  {
    number: "03",
    title: "해설사 되기",
    lessons: "8–10차시",
    description: "자기 말로 해설을 만들고, 교실을 관람객이 참여하는 박물관으로 엽니다.",
  },
] as const;

export function HomePage() {
  return (
    <>
      <section className="home-hero">
        <div className="page-width home-hero__grid">
          <div className="home-hero__copy">
            <p className="eyebrow"><Icon name="spark" size={18} />AI 시대의 역사 수업</p>
            <h1>
              믿기 전에 <em>의심하고,</em><br />
              말하기 전에 <em>확인합니다.</em>
            </h1>
            <p className="home-hero__lead">
              AI의 설명을 그대로 받아 적지 않습니다. 학생이 오류를 찾고, 원본을 확인하고,
              자기 언어로 다시 설명하는 20차시 문화유산 AR 프로젝트입니다.
            </p>
            <div className="home-hero__actions">
              <a className="button button--primary" href="#courses">시대 선택하기 <Icon name="arrow" size={18} /></a>
              <Link className="button button--quiet" to="/teacher"><Icon name="book" size={18} />교사용 대시보드</Link>
            </div>
            <dl className="home-hero__stats">
              <div><dt>과정</dt><dd>2개 시대</dd></div>
              <div><dt>수업</dt><dd>총 20차시</dd></div>
              <div><dt>탐구</dt><dd>12개 문화유산</dd></div>
            </dl>
          </div>
          <div className="home-hero__visual" aria-hidden="true">
            <img alt="" decoding="async" fetchPriority="high" height="1536" src="/images/home-cover.webp" width="1536" />
          </div>
        </div>
      </section>

      <section className="course-section page-width" id="courses">
        <div className="section-heading section-heading--split">
          <div>
            <p className="eyebrow">두 시대, 서로 다른 질문</p>
            <h2>어느 역사 속으로 들어갈까요?</h2>
          </div>
          <p>각 과정은 10차시로 독립 운영되며, 마지막에는 6개 부스의 AR 교실 박물관이 열립니다.</p>
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
                <blockquote>“{era.coreQuestion}”</blockquote>
                <p>{era.description}</p>
                <div className="verification-row" aria-label={`${era.verificationLabel}: ${era.verificationSteps.join(", ")}`}>
                  <strong>{era.verificationLabel}</strong>
                  {era.verificationSteps.map((step) => <span key={step}>{step}</span>)}
                </div>
                <Link className="era-card__link" to={era.route}>10차시 살펴보기 <Icon name="arrow" size={19} /></Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="phase-section">
        <div className="page-width">
          <div className="section-heading">
            <p className="eyebrow">결과보다 검증의 흔적</p>
            <h2>모든 수업은 세 막으로 이어집니다</h2>
          </div>
          <div className="phase-grid">
            {phases.map((phase) => (
              <article className="phase-card" key={phase.number}>
                <span className="phase-card__number">{phase.number}</span>
                <div>
                  <p>{phase.lessons}</p>
                  <h3>{phase.title}</h3>
                  <p>{phase.description}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="teacher-banner">
            <div className="teacher-banner__icon"><Icon name="folder" size={26} /></div>
            <div>
              <p className="eyebrow">수업 준비를 한곳에서</p>
              <h3>교사용 운영안과 차시별 다운로드 목록</h3>
              <p>20개 차시의 목표, 40분 시간표, 준비물, 평가, 사전 준비와 활동지 구성을 확인할 수 있습니다.</p>
            </div>
            <Link className="button button--light" to="/teacher">교사용 화면 열기 <Icon name="arrow" size={18} /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
