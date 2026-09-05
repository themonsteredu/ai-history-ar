import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { heritageResearchCases } from '../content/three-kingdoms/webActivities';
import { downloadProjectFile, evidenceCategories, evidenceStatuses, newProject, parseProject, PROJECT_STORAGE_KEY, projectCsv, projectReadiness, recordProblems, sourceUrl, summarizeRecords, updateRecords, type HeritageProject, type ResearchRecord } from '../content/three-kingdoms/project';
import { ExternalToolActivity } from './ExternalToolActivity';
import type { Lesson } from '../types/curriculum';
import { EXTERNAL_TOOL_STORAGE_KEY, EXTERNAL_TOOL_UPDATE_EVENT, getResolvedExternalTool, readExternalToolSettings } from '../settings/externalToolSettings';
import '../styles/heritage-project.css';

const TrackedHeritageAr = lazy(() => import('./TrackedHeritageAr'));
const stages = ['조사', '정제', '그래프', '해석', '유추', '전시 준비', '박물관'];
const requirements = ['', '4차시에서 지난 판단과 근거 3개를 정리하세요.', '5차시에서 공통 표를 점검하고 정제를 마치세요.', '6차시에서 현재 표로 만든 그래프 PNG를 가져오세요.', '7차시에서 그래프의 관찰점과 한계를 기록하세요.', '8차시에서 확인한 근거 2개로 유추하고 한계를 남기세요.', '9차시에서 우리 모둠 전시를 열어 점검하세요.'];

