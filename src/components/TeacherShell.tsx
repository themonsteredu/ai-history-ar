import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Icon } from "./Icon";

interface TeacherShellProps {
  onLock: () => void;
}

function teacherNavClassName({ isActive }: { isActive: boolean }) {
  return isActive ? "teacher-nav__link teacher-nav__link--active" : "teacher-nav__link";
}

export function TeacherShell({ onLock }: TeacherShellProps) {
  const { search } = useLocation();
  const courseLink = (course: string) => {
    const params = new URLSearchParams(search);
    params.set('course', course);
    return `/teacher?${params.toString()}`;
  };
  return (
    <div className="teacher-shell">
      <a className="skip-link" href="#teacher-main-content">본문으로 바로가기</a>
      <header className="teacher-workspace-header">
        <div className="teacher-workspace-header__inner page-width">
          <Link aria-label="교사 설정 홈" className="teacher-brand" to={`/teacher${search}`}>
            <span aria-hidden="true" className="teacher-brand__icon"><Icon name="lock" size={20} /></span>
            <span>
              <small>PIN LOCKED · TEACHER ONLY</small>
              <strong>교사 설정</strong>
            </span>
          </Link>
          <nav aria-label="교사용 메뉴" className="teacher-nav">
            <NavLink className={teacherNavClassName} end to={`/teacher${search}`}>수업별 설정</NavLink>
            <Link className="teacher-nav__link" to={courseLink("three-kingdoms")}>삼국시대</Link>
            <Link className="teacher-nav__link" to={courseLink("goryeo")}>고려시대</Link>
            <Link className="teacher-nav__link" to={courseLink("joseon")}>조선시대</Link>
          </nav>
          <div className="teacher-workspace-actions">
            <Link className="teacher-workspace-actions__student" title="교사 확인 중에는 학생 화면에서 전체 메뉴를 볼 수 있어요" to="/classes">학생 화면</Link>
            <button className="teacher-workspace-actions__lock" onClick={onLock} type="button">
              <Icon name="lock" size={16} />잠그기
            </button>
          </div>
        </div>
      </header>
      <main id="teacher-main-content"><Outlet /></main>
    </div>
  );
}
