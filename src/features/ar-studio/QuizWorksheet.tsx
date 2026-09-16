import { useEffect, useRef, useState } from 'react';
import type { ArExhibit } from '../../lib/ar/exhibit';
import { studioApi, type Classroom, type StudioSession } from './api';
import { quizWorksheet, worksheetHasEvidence, worksheetTotal, type WorkPoints, type WorksheetSection } from './worksheet';

const CHOICES = ['①', '②', '③'];

/** Teacher-side paper copy of the shared quiz, printed from the class the groups already shared into. */
export function QuizWorksheet({ classroom, session }: { classroom?: Classroom; session?: StudioSession }) {
  const [sections, setSections] = useState<WorksheetSection[]>();
  const [evidence, setEvidence] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    if (!sections) return;
    document.body.classList.add('worksheet-print');
    return () => document.body.classList.remove('worksheet-print');
  }, [sections]);

  async function build() {
    if (!session || !classroom?.questions?.length) return;
    setBusy(true); setError('');
    try {
      const works = await Promise.all((classroom.gallery || []).map(async item => {
        const work = await studioApi<{ ar: ArExhibit; heritageId: number }>(`/rooms/${session.code}/works/${item.group}`, session.token);
        return { group: item.group, heritageId: work.heritageId, points: work.ar.points } as WorkPoints;
      }));
      if (alive.current) setSections(quizWorksheet(classroom.questions, works));
    } catch (value) {
      // Questions alone still make a usable sheet; only the explanation column is lost.
      if (alive.current) { setSections(quizWorksheet(classroom.questions, [])); setError('해설을 불러오지 못해 문제만 인쇄해요.'); }
    } finally { if (alive.current) setBusy(false); }
  }

  const ready = !!session && !!classroom?.questions?.length;
  if (!sections) return <div className="worksheet-launch">
    <div className="studio-actions">
      <button disabled={!ready || busy} onClick={() => { void build(); }}>{busy ? '문제를 모으는 중…' : '퀴즈 활동지 만들기'}</button>
      <span>{!session ? '수업코드로 입장하면 만들 수 있어요.' : ready ? `${classroom!.questions!.length}문제 · ${classroom!.gallery.length}모둠` : '모둠이 문제를 공유하면 만들 수 있어요.'}</span>
    </div>
    <p>공유된 모든 모둠의 문제를 A4 활동지로 인쇄합니다. 태블릿 없이 종이로 풀 수 있어요.</p>
  </div>;

  const total = worksheetTotal(sections);
  return <div className="worksheet-launch">
    <div className="studio-actions">
      <button className="studio-primary" onClick={() => window.print()}>인쇄하기</button>
      <button onClick={() => { void build(); }} disabled={busy}>{busy ? '새로 고치는 중…' : '최신 문제로 새로 고치기'}</button>
      <label><input type="checkbox" checked={evidence} onChange={event => setEvidence(event.target.checked)} disabled={!worksheetHasEvidence(sections)} />선생님용 해설 쪽 함께 인쇄</label>
      <button onClick={() => setSections(undefined)}>닫기</button>
    </div>
    {error && <p className="studio-notice" role="status">{error}</p>}
    <p className="worksheet-hint">아래가 인쇄될 모습이에요. 인쇄 창에서 A4·세로를 확인해 주세요.</p>

    <article className="quiz-print">
      <header className="quiz-print-head">
        <h1>우리 반 AR 박물관 퀴즈</h1>
        <div className="quiz-print-fields"><span>이름 ______________</span><span>모둠 ______</span><span>날짜 ____ / ____</span></div>
        <p>다른 모둠의 AR 작품을 보고 해설을 들은 뒤, 알맞은 답의 번호를 적어 보세요. 모두 {total}문제입니다.</p>
      </header>
      {sections.map(section => <section className="quiz-print-group" key={section.group}>
        <h2>{section.group}모둠 · {section.heritage}</h2>
        <ol className="quiz-print-items">{section.items.map(item => <li key={item.number}>
          <p className="quiz-print-prompt"><b>{item.number}.</b> {item.prompt}</p>
          <ul className="quiz-print-options">{item.options.map((option, index) => <li key={index}>{CHOICES[index]} {option}</li>)}</ul>
          <p className="quiz-print-answer">내 답 <span /></p>
        </li>)}</ol>
      </section>)}
      {evidence && worksheetHasEvidence(sections) && <section className="quiz-print-key">
        <h2>선생님용 · 문제마다 답을 확인할 해설</h2>
        <ol className="quiz-print-evidence">{sections.flatMap(section => section.items).map(item => <li key={item.number}>
          <b>{item.number}번 ({item.group}모둠)</b> {item.evidence ? <>{item.evidence.title && <em>{item.evidence.title}</em>} {item.evidence.text}</> : <span>해설을 불러오지 못했어요.</span>}
        </li>)}</ol>
      </section>}
    </article>
  </div>;
}
