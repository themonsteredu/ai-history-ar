import { NavLink, Outlet } from "react-router-dom";

function navClassName({ isActive }: { isActive: boolean }) {
  return isActive ? "site-nav__link site-nav__link--active" : "site-nav__link";
}

export function AppShell() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        본문으로 바로가기
      </a>
      <header className="site-header">
        <div className="site-header__inner page-width">
          <NavLink aria-label="인공지능과 역사 홈" className="brand" to="/">
            <span aria-hidden="true" className="brand__seal">史</span>
            <span className="brand__text">
              <strong>인공지능과 역사</strong>
              <small>의심하고 · 확인하고 · 설명하기</small>
            </span>
          </NavLink>
          <nav aria-label="주요 메뉴" className="site-nav">
            <NavLink className={navClassName} end to="/">과정 선택</NavLink>
            <NavLink className={navClassName} to="/three-kingdoms">삼국시대</NavLink>
            <NavLink className={navClassName} to="/joseon">조선시대</NavLink>
            <NavLink className={({ isActive }) => `${navClassName({ isActive })} site-nav__teacher`} to="/teacher">설정</NavLink>
          </nav>
        </div>
      </header>
      <main id="main-content"><Outlet /></main>
      <footer className="site-footer">
        <div className="page-width site-footer__inner">
          <div>
            <strong>인공지능과 역사</strong>
            <p>기술은 도구로, 학생의 검증과 성장을 수업의 결과로.</p>
          </div>
          <p className="site-footer__meta">초등학교 5학년 · 시대별 10차시 · 6모둠</p>
        </div>
      </footer>
    </div>
  );
}
