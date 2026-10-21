import { useCallback, useEffect, useMemo, useState } from 'react';
import { TEACHER_PIN } from '../../auth/teacherAccess';
import { encodeUrlQr } from '../../lib/qr/classroomQr';
import type { StudioSession } from '../ar-studio/api';
import { NumericCodeStatus } from '../ar-studio/NumericCodeStatus';
import { addTeacherClass, classNameFor, isClassCode, normalizeClassCode, readTeacherClasses, removeTeacherClass, writeTeacherClasses, type TeacherClass } from '../ar-studio/teacherClasses';
import { GROUP_CHOICES, groupCountKey, readGroupCount } from '../ar-studio/teacherRun';
import { forgetOpenSession, joinOpenLesson, latestLoads, loadState, readOpenSession, saveTeacherSet, type OpenItem, type OpenState } from './api';
import { joseonModelFor, joseonModels, joseonTargets } from '../../lib/ar/joseon/catalog';
import { ArCard } from './ArCard';
import { ARTIFACTS, artifactById } from './artifacts';
import { cardProblems, decisionLabel, isTeacherSet, MAX_TEACHER_QUESTIONS, newQuestion, newTeacherSet, questionsToCheck, selfQuestions, readyQuestions, verifyProgress, type GroupCard, type OxQuestion, type TeacherSet, type Verification } from './model';
import { LessonPrep } from './LessonPrep';
import { Presentation } from './Presentation';
import { saveLabel, useSyncedDraft } from './useSyncedDraft';
import './open-class.css';

const SITE = 'https://ai-history-ar.vercel.app';
export const openClassUrl = (code: string, extra = '') => `${SITE}/joseon/open-class?code=${encodeURIComponent(code)}${extra}`;
const emptyState: OpenState = { cards: [], checks: [], teacher: [] };
const FLOW = [
 {minutes:3,who:'선생님',title:'활동 안내',detail:'AR 카드는 사전에 제작합니다. 당일에는 발표부터 시작해요.'},
 {minutes:10,who:'모둠',title:'AR 카드 발표',detail:'특징·쓰임·백성 생활에 준 도움·출처를 설명하고 친구 발표를 핵심어로 기록해요.'},
 {minutes:15,who:'학생',title:'AI 문제 2개 만들고 자료로 검증',detail:'AI에 질문 → 초안 2개 → 교과서·참고 자료 대조 → 채택·수정·제외와 근거.'},
 {minutes:9,who:'모둠',title:'검증한 퀴즈 발표',detail:'친구들이 먼저 답하고, 출제 모둠이 정답·근거 공개 버튼으로 해설해요.'},
 {minutes:3,who:'학생',title:'배움 정리',detail:'알게 된 점과 AI 정보를 확인해야 하는 까닭을 적어요.'},
];
const inquiryQuestions=(check:Verification|undefined,card:GroupCard|undefined,teacher:TeacherSet|undefined)=>check?.mode==='self'?selfQuestions(check):questionsToCheck(card,teacher);

