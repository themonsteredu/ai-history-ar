import { Link, useLocation } from 'react-router-dom';
import { dataInquiryFiles, dataInquiryPath, dataInquirySessions, dataInquiryWorksheet } from '../content/three-kingdoms/dataInquiry';
import '../styles/data-inquiry.css';

export function DataInquiryOverview({ teacher = false, query = '' }: { teacher?: boolean; query?: string }) {
  const { search } = useLocation();
  const sessions = dataInquirySessions.filter(session => `${session.id} ${session.title} ${session.objective}`.includes(query.trim()));
  return <section className="data-inquiry-overview" aria-label="삼국시대 데이터 탐구 3차시">
    <header className="section-heading">
      <div><p className="eyebrow">삼국시대 · 데이터 탐구 3차시</p><h2>조사한 문장에서 우리 반 그래프까지</h2></div>
      <p>모둠에서는 자료를 정리하고, 마지막에는 1~6모둠의 자료를 합칩니다.</p>
    </header>
    <div className="lesson-list">
      {sessions.map(session => <article className="lesson-card lesson-card--classroom" key={session.id}>
        <div className="lesson-card__number">0{session.id}</div>
        <div className="lesson-card__body"><p className="eyebrow">{session.id}차시 · 40분</p><h3>{session.title}</h3><p>{session.objective}</p></div>
        <div className="data-inquiry-actions">
          <Link className="button button--primary" to={teacher ? dataInquiryPath(session.id, 'start', search).replace('/three-kingdoms/', '/teacher/three-kingdoms/') : dataInquiryPath(session.id, 'start', search)}>수업 열기</Link>
          <a className="button button--outline" href={dataInquiryWorksheet(session.id)} download>{session.id}차시 활동지</a>
        </div>
      </article>)}
    </div>
    {sessions.length === 0 && <p role="status">검색과 일치하는 데이터 탐구 차시가 없습니다.</p>}
    <div className="data-inquiry-actions data-inquiry-materials">
      <a className="button button--outline" href={dataInquiryFiles.ppt} download>이론 수업 PPT · 28장</a>
      <a className="button button--outline" href={dataInquiryFiles.students} download>학생 활동지 · 3쪽</a>
      {teacher && <><a className="button button--outline" href={dataInquiryFiles.teacher} download>교사용 운영 안내</a><a className="button button--outline" href={dataInquiryFiles.bundle} download>3차시 전체 자료 ZIP</a></>}
    </div>
  </section>;
}
