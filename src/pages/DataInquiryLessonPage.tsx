import { useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { dataInquiryFiles, dataInquiryPath, dataInquirySlideImage, dataInquirySlides, dataInquiryWorksheet, getDataInquirySession } from '../content/three-kingdoms/dataInquiry';
import { studioPath } from '../features/ar-studio/curriculum';
import { NotFoundPage } from './NotFoundPage';
import '../styles/data-inquiry.css';

const codap = 'https://codap.concord.org/app/';
const categories = ['언제·어디', '재료·방법', '생김새', '쓰임·생활'];

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
        {([['start', '수업 시작'], ['ppt', '수업 PPT'], ['activity', '활동지·CODAP']] as const).map(([key, label]) => <Link key={key} className={view === key ? 'is-active' : ''} aria-current={view === key ? 'page' : undefined} to={path(session.id, key)}><strong>{label}</strong></Link>)}
      </nav>
    </div></header>
    <main className="page-width classroom-content">
      {view === 'ppt' ? <TeachingSlides key={session.id} sessionId={session.id} /> : <>
        <header className="section-heading"><div><p className="eyebrow">{session.timing}</p><h2>{view === 'start' ? '오늘의 목표' : '활동지와 같은 순서로 해요'}</h2></div><p>{session.objective}</p></header>
        {view === 'start' ? <div className="data-inquiry-actions"><Link className="button button--primary" to={path(session.id, 'ppt')}>수업 PPT 열기</Link><Link className="button button--outline" to={path(session.id, 'activity')}>활동 시작하기</Link></div> : <>
          <ol className="data-inquiry-steps">{session.steps.map(step => <li key={step}>{step}</li>)}</ol>
          {session.id === 1 && <section className="data-inquiry-practice"><h3>기존 조사 자료부터 확인해요</h3><p>출처번호 · 만든 기관 · 자료 제목 · 링크 또는 쪽수를 활동지에 남겨요. 새 AI 계정은 필요하지 않아요.</p><div className="data-inquiry-actions"><a href="https://www.heritage.go.kr/" target="_blank" rel="noreferrer">국가유산포털 ↗</a><a href="https://www.museum.go.kr/" target="_blank" rel="noreferrer">국립중앙박물관 ↗</a></div></section>}
          {session.id === 2 && <section className="data-inquiry-practice"><h3>모든 모둠이 같은 열을 사용해요</h3><div className="data-inquiry-table-wrap"><table><thead><tr>{['모둠', '유산', '이야기종류', '핵심내용', '출처번호'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody><tr><td>1</td><td>무령왕릉</td><td>재료·방법</td><td>벽돌을 쌓아 만들었다.</td><td>1-1</td></tr></tbody></table></div><p>이야기종류: {categories.join(' / ')}</p><p>활동지 상단에 모둠·유산을 쓰고, 표에는 핵심내용·이야기종류·출처번호를 적어요. 같은 유산의 같은 사실은 한 번만 셉니다.</p></section>}
          {session.id === 3 && <section className="data-inquiry-practice"><h3>모둠별 그래프 대신, 학급 그래프 하나</h3><p>선생님 기기에 1~6모둠의 행을 이어 입력합니다. CODAP은 여러 기기에서 한 표를 동시에 편집하는 방식이 아닙니다.</p><ol><li>새 문서 → 테이블 → 새 데이터셋. 다섯 열에 학급 자료를 입력해요.</li><li>그래프 → ‘이야기종류’ 열 이름을 가로축으로 끌어요.</li><li>Config → ‘점을 막대로 변환’, Measure → ‘빈도수’를 선택해요.</li><li>제목·축·단위·합계를 확인하고, 우리 반이 모은 자료의 범위에서 설명해요.</li><li>File → 저장 → Local File → ‘컴퓨터에 저장하기’로 보관해요.</li></ol><a className="button button--primary" href={codap} target="_blank" rel="noreferrer">CODAP 열기 · 로그인 없이 ↗</a><p>구글 로그인 버튼 대신 Local File 탭을 선택합니다. 인터넷 연결은 필요해요.</p></section>}
        </>}
        <p className="data-inquiry-takeaway">{session.takeaway}</p>
      </>}
      <section className="data-inquiry-materials" aria-label="이번 차시 수업 자료"><h2>이 차시 활동지</h2><p>차시당 A4 한 장입니다. 빈칸은 할당량이 아니에요.</p><div className="data-inquiry-actions"><a className="button button--primary" href={dataInquiryWorksheet(session.id)} download>{session.id}차시 학생 활동지 받기</a><a className="button button--outline" href={dataInquiryFiles.students} download>활동지 3쪽 모아 받기</a>{teacher && <a className="button button--outline" href={dataInquiryFiles.teacher} download>교사용 운영 안내</a>}</div></section>
      <nav className="classroom-pagination" aria-label="데이터 탐구 이전·다음 차시">{session.id > 1 ? <Link to={path(session.id - 1)}><span>이전</span><strong>← {session.id - 1}차시</strong></Link> : <span />}{session.id < 3 ? <Link to={path(session.id + 1)}><span>다음</span><strong>{session.id + 1}차시 →</strong></Link> : <Link to={studioPath(params.toString(), teacher ? 'guide' : 'model', teacher, 4)}><span>데이터 탐구 완료 · 다음 활동</span><strong>4차시 입체모형 만들기 →</strong></Link>}</nav>
    </main>
  </div>;
}
