import { Link, useLocation } from 'react-router-dom';
import { samplePath } from './sample';
import { makerPath } from './maker';
import { arLessons, studioPath } from './curriculum';
import './studio.css';
export function StudioOverview({ teacher = false }: { teacher?: boolean }) {
  const { search } = useLocation();
  return <section className="studio-overview" aria-label="AR 제작 4~6차시"><div className="section-heading"><div><p className="eyebrow">총 6차시 · 차시당 40분</p><h2>조사한 유물을 우리 반 AR 전시로</h2></div><p>4차시 모형 → 5차시 해설·문제 → 6차시 관람·개인 퀴즈</p></div><div className="studio-sample-entry"><div><strong>AR 만들기 · 준비된 유물에 설명 붙이기</strong><p>유물에 맞는 입체 모형을 고르고 점을 찍어 설명·녹음을 붙여요. 퀴즈와 AR 체험도 한곳에서 할 수 있어요.</p></div><Link className="button button--primary" to={makerPath(search, teacher)}>AR 만들기</Link></div><div className="studio-sample-entry"><div><strong>표·그래프를 이미 끝냈거나, AR만 먼저 확인하고 싶나요?</strong><p>준비된 첨성대 모형과 해설로 바로 체험하세요.</p></div><Link className="button button--primary" to={samplePath(search)}>예제로 AR 바로 체험</Link></div><div className="lesson-list">{arLessons.map(lesson => <article className="lesson-card lesson-card--classroom" key={lesson.id}><div className="lesson-card__number">0{lesson.id}</div><div className="lesson-card__body"><p className="eyebrow">{lesson.id}차시 · 40분</p><h3>{lesson.title}</h3><p>{lesson.goal}</p></div><Link className="button button--primary" to={studioPath(search, teacher ? 'guide' : lesson.step, teacher, lesson.id)}>{teacher ? '설명·시범·활동 안내' : '학생 활동 열기'}</Link></article>)}</div>{!teacher && <Link className="button button--outline" to={studioPath(search, 'guide', false, 4)}>교사 수업 순서 보기</Link>}</section>;
}
