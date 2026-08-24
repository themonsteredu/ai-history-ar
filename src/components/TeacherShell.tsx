import { Link, NavLink, Outlet } from "react-router-dom";
import { Icon } from "./Icon";

interface TeacherShellProps {
  onLock: () => void;
}

function teacherNavClassName({ isActive }: { isActive: boolean }) {
  return isActive ? "teacher-nav__link teacher-nav__link--active" : "teacher-nav__link";
}

export function TeacherShell({ onLock }: TeacherShellProps) {
  return (
    <div className="teacher-shell">
      <a className="skip-link" href="#teacher-main-content">본문으로 바로가기</a>
      <header className="teacher-workspace-header">
        <div className="teacher-workspace-header__inner page-width">
          <Link aria-label="교사용 수업 준비실 홈" className="teacher-brand" to="/teacher">
            <span aria-hidden="true" className="teacher-brand__icon"><Icon name="lock" size={20} /></span>
            <span>
              <small>TEACHER WORKSPACE</small>
              <strong>교사용 수업 준비실</strong>
            </span>
          </Link>
          <nav aria-label="교사용 메뉴" className="teacher-nav">
            <NavLink className={teacherNavClassName} end to="/teacher">운영안</NavLink>
            <NavLink className={teacherNavClassName} to="/teacher/three-kingdoms/downloads">삼국 자료</NavLink>
            <NavLink className={teacherNavClassName} to="/teacher/joseon/downloads">조선 자료</NavLink>
          </nav>
          <div className="teacher-workspace-actions">
            <Link className="teacher-workspace-actions__student" to="/">학생 화면</Link>
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
