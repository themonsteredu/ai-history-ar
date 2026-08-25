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
          <Link aria-label="교사 설정 홈" className="teacher-brand" to="/teacher">
            <span aria-hidden="true" className="teacher-brand__icon"><Icon name="lock" size={20} /></span>
            <span>
              <small>PIN LOCKED · TEACHER ONLY</small>
              <strong>교사 설정</strong>
            </span>
          </Link>
          <nav aria-label="교사용 메뉴" className="teacher-nav">
            <NavLink className={teacherNavClassName} end to="/teacher">지도안</NavLink>
            <NavLink className={teacherNavClassName} to="/teacher/three-kingdoms/tools">외부 도구</NavLink>
            <NavLink className={teacherNavClassName} to="/teacher/three-kingdoms/downloads">삼국 활동지</NavLink>
            <NavLink className={teacherNavClassName} to="/teacher/joseon/downloads">조선 활동지</NavLink>
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
