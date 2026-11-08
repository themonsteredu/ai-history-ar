import { useEffect, useRef, useState } from 'react';
import type { OpenState } from './api';
import { artifactById } from './artifacts';
import { decisionLabel, type GroupCard, type Verification } from './model';
import { goryeoArtifact } from '../goryeo/readyCards';
import './teacher-class-board.css';

type Props = {
  code: string; groupCount: number; state: OpenState; updatedAt?: number; error: string;
  era: 'goryeo' | 'joseon'; onClose: () => void;
  onPresentCard: (group: number) => void; onPresentQuiz: (group: number) => void;
};

function GroupSummary({ group, card, check, era, onPresentCard, onPresentQuiz }: {
  group: number; card?: GroupCard; check?: Verification; era: Props['era'];
  onPresentCard: Props['onPresentCard']; onPresentQuiz: Props['onPresentQuiz'];
}) {
  const artifact = era === 'goryeo' ? goryeoArtifact(card?.artifactId || 0) : artifactById(card?.artifactId || 0);
  const questions = (check?.selfQuestions || []).slice(0, 2);
  const notes = check?.notes;
  const noteRows = notes ? [
    ['유물의 특징', notes.feature], ['유물의 쓰임', notes.use], ['사람들의 생활에 준 도움', notes.benefit],
    ['출처', notes.source], ['오늘 알게 된 점', notes.learned], ['AI 답을 확인해야 하는 까닭', notes.caution],
  ].filter(([, value]) => value?.trim()) : [];
  return <article className="teacher-class-board__card" aria-label={`${group}모둠 기록`}>
    <header><div><p className="teacher-class-board__eyebrow">{group}모둠</p><h3>{artifact?.name || '유물 선택 전'}</h3></div><span>{card || check ? '기록 있음' : '기록 전'}</span></header>
    <section><h4>AR 카드에 적은 내용</h4>{card?.points.length ? <ol>{card.points.map((point, index) => <li key={point.id}><b>{index + 1}. {point.title || '제목 작성 전'}</b><p>{point.text || '설명 작성 전'}</p></li>)}</ol> : <p className="teacher-class-board__empty">저장된 카드 설명이 없어요.</p>}
      {card && artifact && <button type="button" onClick={() => onPresentCard(group)}>AR 카드 발표 화면</button>}
    </section>
    <section><h4>OX 문제와 검증</h4>{questions.some(q => q.statement.trim()) ? <ol>{questions.map((q, index) => {
      if (!q.statement.trim()) return null;
      const item = check?.items.find(row => row.questionId === q.id);
      return <li key={q.id}><h5>{index + 1}번 · {q.statement}</h5><dl>
        <div><dt>AI가 제안한 답과 해설</dt><dd>{q.answer}{q.explanation ? ` · ${q.explanation}` : ''}</dd></div>
        {item?.aiAnswer && <div><dt>기록한 AI 답변</dt><dd>{item.aiAnswer}</dd></div>}
        <div><dt>모둠의 OX</dt><dd>{item?.solved || '선택 전'}</dd></div>
        <div><dt>확인 자료</dt><dd>{item?.why || '작성 전'}</dd></div>
        <div><dt>모둠의 판단</dt><dd>{decisionLabel(item?.decision || '')}</dd></div>
        <div><dt>판단한 근거</dt><dd>{item?.reason || '작성 전'}</dd></div>
        {item?.decision === 'revise' && <><div><dt>바르게 고친 문장</dt><dd>{item.revised || '작성 전'}</dd></div><div><dt>바르게 고친 답</dt><dd>{item.revisedAnswer || '선택 전'}</dd></div></>}
        {item?.explanation && <div><dt>최종 해설</dt><dd>{item.explanation}</dd></div>}
      </dl></li>;
    })}</ol> : <p className="teacher-class-board__empty">저장된 OX 문제가 없어요.</p>}
      {check && card && <button type="button" onClick={() => onPresentQuiz(group)}>OX 발표 화면</button>}
    </section>
    {noteRows.length > 0 && <section><h4>모둠의 배움 정리</h4><dl>{noteRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>}
  </article>;
}

/** Actual room data, shared by both eras; the parent keeps polling while the board is open. */
export function TeacherClassBoard({ code, groupCount, state, updatedAt, error, era, onClose, onPresentCard, onPresentQuiz }: Props) {
  const [group, setGroup] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose); onCloseRef.current = onClose;
  useEffect(() => { closeRef.current?.focus(); const key = (event: KeyboardEvent) => { if (event.key === 'Escape') onCloseRef.current(); }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, []);
  const groups = Array.from({ length: groupCount }, (_, index) => index + 1);
  const visible = group === null ? groups : groups.filter(value => value === group);
  const lastUpdate = updatedAt ? new Date(updatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
  return <section className="teacher-class-board" role="dialog" aria-modal="true" aria-labelledby="teacher-class-board-title">
    <div className="teacher-class-board__inner">
      <header className="teacher-class-board__header"><div><p>{era === 'goryeo' ? '고려' : '조선'} 수업 · 수업코드 {code}</p><h2 id="teacher-class-board-title">전체 모둠 활동과 발표</h2><p>학생들이 저장한 카드와 검증 내용을 함께 살펴봅니다.</p></div><button ref={closeRef} type="button" onClick={onClose}>화면 닫기</button></header>
      <p className="teacher-class-board__status" role="status">{error ? `연결 확인 필요 · ${error}${lastUpdate ? ` · 마지막 확인 ${lastUpdate}` : ''}` : lastUpdate ? `마지막 확인 ${lastUpdate} · 6초마다 새로 확인` : '수업 기록을 불러오는 중'}</p>
      <nav className="teacher-class-board__groups" aria-label="발표할 모둠 선택"><button type="button" aria-pressed={group === null} onClick={() => setGroup(null)}>전체 모둠 보기</button>{groups.map(value => <button type="button" key={value} aria-pressed={group === value} onClick={() => setGroup(value)}>{value}모둠</button>)}</nav>
      {!updatedAt ? <p className="teacher-class-board__empty">{error ? '수업 기록을 불러오지 못했어요. 연결을 확인해 주세요.' : '모둠의 기록을 불러오고 있어요.'}</p> : <div className={`teacher-class-board__grid${group !== null ? ' is-focused' : ''}`}>{visible.map(value => <GroupSummary key={value} group={value} card={state.cards.find(item => item.data.group === value)?.data} check={state.checks.find(item => item.data.mode === 'self' && item.data.verifier === value && item.data.target === value)?.data} era={era} onPresentCard={onPresentCard} onPresentQuiz={onPresentQuiz} />)}</div>}
    </div>
  </section>;
}
