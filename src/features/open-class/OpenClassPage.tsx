import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { StudioSession } from '../ar-studio/api';
import { forgetOpenSession, joinOpenLesson, latestLoads, loadState, readOpenSession, saveCard, saveCheck, type OpenState } from './api';

import { CardGallery } from './CardGallery';
import { CardMaker } from './CardMaker';
import { LessonPrep } from './LessonPrep';
import { isGroupCard, isVerification, newCard, newSelfVerification, selfQuestions, type GroupCard, type Verification } from './model';
import { Presentation } from './Presentation';
import { useSyncedDraft } from './useSyncedDraft';
import { IntroNotes, SelfQuizLab, Reflection, worksheetUrl } from './SelfInquiry';
import './open-class.css';

type View = 'make' | 'look' | 'check' | 'present' | 'reflect';
const VIEWS: { id: View; label: string; help: string }[] = [
 {id:'look',label:'AR 카드 발표',help:'사전에 만든 카드로 쓰임과 도움 소개'},
 {id:'check',label:'AI 문제 만들고 검증',help:'우리 모둠 문제 2개를 자료로 확인'},
 {id:'present',label:'퀴즈 발표',help:'친구들이 푼 뒤 정답과 근거 공개'},
 {id:'reflect',label:'배움 정리',help:'배운 점과 AI 정보를 확인하는 까닭'},
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
    <p><a href={worksheetUrl} download>공개수업 활동지 PDF</a> · AR 카드는 공개수업 전에 제작합니다.</p><LessonPrep page="student" />
    <p className="oc-foot"><Link to="/joseon">조선시대 수업으로 돌아가기</Link></p>
  </main>;

  return <Lesson key={`${live.code}:${live.memberId}`} session={live} onLeave={() => { forgetOpenSession(live.code); setSession(undefined); }} />;
}

function Lesson({ session, onLeave }: { session: StudioSession; onLeave: () => void }) {
 const [params,setParams]=useSearchParams();const view=(params.get('view')==='make'?'make':VIEWS.some(v=>v.id===params.get('view'))?params.get('view'):'look') as View;
 const {code,token,group}=session;const [state,setState]=useState<OpenState>(emptyState),[loaded,setLoaded]=useState(false),[error,setError]=useState('');
 const [loads]=useState(()=>latestLoads());
 const refresh=useCallback(async()=>{if(document.visibilityState==='hidden')return;const result=await loads(()=>loadState(code,token));if(!result)return;if(result.ok){setState(result.value);setLoaded(true);setError('');}else setError(result.error instanceof Error?result.error.message:'수업 기록을 불러오지 못했어요.');},[code,token,loads]);
 useEffect(()=>{void refresh();const tick=()=>void refresh();const timer=window.setInterval(tick,6000);window.addEventListener('online',tick);return()=>{clearInterval(timer);window.removeEventListener('online',tick);};},[refresh]);
 const go=(next:View)=>{const p=new URLSearchParams(params);p.set('view',next);p.delete('group');setParams(p);window.scrollTo({top:0});};
 const saveMyCard=useCallback((data:GroupCard,version:number)=>saveCard(code,token,data,version),[code,token]);
 const cardDraft=useSyncedDraft<GroupCard>({draftKey:`${code}:card:${group}`,server:state.cards.find(i=>i.key===String(group)),blank:()=>newCard(group),check:isGroupCard,save:saveMyCard,canSave:d=>loaded&&d.artifactId>0&&d.group===group});
 const saveMyCheck=useCallback((data:Verification,version:number)=>saveCheck(code,token,data,version),[code,token]);
 const checkDraft=useSyncedDraft<Verification>({draftKey:`${code}:verify:${group}:${group}`,server:state.checks.find(i=>i.key===`${group}:${group}`),blank:()=>newSelfVerification(group),check:isVerification,save:saveMyCheck,canSave:d=>loaded&&d.mode==='self'&&d.verifier===group&&d.target===group});
 const taken=new Map<number,number[]>();state.cards.forEach(i=>taken.set(i.data.artifactId,[...(taken.get(i.data.artifactId)||[]),i.data.group]));
 return <main className="oc-page page-width"><header className="oc-head"><div><p className="oc-eyebrow">조선시대 공개수업 · 수업코드 {code}</p><h1>조선 전기 과학 기술 탐험 · AI 퀴즈 검증</h1></div><p className="oc-me"><b>{group}모둠</b> · {session.name}<button onClick={onLeave}>다시 입장</button></p></header>
 <div className="oc-actions"><button aria-pressed={view==='make'} onClick={()=>go('make')}>사전 준비 · AR 카드 제작</button><a href={worksheetUrl} download>공개수업 활동지 PDF</a></div><LessonPrep page="student"/>
 <nav className="oc-tabs" aria-label="오늘 할 일">{VIEWS.map((v,i)=><button key={v.id} aria-pressed={view===v.id} onClick={()=>go(v.id)}><b>{i+1}</b><span>{v.label}</span><small>{v.help}</small></button>)}</nav>
 {error&&<p role="alert" className="oc-notice">{error}</p>}{!loaded&&<p role="status">우리 반 기록을 불러오는 중…</p>}
 {view==='make'&&<><p className="oc-help">AR 카드는 사전에 준비해요. 공개수업 당일에는 첫 번째 ‘AR 카드 발표’부터 시작합니다. 문제는 두 번째 단계에서 AI에게 받아요.</p><CardMaker draft={cardDraft} taken={taken}/></>}
 {view==='look'&&<><IntroNotes draft={checkDraft} card={cardDraft.data}/><details className="oc-panel"><summary>다른 모둠 AR 카드 관찰</summary><CardGallery cards={state.cards} myGroup={group} initialGroup={Number(params.get('group'))||undefined}/></details></>}
 {view==='check'&&<SelfQuizLab draft={checkDraft} card={cardDraft.data}/>}
 {view==='present'&&<Presentation check={checkDraft.data} card={cardDraft.data} questions={selfQuestions(checkDraft.data)}/>}
 {view==='reflect'&&<Reflection draft={checkDraft}/>}
 </main>;
}
