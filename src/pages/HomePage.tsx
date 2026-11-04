import { Link, useLocation } from 'react-router-dom';
import { dataInquiryPath, dataInquirySessions } from '../content/three-kingdoms/dataInquiry';
import { arLessons, studioPath } from '../features/ar-studio/curriculum';
import joseonLessons from '../content/joseon/six-course.json';
import './home-courses.css';

export function HomePage() {
  const { search } = useLocation();

  return <div className="home-courses">
    <header className="home-courses__hero">
      <img src={`${import.meta.env.BASE_URL}images/home-cover-ink-v2.jpg`} alt="" aria-hidden="true" />
      <div className="home-courses__hero-inner page-width">
        <p className="home-courses__eyebrow">초등학교 5학년 · 역사 탐구</p>
        <h1>인공지능과 역사</h1>
        <p>시대와 수업을 선택해 시작하세요.</p>
        <a className="home-courses__jump" href="#courses">수업 둘러보기 <span aria-hidden="true">↓</span></a>
      </div>
    </header>

    <div className="home-courses__content page-width" id="courses">
      <div className="home-courses__heading">
        <div><p className="home-courses__kicker">수업 선택</p><h2>어떤 수업을 시작할까요?</h2></div>
        <Link className="home-courses__teacher" to="/teacher">교사 설정 <span aria-hidden="true">↗</span></Link>
      </div>

      <section className="home-courses__section" aria-labelledby="series-heading">
        <div className="home-courses__section-head"><div><p className="home-courses__kicker">차시별 과정</p><h3 id="series-heading">자료 탐구부터 AR 박물관까지</h3></div><p>각 6차시 · 차시당 40분</p></div>
        <div className="home-courses__grid">
          <article className="home-courses__course">
            <div className="home-courses__course-head"><span className="home-courses__tag">삼국시대</span><h4>삼국 문화유산 탐구</h4><p>자료 조사·그래프 분석 · AR 전시 만들기</p></div>
            <div className="home-courses__actions"><Link className="home-courses__primary" to={`/three-kingdoms${search}`}>6차시 전체 보기 <span aria-hidden="true">→</span></Link></div>
            <details className="home-courses__lessons"><summary>차시별 수업 바로 열기</summary><ol>
              {dataInquirySessions.map(lesson=><li key={lesson.id}><Link to={dataInquiryPath(lesson.id,'start',search)}><span>{lesson.id}차시</span><b>{lesson.title}</b><span aria-hidden="true">↗</span></Link></li>)}
              {arLessons.map(lesson=><li key={lesson.id}><Link to={studioPath(search,lesson.step,false,lesson.id)}><span>{lesson.id}차시</span><b>{lesson.title}</b><span aria-hidden="true">↗</span></Link></li>)}
            </ol></details>
          </article>
          <article className="home-courses__course">
            <div className="home-courses__course-head"><span className="home-courses__tag">조선시대</span><h4>조선 문화유산 탐구</h4><p>자료 조사·그래프 분석 · AR 전시 만들기</p></div>
            <div className="home-courses__actions"><Link className="home-courses__primary" to={`/joseon${search}`}>6차시 전체 보기 <span aria-hidden="true">→</span></Link></div>
            <details className="home-courses__lessons"><summary>차시별 수업 바로 열기</summary><ol>
              {joseonLessons.map(lesson=><li key={lesson.id}><Link to={`/joseon/course/${lesson.id}${search}`}><span>{lesson.id}차시</span><b>{lesson.title}</b><span aria-hidden="true">↗</span></Link></li>)}
            </ol></details>
          </article>
        </div>
      </section>

      <section className="home-courses__section" aria-labelledby="open-heading">
        <div className="home-courses__section-head"><div><p className="home-courses__kicker">유물 탐구 수업</p><h3 id="open-heading">유물 AR 카드와 AI 문제 검증</h3></div><p>모둠별 활동 · 수업코드 입장</p></div>
        <div className="home-courses__grid">
          <article className="home-courses__open">
            <div><span className="home-courses__tag">고려시대</span><h4>고려 유물 수업</h4><p>AR 카드 만들기 · AI 문제 검증 · 발표</p></div>
            <div className="home-courses__open-actions"><Link className="home-courses__primary" to={`/goryeo${search}`}>학생 입장 <span aria-hidden="true">→</span></Link><Link className="home-courses__secondary" to="/teacher/goryeo/open-class">교사 화면</Link></div>
          </article>
          <article className="home-courses__open">
            <div><span className="home-courses__tag">조선시대</span><h4>조선 과학 유물 수업</h4><p>AR 카드 만들기 · AI 문제 검증 · 발표</p></div>
            <div className="home-courses__open-actions"><Link className="home-courses__primary" to={`/joseon/open-class${search}`}>학생 입장 <span aria-hidden="true">→</span></Link><Link className="home-courses__secondary" to="/teacher/joseon/open-class">교사 화면</Link></div>
          </article>
        </div>
      </section>
    </div>
  </div>;
}