function readDraft() {
  try { const value = localStorage.getItem(PROJECT_STORAGE_KEY); return value ? parseProject(value) : newProject(); }
  catch { return newProject(); }
}
export function HeritageProjectWorkspace({ lesson }: { lesson: Lesson }) {
  const [project, setProject] = useState<HeritageProject>(readDraft);
  const [message, setMessage] = useState('');
  const [opened, setOpened] = useState<string[]>([]);
  const [showExhibit, setShowExhibit] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [answer, setAnswer] = useState('');
  const [settings, setSettings] = useState(() => readExternalToolSettings(window.localStorage));
  const ready = projectReadiness(project);
  const completion = [ready.research, ready.cleaned, ready.graphed, ready.interpreted, ready.inferred, ready.exhibited];
  const prerequisite = lesson.id === 4 || completion[lesson.id - 5];
  const heritage = heritageResearchCases[project.heritageId - 1];
  const summary = summarizeRecords(project);
  const codap = getResolvedExternalTool(6, settings);
  const codapUrl = codap.studentUrl || codap.embedUrl;

  useEffect(() => {
    try { localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(project)); }
    catch { setMessage('이 기기에 임시 보관하지 못했습니다. 작업 파일을 내려받아 보관하세요.'); }
  }, [project]);
  useEffect(() => { setShowExhibit(false); setZoom(false); setAnswer(''); }, [lesson.id, project.heritageId]);
  useEffect(() => {
    const sync = () => setSettings(readExternalToolSettings(window.localStorage));
    const onStorage = (event: StorageEvent) => { if (event.key === EXTERNAL_TOOL_STORAGE_KEY) sync(); };
    window.addEventListener(EXTERNAL_TOOL_UPDATE_EVENT, sync);
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener(EXTERNAL_TOOL_UPDATE_EVENT, sync); window.removeEventListener('storage', onStorage); };
  }, []);

  function update(patch: Partial<HeritageProject>) {
    setProject(current => ({ ...current, ...patch, exhibit: patch.exhibit ?? { ...current.exhibit, tested: false }, savedAt: new Date().toISOString() }));
    setMessage('');
  }
  function changeRecords(records: ResearchRecord[]) { setProject(current => ({ ...updateRecords(current, records), savedAt: new Date().toISOString() })); }
  function editRecord(id: string, patch: Partial<ResearchRecord>) { changeRecords(project.records.map(record => record.id === id ? { ...record, ...patch } : record)); }
  function saveFile() {
    downloadProjectFile(JSON.stringify(project, null, 2), `삼국시대_${project.group}모둠_${heritage.heritage}_${lesson.id}차시.json`, 'application/json');
    setMessage('내려받은 작업 파일에 근거·그래프·해설이 함께 들어 있습니다. 다음 수업에 이 파일을 가져오세요.');
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 2_800_000) throw new Error('수업에서 저장한 2.8MB 이하 작업 파일을 선택하세요.');
      const imported = parseProject(await file.text());
      if (project.records.length && !window.confirm('현재 작업 대신 선택한 파일을 열까요? 필요한 작업은 먼저 내려받아 보관하세요.')) return;
      setProject(imported); setOpened([]); setShowExhibit(false); setMessage(`${imported.group}모둠 작업을 불러왔습니다.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : '파일을 읽지 못했습니다.'); }
  }
  async function importGraph(file?: File) {
    if (!file) return;
    if (file.size > 1_700_000 || file.type !== 'image/png') { setMessage('1.7MB 이하 PNG 그래프를 골라 주세요.'); return; }
    const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    if ([137,80,78,71,13,10,26,10].some((byte,index) => signature[index] !== byte)) { setMessage('PNG 그림 파일이 아닙니다.'); return; }
    const reader = new FileReader();
    reader.onerror = () => setMessage('그래프를 읽지 못했습니다. 다시 골라 주세요.');
    reader.onload = () => update({ graph: { ...project.graph, image: String(reader.result), revision: project.revision }, interpretation: '', limitation: '', exhibit: { ...project.exhibit, tested: false } });
    reader.readAsDataURL(file);
  }
  function selectHeritage(id: number) {
    if (id === project.heritageId) return;
    if (project.records.length && !window.confirm('다른 유산을 조사하려면 새 작업이 시작됩니다. 현재 작업 파일을 보관했나요?')) return;
    setProject(newProject(project.group, id)); setOpened([]);
  }
  const evidence = project.records.filter(record => project.inference.evidenceIds.includes(record.id));
  const focus = evidence.find(record => record.id === project.exhibit.focusId);

  return <section className="heritage-project" aria-label={`${lesson.id}차시 모둠 탐구`}>
    <div className="project-toolbar">
      <div><label>우리 모둠<select aria-label="우리 모둠" value={project.group} onChange={event => update({ group: Number(event.target.value) })}>{[1,2,3,4,5,6].map(id => <option value={id} key={id}>{id}모둠</option>)}</select></label>
      <label>담당 유산<select aria-label="담당 유산" value={project.heritageId} onChange={event => selectHeritage(Number(event.target.value))}>{heritageResearchCases.map(item => <option value={item.id} key={item.id}>{item.heritage}</option>)}</select></label></div>
      <div><button type="button" onClick={saveFile}>작업 파일 보관</button><label className="project-file-button">이전 작업 불러오기<input type="file" accept=".json,application/json" onChange={event => { void importFile(event.target.files?.[0]); event.target.value = ''; }} /></label></div>
    </div>
    <p className="project-save-note">이 화면에는 임시 작업이 남습니다. 수업이 끝나면 <strong>작업 파일을 보관</strong>하고, 다른 기기에서는 그 파일을 불러오세요.</p>
    {message && <p className="project-message" role="status">{message}</p>}
    <nav className="project-stages" aria-label="탐구 순서">{stages.map((stage,index) => <Link key={stage} aria-current={lesson.id === index + 4 ? 'step' : undefined} to={`/three-kingdoms/lesson/${index + 4}?view=activity`}><span>{index+4}</span>{stage}{completion[index] ? ' ✓' : ''}</Link>)}</nav>
    {!prerequisite && <aside className="project-warning"><strong>이전 결과가 아직 준비되지 않았습니다.</strong><p>{requirements[lesson.id-4]} 다른 기기에서 했다면 ‘이전 작업 불러오기’를 누르세요.</p></aside>}
    <div className="project-overview"><img src={`${import.meta.env.BASE_URL}images/heritage/three-kingdoms/${heritage.image}`} alt={heritage.heritage} /><div className="project-question"><span>10차시까지 이어 갈 질문</span><strong>{project.question}</strong><small>{project.group}모둠 · {heritage.heritage}</small></div></div>

    {lesson.id === 4 && <>
      <div className="project-two-columns">
        <section className="project-paper"><h3>지난 2·3차시의 판단을 가져와요</h3><p>이미 사용한 활동지에서 한 문장만 골라 짧게 옮깁니다.</p>
          <label>우리가 의심했던 말<textarea maxLength={500} value={project.previousClaim} onChange={event => update({ previousClaim: event.target.value })} placeholder="지난 활동지에서 의심했던 문장" /></label>
          <label>자료로 확인한 판단<textarea maxLength={500} value={project.correction} onChange={event => update({ correction: event.target.value })} placeholder="고친 말 또는 아직 판단을 보류한 까닭" /></label>
          <label>계속 조사할 질문<input maxLength={180} value={project.question} onChange={event => update({ question: event.target.value })} /></label>
        </section>
        <section className="project-paper"><h3>오늘의 공통 약속</h3><p><strong>표 한 행 = 서로 다른 근거 문장 하나.</strong> 유산 개수나 옛사람 수를 세는 표가 아닙니다.</p><ol><li>공식 원문 또는 선생님의 인쇄 자료에서 근거를 확인합니다.</li><li>담당 유산의 서로 다른 근거를 3~5개 고릅니다.</li><li>같은 원문의 여러 부분은 서로 다른 출처로 세지 않습니다.</li></ol><p>다음 시간에는 이 문장들을 같은 항목으로 분류합니다. 제작 시기·발견 연도·등재 연도는 문장에서 구분하며 하나의 연도 축으로 합치지 않습니다.</p></section>
      </div>
      <section className="project-paper"><h3>공식 자료에서 근거 고르기</h3><p>원문을 열거나 인쇄 자료를 읽은 뒤 표시하세요. 아래 문구는 읽기를 돕는 요약입니다.</p>
        {heritage.sources.map(source => <details className="project-source" key={source.id} open={opened.includes(source.id)} onToggle={event => { const isOpen = event.currentTarget.open; setOpened(current => isOpen ? (current.includes(source.id) ? current : [...current, source.id]) : current.filter(id => id !== source.id)); }}><summary>{source.label} · {source.title}</summary><p>{source.readGuide}</p><a href={sourceUrl(source.href)} target="_blank" rel="noreferrer">{source.institution} 원문 열기 ↗</a>
          {source.facts.map(fact => <div className="project-source-fact" key={fact.id}><p>{fact.text}</p><button type="button" disabled={project.records.some(record => record.id === fact.id)} onClick={() => changeRecords([...project.records, { id: fact.id, text: fact.text, category: '', status: '추가 확인', source: source.institution, url: source.href }])}>{project.records.some(record => record.id === fact.id) ? '담은 근거' : '우리 표에 담기'}</button></div>)}
        </details>)}
      </section>
    </>}

    {(lesson.id === 4 || lesson.id === 5) && <section className="project-paper"><div className="project-section-title"><h3>우리 모둠 근거 표 · {project.records.length}건</h3><button type="button" disabled={!project.records.length} onClick={() => downloadProjectFile(projectCsv(project), `삼국시대_${project.group}모둠_근거표.csv`, 'text/csv;charset=utf-8')}>현재 표 CSV 받기</button></div>
      {lesson.id === 5 && <p>원본 CSV를 먼저 보관하세요. 같은 문장이 반복되는지, 분류와 출처가 맞는지 확인합니다. 다른 문장이라면 출처가 같아도 지우지 않습니다.</p>}
      {!project.records.length ? <p>위의 공식 자료에서 근거를 담아 주세요.</p> : <div className="project-record-list">{project.records.map((record,index) => <article key={record.id} className="project-record"><strong>근거 {index+1}</strong><label>근거 문장<textarea value={record.text} maxLength={1000} onChange={event => editRecord(record.id, { text: event.target.value })} /></label><div className="project-two-columns"><label>살펴본 항목<select value={record.category} onChange={event => editRecord(record.id, { category: event.target.value as ResearchRecord['category'] })}><option value="">항목을 고르세요</option>{evidenceCategories.map(category => <option key={category}>{category}</option>)}</select></label><label>자료를 읽고 판단<select value={record.status} onChange={event => editRecord(record.id, { status: event.target.value as ResearchRecord['status'] })}>{evidenceStatuses.map(status => <option key={status}>{status}</option>)}</select></label></div><p>{record.source} · {sourceUrl(record.url) ? <a href={record.url} target="_blank" rel="noreferrer">원문 확인 ↗</a> : '원문 주소를 확인하세요'}</p><button className="project-text-button" type="button" onClick={() => changeRecords(project.records.filter(item => item.id !== record.id))}>이 근거 빼기</button></article>)}</div>}
      {lesson.id === 5 && <><ul className="project-validation">{recordProblems(project.records).map(problem => <li key={problem}>{problem}</li>)}</ul><button className="button button--primary" type="button" disabled={!ready.research || recordProblems(project.records).length > 0} onClick={() => { update({ cleanedRevision: project.revision }); setMessage('정제 완료. 이 표를 6차시 CODAP에 가져갑니다.'); }}>공통 표 점검 완료</button></>}
    </section>}

    {lesson.id === 5 && <details className="project-paper"><summary>Google Sheets에서도 표 살펴보기</summary><p>우리 표 CSV를 불러와 확인할 수 있습니다. 이 화면의 근거 표를 최종본으로 맞춘 뒤 다시 내려받으세요.</p><ExternalToolActivity lesson={lesson} /></details>}

    {lesson.id === 6 && <section className="project-paper"><h3>우리 근거를 CODAP 그래프로 만들어요</h3><p>가로축은 살펴본 항목 또는 확인상태, 세로축은 <strong>근거 문장 수(건)</strong>입니다. 이 표로 나라의 우열이나 과거 인구를 비교하지 않습니다.</p><label>비교할 항목<select disabled={!ready.cleaned} value={project.graph.dimension} onChange={event => update({ graph: { ...project.graph, dimension: event.target.value as 'category' | 'status', image: '', revision: -1 }, interpretation: '', exhibit: { ...project.exhibit, tested: false } })}><option value="category">살펴본 항목</option><option value="status">확인상태</option></select></label>
      <div className="project-actions"><button disabled={!ready.cleaned} type="button" onClick={() => downloadProjectFile(projectCsv(project), `삼국시대_${project.group}모둠_정제.csv`, 'text/csv;charset=utf-8')}>1. 우리 정제 CSV 받기</button><a aria-disabled={!ready.cleaned || !codap.enabled || !codapUrl} href={ready.cleaned && codap.enabled && codapUrl ? codapUrl : undefined} target="_blank" rel="noreferrer">2. CODAP 열기 ↗</a><label className="project-file-button">3. 완성한 그래프 PNG 가져오기<input disabled={!ready.cleaned} type="file" accept="image/png" onChange={event => { void importGraph(event.target.files?.[0]); event.target.value = ''; }} /></label></div>
      <ol><li>CODAP에 우리 CSV를 불러옵니다.</li><li>선택한 항목을 가로축으로 끌어 놓고 범주별 개수를 표시합니다.</li><li>제목과 ‘근거 문장 수(건)’를 확인하고 PNG로 저장합니다.</li></ol><label>그래프 제목<input maxLength={180} value={project.graph.title} onChange={event => update({ graph: { ...project.graph, title: event.target.value } })} placeholder="우리 모둠이 조사한 근거의 항목별 개수" /></label>
      <table className="project-counts"><caption>그래프와 비교할 실제 개수 · 전체 {project.records.length}건</caption><thead><tr><th>항목</th><th>근거 수</th></tr></thead><tbody>{summary.map(row => <tr key={row.label}><td>{row.label}</td><td>{row.count}건</td></tr>)}</tbody></table>
    </section>}

    {project.graph.image && lesson.id >= 6 && <figure className="project-graph"><img src={project.graph.image} alt={project.graph.title || '우리 모둠 CODAP 그래프'} /><figcaption>{project.graph.title || '제목을 입력하세요'} · {project.graph.revision === project.revision ? `근거 ${project.records.length}건` : '표가 바뀌었습니다. 6차시에서 그래프를 다시 만들어 주세요.'}</figcaption></figure>}

    {lesson.id === 7 && <section className="project-paper"><h3>수치와 한계를 나누어 말해요</h3><fieldset disabled={!ready.graphed}><label>그래프에서 말할 항목<select value={project.interpretation} onChange={event => update({ interpretation: event.target.value, exhibit: { ...project.exhibit, tested: false } })}><option value="">관찰점 하나를 고르세요</option>{summary.map(row => { const sentence = `우리 모둠이 모은 근거 ${project.records.length}건 중 ‘${row.label}’은 ${row.count}건입니다.`; return <option key={row.label} value={sentence}>{sentence}</option>; })}</select></label><label>이 그래프만으로 알 수 없는 것<select value={project.limitation} onChange={event => update({ limitation: event.target.value, exhibit: { ...project.exhibit, tested: false } })}><option value="">한계를 고르세요</option>{['우리가 고른 자료만 세었으므로 삼국시대 전체 모습은 알 수 없습니다.', '근거 문장 수가 많다고 역사적으로 더 중요하다는 뜻은 아닙니다.', '문장의 개수만으로 옛사람의 생활이나 교류를 증명할 수 없습니다.'].map(text => <option key={text}>{text}</option>)}</select></label></fieldset><p>8차시에는 막대 높이가 아니라 <strong>근거 문장의 내용</strong>으로 돌아갑니다.</p></section>}

    {lesson.id === 8 && <section className="project-paper"><h3>확인한 근거 두 개를 연결해요</h3><p>그래프는 우리가 살펴본 자료의 범위를 알려 줍니다. 역사 유추에는 서로 다른 근거 문장 두 개가 필요합니다. 같은 원문의 문장 두 개는 교차 검증한 출처 두 곳을 뜻하지 않습니다.</p><fieldset disabled={!ready.interpreted}><div className="project-evidence-options">{project.records.filter(record => record.status === '확인됨').map(record => <label key={record.id}><input type="checkbox" checked={project.inference.evidenceIds.includes(record.id)} onChange={() => { const ids = project.inference.evidenceIds.includes(record.id) ? project.inference.evidenceIds.filter(id => id !== record.id) : [...project.inference.evidenceIds, record.id].slice(-2); update({ inference: { ...project.inference, evidenceIds: ids }, exhibit: { ...project.exhibit, focusId: '', tested: false } }); }} /><span>{record.text}</span></label>)}</div><p>{project.inference.evidenceIds.length} / 2개 선택</p><label>두 근거로 설명할 수 있는 과거 모습<textarea maxLength={500} value={project.inference.sentence} onChange={event => update({ inference: { ...project.inference, sentence: event.target.value }, exhibit: { ...project.exhibit, tested: false } })} placeholder="두 근거를 함께 보면, …했을 가능성이 있습니다." /></label><label>그래도 단정할 수 없는 점<textarea maxLength={500} value={project.inference.limit} onChange={event => update({ inference: { ...project.inference, limit: event.target.value }, exhibit: { ...project.exhibit, tested: false } })} placeholder="이 자료만으로 …까지는 알 수 없습니다." /></label></fieldset><details><summary>유추가 어려울 때</summary><p>억지로 교류를 말하지 않아도 됩니다. 유산의 구조·장식·기록이 당시의 기술, 관심사, 생활을 어디까지 보여 주는지 설명하세요. 연결되지 않는다면 4차시에서 관련 근거를 더 확인하고 표와 그래프를 갱신합니다.</p></details></section>}

    {lesson.id === 9 && <section className="project-paper"><h3>우리 근거로 전시 장면을 골라요</h3><fieldset disabled={!ready.inferred}><label>관람객에게 보여 줄 핵심 근거<select value={project.exhibit.focusId} onChange={event => update({ exhibit: { ...project.exhibit, focusId: event.target.value, tested: false } })}><option value="">8차시 근거에서 고르세요</option>{evidence.map(record => <option value={record.id} key={record.id}>{record.text}</option>)}</select></label><div className="project-two-columns"><label>사진 표현<select value={project.exhibit.effect} onChange={event => update({ exhibit: { ...project.exhibit, effect: event.target.value as '표시' | '확대', tested: false } })}><option>표시</option><option>확대</option></select></label><label>관람객이 할 일<select value={project.exhibit.action} onChange={event => update({ exhibit: { ...project.exhibit, action: event.target.value as '특징 찾기' | '근거 고르기', tested: false } })}><option>특징 찾기</option><option>근거 고르기</option></select></label></div></fieldset><p>‘표시’는 사진과 근거를 나란히 보여 줍니다. ‘확대’는 관람객이 사진을 눌러 자세히 살펴봅니다. 없는 역사 장면이나 입체 유물을 새로 만들어 내지 않습니다.</p><button className="button button--primary" disabled={!ready.planned} type="button" onClick={() => setShowExhibit(true)}>우리 전시 시험하기</button></section>}

    {lesson.id === 10 && <section className="project-paper"><h3>{project.group}모둠 · {heritage.heritage} 전시</h3><p>9차시의 작업 파일을 불러오면 같은 그래프와 해설이 열립니다. 지난 2·3차시 검증 활동지도 부스에 함께 둡니다.</p><button className="button button--primary" disabled={!ready.exhibited} type="button" onClick={() => setShowExhibit(true)}>관람객에게 전시 열기</button><details><summary>40분 박물관 운영 순서</summary><p>준비 5분 → 모둠 안 A팀 해설·B팀 관람 12분 → 교대 2분 → B팀 해설·A팀 관람 12분 → 정리 3분 → 돌아보기 6분. 각 관람팀은 다른 부스 세 곳을 4분씩 둘러봅니다.</p></details></section>}

    {showExhibit && ready.planned && <section className="project-exhibit" aria-label="우리 모둠 전시"><div className="project-section-title"><div><span>{project.group}모둠 · 근거로 설명하는 박물관</span><h3>{heritage.heritage}</h3></div><button type="button" onClick={() => setShowExhibit(false)}>전시 닫기</button></div><p className="project-exhibit-question">{project.question}</p><div className="project-two-columns"><figure><button className="project-photo" type="button" disabled={project.exhibit.effect !== '확대'} aria-label="유산 사진 확대 전환" aria-pressed={zoom} onClick={() => setZoom(value => !value)}><img className={zoom ? 'is-zoomed' : ''} src={`${import.meta.env.BASE_URL}images/heritage/three-kingdoms/${heritage.image}`} alt={heritage.heritage} /></button><figcaption>{project.exhibit.effect === '확대' ? '사진을 눌러 확대하고 특징을 찾으세요.' : '사진과 근거 문장에서 같은 특징을 찾으세요.'}</figcaption></figure><div><h4>우리가 확인한 근거</h4><p>{focus?.text}</p><h4>자료를 연결한 설명</h4><p>{project.inference.sentence}</p><h4>아직 단정하지 않을 점</h4><p>{project.inference.limit}</p></div></div><figure className="project-graph"><img src={project.graph.image} alt={project.graph.title} /><figcaption>{project.interpretation}<br />{project.limitation}</figcaption></figure><details><summary>AI 설명을 어떻게 다시 판단했나요?</summary><p>처음 의심한 말: {project.previousClaim}</p><p>자료로 확인한 판단: {project.correction}</p></details><div className="project-visitor"><h4>관람객 활동 · {project.exhibit.action}</h4>{project.exhibit.action === '특징 찾기' ? <><p>사진에서 핵심 근거와 연결되는 특징을 가리키고 모둠 해설사에게 말해 보세요.</p><button type="button" onClick={() => setAnswer('사진에서 찾은 특징을 근거 문장과 함께 설명해 보세요.')}>찾았어요</button></> : <><p>방금 해설에서 핵심으로 보여 준 근거는 어느 것인가요?</p>{evidence.map(record => <button key={record.id} type="button" onClick={() => setAnswer(record.id === project.exhibit.focusId ? '맞아요. 이 근거와 해설이 어떻게 이어지는지 말해 보세요.' : '이것도 우리 근거입니다. 화면에서 핵심으로 강조한 문장을 다시 찾아보세요.')}>{record.text}</button>)}</>}{answer && <p role="status">{answer}</p>}</div><Suspense fallback={<p>AR을 준비하고 있습니다…</p>}><TrackedHeritageAr heritageId={project.heritageId} explanation={focus?.text} caution={project.inference.limit} /></Suspense><details><summary>사용한 출처 확인</summary>{evidence.map(record => <p key={record.id}>{record.text}<br /><a href={sourceUrl(record.url)} target="_blank" rel="noreferrer">{record.source} ↗</a></p>)}</details>{lesson.id === 9 && <button type="button" className="button button--primary" onClick={() => { update({ exhibit: { ...project.exhibit, tested: true } }); setMessage('그래프·사진·해설·관람객 활동을 점검했습니다. 작업 파일을 보관해 10차시에 가져오세요.'); }}>전시와 카메라 없는 대체 화면 점검 완료</button>}</section>}
    <footer className="project-footer"><strong>{ready.research ? `${project.group}모둠 탐구가 이어지고 있어요.` : '지난 검증 결과와 근거를 먼저 담아 주세요.'}</strong><button type="button" onClick={saveFile}>오늘 작업 파일 보관</button></footer>
  </section>;
}
