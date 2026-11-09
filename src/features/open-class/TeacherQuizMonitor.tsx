import { useState } from 'react';
import type { OpenState } from './api';
import { artifactById } from './artifacts';
import { goryeoArtifact } from '../goryeo/readyCards';
import { TeacherQuizStatus } from './TeacherGroupDashboard';
import { quizProgress } from './quizProgress';
import { usePresentationDialog } from './usePresentationDialog';
import './teacher-quiz-monitor.css';

type Props = {
  era: 'goryeo' | 'joseon'; code: string; groupCount: number; state: OpenState;
  updatedAt?: number; error: string; onRefresh: () => Promise<unknown>; onClose: () => void;
};

/** Read-only inspection of every group's saved drafts, without a completion gate. */
export function TeacherQuizMonitor({ era, code, groupCount, state, updatedAt, error, onRefresh, onClose }: Props) {
  const [group, setGroup] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const root = usePresentationDialog(onClose);
  const selected = Math.min(group, groupCount);
  const checkOf = (value: number) => state.checks.find(item => item.data.mode === 'self' && item.data.verifier === value && item.data.target === value);
  const artifactOf = (value: number) => {
    const id = state.cards.find(item => item.data.group === value)?.data.artifactId || 0;
    return era === 'goryeo' ? goryeoArtifact(id) : artifactById(id);
  };
  const check = checkOf(selected);
  const progress = quizProgress(check?.data);
  async function refresh() { setRefreshing(true); try { await onRefresh(); } finally { setRefreshing(false); } }
  return <section ref={root} className="teacher-quiz-monitor" role="dialog" aria-modal="true" aria-labelledby="quiz-monitor-title">
    <header className="teacher-quiz-monitor__header"><div><p>{era === 'goryeo' ? '고려' : '조선'} · 수업코드 {code}</p><h1 id="quiz-monitor-title">OX 문제 작성 확인</h1></div><button type="button" data-autofocus onClick={onClose}>← 수업 현황</button></header>
    <div className="teacher-quiz-monitor__status"><p role="status">{error ? `연결 확인 필요 · ${error}` : updatedAt ? `6초마다 확인 · 마지막 확인 ${new Date(updatedAt).toLocaleTimeString('ko-KR')}` : '수업 기록을 불러오는 중…'}</p><button type="button" disabled={refreshing} onClick={() => void refresh()}>{refreshing ? '확인 중…' : '지금 새로고침'}</button></div>
    <p className="teacher-quiz-monitor__scope">학생들이 이 수업 화면에 입력한 내용입니다. 제미나이 답변은 학생들이 옮긴 뒤 표시됩니다.</p>
    <div className="teacher-quiz-monitor__layout">
      <nav className="teacher-quiz-monitor__groups" aria-label="작성 내용을 확인할 모둠">
        {Array.from({ length: groupCount }, (_, index) => index + 1).map(value => {
          const item = checkOf(value); const status = quizProgress(item?.data);
          return <button type="button" key={value} aria-pressed={selected === value} onClick={() => setGroup(value)}>
            <span><strong>{value}모둠</strong><b>{updatedAt ? status.label : error ? '연결 확인' : '불러오는 중'}</b></span>
            <span>{artifactOf(value)?.name || '유물 선택 전'}</span>
            <small>문제 {status.written}/2 · 검증 {status.verified}/2</small>
          </button>;
        })}
      </nav>
      <article className="teacher-quiz-monitor__detail" aria-label={`${selected}모둠 OX 작성 내용`}>
        <header><div><h2>{selected}모둠 · {artifactOf(selected)?.name || '유물 선택 전'}</h2><p>{updatedAt ? progress.label : '기록 확인 중'}</p></div></header>
        {updatedAt ? <TeacherQuizStatus check={check?.data} updatedAt={check?.updatedAt} /> : <p>{error ? '수업 기록을 확인하지 못했어요.' : '모둠 기록을 불러오는 중…'}</p>}
      </article>
    </div>
  </section>;
}
