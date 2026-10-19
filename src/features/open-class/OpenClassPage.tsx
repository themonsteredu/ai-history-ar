import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { StudioSession } from '../ar-studio/api';
import { forgetOpenSession, joinOpenLesson, latestLoads, loadState, readOpenSession, saveCard, saveCheck, type OpenState } from './api';
import { artifactById } from './artifacts';
import { CardGallery } from './CardGallery';
import { CardMaker } from './CardMaker';
import { LessonPrep } from './LessonPrep';
import { isGroupCard, isVerification, newCard, newVerification, questionsToCheck, type GroupCard, type Verification } from './model';
import { Presentation } from './Presentation';
import { useSyncedDraft } from './useSyncedDraft';
import { VerifyBoard } from './VerifyBoard';
import './open-class.css';

type View = 'make' | 'look' | 'check' | 'present';
const VIEWS: { id: View; label: string; help: string }[] = [
  { id: 'make', label: 'AR 카드 만들기', help: '입체 모형에 점을 찍고 OX 문제 만들기' },
  { id: 'look', label: '다른 모둠 카드 관찰', help: '카드를 AR로 살펴보기' },
  { id: 'check', label: 'AI로 검증하기', help: '풀고 묻고 채택·수정·제외' },
  { id: 'present', label: '발표 정리', help: '문항·이유·정답 해설' },
];
const emptyState: OpenState = { cards: [], checks: [], teacher: [] };

/** Joseon open lesson for students: make a card, look at others, check them with Gemini, present. */
export default function OpenClassPage() {
  const [params, setParams] = useSearchParams();
  const code = (params.get('code') || params.get('hub_code') || '').trim().toLowerCase();
  const [session, setSession] = useState<StudioSession | undefined>(() => code ? readOpenSession(code) : undefined);
  const live = session?.code === code ? session : undefined;
  const [inputCode, setInputCode] = useState(code);
  const [name, setName] = useState(''); const [group, setGroup] = useState(1);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');

  async function join() {
    setBusy(true); setError('');
    try {
      const next = await joinOpenLesson(inputCode.trim().toLowerCase(), name.trim(), group);
      setSession(next);
      const nextParams = new URLSearchParams(params); nextParams.delete('hub_code'); nextParams.set('code', next.code); setParams(nextParams);
    } catch (value) { setError(value instanceof Error ? value.message : '수업에 들어가지 못했어요. 수업코드를 확인해 주세요.'); }
    finally { setBusy(false); }
  }

  if (!live) return <main className="oc-page page-width">
    <p className="oc-eyebrow">조선시대 공개수업</p>
    <h1>세종 때 과학 유물 AR 카드</h1>
    <p className="oc-lead">선생님이 알려 준 수업코드를 넣고, 내 이름과 모둠을 고르세요.</p>
    <form className="oc-entry" onSubmit={event => { event.preventDefault(); if (!busy) void join(); }}>
      <label>수업코드<input required inputMode="numeric" autoCapitalize="none" spellCheck={false} pattern="[a-zA-Z0-9]{4,12}" minLength={4} maxLength={12} value={inputCode} onChange={event => setInputCode(event.target.value.trim())} placeholder="선생님이 알려 준 번호" /></label>
      <label>내 이름<input required maxLength={30} value={name} onChange={event => setName(event.target.value)} placeholder="이름 또는 별명" /></label>
      <label>내 모둠<select value={group} onChange={event => setGroup(Number(event.target.value))}>{[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}모둠</option>)}</select></label>
      <button className="oc-big" type="submit" disabled={busy || !name.trim() || !/^[a-z0-9]{4,12}$/i.test(inputCode.trim())}>{busy ? '들어가는 중…' : '수업 들어가기'}</button>
    </form>
    {error && <p className="oc-notice" role="alert">{error}</p>}
    <LessonPrep page="student" />
    <p className="oc-foot"><Link to="/joseon">조선시대 수업으로 돌아가기</Link></p>
  </main>;

  return <Lesson key={`${live.code}:${live.memberId}`} session={live} onLeave={() => { forgetOpenSession(live.code); setSession(undefined); }} />;
}

