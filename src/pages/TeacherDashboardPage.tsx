import '../styles/teacher-course.css';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { JoseonCourseOverview } from '../components/JoseonCourseOverview';
import { DataInquiryOverview } from '../components/DataInquiryOverview';
import { LessonCard } from '../components/LessonCard';
import { getEra } from '../content/catalog';
import { StudioOverview } from '../features/ar-studio/StudioOverview';
import { readingsPackUrl } from '../features/open-class/HeritageReading';
import { OpenLessonMaterials } from '../features/open-class/OpenLessonMaterials';

const courses = [
  { id: 'three-kingdoms', name: '삼국시대', detail: '데이터 탐구 · AR 전시', count: '6차시' },
  { id: 'goryeo', name: '고려시대', detail: '유물 AR 카드 · 공개수업', count: '공개수업' },
  { id: 'joseon', name: '조선시대', detail: '데이터 탐구 · 과학 유물', count: '6차시 · 공개수업' },
] as const;
type CourseId = typeof courses[number]['id'];

export function TeacherDashboardPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('course');
  const selected: CourseId = courses.some(course => course.id === requested) ? requested as CourseId : 'three-kingdoms';
  const [query, setQuery] = useState('');
  const era = selected === 'goryeo' ? undefined : getEra(selected);
  const visibleLessons = era?.lessons.filter(lesson => `${lesson.id} ${lesson.title} ${lesson.objective} ${lesson.outputs.join(' ')}`.toLocaleLowerCase('ko-KR').includes(query.trim().toLocaleLowerCase('ko-KR'))) ?? [];
  const base = import.meta.env.BASE_URL;

  return <div className="teacher-page teacher-course-home">
    <section className="teacher-course-intro"><div className="page-width"><p className="eyebrow">선생님을 위한 수업 공간</p><h1>어떤 수업을 준비하시나요?</h1><p>수업을 선택하면 지도안과 활동 자료, 수업 진행 화면을 한곳에서 볼 수 있습니다.</p></div></section>
    <div className="page-width teacher-course-content">
      <nav className="teacher-course-tabs" aria-label="수업 선택">
        {courses.map(course => <button type="button" key={course.id} aria-pressed={selected === course.id} onClick={() => { const next = new URLSearchParams(params); next.set('course', course.id); setParams(next); setQuery(''); }}><span>{course.count}</span><strong>{course.name}</strong><small>{course.detail}</small></button>)}
      </nav>
      <section className="teacher-course-section" aria-labelledby="course-title">
        <div className="teacher-course-heading"><div><p className="eyebrow">선택한 수업</p><h2 id="course-title">{courses.find(course => course.id === selected)?.name} 수업</h2><p>{selected === 'goryeo' ? '완성된 유물 카드로 발표하고 AI 문제를 검증합니다.' : '차시별 수업과 교사용 자료를 확인하세요.'}</p></div>
        {selected !== 'goryeo' && <label className="search-field"><span className="sr-only">차시 검색</span><input type="search" placeholder="차시·활동 검색" value={query} onChange={event => setQuery(event.target.value)} /></label>}</div>
        <div className="teacher-quick-links" aria-label="수업별 바로가기">
          {selected === 'three-kingdoms' && <><Link to="/teacher/three-kingdoms/ar"><strong>AR 수업 관리</strong><span>수업코드와 모둠 현황 →</span></Link><Link to="/teacher/three-kingdoms/tools"><strong>외부 도구 설정</strong><span>수업 도구 연결 →</span></Link><Link to="/teacher/three-kingdoms/downloads"><strong>자료 모아보기</strong><span>활동지·카드·답안 →</span></Link></>}
          {selected === 'goryeo' && <><Link to="/teacher/goryeo/open-class"><strong>고려 수업 관리</strong><span>수업코드·모둠 현황·박물관 칠판 →</span></Link><a href={`${base}downloads/goryeo/open-class/student-worksheet.pdf`} download><strong>학생 활동지</strong><span>PDF 내려받기 →</span></a><a href={readingsPackUrl('goryeo')} target="_blank" rel="noopener noreferrer"><strong>유물 역사신문</strong><span>6종 읽기 자료 열기 →</span></a></>}
          {selected === 'joseon' && <><Link to="/teacher/joseon/open-class"><strong>조선 공개수업 관리</strong><span>수업코드·모둠 현황·박물관 칠판 →</span></Link><Link to="/teacher/joseon/downloads"><strong>자료 모아보기</strong><span>활동지·카드·답안 →</span></Link><a href={readingsPackUrl('joseon')} target="_blank" rel="noopener noreferrer"><strong>유물 역사신문</strong><span>6종 읽기 자료 열기 →</span></a></>}
        </div>
        {selected === 'three-kingdoms' && <><DataInquiryOverview teacher query={query} /><StudioOverview teacher /></>}
        {selected === 'joseon' && <JoseonCourseOverview teacher query={query} />}
        {selected !== 'three-kingdoms' && <OpenLessonMaterials era={selected} />}
        {selected === 'goryeo' && <div className="teacher-course-note"><h3>수업 진행 순서</h3><p>완성된 AR 카드 발표 → AI 문제 만들기 → 두 문제 검증 → 퀴즈 발표 → 배움 정리</p><p>수업 관리 화면에서 인식 카드 인쇄와 모둠별 진행 상황을 확인할 수 있습니다.</p></div>}
        {era && <details className="data-inquiry-legacy"><summary>이전 수업 지도안·저장 작업</summary><p>이전에 사용한 차시별 지도안과 자료를 확인할 수 있습니다.</p><div className="lesson-list lesson-list--teacher">{visibleLessons.map(lesson => <LessonCard era={era} key={lesson.id} lesson={lesson} mode="teacher" />)}</div>{visibleLessons.length === 0 && <p>검색 결과가 없습니다.</p>}</details>}
      </section>
    </div>
  </div>;
}
