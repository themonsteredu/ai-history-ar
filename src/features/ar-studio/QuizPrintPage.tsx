import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepStudioSession, readStudioSession, studioApi, type Classroom, type StudioSession } from './api';
import { QuizWorksheet } from './QuizWorksheet';
import './studio.css';
import './worksheet.css';

/** One link for a teacher who only wants the class quiz on paper: enter the code, get the sheet. */
export default function QuizPrintPage() {
  const [params, setParams] = useSearchParams();
  const code = (params.get('hub_code') || '').trim().toLowerCase();
  const [input, setInput] = useState(code);
  const [session, setSession] = useState<StudioSession>();
  const [classroom, setClassroom] = useState<Classroom>();
  const [error, setError] = useState('');
  useEffect(() => {
    if (!/^[a-z0-9]{4,12}$/.test(code)) return;
    let cancelled = false; setError(''); setClassroom(undefined);
    void (async () => {
      try {
        // Reuse this browser's entry to the class; otherwise enter once under a name that says why.
        let entry = readStudioSession(code);
        if (!entry) { entry = await studioApi<StudioSession>('/join', undefined, { code, name: '선생님 인쇄용', group: 1 }); keepStudioSession(entry); }
        const room = await studioApi<Classroom>(`/rooms/${code}`, entry.token);
        if (!cancelled) { setSession(entry); setClassroom(room); }
      } catch (value) { if (!cancelled) setError(value instanceof Error ? value.message : '수업을 열지 못했어요. 수업코드를 확인해 주세요.'); }
    })();
    return () => { cancelled = true; };
  }, [code]);
  const total = classroom?.questions?.length || 0;
  return <main className="studio-page page-width quiz-print-page">
    <h1>우리 반 퀴즈 인쇄</h1>
    <form className="studio-room-form" onSubmit={event => { event.preventDefault(); setParams(new URLSearchParams({ hub_code: input.trim().toLowerCase() })); }}>
      <label>수업코드<input value={input} inputMode="numeric" autoCapitalize="none" spellCheck={false} maxLength={12} onChange={event => setInput(event.target.value.trim())} placeholder="어제 쓴 수업코드" /></label>
      <button type="submit" disabled={!/^[a-z0-9]{4,12}$/i.test(input.trim())}>문제 가져오기</button>
    </form>
    {error && <p className="studio-notice" role="alert">{error}</p>}
    {code && !classroom && !error && <p role="status">수업 {code}의 문제를 가져오는 중…</p>}
    {classroom && total === 0 && <p className="studio-notice" role="status">수업 {code}에는 공유된 문제가 없어요. 어제 쓴 수업코드가 맞는지, 모둠이 ‘모둠에 공유’를 눌렀는지 확인해 주세요.</p>}
    {classroom && total > 0 && <p role="status">{classroom.gallery.length}모둠 · {total}문제를 찾았어요. 아래 <b>인쇄하기</b>를 누른 뒤 인쇄창에서 <b>PDF로 저장</b>을 고르면 파일이 됩니다.</p>}
    <QuizWorksheet classroom={classroom} session={session} auto />
  </main>;
}
