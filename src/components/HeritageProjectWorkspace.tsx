import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { lessonTwoStorageKey } from '../lib/careerLogKeys';
import { readResilientStorage, writeResilientStorage } from '../lib/resilientStorage';
import { heritageResearchCases } from '../content/three-kingdoms/webActivities';
import { downloadProjectFile, evidenceCategories, evidenceStatuses, newProject, parseProject, PROJECT_STORAGE_KEY, projectCsv, projectReadiness, recordProblems, sourceUrl, summarizeRecords, updateRecords, type HeritageProject, type ResearchRecord } from '../content/three-kingdoms/project';
import { ExternalToolActivity } from './ExternalToolActivity';
import type { Lesson } from '../types/curriculum';
import { EXTERNAL_TOOL_STORAGE_KEY, EXTERNAL_TOOL_UPDATE_EVENT, getResolvedExternalTool, readExternalToolSettings } from '../settings/externalToolSettings';
import { projectStages as stages, projectRequirements as requirements, statusLabels, categoryLabels, studentExamples } from '../content/three-kingdoms/studentLanguage';
import '../styles/heritage-project.css';

const TrackedHeritageAr = lazy(() => import('./TrackedHeritageAr'));

function readDraft(key: string) {
  try { const value = readResilientStorage(key); return value ? parseProject(value) : newProject(); }
  catch { return newProject(); }
}
export function HeritageProjectWorkspace({ lesson }: { lesson: Lesson }) {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const storageKey = `${PROJECT_STORAGE_KEY}:${lessonTwoStorageKey(params.get('hub_code') || '', params.get('student_id') || '')}`;
  return <ProjectWorkspace key={storageKey} lesson={lesson} search={search} storageKey={storageKey} />;
}
function ProjectWorkspace({ lesson, search, storageKey }: { lesson: Lesson; search: string; storageKey: string }) {
  const [project, setProject] = useState<HeritageProject>(() => readDraft(storageKey));
  const [message, setMessage] = useState('');
  const [opened, setOpened] = useState<string[]>([]);
  const [showExhibit, setShowExhibit] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [answer, setAnswer] = useState('');
  const [settings, setSettings] = useState(() => readExternalToolSettings({ getItem: readResilientStorage }));
  const example = studentExamples[lesson.id];
  const ready = projectReadiness(project);
  const completion = [ready.research, ready.cleaned, ready.graphed, ready.interpreted, ready.inferred, ready.exhibited];
  const prerequisite = lesson.id === 4 || completion[lesson.id - 5];
  const heritage = heritageResearchCases[project.heritageId - 1];
  const summary = summarizeRecords(project);
  const codap = getResolvedExternalTool(6, settings);
  const codapUrl = codap.studentUrl || codap.embedUrl;

  useEffect(() => {
    try { writeResilientStorage(storageKey, JSON.stringify(project)); }
    catch { setMessage('이 기기에 임시 보관하지 못했습니다. 작업 파일을 내려받아 보관하세요.'); }
  }, [project, storageKey]);
  useEffect(() => { setShowExhibit(false); setZoom(false); setAnswer(''); }, [lesson.id, project.heritageId]);
  useEffect(() => {
    const sync = () => setSettings(readExternalToolSettings({ getItem: readResilientStorage }));
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
    setMessage('표·그래프·설명을 한 파일에 저장했어요. 다음 시간에 ‘지난 작업 열기’로 이 파일을 열어 주세요.');
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
    if (project.records.length && !window.confirm('다른 유산을 조사하려면 새 작업이 시작됩니다. 현재 오늘 작업을 저장했나요?')) return;
    setProject(newProject(project.group, id)); setOpened([]);
  }
  const evidence = project.records.filter(record => project.inference.evidenceIds.includes(record.id));
  const focus = evidence.find(record => record.id === project.exhibit.focusId);

  return <section className="heritage-project" aria-label={`${lesson.id}차시 모둠 탐구`}>
    <div className="project-toolbar">
      <div><label>우리 모둠<select aria-label="우리 모둠" value={project.group} onChange={event => update({ group: Number(event.target.value) })}>{[1,2,3,4,5,6].map(id => <option value={id} key={id}>{id}모둠</option>)}</select></label>
      <label>담당 유산<select aria-label="담당 유산" value={project.heritageId} onChange={event => selectHeritage(Number(event.target.value))}>{heritageResearchCases.map(item => <option value={item.id} key={item.id}>{item.heritage}</option>)}</select></label></div>
      <div><button type="button" onClick={saveFile}>오늘 작업 저장하기</button><label className="project-file-button">지난 작업 열기<input type="file" accept=".json,application/json" onChange={event => { void importFile(event.target.files?.[0]); event.target.value = ''; }} /></label></div>
    </div>
    <p className="project-save-note">수업이 끝나면 <strong>오늘 작업을 저장</strong>하세요. 다음 시간이나 다른 기기에서 이 파일을 열면 이어서 할 수 있어요.</p>
    {message && <p className="project-message" role="status">{message}</p>}
    <nav className="project-stages" aria-label="탐구 순서">{stages.map((stage,index) => <Link key={stage} aria-current={lesson.id === index + 4 ? 'step' : undefined} to={`/three-kingdoms/lesson/${index + 4}?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(search)), view: 'activity' })}`}><span>{index+4}</span>{stage}{completion[index] ? ' ✓' : ''}</Link>)}</nav>
    {!prerequisite && <aside className="project-warning"><strong>먼저 지난 시간의 활동을 마쳐 주세요.</strong><p>{requirements[lesson.id-4]} 다른 기기에서 저장했다면 ‘지난 작업 열기’를 누르세요.</p></aside>}
    <div className="project-overview"><img src={`${import.meta.env.BASE_URL}images/heritage/three-kingdoms/${heritage.image}`} alt={heritage.heritage} /><div className="project-question"><span>10차시까지 이어 갈 질문</span><strong>{project.question}</strong><small>{project.group}모둠 · {heritage.heritage}</small></div></div>

    <details className="project-paper" open={lesson.id === 4 || lesson.id === 6}><summary>{example.title}</summary>{example.lines.map(line => <p key={line}>{line}</p>)}</details>

    {lesson.id === 4 && <>
      <div className="project-two-columns">
        <section className="project-paper"><h3>1. 지난 시간에 고친 말을 적어요</h3><p>지난 활동지에서 문장 하나를 골라 짧게 적어 주세요.</p>
          <label>우리가 의심했던 말<textarea maxLength={500} value={project.previousClaim} onChange={event => update({ previousClaim: event.target.value })} placeholder="지난 활동지에서 의심했던 문장" /></label>
          <label>자료를 읽고 어떻게 고쳤나요?<textarea maxLength={500} value={project.correction} onChange={event => update({ correction: event.target.value })} placeholder="고친 말을 적어요. 아직 모르겠으면 그 까닭을 적어요." /></label>
          <label>더 알아보고 싶은 것은 무엇인가요?<input maxLength={180} value={project.question} onChange={event => update({ question: event.target.value })} /></label>
        </section>
        <section className="project-paper"><h3>2. 자료에서 문장 3~5개를 찾아요</h3><p><strong>표 한 줄에는 문장 하나를 담아요.</strong> 우리가 찾은 문장이 몇 개인지 세는 표예요.</p><ol><li>박물관 자료나 선생님이 나눠 준 자료를 읽어요.</li><li>우리 유산을 설명하는 서로 다른 문장 3~5개를 골라요.</li><li>한 자료를 나눠 읽었어도 자료를 찾은 곳은 같아요.</li></ol><p>다음 시간에는 비슷한 내용끼리 묶어요. 만든 해와 발견한 해는 다르니 어떤 해인지 함께 적어요.</p></section>
      </div>
      <section className="project-paper"><h3>자료를 읽고 ‘우리 표에 담기’를 눌러요</h3><p>아래는 자료를 짧게 정리한 내용이에요. ‘자료 열기’를 누르거나 선생님 자료를 읽고 확인해요.</p>
        {heritage.sources.map(source => <details className="project-source" key={source.id} open={opened.includes(source.id)} onToggle={event => { const isOpen = event.currentTarget.open; setOpened(current => isOpen ? (current.includes(source.id) ? current : [...current, source.id]) : current.filter(id => id !== source.id)); }}><summary>{source.label} · {source.title}</summary><p>{source.readGuide}</p><a href={sourceUrl(source.href)} target="_blank" rel="noreferrer">{source.institution} 자료 열기 ↗</a>
          {source.facts.map(fact => <div className="project-source-fact" key={fact.id}><p>{fact.text}</p><button type="button" disabled={project.records.some(record => record.id === fact.id)} onClick={() => changeRecords([...project.records, { id: fact.id, text: fact.text, category: '', status: '추가 확인', source: source.institution, url: source.href }])}>{project.records.some(record => record.id === fact.id) ? '표에 담았어요' : '우리 표에 담기'}</button></div>)}
        </details>)}
      </section>
    </>}

    {(lesson.id === 4 || lesson.id === 5) && <section className="project-paper"><div className="project-section-title"><h3>우리 모둠이 찾은 문장 · {project.records.length}개</h3><button type="button" disabled={!project.records.length} onClick={() => downloadProjectFile(projectCsv(project), `삼국시대_${project.group}모둠_찾은문장.csv`, 'text/csv;charset=utf-8')}>표 파일 받기 (CSV)</button></div>
      {lesson.id === 5 && <p>고치기 전 표 파일을 먼저 저장해요. 같은 문장은 하나만 남기고 빈칸을 확인해요. 같은 자료라도 내용이 다른 문장은 남겨요.</p>}
      {!project.records.length ? <p>위에서 자료를 읽고 ‘우리 표에 담기’를 눌러 주세요.</p> : <div className="project-record-list">{project.records.map((record,index) => <article key={record.id} className="project-record"><strong>찾은 문장 {index+1}</strong><label>자료에서 찾은 문장<textarea value={record.text} maxLength={1000} onChange={event => editRecord(record.id, { text: event.target.value })} /></label><div className="project-two-columns"><label>어떤 내용인가요?<select value={record.category} onChange={event => editRecord(record.id, { category: event.target.value as ResearchRecord['category'] })}><option value="">비슷한 내용끼리 묶어 주세요</option>{evidenceCategories.map(category => <option key={category} value={category}>{category}</option>)}</select>{record.category && <small>{categoryLabels[record.category].split(" · ")[1]}</small>}</label><label>자료를 읽어 보니 어떤가요?<select value={record.status} onChange={event => editRecord(record.id, { status: event.target.value as ResearchRecord['status'] })}>{evidenceStatuses.map(status => <option key={status} value={status}>{status}</option>)}</select><small>{statusLabels[record.status].split(" · ")[1]}</small></label></div><p>{record.source} · {sourceUrl(record.url) ? <a href={record.url} target="_blank" rel="noreferrer">찾은 자료 보기 ↗</a> : '자료를 찾은 주소를 확인해 주세요'}</p><button className="project-text-button" type="button" onClick={() => changeRecords(project.records.filter(item => item.id !== record.id))}>이 문장 빼기</button></article>)}</div>}
      {lesson.id === 5 && <><ul className="project-validation">{recordProblems(project.records).map(problem => <li key={problem}>{problem}</li>)}</ul><button className="button button--primary" type="button" disabled={!ready.research || recordProblems(project.records).length > 0} onClick={() => { update({ cleanedRevision: project.revision }); setMessage('표를 확인했어요. 파일을 저장하고 6차시에서 그래프를 만들어요.'); }}>표 확인 끝!</button></>}
    </section>}

    {lesson.id === 5 && <details className="project-paper"><summary>구글 스프레드시트에서도 표 보기 (선택)</summary><p>표 파일을 구글 스프레드시트에서도 열 수 있어요. 그곳에서 고쳤다면 이 화면의 표도 똑같이 고친 뒤 다시 저장해요.</p><ExternalToolActivity lesson={lesson} /></details>}

    {lesson.id === 6 && <section className="project-paper"><h3>우리 표로 그래프를 만들어요</h3><p>그래프 아래쪽 가로축에는 문장의 종류를, 옆쪽 세로축에는 <strong>문장 수(개)</strong>를 놓아요. 문장 수로 나라의 힘이나 옛사람 수를 비교할 수는 없어요.</p><label>무엇을 나누어 세어 볼까요?<select disabled={!ready.cleaned} value={project.graph.dimension} onChange={event => update({ graph: { ...project.graph, dimension: event.target.value as 'category' | 'status', image: '', revision: -1 }, interpretation: '', exhibit: { ...project.exhibit, tested: false } })}><option value="category">문장 종류별로 (살펴본항목)</option><option value="status">자료를 확인했는지에 따라 (확인상태)</option></select></label>
      <div className="project-actions"><button disabled={!ready.cleaned} type="button" onClick={() => downloadProjectFile(projectCsv(project), `삼국시대_${project.group}모둠_고친표.csv`, 'text/csv;charset=utf-8')}>1. 고친 표 받기 (CSV)</button><a aria-disabled={!ready.cleaned || !codap.enabled || !codapUrl} href={ready.cleaned && codap.enabled && codapUrl ? codapUrl : undefined} target="_blank" rel="noreferrer">2. 그래프 도구 열기 ↗</a><label className="project-file-button">3. 그래프 그림 가져오기<input disabled={!ready.cleaned} type="file" accept="image/png" onChange={event => { void importGraph(event.target.files?.[0]); event.target.value = ''; }} /></label></div>
      <ol><li>CODAP은 그래프를 만드는 도구예요. 우리 표 파일(CSV)을 열어요.</li><li>표에서 ‘살펴본항목’ 또는 ‘확인상태’를 그래프 아래쪽으로 끌어 놓고 종류별 문장 수를 표시해요.</li><li>문장 수가 아래 표와 맞는지 확인해요. 그래프를 그림 파일(PNG)로 저장해요.</li></ol><label>그래프 제목<input maxLength={180} value={project.graph.title} onChange={event => update({ graph: { ...project.graph, title: event.target.value } })} placeholder="예: 우리 모둠이 찾은 문장 종류" /></label>
      <table className="project-counts"><caption>그래프의 개수가 이 표와 같은지 보세요 · 전체 {project.records.length}개</caption><thead><tr><th>종류</th><th>문장 수</th></tr></thead><tbody>{summary.map(row => <tr key={row.label}><td>{row.label}</td><td>{row.count}개</td></tr>)}</tbody></table>
    </section>}

    {project.graph.image && lesson.id >= 6 && <figure className="project-graph"><img src={project.graph.image} alt={project.graph.title || '우리 모둠 CODAP 그래프'} /><figcaption>{project.graph.title || '제목을 입력하세요'} · {project.graph.revision === project.revision ? `문장 ${project.records.length}개` : '표가 바뀌었습니다. 6차시에서 그래프를 다시 만들어 주세요.'}</figcaption></figure>}

    {lesson.id === 7 && <section className="project-paper"><h3>그래프로 알 수 있는 것과 없는 것을 말해요</h3><fieldset disabled={!ready.graphed}><label>어떤 문장이 몇 개인가요?<select value={project.interpretation} onChange={event => update({ interpretation: event.target.value, exhibit: { ...project.exhibit, tested: false } })}><option value="">그래프와 맞는 문장을 고르세요</option>{summary.map(row => { const sentence = `우리 모둠이 모은 근거 ${project.records.length}건 중 ‘${row.label}’은 ${row.count}건입니다.`; return <option key={row.label} value={sentence}>{`우리 문장 ${project.records.length}개 중 ‘${row.label}’은 ${row.count}개예요.`}</option>; })}</select></label><label>이 그래프만으로 알 수 없는 것<select value={project.limitation} onChange={event => update({ limitation: event.target.value, exhibit: { ...project.exhibit, tested: false } })}><option value="">그래프만으로 알 수 없는 것을 고르세요</option>{[
        ['우리가 고른 자료만 세었으므로 삼국시대 전체 모습은 알 수 없습니다.', '우리가 고른 문장만 세어서 삼국시대 생활을 모두 알 수는 없어요.'],
        ['근거 문장 수가 많다고 역사적으로 더 중요하다는 뜻은 아닙니다.', '문장이 많다고 그 유산이 더 중요하다는 뜻은 아니에요.'],
        ['문장의 개수만으로 옛사람의 생활이나 교류를 증명할 수 없습니다.', '문장 수만으로 옛사람들이 어떻게 살았는지는 알 수 없어요.'],
      ].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></fieldset><p>다음 시간에는 <strong>찾은 문장 두 개를 읽고 옛날 모습을 생각해 볼 거예요.</strong></p></section>}

    {lesson.id === 8 && <section className="project-paper"><h3>찾은 문장 두 개로 옛날 모습을 생각해요</h3><p>자료에서 확인한 문장 두 개를 골라요. 두 문장으로 어떤 옛날 모습을 설명할 수 있을까요? 한 자료에서 문장 두 개를 골라도 두 곳에서 따로 확인한 것은 아니에요.</p><fieldset disabled={!ready.interpreted}><div className="project-evidence-options">{project.records.filter(record => record.status === '확인됨').map(record => <label key={record.id}><input type="checkbox" checked={project.inference.evidenceIds.includes(record.id)} onChange={() => { const ids = project.inference.evidenceIds.includes(record.id) ? project.inference.evidenceIds.filter(id => id !== record.id) : [...project.inference.evidenceIds, record.id].slice(-2); update({ inference: { ...project.inference, evidenceIds: ids }, exhibit: { ...project.exhibit, focusId: '', tested: false } }); }} /><span>{record.text}</span></label>)}</div><p>{project.inference.evidenceIds.length} / 2개 선택</p><label>두 문장을 보니 옛날에는 어땠을 것 같나요?<textarea maxLength={500} value={project.inference.sentence} onChange={event => update({ inference: { ...project.inference, sentence: event.target.value }, exhibit: { ...project.exhibit, tested: false } })} placeholder="이 두 문장을 보니, 옛날 사람들은 …했을 것 같아요." /></label><label>아직 알 수 없는 점은 무엇인가요?<textarea maxLength={500} value={project.inference.limit} onChange={event => update({ inference: { ...project.inference, limit: event.target.value }, exhibit: { ...project.exhibit, tested: false } })} placeholder="하지만 이 자료만으로 …은 알 수 없어요." /></label></fieldset><details><summary>무엇을 써야 할지 모르겠다면</summary><p>어떻게 만들었을지, 무엇을 중요하게 생각했을지 떠올려 봐요. 왜 그렇게 생각했는지 고른 두 문장을 가리킬 수 있어야 해요. 자료가 부족하면 4차시에서 더 찾아보고 표와 그래프도 다시 만들어요.</p></details></section>}

    {lesson.id === 9 && <section className="project-paper"><h3>친구에게 보여 줄 사진과 설명을 골라요</h3><fieldset disabled={!ready.inferred}><label>친구에게 꼭 보여 주고 싶은 문장<select value={project.exhibit.focusId} onChange={event => update({ exhibit: { ...project.exhibit, focusId: event.target.value, tested: false } })}><option value="">8차시에 고른 문장 중 하나를 고르세요</option>{evidence.map(record => <option value={record.id} key={record.id}>{record.text}</option>)}</select></label><div className="project-two-columns"><label>사진을 어떻게 보여 줄까요?<select value={project.exhibit.effect} onChange={event => update({ exhibit: { ...project.exhibit, effect: event.target.value as '표시' | '확대', tested: false } })}><option value="표시">그대로 보기</option><option value="확대">눌러서 크게 보기</option></select></label><label>구경하는 친구가 할 일<select value={project.exhibit.action} onChange={event => update({ exhibit: { ...project.exhibit, action: event.target.value as '특징 찾기' | '근거 고르기', tested: false } })}><option>특징 찾기</option><option>근거 고르기</option></select></label></div></fieldset><p>‘그대로 보기’는 사진 옆에 설명을 보여 줘요. ‘눌러서 크게 보기’는 친구가 사진을 눌러 자세히 볼 수 있어요.</p><button className="button button--primary" disabled={!ready.planned} type="button" onClick={() => setShowExhibit(true)}>우리 전시 미리 열어 보기</button></section>}

    {lesson.id === 10 && <section className="project-paper"><h3>{project.group}모둠 · {heritage.heritage} 전시</h3><p>9차시 파일을 열면 우리 그래프와 설명이 나와요. 지난 2·3차시 활동지도 전시 자리에 함께 놓아요.</p><button className="button button--primary" disabled={!ready.exhibited} type="button" onClick={() => setShowExhibit(true)}>친구에게 전시 보여 주기</button><details><summary>설명하고 구경하는 순서 · 40분</summary><p>준비 5분 → A팀 설명·B팀 구경 12분 → 역할 바꾸기 2분 → B팀 설명·A팀 구경 12분 → 정리 3분 → 돌아보기 6분. 구경하는 팀은 다른 모둠 세 곳을 4분씩 둘러봐요.</p></details></section>}

    {showExhibit && ready.planned && <section className="project-exhibit" aria-label="우리 모둠 전시"><div className="project-section-title"><div><span>{project.group}모둠 · 근거로 설명하는 박물관</span><h3>{heritage.heritage}</h3></div><button type="button" onClick={() => setShowExhibit(false)}>전시 닫기</button></div><p className="project-exhibit-question">{project.question}</p><div className="project-two-columns"><figure><button className="project-photo" type="button" disabled={project.exhibit.effect !== '확대'} aria-label="유산 사진 확대 전환" aria-pressed={zoom} onClick={() => setZoom(value => !value)}><img className={zoom ? 'is-zoomed' : ''} src={`${import.meta.env.BASE_URL}images/heritage/three-kingdoms/${heritage.image}`} alt={heritage.heritage} /></button><figcaption>{project.exhibit.effect === '확대' ? '사진을 눌러 확대하고 특징을 찾으세요.' : '사진과 근거 문장에서 같은 특징을 찾으세요.'}</figcaption></figure><div><h4>자료에서 찾은 문장</h4><p>{focus?.text}</p><h4>문장을 보고 생각한 옛날 모습</h4><p>{project.inference.sentence}</p><h4>아직 알 수 없는 점</h4><p>{project.inference.limit}</p></div></div><figure className="project-graph"><img src={project.graph.image} alt={project.graph.title} /><figcaption>{project.interpretation}<br />{project.limitation}</figcaption></figure><details><summary>AI가 한 말을 어떻게 고쳤나요?</summary><p>처음 의심한 말: {project.previousClaim}</p><p>자료를 읽고 고친 말: {project.correction}</p></details><div className="project-visitor"><h4>함께 해 봐요 · {project.exhibit.action}</h4>{project.exhibit.action === '특징 찾기' ? <><p>사진에서 설명과 같은 부분을 찾아 가리키고 친구에게 말해 보세요.</p><button type="button" onClick={() => setAnswer('사진에서 찾은 부분과 자료의 문장을 함께 보여 주세요.')}>찾았어요</button></> : <><p>우리 모둠이 꼭 보여 주고 싶다고 고른 문장은 무엇일까요?</p>{evidence.map(record => <button key={record.id} type="button" onClick={() => setAnswer(record.id === project.exhibit.focusId ? '맞아요. 이 문장으로 무엇을 알게 됐는지 말해 보세요.' : '이것도 우리가 찾은 문장이에요. 사진 옆에 보여 준 문장을 다시 찾아보세요.')}>{record.text}</button>)}</>}{answer && <p role="status">{answer}</p>}</div><Suspense fallback={<p>AR을 준비하고 있습니다…</p>}><TrackedHeritageAr heritageId={project.heritageId} explanation={focus?.text} caution={project.inference.limit} /></Suspense><details><summary>자료를 어디에서 찾았나요?</summary>{evidence.map(record => <p key={record.id}>{record.text}<br /><a href={sourceUrl(record.url)} target="_blank" rel="noreferrer">{record.source} ↗</a></p>)}</details>{lesson.id === 9 && <button type="button" className="button button--primary" onClick={() => { update({ exhibit: { ...project.exhibit, tested: true } }); setMessage('전시를 확인했어요. 오늘 작업을 저장하고 10차시에 이 파일을 열어요.'); }}>전시 확인 끝!</button>}</section>}
    <footer className="project-footer"><strong>{ready.research ? `${project.group}모둠 탐구가 이어지고 있어요.` : '지난 시간에 고친 말과 자료에서 찾은 문장을 담아 주세요.'}</strong><button type="button" onClick={saveFile}>오늘 작업 저장하기</button></footer>
  </section>;
}