/** Teacher screen for the Joseon open lesson: progress of every group, how they are checking, and the teacher's own OX questions. */
export default function OpenClassTeacher() {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [code, setCode] = useState('');
  const [newName, setNewName] = useState(''); const [newCode, setNewCode] = useState('');
  const [groupCount, setGroupCount] = useState(6);
  useEffect(() => { try { setClasses(readTeacherClasses(window.localStorage)); setGroupCount(readGroupCount(window.localStorage)); } catch { /* defaults stay */ } }, []);
  function saveClasses(next: TeacherClass[]) { setClasses(next); try { writeTeacherClasses(next, window.localStorage); } catch { /* kept for this visit */ } }
  function addClass() {
    const next = addTeacherClass(classes, newName, newCode);
    if (next.length === classes.length && !classNameFor(classes, newCode)) return;
    saveClasses(next); setCode(normalizeClassCode(newCode)); setNewName(''); setNewCode('');
  }
  function changeGroupCount(value: number) { setGroupCount(value); try { window.localStorage.setItem(groupCountKey, String(value)); } catch { /* fine */ } }
  const name = classNameFor(classes, code);

  return <div className="oc-page oc-teacher page-width">
    <header className="oc-head"><div><p className="oc-eyebrow">선생님 화면 · 조선시대 공개수업</p><h1>{name ? `${name} · 수업코드 ${code}` : code ? `수업코드 ${code}` : '세종 때 과학 유물 AR 카드'}</h1></div></header>
    <LessonPrep page="teacher" />
    <section className="oc-panel" aria-label="내 반 목록">
      <h2>내 반</h2>
      {classes.length > 0 && <ul className="oc-class-list">{classes.map(item => <li key={item.code} className={item.code === code ? 'is-open' : undefined}>
        <button type="button" onClick={() => setCode(item.code)}><b>{item.name}</b><span>{item.code}</span></button>
        <button type="button" className="oc-class-remove" aria-label={`${item.name} 목록에서 빼기`} onClick={() => { if (window.confirm(`${item.name}(${item.code})을 목록에서 뺄까요? 학생 기록은 서버에 그대로 남아요.`)) saveClasses(removeTeacherClass(classes, item.code)); }}>×</button>
      </li>)}</ul>}
      <form className="oc-class-add" onSubmit={event => { event.preventDefault(); addClass(); }}>
        <label>반 이름<input value={newName} maxLength={30} placeholder="예: 5학년 2반" onChange={event => setNewName(event.target.value)} /></label>
        <label>수업코드 (숫자)<input value={newCode} inputMode="numeric" autoCapitalize="none" spellCheck={false} maxLength={12} placeholder="예: 520301" onChange={event => setNewCode(event.target.value.trim())} /></label>
        <button type="submit" className="oc-primary" disabled={!newName.trim() || !isClassCode(newCode)}>{classes.length ? '반 추가' : '첫 반 등록'}</button>
      </form>
      <NumericCodeStatus code={newCode} />
      <p className="oc-help">삼국시대 AR 수업과 같은 반 목록을 써요. 숫자를 넣으면 수업코드가 자동으로 저장돼요.</p>
    </section>
    {code ? <ClassBoard key={code} code={code} groupCount={groupCount} onGroupCount={changeGroupCount} /> : <p className="oc-empty">위에서 반을 등록하거나 누르면 QR·모둠 현황·선생님 문제가 나와요.</p>}
  </div>;
}

