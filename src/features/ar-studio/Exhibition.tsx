import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { researchForEra, heritageImageUrl } from '../../content/heritageCatalog';
import type { ExhibitionSound } from '../../lib/ar/sound';
import type { ArExhibit } from '../../lib/ar/exhibit';
import { studioApi, type Classroom, type QuizResult, type StudioSession } from './api';
const ClassroomCamera = lazy(() => import('./ClassroomCamera'));
const Viewer = lazy(() => import('../../components/ArExhibitViewer'));
export function Exhibition({ classroom, session, sound }: { classroom?: Classroom; session?: StudioSession; sound: ExhibitionSound }) {
  const [group, setGroup] = useState<number>();
  const [cameraWorks, setCameraWorks] = useState<import('./ClassroomCamera').CameraWork[]>();
  const [preparingCamera, setPreparingCamera] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  async function startCamera() {
    if (!session || !classroom?.gallery.length) return; setPreparingCamera(true); setError('');
    try { const values = await Promise.all(classroom.gallery.map(async item => ({ ...await studioApi<{ ar: ArExhibit; heritageId: number }>(`/rooms/${session.code}/works/${item.group}`, session.token), group: item.group })));
      if (alive.current) { setGroup(undefined); setWork(undefined); setCameraWorks(values); }
    } catch (e) { if (alive.current) setError(e instanceof Error ? e.message : '작품을 불러오지 못했어요.'); } finally { if (alive.current) setPreparingCamera(false); }
  }
  const [graph, setGraph] = useState('');
  async function loadGraph() { if (!session) return; try { const value = await studioApi<{ data: string }>(`/rooms/${session.code}/graph`, session.token); if (alive.current) setGraph(value.data); } catch (e) { if (alive.current) setError(e instanceof Error ? e.message : '그래프를 불러오지 못했어요.'); } }
  const [work, setWork] = useState<{ ar: ArExhibit; heritageId: number }>();
  const [error, setError] = useState('');
  useEffect(() => {
    if (!session || !group) return; let cancelled = false; setWork(undefined); setError('');
    void studioApi<{ ar: ArExhibit; heritageId: number }>(`/rooms/${session.code}/works/${group}`, session.token).then(value => { if (!cancelled) setWork(value); }).catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; sound.narration(false); };
  }, [group, session?.code, session?.token, sound, classroom?.gallery.find(item => item.group === group)?.version]);
  const heritage = researchForEra('three-kingdoms').find(h => h.id === work?.heritageId);
  if (cameraWorks) return <Suspense fallback={<p>카메라를 준비해요…</p>}><ClassroomCamera works={cameraWorks} sound={sound} onClose={() => setCameraWorks(undefined)} /></Suspense>;
  return <section><header><h1>우리 반 AR 박물관</h1><p>AR 카메라 열기 → 유물 카드 비추기 → 설명점 눌러 듣기</p></header>{!session ? <p>우리 반 작품을 보려면 위에서 수업코드로 입장해 주세요.</p> : classroom?.phase === 'making' ? <p>선생님이 전시를 준비하고 있어요. 전시가 시작되면 작품을 볼 수 있어요.</p> : <><button className="studio-primary" disabled={preparingCamera || !classroom?.gallery.length} onClick={() => { void startCamera(); }}>{preparingCamera ? '모둠 작품을 불러오는 중…' : 'AR 카메라로 카드 비추기'}</button><p>카드를 바꿔 비추면 해당 유물의 작품을 찾아요. 작품을 먼저 골라서 관람할 수도 있어요.</p><div className="studio-gallery-list">{classroom?.gallery.map(item => <button aria-pressed={group === item.group} key={item.group} onClick={() => setGroup(item.group)}><img src={heritageImageUrl('three-kingdoms', item.heritageId)} alt="" /><span><strong>{item.group}모둠</strong>{item.title}</span></button>)}</div>{!classroom?.gallery.length && <p>아직 전시된 작품이 없어요.</p>}{group && !work && !error && <p role="status">선택한 작품과 녹음을 불러와요…</p>}{error && <p role="alert">{error}</p>}{work && heritage && <Suspense fallback={<p>AR을 준비해요…</p>}><Viewer key={`${session.code}-${group}`} value={work.ar} heritage={heritage.heritage} heritageId={work.heritageId} image={heritageImageUrl('three-kingdoms', work.heritageId)} showQuiz={false} sharedClassroom onNarrationActivity={active => sound.narration(active)} onCardFound={() => sound.effect('found')} /></Suspense>}{classroom?.hasGraph && <details onToggle={e => { if (e.currentTarget.open && !graph) void loadGraph(); }}><summary>우리 반 공통 그래프 보기</summary>{graph ? <img className="studio-class-graph" src={graph} alt="1~6모둠의 자료로 만든 학급 공통 그래프" /> : <p>그래프를 불러와요…</p>}</details>}</>}</section>;
}
export function IndividualQuiz({ classroom, session, sound }: { classroom?: Classroom; session?: StudioSession; sound: ExhibitionSound }) {
  const draftKey = `history-ar-quiz-draft:${session?.code || ''}:${session?.memberId || 'practice'}`;
  const [draft] = useState(() => { try { const value = JSON.parse(localStorage.getItem(draftKey) || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; } catch { return {}; } });
  const [answers, setAnswers] = useState<Record<string, number>>(draft.answers && typeof draft.answers === 'object' && !Array.isArray(draft.answers) ? Object.fromEntries(Object.entries(draft.answers).filter(([, value]) => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 2)) as Record<string, number> : {});
  const [role, setRole] = useState(typeof draft.role === 'string' ? draft.role : ''); const [reflection, setReflection] = useState(typeof draft.reflection === 'string' ? draft.reflection : '');
  const [result, setResult] = useState<QuizResult>(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<{ title: string; text: string; narration?: { data: string } }>();
  const hintAudio = useRef<HTMLAudioElement>(null);
  const questions = result?.questions || classroom?.questions || [];
  useEffect(() => { if (!session) return; try { localStorage.setItem(draftKey, JSON.stringify({ answers, role, reflection })); } catch { /* optional draft only; submitted answers remain on the server */ } }, [answers, role, reflection, draftKey]);
  useEffect(() => { const player = hintAudio.current; return () => { player?.pause(); sound.narration(false); }; }, [hint?.narration?.data, sound]);
  useEffect(() => { if (result?.score !== undefined && result.score > 0) sound.effect('correct'); }, [result?.score, sound]);
  useEffect(() => {
    if (!session || !['quiz', 'review'].includes(classroom?.phase || '')) return; let cancelled = false;
    void studioApi<QuizResult>(`/rooms/${session.code}/answers`, session.token).then(value => { if (!cancelled && value.submitted) setResult(value); }).catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [session?.token, session?.code, classroom?.phase]);
  useEffect(() => () => { hintAudio.current?.pause(); sound.narration(false); }, [sound]);
  async function submit() {
    if (!session) return; setBusy(true); setError('');
    try { const value = await studioApi<QuizResult>(`/rooms/${session.code}/answers`, session.token, { answers, role, reflection, questionVersion: classroom?.questionVersion }); setResult(value); }
    catch (e) { setError(e instanceof Error ? e.message : '답안을 저장하지 못했어요.'); } finally { setBusy(false); }
  }
  async function listen(group: number, pointId: string) {
    if (!session) return;
    hintAudio.current?.pause(); setHint(undefined); setError('');
    try { const work = await studioApi<{ ar: ArExhibit }>(`/rooms/${session.code}/works/${group}`, session.token); setHint(work.ar.points.find(p => p.id === pointId)); }
    catch (e) { setError(e instanceof Error ? e.message : '해설을 불러오지 못했어요.'); }
  }
  return <section><header><h1>우리 반 전시 퀴즈</h1><p>자리로 돌아와 각자 답해요. 해설을 다시 확인해도 괜찮아요.</p></header>{!session || !['quiz', 'review'].includes(classroom?.phase || '') ? <p>선생님이 퀴즈를 시작하면 문제가 나타납니다.</p> : <>{result?.submitted && <p className="studio-notice">{result.score === undefined ? '답안을 제출했어요. 선생님이 정답을 공개하면 확인할 수 있어요.' : `${result.total}문제 중 ${result.score}문제를 맞혔어요. 아래에서 해설의 근거를 확인해요.`}</p>}{questions.map((q, index) => { const detail = result?.details?.find(d => d.id === q.id); return <fieldset className="studio-question-editor" key={q.id}><legend>{index + 1}. {q.group}모둠의 문제</legend><h2>{q.prompt}</h2><div className="studio-quiz-options">{q.options.map((option, i) => <button disabled={busy || !!result?.submitted || classroom?.phase === 'review'} aria-pressed={(detail?.chosen ?? answers[q.id]) === i} key={i} onClick={() => setAnswers(old => ({ ...old, [q.id]: i }))}>{i + 1}. {option}</button>)}</div><button onClick={() => { void listen(q.group, q.pointId); }}>해설 다시 확인하기</button>{detail && <p>{detail.correct ? '맞았어요.' : '다시 확인해요.'} 정답: {detail.answer + 1}번</p>}</fieldset>; })}{hint && <aside className="studio-hint"><h3>{hint.title}</h3><p>{hint.text}</p>{hint.narration && <audio ref={hintAudio} src={hint.narration.data} controls onPlaying={() => sound.narration(true)} onPause={() => sound.narration(false)} onEnded={() => sound.narration(false)} onError={() => sound.narration(false)} />}<button onClick={() => { hintAudio.current?.pause(); setHint(undefined); sound.narration(false); }}>해설 닫기</button></aside>}{!result?.submitted && classroom?.phase === 'quiz' && <div className="studio-reflection"><label>내가 맡은 일<input maxLength={300} value={role} onChange={e => setRole(e.target.value)} placeholder="예: 모형 만들기, 해설 녹음, 문제 작성" /></label><label>내가 확인하거나 배운 점<textarea maxLength={1000} rows={2} value={reflection} onChange={e => setReflection(e.target.value)} /></label><p>{Object.keys(answers).length} / {questions.length}문제 선택</p><button className="studio-primary" disabled={busy || !questions.length || questions.some(q => !Number.isInteger(answers[q.id])) || !role.trim() || !reflection.trim()} onClick={() => { void submit(); }}>{busy ? '제출 중…' : '내 답안과 활동 기록 제출'}</button></div>}</>}{error && <p role="alert">{error}</p>}</section>;
}
