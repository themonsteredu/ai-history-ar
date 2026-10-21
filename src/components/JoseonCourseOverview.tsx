import { Link } from 'react-router-dom';
import lessons from '../content/joseon/six-course.json';
export function JoseonCourseOverview({ teacher = false, query = '' }: { teacher?: boolean; query?: string }) {
  return <section aria-label="조선시대 데이터와 AR 6차시">
    <div className="section-heading"><div><p className="eyebrow">조선시대 · 차시당 40분</p><h2>자료 검증부터 우리 반 AR 박물관까지</h2></div><p>1~3차시에는 자료와 학급 그래프, 4~6차시에는 AR 전시와 관람 문제를 만듭니다.</p></div>
    <div className="lesson-list">{lessons.filter(l => `${l.id} ${l.title} ${l.objective}`.includes(query.trim())).map(l => <article className="lesson-card" key={l.id}><div className="lesson-card__number">0{l.id}</div><div className="lesson-card__body"><h3>{l.title}</h3><p>{l.objective}</p></div><div className="data-inquiry-actions"><Link className="button button--primary" to={`${teacher ? '/teacher' : ''}/joseon/course/${l.id}`}>수업 열기</Link><a className="button button--outline" href={`${import.meta.env.BASE_URL}downloads/joseon/course/lesson-${l.id}-student.pdf`} download>활동지</a></div></article>)}</div>
    <div className="data-inquiry-actions"><a className="button button--outline" href={`${import.meta.env.BASE_URL}downloads/joseon/course/teaching.pptx`} download>6차시 수업 PPT · 54장</a><a className="button button--outline" href={`${import.meta.env.BASE_URL}downloads/joseon/course/student-all.pdf`} download>활동지 모아 받기</a><Link className="button button--outline" to={teacher ? '/teacher/joseon/open-class' : '/joseon/open-class'}>공개수업 · 과학 유물 AR 카드</Link></div>
  </section>;
}
