import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { safeSourceLink, type ArExhibit } from '../lib/ar/exhibit';
import '../styles/ar-exhibit.css';
const HeritageModelView = lazy(() => import('./HeritageModelView'));

export default function ArExhibitViewer({ value, heritage, heritageId, image }: { value: ArExhibit; heritage: string; heritageId: number; image: string }) {
  const [selected, setSelected] = useState(value.points[0].id);
  const [camera, setCamera] = useState(false);
  const [tracked, setTracked] = useState(false);
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState('');
  const audio = useRef<HTMLAudioElement>(null);
  const point = value.points.find(item => item.id === selected) || value.points[0];
  useEffect(() => {
    const player = audio.current;
    if (!player) return;
    if (point.narration) {
      if (player.getAttribute('src') !== point.narration.data) player.src = point.narration.data;
    } else {
      player.pause(); player.removeAttribute('src'); player.load();
    }
  }, [point.narration?.data]);
  useEffect(() => { audio.current?.pause(); setMessage(''); }, [camera]);
  useEffect(() => { if (camera && !tracked) audio.current?.pause(); }, [camera, tracked]);
  useEffect(() => { setAnswer(''); }, [value.question, value.answerId]);
  function select(id: string) {
    audio.current?.pause(); setMessage(''); setSelected(id);
    const next = value.points.find(item => item.id === id);
    if (next?.narration && audio.current) {
      // Set the source in the tap handler to retain mobile user activation.
      // React must not set it again after selection and interrupt playback.
      if (audio.current.getAttribute('src') !== next.narration.data) audio.current.src = next.narration.data;
      void audio.current.play().catch(() => setMessage('재생 버튼을 눌러 친구의 해설을 들어 보세요.'));
    }
  }
  return <section className="ar-exhibit-viewer" aria-label={`${heritage} AR 관람`}>
    <div className="ar-maker-heading"><h3>{heritage} · 우리 목소리 전시</h3><div className="ar-maker-actions">
      <button type="button" aria-pressed={!camera} onClick={() => setCamera(false)}>{value.model ? '입체 유물 둘러보기' : '사진으로 둘러보기'}</button><button type="button" aria-pressed={camera} disabled={camera} onClick={() => { setTracked(false); setCamera(true); }}>{camera ? '카메라 AR 사용 중' : '카메라 AR 켜기'}</button>
      {camera && <button type="button" onClick={() => setCamera(false)}>카메라 끄기</button>}
      <a href={image} download={`${heritage}-AR인식카드.jpg`}>인식용 사진 받기</a>
    </div></div>
    {!value.model && <p className="ar-help">지금은 사진에 설명점과 녹음을 띄우는 AR이에요. 선생님이 3D 유물을 넣으면 입체 모형으로 바뀝니다.</p>}
    {camera && <p className="ar-help">받은 사진을 자르지 않고 출력한 뒤 카메라에 비춰 주세요. 영상은 저장하지 않습니다.</p>}
    <div className="ar-maker-layout">
      {value.model || camera ? <Suspense fallback={<p>AR을 준비해요…</p>}><HeritageModelView model={value.model} image={image} points={value.points} selectedId={selected} onSelect={select} targetIndex={heritageId - 1} camera={camera} onTracking={setTracked} /></Suspense> : <div className="ar-point-photo"><img src={image} alt={heritage} />{value.points.map((item, index) => <button type="button" className="ar-hotspot" key={item.id} aria-pressed={selected === item.id} aria-label={`${index + 1}번 ${item.title} 해설 듣기`} style={{ left: `${item.photoPosition[0] * 100}%`, top: `${item.photoPosition[1] * 100}%` }} onClick={() => select(item.id)}>{index + 1}</button>)}</div>}
      <div className="ar-viewer-reading">
        <div className="ar-point-select" role="group" aria-label="해설 선택">{value.points.map((item, index) => <button disabled={camera && !tracked} type="button" key={item.id} aria-pressed={selected === item.id} onClick={() => select(item.id)}>{index + 1}번 해설</button>)}</div>
        <div aria-live="polite"><h4>{point.title || '설명할 곳'}</h4><p className="ar-reading-text">{point.text || '아직 설명을 쓰지 않았어요.'}</p></div>
        <audio ref={audio} hidden={!point.narration || (camera && !tracked)} controls preload="metadata" aria-label={`${point.title} 학생 녹음 해설`} onError={() => setMessage('이 기기에서 녹음을 재생하지 못했어요. 설명 글을 읽거나 다른 브라우저에서 열어 주세요.')} />
        {!point.narration && <p className="ar-help">이 설명에는 아직 녹음이 없어요.</p>}
        {message && <p role="status" className="ar-help">{message}</p>}
        {value.question.trim() && <div className="ar-visitor-mission"><h4>관람 미션</h4><p>{value.question}</p><div className="ar-answer-options">{value.points.map((item, index) => <button type="button" key={item.id} aria-pressed={answer === item.id} onClick={() => setAnswer(item.id)}>{index + 1}번 · {item.title}</button>)}</div>{answer && <p role="status">{answer === value.answerId ? '맞아요! 설명에서 찾은 근거를 친구에게 말해 보세요.' : '설명점을 다시 눌러 단서를 찾아보세요.'}</p>}</div>}
      </div>
    </div>
    {value.model && <p className="ar-help">3D 자료: {value.model.credit || '선생님이 자료 출처를 입력해 주세요.'}{safeSourceLink(value.model.source) && <> · <a href={safeSourceLink(value.model.source)} target="_blank" rel="noreferrer">원본 자료</a></>}{value.model.asset && <> · <a href="https://www.kogl.or.kr/info/licenseType3.do" target="_blank" rel="noreferrer">공공누리 이용조건</a></>}</p>}
  </section>;
}