function Lesson({ session, onLeave }: { session: StudioSession; onLeave: () => void }) {
  const [params, setParams] = useSearchParams();
  const view = (VIEWS.some(item => item.id === params.get('view')) ? params.get('view') : 'make') as View;
  const lookGroup = Number(params.get('group')) || undefined;
  const { code, token, group } = session;
  const [state, setState] = useState<OpenState>(emptyState);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [target, setTarget] = useState(0);

  // On slow Wi-Fi a tick waits for the load still running, and a late old reply never replaces a newer one.
  const [loads] = useState(() => latestLoads());
  const refresh = useCallback(async () => {
    if (document.visibilityState === 'hidden') return;
    const result = await loads(() => loadState(code, token));
    if (!result) return;
    if (result.ok) { setState(result.value); setLoaded(true); setError(''); return; }
    const status = (result.error as { status?: number }).status;
    if (status === 401 || status === 403) { setError('입장 정보가 바뀌었어요. 다시 입장해 주세요.'); return; }
    setError(result.error instanceof Error ? result.error.message : '우리 반 카드를 새로 받지 못했어요. 잠시 뒤 저절로 다시 받아요.');
  }, [code, token, loads]);
  useEffect(() => {
    const tick = () => { void refresh(); };
    tick(); const timer = window.setInterval(tick, 6000); window.addEventListener('online', tick);
    return () => { clearInterval(timer); window.removeEventListener('online', tick); };
  }, [refresh]);

  const go = (next: View, extra: Record<string, string> = {}) => { const value = new URLSearchParams(params); value.set('view', next); value.delete('group'); Object.entries(extra).forEach(([k, v]) => value.set(k, v)); setParams(value); window.scrollTo({ top: 0 }); };

  const myServer = state.cards.find(item => item.key === String(group));
  const saveMyCard = useCallback((data: GroupCard, version: number) => saveCard(code, token, data, version), [code, token]);
  const cardDraft = useSyncedDraft<GroupCard>({ draftKey: `${code}:card:${group}`, server: myServer, blank: () => newCard(group), check: isGroupCard, save: saveMyCard, canSave: data => data.artifactId > 0 && data.group === group });

  const otherCards = useMemo(() => state.cards.map(item => item.data).filter(card => card.group !== group && card.artifactId).sort((a, b) => a.group - b.group), [state.cards, group]);
  const myChecks = state.checks.filter(item => item.data.verifier === group);
  useEffect(() => {
    if (target || !loaded) return;
    const latest = [...myChecks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    if (latest) setTarget(latest.data.target); else if (otherCards[0]) setTarget(otherCards[0].group);
  }, [loaded, target, myChecks, otherCards]);

  const targetCard = otherCards.find(card => card.group === target);
  const teacherSet = state.teacher.find(item => item.data.artifactId === targetCard?.artifactId)?.data;
  const questions = useMemo(() => questionsToCheck(targetCard, teacherSet), [targetCard, teacherSet]);
  const saveMyCheck = useCallback((data: Verification, version: number) => saveCheck(code, token, data, version), [code, token]);
  const checkDraft = useSyncedDraft<Verification>({ draftKey: `${code}:verify:${group}:${target}`, server: state.checks.find(item => item.key === `${group}:${target}`), blank: () => newVerification(group, target), check: isVerification, save: saveMyCheck, canSave: data => data.verifier === group && data.target === target && target > 0 });

  const myCard = cardDraft.data;
  const taken = useMemo(() => { const map = new Map<number, number[]>(); state.cards.forEach(item => { if (item.data.artifactId) map.set(item.data.artifactId, [...(map.get(item.data.artifactId) || []), item.data.group]); }); return map; }, [state.cards]);

  return <main className="oc-page page-width">
    <header className="oc-head">
      <div><p className="oc-eyebrow">조선시대 공개수업 · 수업코드 {code}</p><h1>세종 때 과학 유물 AR 카드</h1></div>
      <p className="oc-me"><b>{group}모둠</b> · {session.name}{myCard.artifactId ? ` · ${artifactById(myCard.artifactId)?.name}` : ''}<button type="button" className="oc-link" onClick={() => { if (window.confirm('이 태블릿의 입장 정보를 지우고 다시 들어갈까요? 쓴 내용은 남아 있어요.')) onLeave(); }}>다시 입장</button></p>
    </header>
    <LessonPrep page="student" />
    <nav className="oc-tabs" aria-label="오늘 할 일">{VIEWS.map((item, index) => <button key={item.id} type="button" aria-pressed={view === item.id} onClick={() => go(item.id)}><b>{index + 1}</b><span>{item.label}</span><small>{item.help}</small></button>)}</nav>
    {error && <p className="oc-notice" role="alert">{error}{error.includes('다시 입장') && <button type="button" className="oc-link" onClick={onLeave}>다시 입장하기</button>}</p>}
    {!loaded && !error && <p className="oc-help" role="status">우리 반 카드를 불러오고 있어요…</p>}
    {view === 'make' && <CardMaker draft={cardDraft} taken={taken} />}
    {view === 'look' && <CardGallery key={lookGroup} cards={state.cards} myGroup={group} initialGroup={lookGroup} onCheck={next => { setTarget(next); go('check'); }} />}
    {view === 'check' && <VerifyBoard draft={checkDraft} card={targetCard} questions={questions} targets={otherCards} target={target} onTarget={setTarget} />}
    {view === 'present' && <section className="oc-panel">
      <div className="oc-actions oc-present-tools">
        {myChecks.length > 1 && <label className="oc-inline">발표할 검증<select value={target} onChange={event => setTarget(Number(event.target.value))}>{myChecks.map(item => <option key={item.key} value={item.data.target}>{item.data.target}모둠 카드</option>)}</select></label>}
        <button type="button" onClick={() => window.print()}>인쇄하기</button>
      </div>
      <Presentation check={checkDraft.data.items.length ? checkDraft.data : undefined} card={targetCard} questions={questions} />
    </section>}
  </main>;
}