function ClassBoard({ code, groupCount, onGroupCount }: { code: string; groupCount: number; onGroupCount: (n: number) => void }) {
  const [session, setSession] = useState<StudioSession>();
  const [state, setState] = useState<OpenState>(emptyState);
  const [error, setError] = useState('');
  const [openGroup, setOpenGroup] = useState<number>();
  const [present, setPresent] = useState<{ verifier: number; target: number }>();
  const [printing, setPrinting] = useState<false | 'groups' | 'targets'>(false);

  // On slow Wi-Fi a tick waits for the load still running, and a late old reply never replaces a newer one.
  const [loads] = useState(() => latestLoads());
  const refresh = useCallback(async () => {
    if (document.visibilityState === 'hidden') return;
    const result = await loads(async () => {
      let entry = session || readOpenSession(code);
      if (!entry) entry = await joinOpenLesson(code, '선생님', 1);
      if (entry !== session) setSession(entry);
      return loadState(code, entry.token);
    });
    if (!result) return;
    if (result.ok) { setState(result.value); setError(''); return; }
    const status = (result.error as { status?: number }).status;
    // A stale entry on this device is replaced on the next check instead of failing every time.
    if (status === 401 || status === 403) { forgetOpenSession(code); setSession(undefined); }
    setError(result.error instanceof Error ? result.error.message : '수업을 열지 못했어요. 잠시 뒤 저절로 다시 해 볼게요.');
  }, [code, session, loads]);
  useEffect(() => {
    const tick = () => { void refresh(); };
    tick(); const timer = window.setInterval(tick, 6000); window.addEventListener('online', tick);
    return () => { clearInterval(timer); window.removeEventListener('online', tick); };
  }, [refresh]);
  useEffect(() => {
    if (!printing) return;
    document.body.classList.add('oc-printing-cards');
    const done = () => { document.body.classList.remove('oc-printing-cards'); setPrinting(false); };
    window.addEventListener('afterprint', done, { once: true });
    const timer = window.setTimeout(() => window.print(), 100);
    return () => { clearTimeout(timer); window.removeEventListener('afterprint', done); document.body.classList.remove('oc-printing-cards'); };
  }, [printing]);

  const qr = useMemo(() => encodeUrlQr(openClassUrl(code)), [code]);
  const cardOf = (group: number) => state.cards.find(item => item.data.group === group)?.data;
  const teacherFor = (artifactId: number) => state.teacher.find(item => item.data.artifactId === artifactId)?.data;
  const groups = Array.from({ length: groupCount }, (_, index) => index + 1);
  const presentCheck = present && state.checks.find(item => item.key === `${present.verifier}:${present.target}`)?.data;
  const presentCard = present && cardOf(present.target);

  return <>
    {error && <p className="oc-notice" role="alert">{error}</p>}
    <div className="oc-teacher-top">
      <section className="oc-panel oc-qr" aria-label="학생 입장 QR">
        <h2>학생 입장 QR</h2>
        <svg role="img" aria-label={`수업코드 ${code} 입장 QR`} viewBox={`0 0 ${qr.size} ${qr.size}`} shapeRendering="crispEdges"><rect width="100%" height="100%" fill="#fff" /><path d={qr.path} fill="#000" /></svg>
        <p className="oc-qr-code">수업코드 <b>{code}</b></p>
        <a className="oc-qr-link" href={openClassUrl(code)} target="_blank" rel="noopener noreferrer">{openClassUrl(code)}</a>
      </section>
      <section className="oc-panel oc-flow" aria-label="40분 진행 순서">
        <h2>40분 진행 순서</h2><a href={`${import.meta.env.BASE_URL}downloads/joseon/open-class/student-worksheet.pdf`} download>공개수업 활동지 PDF</a>
        <ol>{FLOW.map(step => <li key={step.title}><span>{step.minutes}분 · {step.who}</span><b>{step.title}</b><small>{step.detail}</small></li>)}</ol>
      </section>
    </div>

    <section className="oc-panel" aria-label="모둠 현황">
      <div className="oc-board-head"><h2>모둠 현황 <small>6초마다 새로 확인</small></h2>
        <div className="oc-actions"><label className="oc-inline">모둠 수<select value={groupCount} onChange={event => onGroupCount(Number(event.target.value))}>{GROUP_CHOICES.map(n => <option key={n} value={n}>{n}모둠</option>)}</select></label>
          <button type="button" disabled={!state.cards.some(item => item.data.artifactId)} onClick={() => setPrinting('groups')}>모둠 카드 인쇄</button>
          {joseonTargets.ready && <button type="button" onClick={() => setPrinting('targets')}>AR 인식 카드 6종 인쇄</button>}</div>
      </div>
      <div className="oc-board">{groups.map(group => <GroupStatus key={group} group={group} card={cardOf(group)} cardItem={state.cards.find(item => item.data.group === group)}
        checks={state.checks.filter(item => item.data.verifier === group)} cardOf={cardOf} teacherFor={teacherFor}
        open={openGroup === group} onToggle={() => setOpenGroup(value => value === group ? undefined : group)} onPresent={target => setPresent({ verifier: group, target })} />)}</div>
      <p className="oc-help">모둠 이름을 누르면 카드·문제·검증 기록을 자세히 볼 수 있어요.</p>
    </section>
    {openGroup && <GroupDetail group={openGroup} card={cardOf(openGroup)} checks={state.checks.filter(item => item.data.verifier === openGroup)} cardOf={cardOf} teacherFor={teacherFor} />}

    {session && <details className="oc-panel"><summary>이전 수업용 · 선생님 OX 문제</summary><p>이번 공개수업은 모둠이 AI로 만든 2문항만 검증합니다. 아래 문제는 이전 방식의 기록입니다.</p><TeacherQuestions code={code} token={session.token} sets={state.teacher} cards={state.cards.map(item => item.data)} /></details>}

    {present && <div className="oc-present-modal" role="dialog" aria-modal="true" aria-label="발표 화면">
      <div className="oc-present-modal-bar"><b>{present.verifier}모둠 발표</b><div className="oc-actions"><button type="button" onClick={() => window.print()}>인쇄</button><button type="button" className="oc-primary" onClick={() => setPresent(undefined)}>닫기</button></div></div>
      <Presentation big check={presentCheck} card={presentCard} questions={inquiryQuestions(presentCheck || undefined, presentCard || undefined, teacherFor(presentCard?.artifactId || 0))} />
    </div>}

    {printing === 'targets' && <div className="oc-print-cards" aria-hidden="true">{joseonModels.map(info => <TargetCard key={info.id} artifactId={info.id} />)}</div>}
    {printing === 'groups' && <div className="oc-print-cards" aria-hidden="true">{state.cards.map(item => item.data).filter(card => card.artifactId).sort((a, b) => a.group - b.group).map(card => <PrintCard key={card.group} code={code} card={card} />)}</div>}
  </>;
}

