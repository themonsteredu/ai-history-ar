import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { heritageImageUrl, researchForEra } from '../../content/heritageCatalog';
import { downloadProjectFile } from '../../content/three-kingdoms/project';
import NarrationEditor from '../../components/NarrationEditor';
import ArRecognitionCard from '../../components/ArRecognitionCard';
import type { ExhibitPoint } from '../../lib/ar/exhibit';
import type { ExhibitionSound } from '../../lib/ar/sound';
import type { Classroom, StudioSession } from './api';
import { newPoint, submissionProblems, type StudioProject } from './project';
import { newPreparedProject, applyPreparedModel, hasStarterModel } from './prepared';
import { preparedHeritage } from '../../lib/ar/preparedCatalog';
import { photoCoordinates, readyQuestions } from './maker';
import { QuestionStep } from './NarrationStep';
import { Exhibition, IndividualQuiz } from './Exhibition';
import { TeacherControls } from './TeacherControls';
import { ClassroomEntry } from './ClassroomEntry';
import './maker.css';

const Viewer = lazy(() => import('../../components/ArExhibitViewer'));
const HeritageModelView = lazy(() => import('../../components/HeritageModelView'));

interface MakerWorkspaceProps {
  project: StudioProject;
  onChange: (project: StudioProject) => void;
  ready: boolean;
  busy: boolean;
  recording: boolean;
  onRecording: (value: boolean) => void;
  message: string;
  onMessage: (value: string) => void;
  sound: ExhibitionSound;
  soundOn: boolean;
  volume: number;
  effects: boolean;
  onSound: (value: boolean) => void;
  onVolume: (value: number) => void;
  onEffects: (value: boolean) => void;
  classroom?: Classroom;
  session?: StudioSession;
  teacher: boolean;
  code: string;
  onCode: (value: string) => void;
  inputCode: string;
  onInputCode: (value: string) => void;
  name: string;
  onName: (value: string) => void;
  joinGroup: number;
  onJoinGroup: (value: number) => void;
  onJoin: () => void;
  onSave: (final?: boolean) => void;
  onLoadShared: () => void;
  onImport: (file?: File) => void;
}

