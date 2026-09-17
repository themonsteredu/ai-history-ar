import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepStudioSession, readStudioSession, studioApi, type Classroom, type StudioSession } from './api';
import { GROUP_CHOICES, groupCountKey, readGroupCount, sharingStatus } from './teacherRun';
import { cardSlots, waitingCards } from './visiting';
import { addTeacherClass, classNameFor, isClassCode, normalizeClassCode, readTeacherClasses, removeTeacherClass, writeTeacherClasses, type TeacherClass } from './teacherClasses';
import { allArCardsUrl } from '../../components/ArRecognitionCard';
import './studio.css';
import './maker.css';
import './teacher.css';

const ClassroomQr = lazy(() => import('./ClassroomQr'));

/** Everything a teacher touches during an AR lesson, on one page, with the classes they registered themselves. */
export default function TeacherPage() {
  const [params, setParams] = useSearchParams();
  const code = normalizeClassCode(params.get('hub_code') || '');
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [newName, setNewName] = useState(''); const [newCode, setNewCode] = useState('');
  const [session, setSession] = useState<StudioSession>();
  const [classroom, setClassroom] = useState<Classroom>();
  const [groupCount, setGroupCount] = useState(6);
  const [error, setError] = useState('');
  useEffect(() => { try { setClasses(readTeacherClasses(window.localStorage)); setGroupCount(readGroupCount(window.localStorage)); } catch { /* defaults stay */ } }, []);
  useEffect(() => {
    setSession(undefined); setClassroom(undefined); setError('');
    if (!isClassCode(code)) return;
    let cancelled = false;
    const load = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        let entry = readStudioSession(code);
        if (!entry) { entry = await studioApi<StudioSession>('/join', undefined, { code, name: '선생님', group: 1 }); keepStudioSession(entry); }
        const room = await studioApi<Classroom>(`/rooms/${code}`, entry.token);
        if (!cancelled) { setSession(entry); setClassroom(room); setError(''); }
      } catch (value) { if (!cancelled) setError(value instanceof Error ? value.message : '수업을 열지 못했어요.'); }
    };
    void load(); const timer = window.setInterval(() => { void load(); }, 8000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [code]);

  function open(next: string) { setParams(new URLSearchParams({ hub_code: normalizeClassCode(next) })); }
  function saveClasses(next: TeacherClass[]) { setClasses(next); try { writeTeacherClasses(next, window.localStorage); } catch { /* kept for this visit */ } }
  function addClass() {
    const next = addTeacherClass(classes, newName, newCode);
    if (next.length === classes.length && !classNameFor(classes, newCode)) return;
    saveClasses(next); open(newCode); setNewName(''); setNewCode('');
  }
  function changeGroupCount(value: number) { setGroupCount(value); try { window.localStorage.setItem(groupCountKey, String(value)); } catch { /* fine */ } }

  const name = classNameFor(classes, code);
  const status = sharingStatus(groupCount, session ? classroom?.gallery : undefined);
  const waiting = waitingCards(cardSlots(classroom?.gallery));
  const questions = classroom?.questions?.length || 0;

  return <main className="studio-page page-width teacher-page">
    <header className="teacher-page-head"><div><p className="teacher-run-eyebrow">선생님 화면</p><h1>{name ? `${name} · 수업코드 ${code}` : code ? `수업코드 ${code}` : '우리 반 AR 수업'}</h1></div></header>

    <section className="teacher-classes" aria-label="내 반 목록">
      <h2>내 반</h2>
      {classes.length > 0 && <ul className="teacher-class-list">{classes.map(item => <li key={item.code} className={item.code === code ? 'is-open' : undefined}>
        <button className="teacher-class-open" onClick={() => open(item.code)}><b>{item.name}</b><span>{item.code}</span></button>
        <button className="teacher-class-remove" aria-label={`${item.name} 목록에서 빼기`} onClick={() => { if (window.confirm(`${item.name}(${item.code})을 목록에서 뺄까요? 학생 작품은 서버에 그대로 남아요.`)) saveClasses(removeTeacherClass(classes, item.code)); }}>×</button>
      </li>)}</ul>}
      <form className="teacher-class-add" onSubmit={event => { event.preventDefault(); addClass(); }}>
        <label>반 이름<input value={newName} maxLength={30} placeholder="예: 5학년 2반" onChange={event => setNewName(event.target.value)} /></label>
        <label>수업코드<input value={newCode} inputMode="numeric" autoCapitalize="none" spellCheck={false} maxLength={12} placeholder="예: 5252" onChange={event => setNewCode(event.target.value.trim())} /></label>
        <button type="submit" className="studio-primary" disabled={!newName.trim() || !isClassCode(newCode)}>{classes.length ? '반 추가' : '첫 반 등록'}</button>
      </form>
      <p className="maker-entry-help">반 이름과 코드는 이 기기에 저장돼요. 같은 코드는 90일 동안 계속 씁니다.</p>
    </section>

    {code && <>
      {error && <p className="studio-notice" role="alert">{error}</p>}
      <div className="teacher-page-grid">
        <section className="teacher-page-card" aria-label="학생 입장 QR">
          <h2>학생 QR</h2>
          <Suspense fallback={<p role="status">QR을 준비해요…</p>}><ClassroomQr code={code} onCode={value => { if (isClassCode(value) && normalizeClassCode(value) !== code) open(value); }} /></Suspense>
        </section>
        <section className="teacher-page-card" aria-label="모둠 공유 현황">
          <div className="teacher-run-groups-head"><h2>모둠 현황</h2><label>모둠 수<select value={groupCount} onChange={event => changeGroupCount(Number(event.target.value))}>{GROUP_CHOICES.map(n => <option key={n} value={n}>{n}모둠</option>)}</select></label></div>
          <ul className="teacher-run-chips">{Array.from({ length: groupCount }, (_, index) => index + 1).map(group => {
            const done = status.shared.includes(group);
            return <li key={group} className={done ? 'is-shared' : 'is-waiting'}>{group}모둠<small>{!session ? '확인 중' : done ? '공유 완료' : '대기 중'}</small></li>;
          })}</ul>
          {session && (status.ready
            ? <p className="teacher-run-warn is-ready" role="status">모든 모둠이 공유했어요. 관람·퀴즈를 시작해도 됩니다.</p>
            : <p className="teacher-run-warn" role="status">아직 {status.missing.join(', ')}모둠이 남았어요. {waiting.length > 0 && `카드 기준으로는 ${waiting.map(slot => slot.heritage).join(', ')}이 비어 있어요.`}</p>)}
          <p className="maker-entry-help">문제 {questions}개 공유됨 · 8초마다 새로 확인해요.</p>
        </section>
      </div>
      <nav className="teacher-page-actions" aria-label="바로 가기">
        <Link className="teacher-page-action is-primary" to={`/three-kingdoms/ar-quiz-print?hub_code=${code}`}><b>퀴즈 PDF</b><span>{questions ? `${questions}문제 인쇄` : '문제가 공유되면 열려요'}</span></Link>
        <Link className="teacher-page-action" to={`/three-kingdoms/ar-visit?hub_code=${code}`}><b>관람 화면</b><span>학생이 보는 화면 그대로</span></Link>
        <Link className="teacher-page-action" to={`/three-kingdoms/ar-maker?hub_code=${code}`}><b>만들기 화면</b><span>모둠 작품 만들기·공유</span></Link>
        <a className="teacher-page-action" href={allArCardsUrl()} download><b>유물 카드 6종</b><span>A4 출력용</span></a>
        <Link className="teacher-page-action" to="/three-kingdoms/ar-rescue"><b>작업 복구</b><span>태블릿에 남은 작품 찾기</span></Link>
      </nav>
    </>}
    {!code && <p className="teacher-page-empty">위에서 반을 등록하거나 누르면 그 반의 QR·모둠 현황·퀴즈 인쇄가 여기에 나옵니다.</p>}
  </main>;
}
