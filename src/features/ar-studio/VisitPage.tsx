import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ExhibitionSound } from '../../lib/ar/sound';
import { keepStudioSession, readStudioSession, studioApi, type Classroom, type StudioSession } from './api';
import { Exhibition, IndividualQuiz } from './Exhibition';
import { quizProgress } from './visiting';
import './studio.css';
import './visit.css';

/** Visiting day only: enter the class, look at other groups, answer their quiz. Nothing else. */
export default function VisitPage() {
  const [params, setParams] = useSearchParams();
  const code = (params.get('hub_code') || '').trim().toLowerCase();
  const [session, setSession] = useState<StudioSession | undefined>(() => readStudioSession(code));
  const live = session?.code === code ? session : undefined;
  const [inputCode, setInputCode] = useState(code);
  const [name, setName] = useState(''); const [group, setGroup] = useState(1);
  const [classroom, setClassroom] = useState<Classroom>();
  const [step, setStep] = useState<'visit' | 'quiz'>('visit');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [sound] = useState(() => new ExhibitionSound());
  useEffect(() => () => sound.dispose(), [sound]);
  useEffect(() => {
    if (!live) return; let cancelled = false;
    const load = () => { if (document.visibilityState === 'hidden') return; void studioApi<Classroom>(`/rooms/${code}`, live.token).then(value => { if (!cancelled) setClassroom(value); }).catch(value => { if (!cancelled) setError(value.message); }); };
    load(); const timer = window.setInterval(load, 8000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [code, live?.token]);
  async function join() {
    setBusy(true); setError('');
    try {
      const next = inputCode.trim().toLowerCase();
      const cached = readStudioSession(next);
      if (cached && cached.name === name.trim() && cached.group === group) {
        try {
          const room = await studioApi<Classroom>(`/rooms/${next}`, cached.token);
          setSession(cached); setClassroom(room); setParams(new URLSearchParams({ hub_code: next })); return;
        } catch (value) { if ((value as { status?: number }).status !== 403) throw value; }
      }
      const created = await studioApi<StudioSession>('/join', undefined, { code: next, name: name.trim(), group });
      keepStudioSession(created); setSession(created); setParams(new URLSearchParams({ hub_code: created.code }));
    } catch (value) { setError(value instanceof Error ? value.message : '수업에 들어가지 못했어요. 수업코드를 확인해 주세요.'); }
    finally { setBusy(false); }
  }
  const progress = quizProgress(classroom?.questions);

  if (!live) return <main className="visit-page page-width">
    <h1>우리 반 AR 박물관</h1>
    <p className="visit-lead">선생님이 알려 준 수업코드를 넣으면 친구들 작품을 볼 수 있어요.</p>
    <form className="visit-form" onSubmit={event => { event.preventDefault(); if (!busy) void join(); }}>
      <label>수업코드<input required inputMode="numeric" autoCapitalize="none" spellCheck={false} pattern="[a-zA-Z0-9]{4,12}" minLength={4} maxLength={12} value={inputCode} onChange={event => setInputCode(event.target.value.trim())} placeholder="선생님이 알려 준 번호" /></label>
      <label>내 이름<input required maxLength={30} value={name} onChange={event => setName(event.target.value)} placeholder="이름 또는 별명" /></label>
      <label>내 모둠<select value={group} onChange={event => setGroup(Number(event.target.value))}>{[1, 2, 3, 4, 5, 6].map(number => <option key={number} value={number}>{number}모둠</option>)}</select></label>
      <button className="visit-big" type="submit" disabled={busy || !name.trim() || !/^[a-z0-9]{4,12}$/i.test(inputCode.trim())}>{busy ? '들어가는 중…' : '들어가기'}</button>
    </form>
    {error && <p className="studio-notice" role="alert">{error}</p>}
    <p className="visit-foot"><Link to="/three-kingdoms/ar-maker">작품 만들기 화면으로 가기</Link></p>
  </main>;

  return <main className="visit-page page-width">
    <header className="visit-head"><h1>우리 반 AR 박물관</h1><span>{live.group}모둠 · {live.name}</span></header>
    <nav className="visit-steps" aria-label="오늘 할 일">
      <button aria-pressed={step === 'visit'} onClick={() => { sound.narration(false); setStep('visit'); }}><b>1</b>AR로 관람하기</button>
      <button aria-pressed={step === 'quiz'} onClick={() => { sound.narration(false); setStep('quiz'); }}><b>2</b>퀴즈 풀기{progress.total > 0 && <small>{progress.total}문제</small>}</button>
    </nav>
    {error && <p className="studio-notice" role="alert">{error}</p>}
    {step === 'visit'
      ? <Exhibition classroom={classroom} session={live} sound={sound} />
      : <IndividualQuiz key={live.memberId} classroom={classroom} session={live} sound={sound} />}
  </main>;
}