export function MakerWorkspace(props: MakerWorkspaceProps) {
  const { project, onChange, sound, recording, busy, ready, classroom, session } = props;
  const [view, setView] = useState<'photo' | 'preview' | 'classroom'>('photo');
  const [selected, setSelected] = useState(project.ar.points[0].id);
  const [placeOnModel, setPlaceOnModel] = useState(true);
  const entry = useRef<HTMLDivElement>(null);
  const [showProblems, setShowProblems] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState('');
  const latest = useRef(project); latest.current = project;
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const point = project.ar.points.find(item => item.id === selected) || project.ar.points[0];
  const heritage = researchForEra('three-kingdoms').find(item => item.id === project.heritageId)!;
  const image = heritageImageUrl('three-kingdoms', project.heritageId);
  const prepared = preparedHeritage(project.ar.model?.preset);
  const museumOriginal = project.ar.model?.asset === 'cheomseongdae-nsm-2015';
  const readonly = !!classroom && classroom.phase !== 'making' && classroom.mode !== 'shared';
  const editingDisabled = busy || recording || placing || readonly || !ready;
  const problems = submissionProblems(project);
  const questions = readyQuestions(project);

  function changeView(next: typeof view) {
    if (recording || placing) return;
    sound.narration(false);
    setView(next);
    if (next === 'preview' && !readonly) onChange({ ...project, modelChecked: true, pointsChecked: true });
  }
  function updatePoint(patch: Partial<ExhibitPoint>) {
    onChange({ ...project, pointsChecked: patch.position || patch.photoPosition ? false : project.pointsChecked, ar: { ...project.ar, points: project.ar.points.map(item => item.id === point.id ? { ...item, ...patch } : item) } });
  }
  async function placePhoto(coordinates: [number, number]) {
    if (editingDisabled) return;
    const pointId = point.id;
    const currentProject = project;
    setPlacing(true); setPlaced('');
    try {
      const { photoToModelPosition } = await import('../../lib/ar/modelScene');
      const position = await photoToModelPosition(project.ar.model!, coordinates);
      if (!alive.current || latest.current !== currentProject) return;
      onChange({ ...project, pointsChecked: false, ar: { ...project.ar, points: project.ar.points.map(item => item.id === pointId ? { ...item, photoPosition: coordinates, position } : item) } });
      setPlaced(`${project.ar.points.findIndex(item => item.id === pointId) + 1}번 점의 위치를 옮겼어요.`);
    } catch { if (alive.current) props.onMessage('설명점 위치를 옮기지 못했어요. 한 번 더 눌러 주세요.'); }
    finally { if (alive.current) setPlacing(false); }
  }
  async function chooseHeritage(id: number) {
    if (editingDisabled || id === project.heritageId) return;
    const currentProject = project;
    const hasWork = project.ar.points.some(item => item.title || item.text || item.narration) ||
      project.questions.some(item => item.prompt || item.options.some(Boolean)) ||
      (project.ar.model?.format === 'primitives' && !hasStarterModel(project));
    if (hasWork && !window.confirm('유물을 바꾸면 새 작품을 시작해요. 현재 작업은 먼저 파일로 보관해 주세요. 다른 유물로 바꿀까요?')) return;
    setPlacing(true);
    try {
      const next = await newPreparedProject(session?.group || project.group, id);
      if (!alive.current || latest.current !== currentProject) return;
      onChange(next); setSelected(next.ar.points[0].id);
      setView('photo'); setPlaceOnModel(true); setShowProblems(false); setPlaced('');
    } catch { if (alive.current) props.onMessage('유물 모형을 열지 못했어요. 다시 골라 주세요.'); }
    finally { if (alive.current) setPlacing(false); }
  }
  async function replaceWithPrepared() {
    if (editingDisabled || !window.confirm('설명과 녹음은 유지하고, 준비된 유물 모형으로 바꿀까요? 점의 위치는 다시 확인해 주세요.')) return;
    const currentProject = project;
    setPlacing(true);
    try { const next = await applyPreparedModel(project); if (alive.current && latest.current === currentProject) { onChange(next); setPlaceOnModel(true); setPlaced('준비된 모형을 열었어요. 설명할 곳에 점을 다시 찍어 주세요.'); } }
    catch { if (alive.current) props.onMessage('준비된 모형을 열지 못했어요. 현재 작업은 그대로 유지돼요.'); }
    finally { if (alive.current) setPlacing(false); }
  }
  function save(final = false) {
    if (!session) { entry.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); props.onMessage('다른 태블릿에서도 열려면 위에서 수업코드로 입장해 주세요. 지금 작업은 그대로 유지돼요.'); return; }
    if (!classroom?.canEdit) { props.onMessage('모둠 작품은 처음 공유한 태블릿에서 저장해요. 여기서는 우리 반 작품을 관람하거나 내 작업을 파일로 보관할 수 있어요.'); return; }
    if (final && classroom.mode !== 'shared' && problems.length) { setShowProblems(true); return; }
    props.onSave(final);
  }

  return <div className="studio-page maker-page page-width">
    <header className="maker-titlebar">
      <div><Link to="/three-kingdoms" onClick={event => { if (recording) event.preventDefault(); }}>← 삼국시대</Link><h1>AR 만들기</h1></div>
      <div className="maker-title-actions"><span className="maker-draft-label">{session ? `${session.code} · ${session.group}모둠` : '이 기기에서 제작 중'}</span><button disabled={busy || recording || placing || !ready || readonly || (!!session && !classroom?.canEdit)} onClick={() => save()}>모둠에 공유</button><button className="studio-primary" disabled={busy || recording || placing || !ready} onClick={() => changeView(view === 'preview' ? 'photo' : 'preview')}>{view === 'preview' ? '제작으로 돌아가기' : '내 작품 AR로 보기'}</button></div>
    </header>

    <div ref={entry}><ClassroomEntry session={session} inputCode={props.inputCode} name={props.name} joinGroup={props.joinGroup} disabled={busy || recording || placing || !ready} onInputCode={props.onInputCode} onName={props.onName} onJoinGroup={props.onJoinGroup} onJoin={props.onJoin} onGallery={() => changeView('classroom')} /></div>

    <div className="maker-projectbar">
      <label>모둠<select aria-label="제작 모둠" disabled={editingDisabled || !!session} value={project.group} onChange={event => { const group = Number(event.target.value); onChange({ ...project, group }); props.onJoinGroup(group); }}>{[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}모둠</option>)}</select></label>
      <label>우리 유물<select aria-label="유물 선택" disabled={editingDisabled} value={project.heritageId} onChange={event => { void chooseHeritage(Number(event.target.value)); }}>{researchForEra('three-kingdoms').map(item => <option key={item.id} value={item.id}>{item.heritage}</option>)}</select></label>
      <p>준비된 모형에 점을 찍고, 설명과 목소리를 붙여요.</p>
    </div>
    {props.message && <p className="studio-notice" role="status">{props.message}</p>}
    {readonly && <p className="studio-notice">전시가 시작되어 제출 작품은 고정되어 있어요. 내 작품과 우리 반 전시는 계속 볼 수 있어요.</p>}
    {!ready ? <p role="status">작업을 불러와요…</p> : <>
      <nav className="maker-viewbar" aria-label="AR 만들기 도구">
        {([['photo', '점 찍기·설명·녹음'], ['preview', '내 작품 체험'], ['classroom', '우리 반 전시·퀴즈']] as const).map(([key, label]) => <button key={key} aria-pressed={view === key} disabled={recording || placing} onClick={() => changeView(key)}>{label}</button>)}
      </nav>
      {view === 'photo' && <section className="maker-photo-layout" aria-label="준비된 유물에 설명점과 녹음 붙이기">
        <div className="maker-visual">
          <div className="maker-surface-heading"><strong>{heritage.heritage}</strong><button disabled={editingDisabled} aria-pressed={placeOnModel} onClick={() => setPlaceOnModel(!placeOnModel)}>{placeOnModel ? '사진에서 보기' : '입체 모형에서 점 찍기'}</button></div>
          {museumOriginal ? <p className="maker-model-description">국립중앙과학관의 실물 표면 그림이 포함된 첨성대 3D 원본이에요. 설명할 곳을 눌러 점을 붙이세요.</p> : prepared ? <p className="maker-model-description">{prepared.detail}</p> : <p className="maker-model-description">이전에 만든 모형을 열었어요. <button disabled={editingDisabled} onClick={() => { void replaceWithPrepared(); }}>준비된 유물 모형 사용</button></p>}
          {placeOnModel ? <Suspense fallback={<p>모형을 열어요…</p>}><HeritageModelView model={project.ar.model} image={image} points={project.ar.points} selectedId={point.id} onSelect={id => { if (!editingDisabled) setSelected(id); }} onPlace={editingDisabled ? undefined : position => updatePoint({ position })} targetIndex={project.heritageId - 1} /></Suspense> : <div className="maker-photo">
            <button type="button" className="maker-photo-surface" aria-label={`${point.title || '선택한 설명점'} 위치를 사진에 찍기`} disabled={editingDisabled} onClick={event => { const coordinates = event.detail === 0 ? [.5, .5] as [number, number] : photoCoordinates(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect()); void placePhoto(coordinates); }}><img src={image} alt={`${heritage.heritage} · 설명할 위치를 눌러 주세요`} draggable={false} /></button>
            {project.ar.points.map((item, index) => <button key={item.id} type="button" className="maker-pin" aria-pressed={point.id === item.id} aria-label={`${index + 1}번 설명점 선택`} disabled={editingDisabled} style={{ left: `${item.photoPosition[0] * 100}%`, top: `${item.photoPosition[1] * 100}%` }} onClick={() => { setSelected(item.id); setPlaced(''); }}>{index + 1}</button>)}
          </div>}
          <p className="maker-photo-help" role="status">{placing ? '유물과 설명점 위치를 준비해요…' : placed || (placeOnModel ? '번호를 고르고 모형을 톡 누르면 점이 붙어요. 손가락으로 끌어서 돌려볼 수 있어요.' : '번호를 고른 뒤 사진을 누르면 그곳으로 점이 이동해요.')}</p>
          {prepared && <p className="maker-model-credit">실물의 특징을 단순화한 학습용 모형이에요. 자세한 모습은 사진과 함께 살펴봐요.</p>}
          {museumOriginal && <p className="maker-model-credit">{project.ar.model?.credit} · 원본 약 36MB를 처음 한 번 내려받아요. 교체된 모형의 점 위치를 확인해 주세요.</p>}
        </div>
        <aside className="maker-point-editor">
          <div className="maker-point-heading"><h2>설명과 목소리</h2><span>{project.ar.points.length}개의 설명점</span></div>
          <div className="maker-point-tabs">{project.ar.points.map((item, index) => <button key={item.id} disabled={editingDisabled} aria-pressed={point.id === item.id} onClick={() => { sound.narration(false); setSelected(item.id); setPlaced(''); }}><span>{index + 1}</span><small>{item.narration ? '녹음 완료' : item.text ? '설명 작성' : '설명 쓰기'}</small></button>)}{project.ar.points.length < 4 && <button disabled={editingDisabled} aria-label="설명점 하나 더 추가" onClick={() => { const item = newPoint(project.ar.points.length); onChange({ ...project, pointsChecked: false, ar: { ...project.ar, points: [...project.ar.points, item] } }); setSelected(item.id); }}>＋</button>}</div>
          <fieldset disabled={editingDisabled} className="maker-text-fields"><label>설명할 곳<input value={point.title} maxLength={80} placeholder="예: 가운데 창" onChange={event => updatePoint({ title: event.target.value })} /></label><label>친구에게 들려줄 설명<textarea value={point.text} rows={4} maxLength={1500} placeholder="이 부분은 어떤 특징이 있나요?" onChange={event => updatePoint({ text: event.target.value })} /></label></fieldset>
          <NarrationEditor key={point.id} value={point.narration} disabled={busy || placing || readonly} onChange={narration => updatePoint({ narration })} onBusy={value => { props.onRecording(value); sound.recordingActive(value); }} onPlayback={value => sound.narration(value)} />
          {project.ar.points.length > 3 && <button className="maker-quiet-button" disabled={editingDisabled} onClick={() => { if (!window.confirm('이 설명점과 녹음을 지울까요?')) return; const points = project.ar.points.filter(item => item.id !== point.id); onChange({ ...project, pointsChecked: false, ar: { ...project.ar, points, answerId: points[0].id }, questions: project.questions.map(q => q.pointId === point.id ? { ...q, pointId: points[0].id } : q) }); setSelected(points[0].id); }}>이 설명점 지우기</button>}
        </aside>
      </section>}
      {view === 'preview' && <section className="maker-preview" aria-label="내 작품 미리보기">
        <p className="maker-preview-note">유물 모형에 붙인 설명과 녹음으로 체험해요. 제출이나 퀴즈 완성은 필요 없어요.</p>
        <Suspense fallback={<p>내 작품을 열어요…</p>}><Viewer key={project.heritageId} value={project.ar} heritage={heritage.heritage} heritageId={project.heritageId} image={image} showQuiz={false} showCard={false} onNarrationActivity={value => sound.narration(value)} onCardFound={() => sound.effect('found')} /></Suspense>
        {questions.length > 0 && <details className="maker-extra"><summary>내가 만든 퀴즈 풀어보기 · {questions.length}문제</summary><MakerQuiz key={JSON.stringify(questions)} project={project} sound={sound} /></details>}
      </section>}
      {view === 'classroom' && <section className="maker-classroom"><Exhibition classroom={classroom} session={session} sound={sound} /><details className="maker-extra"><summary>우리 반 문제 풀기·활동 기록</summary><IndividualQuiz key={session?.memberId || 'practice'} classroom={classroom} session={session} sound={sound} /></details></section>}

      <details className="maker-extra maker-question-tools"><summary>퀴즈 만들기 <span>{questions.length}문제 작성</span></summary><QuestionStep project={project} onChange={onChange} onSubmit={() => save(true)} busy={editingDisabled} connected={!!classroom?.canEdit} showSubmission={false} /></details>
      <div className="maker-extras-row">
        <details className="maker-extra"><summary>사진 카드 출력</summary><ArRecognitionCard heritageId={heritage.id} heritage={heritage.heritage} shared={!!session} /></details>
        <details className="maker-extra"><summary>배경음·효과음</summary><div className="studio-actions"><button disabled={recording} aria-pressed={props.soundOn} onClick={() => props.onSound(!props.soundOn)}>{props.soundOn ? '배경음 끄기' : '배경음 켜기'}</button><label>배경음 크기<input type="range" min={0} max={.5} step={.05} value={props.volume} onChange={event => props.onVolume(Number(event.target.value))} /></label><label><input type="checkbox" disabled={recording} checked={props.effects} onChange={event => props.onEffects(event.target.checked)} />짧은 효과음</label></div><p>해설 중에는 배경음이 작아지고 녹음 중에는 모든 배경 소리가 멈춰요.</p></details>
      </div>
      <details className="maker-extra"><summary>모둠 작업 저장·불러오기</summary>
        {!session ? <p>화면 위의 수업코드 입장칸에서 연결하세요. 지금 작업은 유지돼요.</p> : <><p>{classroom?.canEdit ? '공유하면 친구들의 태블릿에도 작품과 녹음이 나타나요. 퀴즈는 만들지 않아도 돼요.' : '처음 공유한 모둠 대표 태블릿에서 저장해요. 다른 친구들은 ‘우리 반 작품 보기’로 관람하세요.'}</p><div className="studio-actions"><button disabled={editingDisabled || !classroom?.canEdit} onClick={() => save()}>모둠에 공유</button><button disabled={editingDisabled || !classroom?.canEdit} onClick={props.onLoadShared}>저장한 우리 모둠 작품 열기</button></div>{showProblems && problems.length > 0 && <div className="studio-notice" role="status"><ul>{problems.map(message => <li key={message}>{message}</li>)}</ul></div>}</>}
      </details>
      <details className="maker-extra"><summary>작업 파일 보관·불러오기</summary><p>이 기기에는 임시 저장돼요. 수업코드로 저장하거나 작업 파일을 받아 보관해 주세요.</p><div className="studio-actions"><button disabled={recording || busy} onClick={() => downloadProjectFile(JSON.stringify(project), `AR_${project.group}모둠_${heritage.heritage}.json`, 'application/json')}>작업 파일 받기</button><label className="studio-file">작업 파일 열기<input disabled={editingDisabled} type="file" accept=".json,application/json" onChange={event => { props.onImport(event.target.files?.[0]); event.target.value = ''; }} /></label></div></details>
      {props.teacher && <details className="maker-extra"><summary>교사 전시 진행</summary><TeacherControls initialCode={props.code} onCode={props.onCode} /></details>}
    </>}
  </div>;
}

function MakerQuiz({ project, sound }: { project: StudioProject; sound: ExhibitionSound }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const questions = readyQuestions(project);
  return <section aria-label="내 퀴즈 미리보기">{questions.map((question, index) => <fieldset className="studio-question-editor" key={question.id}><legend>{index + 1}. {question.prompt}</legend><div className="studio-quiz-options">{question.options.map((option, choice) => <button key={choice} aria-pressed={answers[question.id] === choice} onClick={() => { setAnswers(previous => ({ ...previous, [question.id]: choice })); if (choice === question.answer) sound.effect('correct'); }}>{option}</button>)}</div>{answers[question.id] !== undefined && <p role="status">{answers[question.id] === question.answer ? '정답이에요.' : '해설을 다시 들어 보세요.'} {project.ar.points.find(point => point.id === question.pointId)?.text}</p>}</fieldset>)}<p>내 작품 확인용입니다. 학생 점수로 제출되지 않아요.</p></section>;
}