function GroupStatus({ group, card, cardItem, checks, cardOf, teacherFor, open, onToggle, onPresent }: {
  group: number; card?: GroupCard; cardItem?: OpenItem<GroupCard>; checks: OpenItem<Verification>[]; cardOf: (g: number) => GroupCard | undefined;
  teacherFor: (artifactId: number) => TeacherSet | undefined; open: boolean; onToggle: () => void; onPresent: (target: number) => void;
}) {
  const artifact = artifactById(card?.artifactId || 0);
  const problems = card ? cardProblems(card) : ['아직 카드를 저장하지 않았어요.'];
  const ready = card ? readyQuestions(card.questions).length : 0;
  const cardState = !card || !artifact ? 'none' : problems.length ? 'working' : 'done';
  const time = (value?: string) => value ? new Date(value).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '';
  return <article className={`oc-group is-${cardState}${open ? ' is-open' : ''}`}>
    <button type="button" className="oc-group-head" aria-expanded={open} onClick={onToggle}>
      <b>{group}모둠</b>
      <span className="oc-group-artifact">{artifact?.name || '유물 고르기 전'}</span>
      <span className={`oc-chip is-${cardState}`}>{cardState === 'done' ? '카드 완성' : cardState === 'working' ? '카드 만드는 중' : '대기'}</span>
    </button>
    <dl className="oc-group-facts">
      <div><dt>설명 점</dt><dd>{card?.points.length || 0}개</dd></div>
      <div><dt>OX 문제</dt><dd>{ready}개</dd></div>
      <div><dt>저장</dt><dd>{time(cardItem?.updatedAt) || '-'}</dd></div>
    </dl>
    {checks.length === 0 ? <p className="oc-group-check is-none">검증: 아직 시작 전</p> : checks.map(item => {
      const target = cardOf(item.data.target);
      const total = item.data.mode==='self'?2:inquiryQuestions(item.data,target,teacherFor(target?.artifactId || 0)).length;
      const progress = verifyProgress(item.data, total);
      return <div key={item.key} className="oc-group-check">
        <p><b>{total && progress.done === total ? '검증 완료' : '검증 중'} → {item.data.target}모둠 {artifactById(target?.artifactId || 0)?.name || ''}</b> <small>{time(item.updatedAt)}</small></p>
        <div className="oc-meter" aria-label={`완료 ${progress.done} / ${total}`}><span style={{ width: `${total ? (progress.done / total) * 100 : 0}%` }} /></div>
        <p className="oc-group-nums">자료 확인 {progress.done}/{total} · 판단 완료 {progress.done}<br /><span className="is-adopt">채택 {progress.adopt}</span> <span className="is-revise">수정 {progress.revise}</span> <span className="is-exclude">제외 {progress.exclude}</span></p>
        <button type="button" onClick={() => onPresent(item.data.target)}>발표 화면</button>
      </div>;
    })}
  </article>;
}

