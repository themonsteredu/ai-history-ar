import { useState } from 'react';
import type { OpenItem } from './api';
import { ArCard } from './ArCard';
import { artifactById } from './artifacts';
import { goryeoArtifact } from '../goryeo/readyCards';
import { cardProblems, decisionLabel, selfItemDone, type GroupCard, type Verification } from './model';

type Stage = 'card-progress' | 'card-view' | 'card-present' | 'quiz-status' | 'quiz-present';
type Era = 'goryeo' | 'joseon';

const stages: { id: Stage; label: string }[] = [
  { id: 'card-progress', label: 'AR 카드 제작 현황' },
  { id: 'card-view', label: 'AR 카드 확인' },
  { id: 'card-present', label: 'AR 카드 발표' },
  { id: 'quiz-status', label: 'OX 퀴즈 작성 현황' },
  { id: 'quiz-present', label: 'OX 퀴즈 발표' },
];

function savedTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export function TeacherGroupDashboard({ group, era, cardItem, checkItem, onBack, onCardPresentation, onQuizPresentation }: {
  group: number; era: Era; cardItem?: OpenItem<GroupCard>; checkItem?: OpenItem<Verification>;
  onBack: () => void; onCardPresentation: () => void; onQuizPresentation: () => void;
}) {
  const [stage, setStage] = useState<Stage>('card-progress');
  const [selected, setSelected] = useState('');
  const card = cardItem?.data;
  const check = checkItem?.data;
  const artifact = era === 'goryeo' ? goryeoArtifact(card?.artifactId || 0) : artifactById(card?.artifactId || 0);
  const points = card?.points || [];
  const questions = (check?.selfQuestions || []).slice(0, 2);
  const written = questions.filter(q => q.statement.trim()).length;
  const verified = questions.filter(q => {
    const item = check?.items.find(value => value.questionId === q.id);
    return !!q.statement.trim() && !!item && item.decision !== 'exclude' && selfItemDone(item);
  }).length;
  const ready = !!card && !!artifact && cardProblems(card).length === 0;
  const selectedPoint = points.find(point => point.id === selected);
  const status = (id: Stage) => id === 'card-progress' ? (!artifact ? '작성 전' : ready ? '완성' : '만드는 중')
    : id === 'card-view' || id === 'card-present' ? (artifact ? `${points.length}개 설명` : '작성 전')
    : id === 'quiz-status' ? `${written} / 2문제 작성` : `${verified} / 2문제 검증`;

  function selectStage(next: Stage) {
    setStage(next);
    if (next === 'card-present' && artifact) onCardPresentation();
    if (next === 'quiz-present' && check && card) onQuizPresentation();
  }

  return <div className="oc-group-dashboard">
    <header className="oc-group-dashboard__head">
      <div><button type="button" className="oc-group-dashboard__back" onClick={onBack}>← 모둠 목록</button><h2>{group}모둠 활동</h2><p>{artifact?.name || '유물 선택 전'}</p></div>
      <p className="oc-help">학생들이 저장한 기록을 6초마다 확인합니다.</p>
    </header>
    <nav className="oc-group-dashboard__nav" aria-label={`${group}모둠 활동 선택`}>
      {stages.map(item => <button key={item.id} type="button" aria-pressed={stage === item.id} onClick={() => selectStage(item.id)}>
        <b>{item.label}</b><span>{status(item.id)}</span>
      </button>)}
    </nav>
    <div className="oc-group-dashboard__content">
      {stage === 'card-progress' && <section aria-label="AR 카드 제작 현황">
        <h3>AR 카드 제작 현황</h3>
        {!card || !artifact ? <p className="oc-empty">아직 저장된 AR 카드가 없어요.</p> : <>
          <p><b>{artifact.name}</b> · {ready ? '카드 완성' : '카드 만드는 중'}{savedTime(cardItem?.updatedAt) && ` · 마지막 저장 ${savedTime(cardItem?.updatedAt)}`}</p>
          {card.members && <p>모둠원: {card.members}</p>}
          <p>작성한 설명: {points.length}개</p>
          {points.length ? <ol className="oc-group-dashboard__points">{points.map((point, index) => <li key={point.id}><strong>{index + 1}. {point.title || '제목 작성 전'}</strong><p>{point.text || '설명 작성 전'}</p></li>)}</ol> : <p>아직 작성한 설명이 없어요.</p>}
          {!ready && <p className="oc-help">{cardProblems(card).join(' ')}</p>}
        </>}
      </section>}
      {stage === 'card-view' && <section aria-label="AR 카드 확인">
        <h3>AR 카드 확인</h3>
        {!card || !artifact ? <p className="oc-empty">학생들이 카드를 저장하면 여기에서 볼 수 있어요.</p> : <>
          <p>모형의 번호 또는 아래 번호를 누르면 학생들이 쓴 설명이 나타납니다.</p>
          <div className="oc-group-dashboard__card"><ArCard era={era} artifactId={card.artifactId} points={points} selected={selected} onSelect={id => setSelected(value => value === id ? '' : id)} caption={`${group}모둠 · ${artifact.name}`} />
            <div><div className="oc-group-dashboard__number-buttons">{points.map((point, index) => <button type="button" key={point.id} aria-pressed={selected === point.id} onClick={() => setSelected(value => value === point.id ? '' : point.id)}>{index + 1}번 {point.title || '제목 작성 전'}</button>)}</div>
              {selectedPoint ? <div className="oc-group-dashboard__point"><b>{selectedPoint.title || '제목 작성 전'}</b><p>{selectedPoint.text || '설명 작성 전'}</p></div> : <p>{points.length ? '확인할 번호를 선택하세요.' : '아직 작성한 설명이 없어요.'}</p>}</div>
          </div>
        </>}
      </section>}
      {stage === 'card-present' && <section aria-label="AR 카드 발표"><h3>AR 카드 발표</h3>{artifact ? <><p>{group}모둠이 만든 {artifact.name} 카드로 발표합니다.</p><button type="button" className="oc-primary" onClick={onCardPresentation}>발표 화면 다시 열기</button></> : <p className="oc-empty">학생들이 카드를 저장하면 발표 화면을 열 수 있어요.</p>}</section>}
      {stage === 'quiz-status' && <TeacherQuizStatus check={check} updatedAt={checkItem?.updatedAt} />}
      {stage === 'quiz-present' && <section aria-label="OX 퀴즈 발표"><h3>OX 퀴즈 발표</h3>{check && card ? <><p>검증 완료 {verified} / 2문제</p><button type="button" className="oc-primary" onClick={onQuizPresentation}>발표 화면 다시 열기</button></> : <p className="oc-empty">학생들이 퀴즈 검증을 저장하면 발표 화면을 열 수 있어요.</p>}</section>}
    </div>
  </div>;
}

