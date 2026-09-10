import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { researchForEra } from '../../content/heritageCatalog';
import { downloadProjectFile } from '../../content/three-kingdoms/project';
import { loadProjectDraft, saveProjectDraft } from '../../lib/projectDraftStore';
import { ExhibitionSound } from '../../lib/ar/sound';
import { isStudioProject, newStudioProject, type StudioProject } from './project';
import { prepareMakerDraft } from './prepared';
import { studioApi, keepStudioSession, readStudioSession, type Classroom, type StudioSession } from './api';
import { samplePath } from './sample';
import { TeacherGuide } from './TeacherGuide';
import { TeacherControls } from './TeacherControls';
import { NarrationStep, QuestionStep } from './NarrationStep';
import { Exhibition, IndividualQuiz } from './Exhibition';
import { MakerWorkspace } from './MakerWorkspace';
import './studio.css';
const ModelEditor = lazy(() => import('./ModelEditor').then(m => ({ default: m.ModelEditor })));
const steps = [['model', '모형 만들기'], ['narration', '설명·녹음'], ['questions', '문제·제출'], ['gallery', 'AR 관람'], ['quiz', '개인 퀴즈']] as const;

export default function StudioPage({ teacher = false, maker = false }: { teacher?: boolean; maker?: boolean }) {
  const [params, setParams] = useSearchParams();
  const code = (params.get('hub_code') || '').trim().toLowerCase();
  const [session, setSession] = useState<StudioSession | undefined>(() => readStudioSession(code));
  const effectiveSession = session?.code === code ? session : undefined;
  const [inputCode, setInputCode] = useState(code); const [name, setName] = useState(''); const [joinGroup, setJoinGroup] = useState(1);
  const [project, setProject] = useState<StudioProject>(() => newStudioProject(1, maker ? 3 : 1));
  const [classroom, setClassroom] = useState<Classroom>(); const [revision, setRevision] = useState(0);
  const [ready, setReady] = useState(false); const [busy, setBusy] = useState(false); const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState(''); const [soundOn, setSoundOn] = useState(false); const [volume, setVolume] = useState(.2); const [effects, setEffects] = useState(false);
  const [sound] = useState(() => new ExhibitionSound());
  const latest = useRef(project); latest.current = project;
  const latestDraft = useRef({ project, revision }); latestDraft.current = { project, revision };
  const draftLoaded = useRef(false);
  const transferredDraft = useRef<StudioProject | undefined>(undefined);
  const step = params.get('step') || (teacher ? 'guide' : 'model'); const lesson = Number(params.get('lesson')) || 4;
  const draftKey = `${maker ? 'history-ar-maker' : 'history-ar-studio'}:v1:${code || 'practice'}:${effectiveSession?.memberId || 'local'}`;
  const canEdit = !classroom || classroom.phase === 'making' || classroom.mode === 'shared';
  const heritage = researchForEra('three-kingdoms').find(h => h.id === project.heritageId)!;
  function navigate(next: string, lessonId = lesson) { if (recording) return; const query = new URLSearchParams(params); query.set('step', next); query.set('lesson', String(lessonId)); query.delete('view'); setParams(query); }
  function updateCode(value: string) { const query = new URLSearchParams(params); query.set('hub_code', value); setParams(query); setInputCode(value); }
  async function refresh() {
    if (!effectiveSession) return;
    const data = await studioApi<Classroom>(`/rooms/${effectiveSession.code}`, effectiveSession.token); setClassroom(data);
  }
  useEffect(() => {
    let cancelled = false; draftLoaded.current = false; setReady(false); setClassroom(undefined); setRevision(0);
    void (async () => {
      let draft = newStudioProject(effectiveSession?.group || 1, maker ? 3 : 1);
      let savedRevision = 0, notice = '';
      try {
        const text = await loadProjectDraft(draftKey);
        if (cancelled) return;
        const transferred = transferredDraft.current;
        const parsed = transferred ? null : text ? JSON.parse(text) : null;
        const candidate = transferred || parsed?.project || parsed;
        transferredDraft.current = undefined;
        if (isStudioProject(candidate)) {
          draft = candidate;
          if (!transferred && Number.isInteger(parsed?.revision)) savedRevision = parsed.revision;
        } else if (candidate) notice = '임시 작업 형식을 확인하지 못했어요. 저장한 작업 파일을 열어 주세요.';
      } catch { notice = '임시 작업을 읽지 못했어요. 저장한 작업 파일을 열어 주세요.'; }
      if (maker) {
        try { draft = await prepareMakerDraft(draft); }
        catch { notice = '준비된 모형을 열지 못했어요. 기존 작업은 유지했으니 모형 사용 버튼으로 다시 열어 주세요.'; }
      }
      if (cancelled) return;
      latest.current = draft; latestDraft.current = { project: draft, revision: savedRevision };
      setProject(draft); setRevision(savedRevision);
      if (notice) setMessage(notice);
      draftLoaded.current = true; setReady(true);
    })();
    return () => { cancelled = true; if (draftLoaded.current) void saveProjectDraft(draftKey, JSON.stringify(latestDraft.current)).catch(() => {}); };
  }, [draftKey, maker, effectiveSession?.group]);
  useEffect(() => {
    if (!ready) return; const timer = window.setTimeout(() => { void saveProjectDraft(draftKey, JSON.stringify({ project, revision })).catch(() => setMessage('임시 저장 공간이 부족해요. 작업 파일을 받아 보관해 주세요.')); }, 500);
    return () => clearTimeout(timer);
  }, [project, revision, ready, draftKey]);
  useEffect(() => {
    if (!effectiveSession) return; let cancelled = false;
    const load = () => { if (document.visibilityState === 'hidden') return; void studioApi<Classroom>(`/rooms/${code}`, effectiveSession.token).then(data => { if (!cancelled) setClassroom(data); }).catch(e => { if (!cancelled) setMessage(e.message); }); };
    load(); const timer = window.setInterval(load, 8000); return () => { cancelled = true; clearInterval(timer); };
  }, [code, effectiveSession?.token]);
  useEffect(() => { const hide = () => { if (document.hidden) { void sound.enable(false); setSoundOn(false); } }; document.addEventListener('visibilitychange', hide); return () => { document.removeEventListener('visibilitychange', hide); sound.dispose(); }; }, [sound]);
  useEffect(() => { sound.narration(false); sound.recordingActive(false); }, [step, sound]);
  async function join() {
    setBusy(true); setMessage('');
    try {
      const nextCode = inputCode.trim().toLowerCase();
      const cached = readStudioSession(nextCode);
      if (cached && cached.name === name.trim() && cached.group === joinGroup) {
        try {
          const room = await studioApi<Classroom>(`/rooms/${nextCode}`, cached.token);
          transferredDraft.current = undefined; setSession(cached); updateCode(cached.code); setClassroom(room);
          setMessage('전에 입장한 정보로 이어서 열었어요. 우리 반 작품을 보거나 이 태블릿의 작업을 계속할 수 있어요.');
          return;
        } catch (error) { if ((error as { status?: number }).status !== 403) throw error; }
      }
      const next = await studioApi<StudioSession>('/join', undefined, { code: nextCode, name: name.trim(), group: joinGroup });
      // Carry this tablet's current work into the chosen classroom, without claiming it was submitted.
      const transferred = { ...latest.current, group: next.group };
      keepStudioSession(next); transferredDraft.current = transferred; setSession(next); updateCode(next.code);
      setMessage('수업에 들어왔어요. 모둠 대표는 ‘모둠에 공유’를 누르고, 다른 친구들은 ‘우리 반 작품 보기’를 누르세요.');
      void saveProjectDraft(`${maker ? 'history-ar-maker' : 'history-ar-studio'}:v1:${next.code}:${next.memberId}`, JSON.stringify({ project: transferred, revision: 0 })).catch(() => setMessage('수업에는 입장했어요. 기기 임시 저장이 어려우니 작업 파일을 보관해 주세요.'));
    } catch (e) { setMessage(e instanceof Error ? e.message : '수업에 입장하지 못했어요.'); } finally { setBusy(false); }
  }
  async function submit(final = true) {
    if (!effectiveSession) return; setBusy(true); setMessage('');
    try { const result = await studioApi<{ version: number; shared?: boolean }>(`/rooms/${code}/works/${effectiveSession.group}`, effectiveSession.token, { project, expectedVersion: revision, submit: final }); setRevision(result.version); setMessage(result.shared ? '모둠 작품과 녹음을 공유했어요. 친구들은 각자 태블릿에서 ‘우리 반 작품 보기’를 눌러 주세요.' : final ? '모둠 작품을 제출했어요. 선생님이 전시를 시작하면 다른 태블릿에서도 볼 수 있어요.' : '모둠 작업을 저장했어요. 다음 시간에 같은 수업코드로 이어 할 수 있어요.'); await refresh(); }
    catch (e) { setMessage(e instanceof Error ? e.message : '작품을 제출하지 못했어요.'); } finally { setBusy(false); }
  }
  async function loadShared() {
    if (!effectiveSession || !window.confirm('이 기기의 작업 대신 제출된 우리 모둠 작품을 열까요? 필요한 작업은 먼저 파일로 저장해 주세요.')) return;
    setBusy(true);
    try { const result = await studioApi<{ project: StudioProject; version: number }>(`/rooms/${code}/works/${effectiveSession.group}?draft=1`, effectiveSession.token); if (!isStudioProject(result.project)) throw new Error('작품 형식을 확인하지 못했어요.'); const next = maker ? await prepareMakerDraft(result.project) : result.project; setProject(next); setRevision(result.version); setMessage('제출된 우리 모둠 작품을 열었어요.'); }
    catch (e) { setMessage(e instanceof Error ? e.message : '작품을 열지 못했어요.'); } finally { setBusy(false); }
  }
  async function importFile(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > 4_000_000) throw new Error('4MB 이하의 AR 제작 파일을 골라 주세요.');
      const parsed = JSON.parse(await file.text()), p = parsed.project || parsed;
      if (!isStudioProject(p)) throw new Error('AR 제작 화면에서 저장한 작업 파일을 골라 주세요.');
      if (!window.confirm('현재 작업 대신 선택한 파일을 열까요?')) return;
      const next = maker ? await prepareMakerDraft(p) : p;
      setProject({ ...next, group: effectiveSession?.group || next.group }); setMessage('작업 파일을 열었어요.');
    } catch (e) { setMessage(e instanceof Error ? e.message : '작업 파일을 읽지 못했어요.'); }
    finally { setBusy(false); }
  }
  const homeParams = new URLSearchParams(params); homeParams.delete('step'); homeParams.delete('lesson');
  if (maker) return <MakerWorkspace
    project={project} onChange={setProject} ready={ready} busy={busy} recording={recording} onRecording={setRecording}
    message={message} onMessage={setMessage} sound={sound} soundOn={soundOn} volume={volume} effects={effects}
    onSound={value => { void sound.enable(value).then(() => setSoundOn(value)).catch(error => setMessage(error.message)); }}
    onVolume={value => { setVolume(value); sound.setVolume(value); }}
    onEffects={value => { void sound.setEffects(value).then(() => setEffects(value)).catch(error => setMessage(error.message)); }}
    classroom={classroom} session={effectiveSession} teacher={teacher} code={code} onCode={updateCode}
    inputCode={inputCode} onInputCode={setInputCode} name={name} onName={setName} joinGroup={joinGroup} onJoinGroup={setJoinGroup}
    onJoin={() => { void join(); }} onSave={final => { void submit(!!final); }} onLoadShared={() => { void loadShared(); }} onImport={file => { void importFile(file); }}
  />;
  return <main className="studio-page page-width"><header className="studio-header"><Link onClick={e => { if (recording) { e.preventDefault(); setMessage('녹음을 끝낸 뒤 이동해 주세요.'); } }} to={`/three-kingdoms?${homeParams}`}>← 삼국시대 6차시</Link><span>MOA 역사 · 우리 반 AR 박물관</span><Link onClick={e => { if (recording) e.preventDefault(); }} to={samplePath(params.toString())}>예제로 AR 바로 체험</Link><button disabled={recording} onClick={() => navigate('guide')}>수업 안내</button>{teacher && <button disabled={recording} onClick={() => navigate('teacher')}>교사 진행</button>}</header>
    <nav className="studio-steps" aria-label="AR 활동 단계">{steps.map(([key, label], index) => <button disabled={recording} aria-current={step === key ? 'step' : undefined} key={key} onClick={() => navigate(key, key === 'model' ? 4 : ['narration', 'questions'].includes(key) ? 5 : 6)}><span>{index + 1}</span>{label}</button>)}</nav>
    {step !== 'guide' && step !== 'teacher' && <><details className="studio-session" open={!effectiveSession}><summary>{effectiveSession ? `${effectiveSession.code} · ${effectiveSession.group}모둠 · ${effectiveSession.name}` : '수업코드로 입장하기 · 연습은 바로 가능'}</summary>{!effectiveSession ? <div className="studio-room-form"><label>수업코드<input autoCapitalize="none" maxLength={12} value={inputCode} onChange={e => setInputCode(e.target.value)} /></label><label>이름 또는 별명<input maxLength={30} value={name} onChange={e => setName(e.target.value)} /></label><label>내 모둠<select value={joinGroup} onChange={e => setJoinGroup(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6].map(n => <option value={n} key={n}>{n}모둠</option>)}</select></label><button disabled={recording || busy || !name.trim() || !/^[a-z0-9]{4,12}$/i.test(inputCode.trim())} className="studio-primary" onClick={() => { void join(); }}>수업 입장</button></div> : <p>{classroom?.canEdit ? '이 태블릿은 우리 모둠의 작품 제출 담당입니다.' : '모형을 연습할 수 있어요. 작품 제출은 선생님이 지정한 모둠 담당이 합니다.'} 관람·퀴즈는 각자 참여해요.</p>}</details><div className="studio-work-toolbar"><label>우리 유물<select disabled={recording || busy || !canEdit} value={project.heritageId} onChange={e => { if (window.confirm('유물을 바꾸면 새 작품을 시작해요. 현재 작업을 파일로 저장했나요?')) { setProject(newStudioProject(effectiveSession?.group || project.group, Number(e.target.value))); } }}>{researchForEra('three-kingdoms').map(h => <option key={h.id} value={h.id}>{h.heritage}</option>)}</select></label><button className="studio-primary" disabled={recording || busy || !canEdit || !classroom?.canEdit} onClick={() => { void submit(false); }}>모둠 작업 저장</button><button disabled={recording || busy} onClick={() => downloadProjectFile(JSON.stringify(project), `AR_${project.group}모둠_${heritage.heritage}.json`, 'application/json')}>작업 파일 받기</button><label className="studio-file">작업 파일 열기<input disabled={recording || busy || !canEdit} type="file" accept=".json,application/json" onChange={e => { void importFile(e.target.files?.[0]); e.target.value = ''; }} /></label>{effectiveSession && <button disabled={recording || busy || !canEdit || !classroom?.canEdit} onClick={() => { void loadShared(); }}>저장된 우리 모둠 작업 열기</button>}</div><details className="studio-sound"><summary>배경음·효과음 설정</summary><div className="studio-actions"><button disabled={recording} aria-pressed={soundOn} onClick={() => { const next = !soundOn; void sound.enable(next).then(() => setSoundOn(next)).catch(e => setMessage(e.message)); }}>{soundOn ? '배경음 끄기' : '배경음 켜기'}</button><label>배경음 크기<input type="range" min={0} max={.5} step={.05} value={volume} onChange={e => { const n = Number(e.target.value); setVolume(n); sound.setVolume(n); }} /></label><label><input type="checkbox" disabled={recording} checked={effects} onChange={e => { const value = e.target.checked; void sound.setEffects(value).then(() => setEffects(value)).catch(e => setMessage(e.message)); }} />짧은 효과음</label></div><p>해설 중에는 배경음이 작아지고, 녹음 중에는 멈춰요. 이어폰으로 들어 주세요.</p></details></>}
    {message && <p className="studio-notice" role="status">{message}</p>}
    {step === 'guide' ? <TeacherGuide lessonId={lesson} onLesson={id => navigate('guide', id)} onStep={next => navigate(next)} /> : step === 'teacher' ? <TeacherControls initialCode={code} onCode={updateCode} /> : !ready ? <p role="status">이 기기의 작업을 불러와요…</p> : step === 'gallery' ? <Exhibition classroom={classroom} session={effectiveSession} sound={sound} /> : step === 'quiz' ? <IndividualQuiz key={effectiveSession?.memberId || 'practice'} classroom={classroom} session={effectiveSession} sound={sound} /> : <fieldset className="studio-workspace" disabled={busy || (!canEdit && step !== 'demo')}>
      {!canEdit && <p>전시를 시작해서 제출 작품은 고정되어 있어요. 관람 화면으로 이동해 주세요.</p>}
      {step === 'model' || step === 'demo' ? <><Suspense fallback={<p>입체 편집기를 열어요…</p>}><ModelEditor key={project.heritageId} project={project} onChange={setProject} onNext={() => navigate('narration', 5)} /></Suspense>{step === 'demo' && <p>시범: 네모 넣기 → 높이를 낮춰 받침 만들기 → 원기둥 넣기 → 위로 이동하기 → 모형 돌려 보기</p>}</> : step === 'narration' ? <NarrationStep project={project} onChange={setProject} onBusy={setRecording} sound={sound} onNext={() => navigate('questions', 5)} /> : <QuestionStep project={project} onChange={setProject} onSubmit={() => { void submit(); }} busy={busy} connected={!!effectiveSession && !!classroom?.canEdit} />}
    </fieldset>}
  </main>;
}
