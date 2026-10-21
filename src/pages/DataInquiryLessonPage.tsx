import DataLab from '../features/data-lab/DataLab';
import { useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { dataInquiryFiles, dataInquiryPath, dataInquirySlideImage, dataInquirySlides, dataInquiryWorksheet, getDataInquirySession } from '../content/three-kingdoms/dataInquiry';
import { studioPath } from '../features/ar-studio/curriculum';
import { NotFoundPage } from './NotFoundPage';
import '../styles/data-inquiry.css';




function TeachingSlides({ sessionId }: { sessionId: number }) {
  const slides = dataInquirySlides(sessionId);
  const [current, setCurrent] = useState(0);
  const [message, setMessage] = useState('');
  const stage = useRef<HTMLDivElement>(null);
  const slide = slides[current];
  const move = (delta: number) => setCurrent(value => Math.max(0, Math.min(slides.length - 1, value + delta)));
  async function fullscreen() {
    try { await stage.current?.requestFullscreen(); stage.current?.focus(); }
    catch { setMessage('이 기기에서는 전체 화면을 열 수 없어요. 현재 화면에서 넘겨 보세요.'); }
  }
  return <section className="data-inquiry-presentation">
    <div className="data-inquiry-actions"><h2>{sessionId}차시 수업 PPT</h2><button type="button" className="button button--outline" onClick={fullscreen}>전체 화면</button><a className="button button--outline" href={dataInquiryFiles.ppt} download>편집용 PPT 받기 · 전체 28장</a></div>
    <div className="data-inquiry-viewer" ref={stage} tabIndex={0} aria-label="수업 슬라이드. 방향키로 넘기기" onKeyDown={event => {
      if ((event.target as HTMLElement).closest('select, button, a, input')) return;
      if (event.key === 'ArrowRight' || event.key === 'PageDown') { event.preventDefault(); move(1); }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); move(-1); }
      if (event.key === 'Home') { event.preventDefault(); setCurrent(0); }
      if (event.key === 'End') { event.preventDefault(); setCurrent(slides.length - 1); }
    }}>
      <img className="data-inquiry-slide" src={dataInquirySlideImage(slide.number)} alt={slide.title} width="1280" height="720" />
      <div className="data-inquiry-slide-controls">
        <button className="button button--outline" type="button" disabled={current === 0} onClick={() => move(-1)}>이전</button>
        <label>슬라이드 <select value={current} onChange={event => setCurrent(Number(event.target.value))}>{slides.map((item, index) => <option key={item.number} value={index}>{index + 1}. {item.title}</option>)}</select></label>
        <span aria-live="polite">{current + 1} / {slides.length}</span>
        <button className="button button--outline" type="button" disabled={current === slides.length - 1} onClick={() => move(1)}>다음</button>
      </div>
    </div>
    {message && <p role="status">{message}</p>}
    <details className="data-inquiry-transcript"><summary>현재 슬라이드 내용 읽기</summary><p>{slide.text}</p></details>
  </section>;
}

export function DataInquiryLessonPage({ teacher = false }: { teacher?: boolean }) {
  const { sessionId } = useParams();
  const session = getDataInquirySession(sessionId);
  const [params] = useSearchParams();
  if (!session) return <NotFoundPage />;
  const view = params.get('view') === 'ppt' ? 'ppt' : params.get('view') === 'activity' ? 'activity' : 'start';
  const context = new URLSearchParams(params);
  context.delete('view');
  const home = `${teacher ? '/teacher' : '/three-kingdoms'}${context.size ? `?${context}` : ''}`;
  const path = (id: number, nextView = 'start') => {
    const publicPath = dataInquiryPath(id, nextView, params.toString());
    return teacher ? publicPath.replace('/three-kingdoms/', '/teacher/three-kingdoms/') : publicPath;
  };
  return <div className="data-inquiry-page">
    <header className="classroom-header"><div className="page-width classroom-header__inner">
      <Link className="back-link" to={home}>← 삼국시대 수업</Link>
      <div className="classroom-header__title"><span>0{session.id}</span><div><p>삼국시대 · 데이터 탐구 {session.id}차시</p><h1>{session.title}</h1></div></div>
      <nav className="classroom-tabs classroom-tabs--three" aria-label="수업 화면 선택">
        {([['start', '수업 시작'], ['ppt', '수업 PPT'], ['activity', '표·그래프 활동']] as const).map(([key, label]) => <Link key={key} className={view === key ? 'is-active' : ''} aria-current={view === key ? 'page' : undefined} to={path(session.id, key)}><strong>{label}</strong></Link>)}
      </nav>
    </div></header>
    <main className="page-width classroom-content">
      {view === 'ppt' ? <TeachingSlides key={session.id} sessionId={session.id} /> : <>
        <header className="section-heading"><div><p className="eyebrow">{session.timing}</p><h2>{view === 'start' ? '오늘의 목표' : '활동지와 같은 순서로 해요'}</h2></div><p>{session.objective}</p></header>
        {view === 'start' ? <div className="data-inquiry-actions"><Link className="button button--primary" to={path(session.id, 'ppt')}>수업 PPT 열기</Link><Link className="button button--outline" to={path(session.id, 'activity')}>활동 시작하기</Link></div> : <>
          <ol className="data-inquiry-steps">{session.steps.map(step => <li key={step}>{step}</li>)}</ol>
          {session.id === 1 && <section className="data-inquiry-practice"><h3>기존 조사 자료부터 확인해요</h3><p>출처번호 · 만든 기관 · 자료 제목 · 링크 또는 쪽수를 활동지에 남겨요. 새 AI 계정은 필요하지 않아요.</p><div className="data-inquiry-actions"><a href="https://www.heritage.go.kr/" target="_blank" rel="noreferrer">국가유산포털 ↗</a><a href="https://www.museum.go.kr/" target="_blank" rel="noreferrer">국립중앙박물관 ↗</a></div></section>}
          {session.id >= 2 && <DataLab era="three-kingdoms" graph={session.id === 3} />}

        </>}
        <p className="data-inquiry-takeaway">{session.takeaway}</p>
      </>}
      <section className="data-inquiry-materials" aria-label="이번 차시 수업 자료"><h2>이 차시 활동지</h2><p>차시당 A4 한 장입니다. 빈칸은 할당량이 아니에요.</p><div className="data-inquiry-actions"><a className="button button--primary" href={dataInquiryWorksheet(session.id)} download>{session.id}차시 학생 활동지 받기</a><a className="button button--outline" href={dataInquiryFiles.students} download>활동지 3쪽 모아 받기</a>{teacher && <a className="button button--outline" href={dataInquiryFiles.teacher} download>교사용 운영 안내</a>}</div></section>
      <nav className="classroom-pagination" aria-label="데이터 탐구 이전·다음 차시">{session.id > 1 ? <Link to={path(session.id - 1)}><span>이전</span><strong>← {session.id - 1}차시</strong></Link> : <span />}{session.id < 3 ? <Link to={path(session.id + 1)}><span>다음</span><strong>{session.id + 1}차시 →</strong></Link> : <Link to={studioPath(params.toString(), teacher ? 'guide' : 'model', teacher, 4)}><span>데이터 탐구 완료 · 다음 활동</span><strong>4차시 입체모형 만들기 →</strong></Link>}</nav>
    </main>
  </div>;
}