export function TeacherQuizStatus({ check, updatedAt }: { check?: Verification; updatedAt?: string }) {
  const questions = (check?.selfQuestions || []).slice(0, 2);
  return <section aria-label="OX 퀴즈 작성 현황"><h3>OX 퀴즈 작성 현황</h3>
    {savedTime(updatedAt) && <p className="oc-help">마지막 저장 {savedTime(updatedAt)}</p>}
    {!questions.length ? <p className="oc-empty">아직 저장된 OX 퀴즈가 없어요.</p> : <ol className="oc-group-dashboard__questions">{questions.map((question, index) => {
      const item = check?.items.find(value => value.questionId === question.id);
      return <li key={question.id}><h4>{index + 1}번 문제 {item && selfItemDone(item) ? '· 검증 완료' : '· 작성 중'}</h4>
        {question.statement.trim() ? <><p>{question.statement}</p><p><b>AI 정답:</b> {question.answer}</p>{question.explanation && <p><b>AI 해설:</b> {question.explanation}</p>}</> : <p>문장 작성 전</p>}
        {item && <dl><div><dt>확인 자료</dt><dd>{item.why || '작성 전'}</dd></div><div><dt>모둠의 답</dt><dd>{item.solved || '선택 전'}</dd></div><div><dt>판단</dt><dd>{decisionLabel(item.decision)}</dd></div>
          {item.decision === 'revise' && <><div><dt>고친 문장</dt><dd>{item.revised || '작성 전'}</dd></div><div><dt>고친 답</dt><dd>{item.revisedAnswer || '선택 전'}</dd></div></>}
          <div><dt>판단 이유</dt><dd>{item.reason || '작성 전'}</dd></div>{item.explanation && <div><dt>최종 해설</dt><dd>{item.explanation}</dd></div>}</dl>}
      </li>;
    })}</ol>}
  </section>;
}
