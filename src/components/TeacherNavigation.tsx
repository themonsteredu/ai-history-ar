import { Link, useLocation } from 'react-router-dom';
import { readTeacherClass, teacherCodeParam, teacherRoomLink, teacherRoomPath, validTeacherCode, type TeacherCourse } from '../features/ar-studio/teacherClassNavigation';
import '../styles/teacher-navigation.css';

export function TeacherNavigation() {
  const { pathname, search } = useLocation();
  const params = new URLSearchParams(search);
  const requested = pathname.split('/')[2] || params.get('course');
  const course: TeacherCourse = requested === 'goryeo' || requested === 'joseon' ? requested : 'three-kingdoms';
  const code = params.has(teacherCodeParam(course))
    ? validTeacherCode(course, params.get(teacherCodeParam(course)) || '') : readTeacherClass(course);
  const home = `/teacher?course=${course}`;
  const isHome = pathname === '/teacher' || pathname === '/teacher/';
  const isRoom = pathname === teacherRoomPath(course);
  return <nav className="teacher-return-nav page-width" aria-label="교사 화면 이동">
    {!isHome && <Link to={isRoom ? home : teacherRoomLink(course, code)}>← 이전 화면</Link>}
    {!isRoom && code && <Link to={teacherRoomLink(course, code)}>수업 현황으로 돌아가기</Link>}
    {!isHome && !isRoom && <Link to={home}>수업 선택</Link>}
    {code && <span>수업코드 <b>{code}</b></span>}
    {isHome && !code && <span>수업 선택</span>}
  </nav>;
}
