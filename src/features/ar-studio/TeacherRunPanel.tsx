import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Classroom, StudioSession } from './api';
import { GROUP_CHOICES, groupCountKey, readGroupCount, runLessons, sharingStatus } from './teacherRun';

interface RunPanelProps {
  classroom?: Classroom;
  session?: StudioSession;
  code: string;
  onView: (view: 'photo' | 'preview' | 'classroom') => void;
}

export function TeacherRunPanel({ classroom, session, code, onView }: RunPanelProps) {
  const [lessonId, setLessonId] = useState(1);
  const [groupCount, setGroupCount] = useState(6);
  useEffect(() => { try { setGroupCount(readGroupCount(window.localStorage)); } catch { /* default stays */ } }, []);
  function changeGroupCount(value: number) {
    setGroupCount(value);
    try { window.localStorage.setItem(groupCountKey, String(value)); } catch { /* panel keeps working without storage */ }
  }
  const lesson = runLessons.find(item => item.id === lessonId) || runLessons[0];
  const status = sharingStatus(groupCount, session ? classroom?.gallery : undefined);
  const typedCode = /^[a-z0-9]{4,12}$/i.test(code.trim()) ? code.trim() : '';
  const stage = session ? 'live' : typedCode ? 'join' : 'code';

  return <section className="teacher-run" aria-label="교사 수업 진행판">
    <header className="teacher-run-head">
      <div><p className="teacher-run-eyebrow">선생님 화면</p><h2>진행 순서</h2></div>
      <div className="teacher-run-tabs">{runLessons.map(item => <button key={item.id} aria-pressed={item.id === lesson.id} onClick={() => setLessonId(item.id)}>{item.id}차시 · {item.name}</button>)}</div>
    </header>

    <div className="teacher-run-status">
      <div className={`teacher-run-state teacher-run-state--${stage}`}>
        {stage === 'code' ? <><strong>먼저 수업코드를 정해 주세요</strong><p>아래 <b>학생 입장 QR 만들기</b>에 숫자 6자리를 넣으세요.</p></>
          : stage === 'join' ? <><strong>수업코드 {typedCode}</strong><p><b>수업코드 저장 완료</b>가 뜨면 학생을 입장시키세요. 선생님도 같은 코드로 들어오면 공유 현황이 보입니다. 단 <b>모둠에 공유</b>는 누르지 마세요.</p></>
          : <><strong>수업코드 {session?.code} 연결됨</strong><p>{status.ready ? '모든 모둠이 공유를 마쳤습니다. 시작하세요.' : `${status.shared.length} / ${groupCount}모둠 공유됨.`}</p></>}
      </div>
      <div className="teacher-run-groups">
        <div className="teacher-run-groups-head"><span>모둠 공유 현황</span><label>우리 반 모둠 수<select value={groupCount} onChange={event => changeGroupCount(Number(event.target.value))}>{GROUP_CHOICES.map(n => <option key={n} value={n}>{n}모둠</option>)}</select></label></div>
        <ul className="teacher-run-chips">{Array.from({ length: groupCount }, (_, index) => index + 1).map(group => {
          const done = status.shared.includes(group);
          return <li key={group} className={done ? 'is-shared' : 'is-waiting'}>{group}모둠<small>{stage !== 'live' ? '확인 전' : done ? '공유 완료' : '대기 중'}</small></li>;
        })}</ul>
        {stage === 'live' && !status.ready && <p className="teacher-run-warn" role="status">아직 {status.missing.join(', ')}모둠이 남았습니다. 먼저 퀴즈를 시작하면 학생 제출이 막힙니다.</p>}
        {stage === 'live' && status.ready && <div className="studio-actions"><button className="studio-primary" onClick={() => onView('classroom')}>우리 반 전시·퀴즈 열기</button></div>}
      </div>
    </div>

    <div className="teacher-run-body">
      <div>
        <h3>{lesson.id}차시 · {lesson.name} <span>{lesson.minutes}분</span></h3>
        <p className="teacher-run-summary">{lesson.summary}</p>
        <ol className="teacher-run-steps">{lesson.steps.map((step, index) => <li key={step.title} className={`is-${step.actor}`}>
          <span className="teacher-run-num">{index + 1}</span>
          <div><p className="teacher-run-meta"><b>{step.actor === 'teacher' ? '선생님' : '학생'}</b><span>{step.minutes}분</span>{step.press && <em>‘{step.press}’ 누르기</em>}</p><h4>{step.title}</h4><p>{step.detail}</p></div>
        </li>)}</ol>
        <p className="teacher-run-finish"><b>마무리</b> {lesson.finish}</p>
      </div>
      <aside className="teacher-run-side">
        <h3>준비물</h3>
        <ul>{lesson.prepare.map(item => <li key={item}>{item}</li>)}</ul>
        <h3>주의</h3>
        <ul className="teacher-run-rules">
          <li><b>공유는 모둠당 한 대만.</b> 처음 누른 태블릿이 담당입니다.</li>
          <li><b>전시 시작 버튼은 없습니다.</b> 공유하면 바로 반에 보입니다.</li>
          <li><b>퀴즈는 다 공유된 뒤에.</b> 학생 제출은 한 번뿐입니다.</li>
        </ul>
        <div className="studio-actions"><button onClick={() => onView('photo')}>제작 화면 보기</button><button onClick={() => onView('preview')}>내 작품 체험</button></div>
        <p className="teacher-run-rescue">지난 작업이 안 보이면 그 태블릿에서 <Link to="/three-kingdoms/ar-rescue">학생 작업 복구</Link>를 여세요.</p>
      </aside>
    </div>
  </section>;
}