function GroupDetail({ group, card, checks, cardOf, teacherFor }: { group: number; card?: GroupCard; checks: OpenItem<Verification>[]; cardOf: (g: number) => GroupCard | undefined; teacherFor: (artifactId: number) => TeacherSet | undefined }) {
  const artifact = artifactById(card?.artifactId || 0);
  const problems = card ? cardProblems(card) : ['아직 카드를 저장하지 않았어요.'];
  return <section className="oc-panel" aria-label={`${group}모둠 자세히 보기`}>
    <h2>{group}모둠 자세히 보기</h2>
    <div className="oc-group-detail">
      <div>
        {card && artifact && <ArCard artifactId={card.artifactId} points={card.points} caption={`${group}모둠 카드${card.members ? ` · ${card.members}` : ''}`} />}
      </div>
      <div>
        {card && <ol className="oc-group-points">{card.points.map(point => <li key={point.id}><b>{point.title || '제목 없음'}</b> {point.text}</li>)}</ol>}
        {card && <><h3>만든 OX 문제</h3><ol className="oc-group-qs">{readyQuestions(card.questions).map(q => <li key={q.id}>“{q.statement}” <b>{q.answer}</b> <small>{q.explanation}</small></li>)}</ol></>}
        {problems.length > 0 && <p className="oc-help is-warn">남은 일: {problems.join(' ')}</p>}
        {checks.map(item => <div key={item.key} className="oc-group-verify">
          {item.data.notes&&<div><p>특징: {item.data.notes.feature}</p><p>쓰임: {item.data.notes.use}</p><p>생활에 준 도움: {item.data.notes.benefit}</p><p>출처: {item.data.notes.source}</p><p>배운 점: {item.data.notes.learned}</p><p>AI 확인이 필요한 까닭: {item.data.notes.caution}</p></div>}<h3>{item.data.mode==='self'?'우리 모둠 AI 문제':`${item.data.target}모둠 카드`} 검증 기록</h3>
          <p className="oc-help">AI 역할: {item.data.parts.role || '(아직 안 씀)'} · 상황: {item.data.parts.situation || '(아직 안 씀)'} · 답 방법: {item.data.parts.style || '(아직 안 씀)'}</p>
          <ol>{inquiryQuestions(item.data,cardOf(item.data.target), teacherFor(cardOf(item.data.target)?.artifactId || 0)).map(q => {
            const row = item.data.items.find(value => value.questionId === q.id);
            return <li key={q.id}><p>“{q.statement}” {q.source === 'teacher' && <span className="oc-badge is-teacher">선생님 출제</span>} → 풀이 <b>{row?.solved || '-'}</b> · 판단 <b className={`is-${row?.decision || 'none'}`}>{decisionLabel(row?.decision || '')}</b></p>
              {row?.why && <p className="oc-help">확인 자료: {row.why}</p>}{row?.aiAnswer && <p className="oc-help">AI: {row.aiAnswer}</p>}
              {row?.decision === 'revise' && <p className="oc-help">고친 문장: “{row.revised}” ({row.revisedAnswer || '?'})</p>}
              {row?.reason && <p className="oc-help">이유: {row.reason}</p>}
              {row?.explanation && <p className="oc-help">정답 해설: {row.explanation}</p>}
            </li>;
          })}</ol>
        </div>)}
      </div>
    </div>
  </section>;
}

