import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { MAX_MODEL_BYTES, readDataUrl, safeSourceLink, validateGlb, type ArExhibit, type ExhibitPoint } from '../lib/ar/exhibit';
import NarrationEditor from './NarrationEditor';
import { cheomseongdaeModel } from '../content/three-kingdoms/arModels';
import '../styles/ar-exhibit.css';

const HeritageModelView = lazy(() => import('./HeritageModelView'));
const ArExhibitViewer = lazy(() => import('./ArExhibitViewer'));
export default function ArExhibitEditor({ value, onChange, image, heritage, heritageId, onBusy }: {
  value: ArExhibit; onChange: (value: ArExhibit) => void; image: string; heritage: string; heritageId: number; onBusy: (busy: boolean) => void;
}) {
  const [selected, setSelected] = useState(value.points[0].id);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const upload = useRef(0);
  const latest = useRef(value); latest.current = value;
  const photo = useRef<HTMLDivElement>(null);
  useEffect(() => () => { upload.current++; }, []);
  const point = value.points.find(item => item.id === selected) || value.points[0];
  function updatePoint(patch: Partial<ExhibitPoint>) { onChange({ ...value, points: value.points.map(item => item.id === point.id ? { ...item, ...patch } : item) }); }
  function setWorking(next: boolean) { setBusy(next); onBusy(next); }
  async function loadModel(file?: File) {
    if (!file) return;
    const job = ++upload.current; setWorking(true); setMessage('입체 유물 파일을 확인하고 있어요…');
    try {
      const format = file.name.toLowerCase().endsWith('.glb') ? 'glb' : file.name.toLowerCase().endsWith('.stl') ? 'stl' : null;
      if (!format || !file.size || file.size > MAX_MODEL_BYTES) throw new Error('12MB 이하의 GLB 또는 STL 파일을 골라 주세요.');
      const bytes = await file.arrayBuffer();
      if (format === 'glb') validateGlb(bytes);
      else {
        const view = new DataView(bytes);
        const binary = bytes.byteLength >= 84 && 84 + view.getUint32(80, true) * 50 === bytes.byteLength;
        if (!binary && !/^\s*solid\b/.test(new TextDecoder().decode(bytes.slice(0, 100)))) throw new Error('올바른 STL 파일이 아니에요.');
      }
      const data = await readDataUrl(new Blob([bytes], { type: 'application/octet-stream' }));
      if (job !== upload.current) return;
      onChange({ ...latest.current, model: { data, format, name: file.name.slice(0, 180), credit: '', source: '', rotation: [0, 0, 0] } });
      setMessage('입체 유물을 넣었어요. 출처를 적고 설명할 곳을 눌러 주세요.');
    } catch (error) { if (job === upload.current) setMessage(error instanceof Error ? error.message : '파일을 읽지 못했어요.'); }
    finally { if (job === upload.current) setWorking(false); }
  }
  if (preview) return <section className="ar-maker"><button type="button" onClick={() => setPreview(false)}>← 설명과 녹음 고치기</button><Suspense fallback={<p>우리 전시를 열어요…</p>}><ArExhibitViewer value={value} heritage={heritage} heritageId={heritageId} image={image} /></Suspense></section>;
  return <section className="ar-maker" aria-label="설명점과 녹음 만들기">
    <div className="ar-maker-heading"><h3>우리 목소리로 안내하는 AR 전시</h3><button type="button" disabled={busy} onClick={() => setPreview(true)}>친구 화면으로 체험</button></div>
    <details className="ar-teacher-prep">
      <summary>선생님 준비 · 입체 유물 넣기{value.model ? ' ✓' : ''}</summary>
      <p>사용 가능한 3D 원본을 넣으면 카드 위에 입체 유물이 나타납니다. 학생들은 모형에 설명점과 녹음을 붙입니다.</p>
      {heritageId === 3 && <><button disabled={busy} type="button" onClick={() => { onChange({ ...value, model: cheomseongdaeModel() }); setMessage('공식 첨성대 모형을 연결했어요. 돌려 보면서 설명할 곳을 눌러 주세요.'); }}>공식 첨성대 3D 원본 불러오기</button><p className="ar-help">처음 열 때 약 36MB를 내려받습니다. 원본 모양과 표면 색을 그대로 보여 줍니다.</p></>}
      <label>3D 유물 파일 (GLB·STL, 12MB 이하)<input disabled={busy} type="file" accept=".glb,.stl" onChange={event => { void loadModel(event.target.files?.[0]); event.target.value = ''; }} /></label>
      {value.model && <fieldset disabled={busy}>
        <p>{value.model.name}</p>
        <label>자료를 제공한 곳과 이용 조건<input readOnly={!!value.model.asset} maxLength={300} value={value.model.credit} onChange={event => onChange({ ...value, model: { ...value.model!, credit: event.target.value } })} placeholder="예: 제공 기관 · 공공누리 제1유형" /></label>
        <label>원본 자료 주소<input readOnly={!!value.model.asset} type="url" maxLength={2000} value={value.model.source} onChange={event => onChange({ ...value, model: { ...value.model!, source: event.target.value } })} placeholder="https://" /></label>
        <div className="ar-maker-actions">{['앞뒤', '좌우', '기울기'].map((label, index) => <button type="button" key={label} onClick={() => onChange({ ...value, model: { ...value.model!, rotation: value.model!.rotation.map((n, axis) => axis === index ? (n + 90) % 360 : n) as [number, number, number] } })}>{label} 90° 조정</button>)}<button type="button" onClick={() => onChange({ ...value, model: undefined })}>모형 빼기</button></div>
        <p className="ar-help">방향을 먼저 맞춘 뒤 설명점을 놓아 주세요. STL은 표면 사진이 없는 단색 모형으로 표시됩니다.</p>
      </fieldset>}
      <a href={image} download={`${heritage}-AR인식카드.jpg`}>인식용 유물 사진 받기</a>
      <p className="ar-help">사진을 자르거나 늘리지 않고 출력해 주세요. 다른 기기에서는 저장한 작업 파일을 연 뒤 웹앱의 AR 카메라를 켭니다.</p>
    </details>
    {message && <p role="status" className="ar-help">{message}</p>}
    <div className="ar-maker-layout">
      <div>
        {value.model ? <Suspense fallback={<p>입체 유물을 준비해요…</p>}><HeritageModelView model={value.model} image={image} points={value.points} selectedId={selected} targetIndex={heritageId - 1} onSelect={id => { if (!busy) setSelected(id); }} onPlace={busy ? undefined : position => updatePoint({ position })} /></Suspense> : <>
          <div className="ar-point-photo" ref={photo}>
            <img src={image} alt={heritage} />
            <button type="button" className="ar-photo-hit" disabled={busy} aria-label="사진에서 설명할 곳 선택" onClick={event => { if (event.detail === 0) return; const rect = photo.current!.getBoundingClientRect(); updatePoint({ photoPosition: [Math.max(.1, Math.min(.9, (event.clientX - rect.left) / rect.width)), Math.max(.1, Math.min(.9, (event.clientY - rect.top) / rect.height))] }); }} />
            {value.points.map((item, index) => <button disabled={busy} type="button" className="ar-hotspot" style={{ left: `${item.photoPosition[0] * 100}%`, top: `${item.photoPosition[1] * 100}%` }} key={item.id} aria-label={`${index + 1}번 설명점 선택. 방향키로 위치 이동`} aria-pressed={point.id === item.id} onClick={() => setSelected(item.id)} onKeyDown={event => {
              const direction = { ArrowLeft: [-.025, 0], ArrowRight: [.025, 0], ArrowUp: [0, -.025], ArrowDown: [0, .025] }[event.key];
              if (!direction) return; event.preventDefault(); setSelected(item.id);
              onChange({ ...value, points: value.points.map(p => p.id === item.id ? { ...p, photoPosition: p.photoPosition.map((n, axis) => Math.max(.1, Math.min(.9, n + direction[axis]))) as [number, number] } : p) });
            }}>{index + 1}</button>)}
          </div>
          <p className="ar-help">설명점을 고른 뒤 사진에서 설명할 곳을 눌러요. 입체 유물은 선생님이 3D 파일을 넣으면 볼 수 있어요.</p>
        </>}
        {value.model?.credit && <p className="ar-help">3D 자료: {value.model.credit}{safeSourceLink(value.model.source) && <> · <a href={safeSourceLink(value.model.source)} target="_blank" rel="noreferrer">원본 보기</a></>}</p>}
      </div>
      <div>
        <div className="ar-point-select" role="group" aria-label="수정할 설명점">{value.points.map((item, index) => <button type="button" disabled={busy} key={item.id} aria-pressed={point.id === item.id} onClick={() => setSelected(item.id)}>{index + 1}번 설명</button>)}</div>
        <fieldset disabled={busy}>
          <label>설명할 곳<input maxLength={80} value={point.title} onChange={event => updatePoint({ title: event.target.value })} placeholder="예: 꼭대기의 봉황" /></label>
          <label>자료에서 확인한 설명<textarea rows={3} maxLength={1500} value={point.text} onChange={event => updatePoint({ text: event.target.value })} /></label>
        </fieldset>
        <NarrationEditor key={point.id} disabled={busy} value={point.narration} onChange={narration => updatePoint({ narration })} onBusy={setWorking} />
        {value.model && <details><summary>키보드로 설명점 위치 조정</summary><fieldset disabled={busy}>{['좌우', '높이', '앞뒤'].map((label, index) => <label key={label}>{label}<input type="range" min={-1} max={1.5} step={.025} value={point.position[index]} onChange={event => updatePoint({ position: point.position.map((n, axis) => axis === index ? Number(event.target.value) : n) as [number, number, number] })} /></label>)}</fieldset></details>}
      </div>
    </div>
    <fieldset className="ar-mission-editor" disabled={busy}><legend>친구에게 낼 관람 문제</legend><label>문제<input maxLength={300} value={value.question} onChange={event => onChange({ ...value, question: event.target.value })} placeholder="예: 봉황을 찾을 수 있는 설명점은 어디일까요?" /></label><label>정답인 설명점<select value={value.answerId} onChange={event => onChange({ ...value, answerId: event.target.value })}>{value.points.map((item, index) => <option value={item.id} key={item.id}>{index + 1}번 · {item.title}</option>)}</select></label></fieldset>
  </section>;
}
