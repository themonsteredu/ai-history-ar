import { useEffect, useState } from 'react';
import { prepStatusText, type PrepPage, type PrepStatus } from './lessonPrep';
import { lessonPrepShown, preparedStatus, startPrep, watchPrep } from './lessonWorker';
import './lesson-prep.css';

/** '수업 준비하기': pressed once before class, keeps the lesson pages, 3D models and AR card camera on this tablet for slow or dropped Wi-Fi. */
export function LessonPrep({ page }: { page: PrepPage }) {
  const [status, setStatus] = useState<PrepStatus>({ kind: 'idle' });
  useEffect(() => {
    let live = true;
    const stop = watchPrep(setStatus);
    void preparedStatus(page).then(next => { if (live) setStatus(current => current.kind === 'idle' ? next : current); });
    return () => { live = false; stop(); };
  }, [page]);
  if (!lessonPrepShown) return null;
  const working = status.kind === 'working';
  return <section className={`oc-prep is-${status.kind}`} aria-label="수업 준비">
    <button type="button" onClick={() => startPrep(page)} disabled={working || status.kind === 'unsupported'} aria-busy={working}>수업 준비하기</button>
    <div className="oc-prep-text">
      <p className="oc-prep-status" role="status">{prepStatusText(status)}</p>
      {page === 'teacher' && <p>수업 전에 모둠 태블릿마다 학생 화면에서 한 번씩 눌러 주세요. 여기서 누르면 이 기기의 선생님 화면이 준비돼요.</p>}
      <p className="oc-prep-note">반에 저장하기, 다른 모둠 카드, 선생님 현황, 제미나이는 인터넷이 있어야 해요.</p>
    </div>
  </section>;
}