function TeacherQuestions({ code, token, sets, cards }: { code: string; token: string; sets: OpenItem<TeacherSet>[]; cards: GroupCard[] }) {
  const [artifactId, setArtifactId] = useState(1);
  const server = sets.find(item => item.data.artifactId === artifactId);
  const save = useCallback((data: TeacherSet, version: number) => saveTeacherSet(code, token, data, version, TEACHER_PIN), [code, token]);
  const draft = useSyncedDraft<TeacherSet>({ draftKey: `${code}:teacher:${artifactId}`, server, blank: () => newTeacherSet(artifactId), check: isTeacherSet, save, canSave: data => data.artifactId === artifactId });
  const set = draft.data;
  const change = (id: string, next: Partial<OxQuestion>) => draft.update(current => ({ ...current, questions: current.questions.map(q => q.id === id ? { ...q, ...next } : q) }));
  const artifact = artifactById(artifactId)!;
  const using = cards.filter(card => card.artifactId === artifactId).map(card => card.group);
  return <section className="oc-panel oc-teacher-q" aria-labelledby="oc-tq">
    <h2 id="oc-tq">선생님 OX 문제 출제 <small>학생 화면에 ‘선생님 출제’로 표시돼요</small></h2>
    <div className="oc-artifacts is-compact">{ARTIFACTS.map(item => {
      const count = sets.find(value => value.data.artifactId === item.id)?.data.questions.filter(q => q.statement.trim()).length || 0;
      return <button key={item.id} type="button" aria-pressed={artifactId === item.id} onClick={() => setArtifactId(item.id)}><b>{item.name}</b><small>선생님 문제 {count}개</small></button>;
    })}</div>
    <p className="oc-help">{using.length ? `${using.join('·')}모둠이 ${artifact.name} 카드를 만들었어요. 이 카드를 검증하는 모둠에게 아래 문제가 함께 나와요.` : `아직 ${artifact.name} 카드를 만든 모둠이 없어요. 카드가 생기면 그 카드를 검증할 때 함께 나와요.`}</p>
    <details className="oc-look"><summary>{artifact.name} 참고 내용 (선생님용)</summary><p>{artifact.teacherNote}</p></details>
    <ol className="oc-questions">{set.questions.map((q, index) => <li key={q.id} className="oc-question is-teacher">
      <div className="oc-question-head"><b>선생님 {index + 1}번</b><span className="oc-badge is-teacher">선생님 출제</span><button type="button" className="oc-danger" onClick={() => draft.update(current => ({ ...current, questions: current.questions.filter(item => item.id !== q.id) }))}>빼기</button></div>
      <label className="oc-field">문장<textarea rows={2} maxLength={200} value={q.statement} placeholder={`예: ${artifact.name}은 비의 양을 재는 기구이다.`} onChange={event => change(q.id, { statement: event.target.value })} /></label>
      <div className="oc-ox-row"><span>정답</span>{(['O', 'X'] as const).map(value => <button key={value} type="button" className={`oc-ox oc-ox--${value}`} aria-pressed={q.answer === value} onClick={() => change(q.id, { answer: value })}>{value}</button>)}</div>
      <label className="oc-field">정답 해설<input maxLength={400} value={q.explanation} placeholder="학생이 정답을 확인할 때 보이는 설명" onChange={event => change(q.id, { explanation: event.target.value })} /></label>
    </li>)}</ol>
    <div className="oc-actions">
      {set.questions.length < MAX_TEACHER_QUESTIONS && <button type="button" onClick={() => draft.update(current => ({ ...current, questions: [...current.questions, newQuestion()] }))}>＋ {artifact.name} 문제 추가 ({set.questions.length}/{MAX_TEACHER_QUESTIONS})</button>}
      {draft.state === 'conflict' ? <><button type="button" onClick={draft.takeServer}>저장된 것 불러오기</button><button type="button" className="oc-primary" onClick={draft.keepMine}>이 화면 것으로 저장</button></>
        : <button type="button" className="oc-primary" disabled={draft.state === 'saving'} onClick={() => { void draft.saveNow(true); }}>저장</button>}
    </div>
    <p className={`oc-save-state is-${draft.state}`} role="status">{saveLabel(draft.state, draft.dirty, draft.savedAt)}{draft.message && ` · ${draft.message}`}</p>
  </section>;
}

/** The photo the AR camera looks for, printed whole and uncropped so it matches the compiled target. */
function TargetCard({ artifactId }: { artifactId: number }) {
  const artifact = artifactById(artifactId)!, photo = joseonModelFor(artifactId)?.photo;
  if (!photo) return null;
  return <article className="oc-print-card oc-target-card">
    <header><b>AR 인식 카드</b><span>{artifact.name}({artifact.hanja})</span></header>
    <img src={`${import.meta.env.BASE_URL}${photo.path}`} alt={`${artifact.name} 실물 사진`} />
    <p>‘AR로 보기’에서 이 사진 전체를 카메라에 비추면 사진 위에 입체 모형이 나타나요. 사진: {photo.author} · {photo.license}</p>
  </article>;
}

function PrintCard({ code, card }: { code: string; card: GroupCard }) {
  const artifact = artifactById(card.artifactId)!;
  const qr = encodeUrlQr(openClassUrl(code, `&view=look&group=${card.group}`));
  const photo = joseonModelFor(card.artifactId)?.photo;
  return <article className="oc-print-card">
    <header><b>{card.group}모둠 AR 카드</b><span>{artifact.name}({artifact.hanja})</span></header>
    {photo ? <figure className="oc-print-photo"><img src={`${import.meta.env.BASE_URL}${photo.path}`} alt={`${artifact.name} 실물 사진`} /><figcaption>사진: {photo.author} · {photo.license}</figcaption></figure>
      : <p className="oc-print-nophoto">{artifact.name} 실물 사진은 준비 중이에요. QR로 입체 모형을 보세요.</p>}
    <ol>{card.points.map(point => <li key={point.id}><b>{point.title}</b> {point.text}</li>)}</ol>
    <footer><svg viewBox={`0 0 ${qr.size} ${qr.size}`} shapeRendering="crispEdges"><rect width="100%" height="100%" fill="#fff" /><path d={qr.path} fill="#000" /></svg><p>QR을 찍으면 이 카드의 입체 모형과 설명을 AR로 볼 수 있어요.</p></footer>
  </article>;
}
