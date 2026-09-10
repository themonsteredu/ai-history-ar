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
      <div><p className="teacher-run-eyebrow">선생님 화면 · 2차시 운영</p><h2>지금 이대로 진행하세요</h2></div>
      <div className="teacher-run-tabs">{runLessons.map(item => <button key={item.id} aria-pressed={item.id === lesson.id} onClick={() => setLessonId(item.id)}>{item.id}차시 · {item.name}</button>)}</div>
    </header>

    <div className="teacher-run-status">
      <div className={`teacher-run-state teacher-run-state--${stage}`}>
        {stage === 'code' ? <><strong>먼저 수업코드를 정해 주세요</strong><p>아래 <b>학생 입장 QR 만들기</b>를 누르고 숫자 6자리를 입력하면 자동 저장됩니다.</p></>
          : stage === 'join' ? <><strong>수업코드 {typedCode}</strong><p><b>수업코드 저장 완료</b> 표시를 확인한 뒤 학생을 입장시켜 주세요. 선생님도 같은 코드로 입장하면 모둠 공유 현황이 실시간으로 보입니다. 단, 선생님은 <b>모둠에 공유</b>를 누르지 마세요.</p></>
          : <><strong>수업코드 {session?.code} 연결됨</strong><p>{status.ready ? '모든 모둠이 공유를 마쳤습니다. 관람과 퀴즈를 시작해도 됩니다.' : `${status.shared.length} / ${groupCount}모둠 공유됨. 남은 모둠이 공유를 마친 뒤 퀴즈를 시작해 주세요.`}</p></>}
      </div>
      <div className="teacher-run-groups">
        <div className="teacher-run-groups-head"><span>모둠 공유 현황</span><label>우리 반 모둠 수<select value={groupCount} onChange={event => changeGroupCount(Number(event.target.value))}>{GROUP_CHOICES.map(n => <option key={n} value={n}>{n}모둠</option>)}</select></label></div>
        <ul className="teacher-run-chips">{Array.from({ length: groupCount }, (_, index) => index + 1).map(group => {
          const done = status.shared.includes(group);
          return <li key={group} className={done ? 'is-shared' : 'is-waiting'}>{group}모둠<small>{stage !== 'live' ? '확인 전' : done ? '공유 완료' : '대기 중'}</small></li>;
        })}</ul>
        {stage === 'live' && !status.ready && <p className="teacher-run-warn" role="status">아직 {status.missing.join(', ')}모둠이 남았습니다. 퀴즈를 먼저 시작하면 뒤늦게 공유된 문제 때문에 학생 제출이 막힙니다.</p>}
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
        <p className="teacher-run-finish"><b>마치는 기준</b> {lesson.finish}</p>
      </div>
      <aside className="teacher-run-side">
        <h3>수업 전에 준비할 것</h3>
        <ul>{lesson.prepare.map(item => <li key={item}>{item}</li>)}</ul>
        <h3>꼭 기억할 세 가지</h3>
        <ul className="teacher-run-rules">
          <li><b>공유는 모둠당 한 대에서만</b> 됩니다. 처음 누른 태블릿이 저장 담당입니다.</li>
          <li><b>‘저장’과 ‘제출’은 같은 동작</b>입니다. 따로 전시를 시작하는 버튼은 없고, 공유하면 바로 반에 보입니다.</li>
          <li><b>퀴즈는 모둠이 다 공유된 뒤에</b> 시작합니다. 개인 제출은 한 번뿐이고 되돌릴 수 없습니다.</li>
        </ul>
        <div className="studio-actions"><button onClick={() => onView('photo')}>제작 화면 보기</button><button onClick={() => onView('preview')}>내 작품 체험</button></div>
        <h3>지난 시간 작업을 못 찾을 때</h3>
        <p className="teacher-run-rescue">학생이 쓰던 태블릿에서 <Link to="/three-kingdoms/ar-rescue">학생 작업 복구</Link>를 열면 그 기기에 남은 작업을 찾아 파일로 꺼낼 수 있습니다. 저장된 내용은 지우지 않습니다.</p>
      </aside>
    </div>
  </section>;
}
