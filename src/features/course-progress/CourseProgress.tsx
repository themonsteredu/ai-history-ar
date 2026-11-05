import { useEffect, useRef, useState } from 'react';
import { TEACHER_PIN } from '../../auth/teacherAccess';
import { loadProjectDraft, saveProjectDraft } from '../../lib/projectDraftStore';
import { studioApi, type StudioSession } from '../ar-studio/api';
import type { ArExhibit } from '../../lib/ar/exhibit';
import type { DataRow } from '../data-lab/model';
import './course-progress.css';

type Era = 'three-kingdoms' | 'joseon';
type Point = { title: string; text: string; recorded?: boolean };
type Question = { prompt: string; options?: string[]; answer?: number };
type Progress = { kind: 'note' | 'data' | 'ar' | 'quiz'; name?: string; score?: number; total?: number; results?: { chosen: number; answer: number; correct: boolean }[]; heritage?: string; source?: string; note?: string; title?: string; rows?: DataRow[]; heritageId?: number; modelName?: string; points?: Point[]; question?: string; answer?: string; questions?: Question[]; role?: string; reflection?: string };
type Item = { memberId?: string; group: number; updatedAt: string; data: Progress };
type TeacherState = { records: Item[]; shared: Item[] };
const selectedCodeKey = 'history-course-progress-code';
const studentCodeKey = 'history-course-progress-student-code';
const teacherKey = (code: string) => `history-course-progress-teacher:${code}`;
const memberKey = (code: string, group: number) => `history-course-progress-member:${code}:${group}`;
function stored(key: string) { try { return localStorage.getItem(key) || ''; } catch { return ''; } }
function store(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* stay in memory */ } }
function readMember(code: string, group: number): StudioSession | undefined { try { const value = JSON.parse(stored(memberKey(code, group))); return value?.code === code && value?.group === group && typeof value?.token === 'string' ? value : undefined; } catch { return undefined; } }
async function courseApi<T>(session: StudioSession, era: Era, lesson: number, data?: Progress): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}api/course-work/rooms/${session.code}/${era}/${lesson}`, {
    method: data ? 'POST' : 'GET', credentials: 'same-origin',
    headers: { Authorization: `Bearer ${session.token}`, ...(data ? { 'Content-Type': 'application/json' } : { 'X-Teacher-Pin': TEACHER_PIN }) },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || '수업 서버에 연결하지 못했어요.');
  return body as T;
}
/** Only the text and status are shared; original 3D files and recordings stay in the project. */
export function arProgress(project: { heritageId: number; ar?: ArExhibit; questions?: Question[]; role?: string; reflection?: string }): Progress {
  return { kind: 'ar', heritageId: project.heritageId, modelName: project.ar?.model?.name || '',
    points: project.ar?.points.map(p => ({ title: p.title, text: p.text, recorded: !!p.narration })) || [],
    question: project.ar?.question || '', answer: project.ar?.points.find(point => point.id === project.ar?.answerId)?.title || '', questions: project.questions || [], role: project.role || '', reflection: project.reflection || '' };
}
function Sync({ session, era, lesson, data }: { session: StudioSession; era: Era; lesson: number; data: Progress }) {
  const [status, setStatus] = useState('연결 중'); const [retry, setRetry] = useState(0);
  const queue = useRef<Promise<void>>(Promise.resolve()); const serial = useRef(0);
  const snapshot = JSON.stringify(data);
  const latest = useRef(snapshot);
  useEffect(() => { latest.current = snapshot; }, [snapshot]);
  useEffect(() => () => { const pending = latest.current; queue.current = queue.current.catch(() => {}).then(async () => { try { await courseApi(session, era, lesson, JSON.parse(pending) as Progress); } catch { /* local draft remains available */ } }); }, [session.code, session.token, era, lesson]);
  useEffect(() => {
    const id = ++serial.current;
    const timer = window.setTimeout(() => {
      queue.current = queue.current.catch(() => {}).then(async () => {
        if (id !== serial.current) return;
        try { await courseApi(session, era, lesson, JSON.parse(snapshot) as Progress); if (id === serial.current) setStatus('선생님 화면에 저장됨'); }
        catch { if (id === serial.current) setStatus('연결하지 못했어요. 다시 저장해 주세요.'); }
      });
    }, 1200);
    return () => clearTimeout(timer);
  }, [session.code, session.token, era, lesson, snapshot, retry]);
  useEffect(() => { const online = () => setRetry(n => n + 1); window.addEventListener('online', online); return () => window.removeEventListener('online', online); }, []);
  return <p className="course-share-status" role="status">{status} {status.includes('못했어요') && <button type="button" onClick={() => setRetry(n => n + 1)}>다시 저장</button>}</p>;
}
export function CourseShare({ era, lesson, data, fixedGroup, existingSession }: { era: Era; lesson: number; data: Progress; fixedGroup?: number; existingSession?: StudioSession }) {
  const [code, setCode] = useState(() => existingSession?.code || stored(studentCodeKey));
  const [group, setGroup] = useState(fixedGroup || 1); const [session, setSession] = useState<StudioSession | undefined>(existingSession);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { if (existingSession) setSession(existingSession); }, [existingSession?.token]);
  async function join() {
    const normalized = code.trim().toLowerCase(); if (!/^[a-z0-9]{4,12}$/.test(normalized)) { setError('수업코드 4~12자리를 입력해 주세요.'); return; }
    setBusy(true); setError('');
    try {
      let entry = readMember(normalized, group);
      if (entry) { try { await studioApi(`/rooms/${normalized}`, entry.token); } catch { entry = undefined; } }
      if (!entry) entry = await studioApi<StudioSession>('/join', undefined, { code: normalized, group, name: `${group}모둠` });
      store(memberKey(normalized, group), JSON.stringify(entry)); store(studentCodeKey, normalized); setSession(entry);
    } catch (e) { setError(e instanceof Error ? e.message : '수업에 입장하지 못했어요.'); }
    finally { setBusy(false); }
  }
  return <section className="course-share" aria-label="선생님께 활동 공유">
    <h3>우리 모둠 활동 공유</h3>
    {session ? <><p>{session.code} · {session.group}모둠 <button type="button" onClick={() => setSession(undefined)}>수업 바꾸기</button></p><Sync session={session} era={era} lesson={lesson} data={data} /></>
      : <><p>선생님이 알려 준 수업코드로 입장하면 작성 내용이 교사 화면에 자동으로 전해져요.</p><div className="course-share-form"><label>수업코드<input value={code} maxLength={12} autoCapitalize="none" onChange={e => setCode(e.target.value)} /></label><label>모둠<select value={group} disabled={!!fixedGroup} onChange={e => setGroup(Number(e.target.value))}>{[1,2,3,4,5,6].map(g => <option value={g} key={g}>{g}모둠</option>)}</select></label><button type="button" disabled={busy} onClick={() => { void join(); }}>입장하고 공유</button></div></>}
    {data.kind === 'ar' && <p>설명과 문제를 공유해요. 3D 모형과 녹음 원본은 작업 파일에 보관돼요.</p>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
export function CourseNotes({ era }: { era: Era }) {
  const key = `history-course-notes:${era}`; const [ready, setReady] = useState(false);
  const [heritage, setHeritage] = useState(''), [source, setSource] = useState(''), [note, setNote] = useState('');
  useEffect(() => { let active = true; void loadProjectDraft(key).then(value => { if (!active) return; try { const data = value ? JSON.parse(value) : {}; setHeritage(data.heritage || ''); setSource(data.source || ''); setNote(data.note || ''); } catch { /* start with blank notes */ } setReady(true); }).catch(() => { if (active) setReady(true); }); return () => { active = false; }; }, [key]);
  useEffect(() => { if (ready) void saveProjectDraft(key, JSON.stringify({ heritage, source, note })).catch(() => {}); }, [key, ready, heritage, source, note]);
  if (!ready) return <p>기록을 불러오는 중…</p>;
  return <section className="course-notes"><h2>모둠 조사 기록</h2><label>조사할 유산<input maxLength={120} value={heritage} onChange={e => setHeritage(e.target.value)} /></label><label>찾은 자료와 출처<textarea maxLength={1500} value={source} onChange={e => setSource(e.target.value)} /></label><label>자료에서 알게 된 점<textarea maxLength={1500} value={note} onChange={e => setNote(e.target.value)} /></label><CourseShare era={era} lesson={1} data={{ kind: 'note', heritage, source, note }} /></section>;
}
function Details({ data }: { data: Progress }) {
  if (data.kind === 'note') return <dl><dt>조사할 유산</dt><dd>{data.heritage || '아직 없음'}</dd><dt>자료와 출처</dt><dd>{data.source || '아직 없음'}</dd><dt>알게 된 점</dt><dd>{data.note || '아직 없음'}</dd></dl>;
  if (data.kind === 'data') return <><p><b>그래프 제목:</b> {data.title || '아직 없음'} · {data.rows?.length || 0}행</p>{data.rows?.length ? <div className="course-progress-table"><table><thead><tr><th>모둠</th><th>유산</th><th>분류</th><th>근거 문장</th><th>출처</th><th>확인</th></tr></thead><tbody>{data.rows.map((row, i) => <tr key={`${row.id}-${i}`}><td>{row.group}</td><td>{row.heritage}</td><td>{row.category}</td><td>{row.text}</td><td>{row.source}</td><td>{row.confirmed ? '확인' : '보류'}</td></tr>)}</tbody></table></div> : <p>아직 작성한 표가 없어요.</p>}</>;
  if (data.kind === 'quiz') return <><p><b>참여:</b> {data.name || '학생'} · <b>결과:</b> {data.score ?? '-'} / {data.total ?? '-'}</p>{data.questions?.map((q, i) => <p key={i}><b>문제 {i+1}:</b> {q.prompt} {data.results?.[i] && (data.results[i].correct ? '· 정답' : '· 다시 확인')}</p>)}<p><b>맡은 일:</b> {data.role || '없음'}</p><p><b>배운 점:</b> {data.reflection || '없음'}</p></>;
  return <><p><b>유산 카드:</b> {data.heritageId || '-'}번 · <b>모형:</b> {data.modelName || '아직 없음'}</p>{data.points?.length ? <ol>{data.points.map((point, i) => <li key={i}><strong>{point.title || `설명 ${i+1}`}</strong><p>{point.text || '아직 없음'}{point.recorded ? ' · 녹음 있음' : ''}</p></li>)}</ol> : <p>아직 작성한 설명이 없어요.</p>}{data.question && <p><b>질문:</b> {data.question}{data.answer ? ` · 정답 설명: ${data.answer}` : ''}</p>}{data.questions?.map((q, i) => <p key={i}><b>문제 {i+1}:</b> {q.prompt || '아직 없음'} {q.options?.filter(Boolean).join(' / ')} {typeof q.answer === 'number' && q.options?.[q.answer] ? `· 정답: ${q.options[q.answer]}` : ''}</p>)}{data.role && <p><b>맡은 일:</b> {data.role}</p>}{data.reflection && <p><b>배운 점:</b> {data.reflection}</p>}</>;
}
export function CourseTeacher({ era, lesson }: { era: Era; lesson: number }) {
  const [input, setInput] = useState(() => stored(selectedCodeKey)); const [code, setCode] = useState(() => stored(selectedCodeKey));
  const [result, setResult] = useState<TeacherState>(); const [error, setError] = useState(''); const [selected, setSelected] = useState(0);
  useEffect(() => {
    setResult(undefined); setError(''); if (!/^[a-z0-9]{4,12}$/.test(code)) return;
    let active = true; let loading = false; let entry: StudioSession | undefined;
    const load = async () => { if (loading || document.visibilityState === 'hidden') return; loading = true; try {
      if (!entry) { try { const saved = JSON.parse(stored(teacherKey(code))); if (saved?.code === code && typeof saved?.token === 'string') entry = saved as StudioSession; } catch { /* join below */ } if (entry) { try { await studioApi(`/rooms/${code}`, entry.token); } catch { entry = undefined; } } if (!entry) { entry = await studioApi<StudioSession>('/join', undefined, { code, group: 1, name: '선생님' }); store(teacherKey(code), JSON.stringify(entry)); } }
      const next = await courseApi<TeacherState>(entry, era, lesson); if (active) { setResult(next); setError(''); }
    } catch (e) { entry = undefined; if (active) setError(e instanceof Error ? e.message : '모둠 현황을 불러오지 못했어요.'); } finally { loading = false; } };
    void load(); const timer = window.setInterval(() => { void load(); }, 8000); return () => { active = false; clearInterval(timer); };
  }, [code, era, lesson]);
  const items = [...(result?.records || []), ...(result?.shared || [])];
  return <section className="course-progress" aria-label={`${lesson}차시 모둠 현황`}><header><div><p className="course-progress-kicker">교사 수업 현황 · {lesson}차시</p><h2>모둠별 활동 보기</h2><p>학생들이 이 수업코드로 입장하면 작성 내용을 확인할 수 있어요.</p></div></header>
    <form className="course-share-form" onSubmit={e => { e.preventDefault(); const value = input.trim().toLowerCase(); if (!/^[a-z0-9]{4,12}$/.test(value)) { setError('수업코드 4~12자리를 입력해 주세요.'); return; } store(selectedCodeKey, value); setCode(value); setSelected(0); }}><label>수업코드<input value={input} maxLength={12} autoCapitalize="none" onChange={e => setInput(e.target.value)} placeholder="학생에게 알려 줄 코드" /></label><button type="submit">현황 보기</button></form>
    {error && <p role="alert">{error}</p>}
    {code && <><p className="course-progress-caption">수업코드 <strong>{code}</strong> · 8초마다 확인</p><div className="course-group-grid">{[1,2,3,4,5,6].map(group => { const n = items.filter(item => item.group === group).length; return <button type="button" key={group} aria-pressed={selected === group} onClick={() => setSelected(selected === group ? 0 : group)}><strong>{group}모둠</strong><span>{!result ? '확인 중' : n ? `기록 ${n}개` : '기록 없음'}</span></button>; })}</div>
    {selected > 0 && <div className="course-progress-detail"><h3>{selected}모둠 활동</h3>{items.filter(item => item.group === selected).length ? items.filter(item => item.group === selected).map((item, i) => <article key={`${item.memberId || 'shared'}-${i}`}><p>{item.data.kind === 'quiz' ? '학생 퀴즈 결과' : item.memberId ? '학생 기기에서 작성 중' : '모둠이 공유한 작품'} · {new Date(item.updatedAt).toLocaleString('ko-KR')}</p><Details data={item.data} /></article>) : <p>아직 이 차시에 공유된 기록이 없어요.</p>}</div>}</>}
  </section>;
}
export function StudioProgressSync({ session, lesson, project }: { session?: StudioSession; lesson: number; project: Parameters<typeof arProgress>[0] }) {
  return session ? <Sync session={session} era="three-kingdoms" lesson={lesson} data={arProgress(project)} /> : null;
}
