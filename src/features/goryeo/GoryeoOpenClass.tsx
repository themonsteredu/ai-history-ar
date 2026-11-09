import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GroupStatus, LessonFlow } from '../open-class/OpenClassTeacher';
import { TeacherGroupDashboard } from '../open-class/TeacherGroupDashboard';
import { TeacherClassBoard } from '../open-class/TeacherClassBoard';
import { TeacherQuizMonitor } from '../open-class/TeacherQuizMonitor';
import { CardMaker } from '../open-class/CardMaker';
import { CardGallery } from '../open-class/CardGallery';
import { TeacherClassPicker } from '../open-class/TeacherClassPicker';
import { GROUP_CHOICES, groupCountKey, readGroupCount } from '../ar-studio/teacherRun';
import type { StudioSession } from '../ar-studio/api';
import { encodeUrlQr } from '../../lib/qr/classroomQr';
import { forgetOpenSession, readOpenSession, joinOpenLesson, loadState, saveCard, saveCheck, latestLoads, type OpenState } from '../open-class/api';
import { isGroupCard, isVerification, newCard, newSelfVerification, selfItemDone, selfQuestions, type GroupCard, type Verification } from '../open-class/model';
import { useSyncedDraft } from '../open-class/useSyncedDraft';
import { IntroNotes, Reflection, SelfQuizLab } from '../open-class/SelfInquiry';
import { Presentation } from '../open-class/Presentation';
import { MuseumBoard } from '../open-class/MuseumBoard';
import { MuseumCardStage } from '../open-class/MuseumCardStage';
import { TeacherArPresentation } from '../open-class/TeacherArPresentation';
import { readingsPackUrl } from '../open-class/HeritageReading';
import { OpenLessonMaterials } from '../open-class/OpenLessonMaterials';
import { artifacts } from './data';
import { GORYEO_TAG, goryeoArtifact, goryeoCode, goryeoModel, goryeoRoomSafe, isGoryeo } from './readyCards';
import '../open-class/open-class.css';
import './goryeo.css';
const ModelView=lazy(()=>import('../../components/HeritageModelView'));
const empty:OpenState={cards:[],checks:[],teacher:[]};
const goodCode=(code:string)=>/^\d{4,10}$/.test(code);
const displayCode=(code:string)=>code.slice(2);
type Tab='card'|'look'|'check'|'present'|'reflect';
const steps:{key:Tab;label:string;help:string}[]=[{key:'card',label:'AR 카드 만들기',help:'유물에 설명을 쓰고 저장'},{key:'look',label:'AR 카드 발표',help:'완성한 카드로 유물 소개'},{key:'check',label:'AI 문제 만들고 검증',help:'두 문제를 자료로 확인'},{key:'present',label:'퀴즈 발표',help:'친구들이 푼 뒤 정답과 근거 공개'},{key:'reflect',label:'배움 정리',help:'배운 점과 AI 정보를 확인하는 까닭'}];

export default function GoryeoOpenClass() {
 const [params,setParams]=useSearchParams(); const initialCode=params.get('code')||'';
 const [code,setCode]=useState(initialCode),[name,setName]=useState(''),[group,setGroup]=useState(1),[session,setSession]=useState<StudioSession|undefined>(()=>goodCode(initialCode)?readOpenSession(goryeoCode(initialCode)):undefined),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function join(){setBusy(true);setError('');try{setSession(await joinOpenLesson(goryeoCode(code),name.trim(),group));const next=new URLSearchParams(params);next.set('code',code);setParams(next);}catch(e){setError(e instanceof Error?e.message:'입장하지 못했어요.');}finally{setBusy(false);}}
 if(session)return <GoryeoRoom key={session.memberId} session={session} onLeave={()=>{forgetOpenSession(session.code);setSession(undefined);}}/>;
 return <main className="oc-page page-width"><p className="oc-eyebrow">고려시대 공개수업</p><h1>고려 유물 AR 탐구</h1><p>선생님이 알려 준 수업코드와 내 이름, 모둠을 입력하세요.</p><form className="oc-entry" onSubmit={e=>{e.preventDefault();if(goodCode(code)&&name.trim()&&!busy)void join();}}><label>수업코드<input inputMode="numeric" maxLength={10} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} placeholder="숫자 4~10자리"/></label><label>내 이름<input maxLength={30} value={name} onChange={e=>setName(e.target.value)} placeholder="이름 또는 별명"/></label><label>내 모둠<select value={group} onChange={e=>setGroup(Number(e.target.value))}>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}모둠</option>)}</select></label><button className="oc-big" type="submit" disabled={busy||!goodCode(code)||!name.trim()}>{busy?'들어가는 중…':'수업 들어가기'}</button></form>{error&&<p role="alert">{error}</p>}<OpenLessonMaterials era="goryeo"/><p><a href={`${import.meta.env.BASE_URL}goryeo/sample`}>이전 고려 유물 샘플 보기</a></p></main>;
}

function useRoom(session:StudioSession) {
 const [state,setState]=useState<OpenState>(empty),[loaded,setLoaded]=useState(false),[error,setError]=useState(''),[updatedAt,setUpdatedAt]=useState<number>();
 const [loads]=useState(()=>latestLoads());
 const refresh=useCallback(async()=>{if(document.visibilityState==='hidden')return;const result=await loads(()=>loadState(session.code,session.token));if(!result)return;if(result.ok){setState(result.value);setLoaded(true);setUpdatedAt(Date.now());setError(goryeoRoomSafe(result.value)?'':'다른 수업 기록이 있는 코드입니다. 선생님과 새로운 코드를 정해 주세요.');}else setError(result.error instanceof Error?result.error.message:'수업 기록을 불러오지 못했어요.');},[loads,session.code,session.token]);
 useEffect(()=>{void refresh();const timer=window.setInterval(()=>void refresh(),6000);return()=>window.clearInterval(timer);},[refresh]);
 return {state,loaded,error,updatedAt,refresh,safe:loaded&&goryeoRoomSafe(state)};
}
function GoryeoRoom({session,onLeave}:{session:StudioSession;onLeave:()=>void}) {
 const {code,token,group}=session;const {state,loaded,error,safe}=useRoom(session);const [tab,setTab]=useState<Tab>('card');
 const saveMyCard=useCallback((data:GroupCard,version:number)=>saveCard(code,token,data,version),[code,token]);
 const saveMyCheck=useCallback((data:Verification,version:number)=>saveCheck(code,token,{...data,lesson:GORYEO_TAG} as Verification,version),[code,token]);
 const card=useSyncedDraft<GroupCard>({draftKey:`goryeo:${code}:card:${group}`,server:state.cards.find(x=>x.key===String(group)),blank:()=>({...newCard(group),lesson:GORYEO_TAG} as GroupCard),check:(v):v is GroupCard=>isGroupCard(v)&&isGoryeo(v),save:saveMyCard,canSave:d=>safe&&isGoryeo(d)&&d.artifactId>0});
 const draft=useSyncedDraft<Verification>({draftKey:`goryeo:${code}:verify:${group}`,server:state.checks.find(x=>x.key===`${group}:${group}`),blank:()=>({...newSelfVerification(group),lesson:GORYEO_TAG} as Verification),check:(v):v is Verification=>isVerification(v)&&isGoryeo(v),save:saveMyCheck,maxWait:10000,canSave:d=>safe&&isGoryeo(d)});
 const artifact=goryeoArtifact(card.data.artifactId);
 if(loaded&&!safe)return <main className="oc-page page-width"><p role="alert">{error}</p><button onClick={onLeave}>다른 수업코드 입력</button></main>;
 return <main className="oc-page page-width"><header className="oc-head"><div><p className="oc-eyebrow">고려시대 공개수업 · 수업코드 {displayCode(code)}</p><h1>고려 유물 AR 탐구 · AI 퀴즈 검증</h1></div><p className="oc-me"><b>{group}모둠</b> · {session.name}<button onClick={onLeave}>다시 입장</button></p></header>
 {error&&<p className="oc-notice" role="alert">{error}</p>}{!loaded&&<p role="status">우리 반 기록을 불러오는 중…</p>}<div className="oc-actions"><a className="oc-primary" href={`${import.meta.env.BASE_URL}goryeo-ar-cards.html`} target="_blank" rel="noopener noreferrer">AR 인식 카드 인쇄</a><a href={`${import.meta.env.BASE_URL}downloads/goryeo/open-class/student-worksheet.pdf`} download>수업 활동지 PDF</a><a href={`${import.meta.env.BASE_URL}downloads/goryeo/open-class/group-presentation-notes.pdf`} download>모둠 발표 듣기 활동지</a></div><details className="oc-panel"><summary>수업 자료 모아보기</summary><OpenLessonMaterials era="goryeo"/></details><nav className="oc-tabs" aria-label="오늘 할 일">{steps.map((s,i)=><button key={s.key} aria-pressed={tab===s.key} onClick={()=>setTab(s.key)}><b>{i+1}</b><span>{s.label}</span><small>{s.help}</small></button>)}</nav>
 {tab==='card'&&<CardMaker era="goryeo" draft={card} taken={new Map(state.cards.map(item=>[item.data.artifactId,state.cards.filter(other=>other.data.artifactId===item.data.artifactId).map(other=>other.data.group)]))} hasVerification={(draft.data.selfQuestions||[]).some(q=>q.statement.trim())}/>}
 {tab==='look'&&<><IntroNotes era="goryeo" draft={draft} card={card.data}/><details className="oc-panel"><summary>다른 모둠 AR 카드 관찰</summary><CardGallery era="goryeo" cards={state.cards} myGroup={group}/></details></>}
 {tab==='check'&&!artifact&&<p className="oc-empty">먼저 AR 카드를 만들어 주세요.</p>}
 {tab==='check'&&artifact&&<SelfQuizLab draft={draft} card={card.data} artifactName={artifact.short} era="goryeo"/>}
 {tab==='present'&&artifact&&<Presentation check={draft.data} card={card.data} questions={selfQuestions(draft.data)} artifactName={artifact.short} era="goryeo"/>}
 {tab==='reflect'&&<Reflection era="goryeo" draft={draft}/>}
 <nav className="oc-actions" aria-label="활동 이동"><button type="button" disabled={tab==='card'} onClick={()=>{const index=steps.findIndex(step=>step.key===tab);if(index>0)setTab(steps[index-1].key);}}>← 이전 활동</button><button type="button" disabled={tab==='reflect'} onClick={()=>{const index=steps.findIndex(step=>step.key===tab);if(index>=0&&index<steps.length-1)setTab(steps[index+1].key);}}>다음 활동 →</button></nav></main>;
}
export function GoryeoTeacher() {
 const [code,setCode]=useState(''),[session,setSession]=useState<StudioSession>(),[count,setCount]=useState(6),[error,setError]=useState('');
 useEffect(()=>setCount(readGroupCount(window.localStorage)),[]);
 useEffect(()=>{if(!code)return;let active=true;setSession(undefined);setError('');void joinOpenLesson(goryeoCode(code),'선생님',1).then(next=>{if(active)setSession(next);}).catch(e=>{if(active)setError(e instanceof Error?e.message:'수업을 열지 못했어요.');});return()=>{active=false;};},[code]);
 function changeCount(value:number){setCount(value);try{window.localStorage.setItem(groupCountKey,String(value));}catch{/* keep for this visit */}}
 return <div className="oc-page oc-teacher page-width"><header className="oc-head"><div><p className="oc-eyebrow">선생님 화면 · 고려시대 공개수업</p><h1>{code?`수업코드 ${code}`:'고려 유물 AR 카드'}</h1></div></header><OpenLessonMaterials era="goryeo"/><TeacherClassPicker era="goryeo" code={code} onSelect={setCode}/>{error&&<p role="alert">{error}</p>}{session?<GoryeoTeacherRoom key={session.code} session={session} count={count} onCount={changeCount} onLeave={()=>{setCode('');setSession(undefined);}}/>:code&&!error?<p role="status">수업 현황을 불러오는 중…</p>:<p className="oc-empty">위에서 반을 등록하거나 누르면 QR·모둠 현황이 나와요.</p>}</div>;
}
function GoryeoTeacherRoom({session,count,onCount,onLeave}:{session:StudioSession;count:number;onCount:(value:number)=>void;onLeave:()=>void}) {
 const [classBoard,setClassBoard]=useState(false);
 const [quizMonitor,setQuizMonitor]=useState(false);
 const {state,loaded,error,updatedAt,safe,refresh}=useRoom(session);const [board,setBoard]=useState(false),[present,setPresent]=useState<number>(),[openGroup,setOpenGroup]=useState<number>(),[presentCard,setPresentCard]=useState<number | null>();
 const cardOf=(group:number)=>state.cards.find(x=>x.data.group===group)?.data; const teacherFor=()=>undefined;
 const url=`${window.location.origin}${import.meta.env.BASE_URL}goryeo?code=${encodeURIComponent(displayCode(session.code))}`;const qr=encodeUrlQr(url);const check=state.checks.find(x=>x.key===`${present}:${present}`)?.data;const card=state.cards.find(x=>x.data.group===present)?.data;const artifact=card?goryeoArtifact(card.artifactId):undefined;
 const questions=check?selfQuestions(check).filter(q=>{const item=check.items.find(i=>i.questionId===q.id);return item&&item.decision!=='exclude'&&selfItemDone(item);}).slice(0,2):[];
 if(loaded&&!safe)return <div className="oc-page page-width"><p role="alert">{error}</p><button onClick={onLeave}>다른 수업코드 선택</button></div>;
 return <div className="oc-page oc-teacher page-width"><header className="oc-head"><div><p className="oc-eyebrow">선생님 화면 · 고려 유물 수업</p><h1>수업코드 {displayCode(session.code)}</h1></div><button onClick={onLeave}>수업 바꾸기</button></header>{error&&<p role="alert">{error}</p>}<section className="oc-ar-launcher" aria-label="수업 확인과 발표"><h2>수업 확인과 발표</h2><div className="oc-actions"><button type="button" className="oc-primary" onClick={()=>setPresentCard(null)}>AR 카드 발표 화면</button><button type="button" onClick={()=>setQuizMonitor(true)}>OX 문제 작성 확인</button></div></section><div className="oc-teacher-top"><section className="oc-panel oc-qr"><h2>학생 입장 QR</h2><svg role="img" aria-label="고려 유물 수업 입장 QR" viewBox={`0 0 ${qr.size} ${qr.size}`} shapeRendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d={qr.path} fill="#000"/></svg><p>수업코드 <b>{displayCode(session.code)}</b></p><a href={url}>{url}</a></section><LessonFlow era="goryeo"/></div><section className="oc-panel"><h2>고려 AR 인식 카드</h2><p><a className="oc-primary" href={`${import.meta.env.BASE_URL}goryeo-ar-cards.html`} target="_blank" rel="noopener noreferrer">AR 인식 카드 6종 인쇄</a></p><p><a href={readingsPackUrl("goryeo")} target="_blank" rel="noopener noreferrer">고려 유물 읽기 자료 6종 인쇄</a></p><p>필요한 카드를 내려받아 인쇄하면 학생들이 카메라로 볼 수 있어요.</p><div className="oc-actions">{artifacts.map(a=><a key={a.id} href={`${import.meta.env.BASE_URL}goryeo-ar-cards.html?card=${a.id}`} target="_blank" rel="noopener noreferrer">{a.short} 카드 인쇄</a>)}</div></section><section className="oc-panel" aria-label="모둠 현황">{openGroup ? <TeacherGroupDashboard key={openGroup} group={openGroup} era="goryeo" cardItem={state.cards.find(item=>item.data.group===openGroup)} checkItem={state.checks.find(item=>item.data.mode==='self'&&item.data.verifier===openGroup&&item.data.target===openGroup)} onBack={()=>setOpenGroup(undefined)} onCardPresentation={()=>setPresentCard(openGroup)} onQuizPresentation={()=>setPresent(openGroup)}/> : <><div className="oc-board-head"><h2>모둠 현황 <small>6초마다 새로 확인</small></h2><div className="oc-actions"><button type="button" className="oc-primary" disabled={!safe} onClick={()=>setPresentCard(null)}>AR 카드 발표 화면</button><button type="button" disabled={!safe} onClick={()=>setClassBoard(true)}>전체 모둠 내용 보기</button><button type="button" disabled={!safe} onClick={()=>setBoard(true)}>역사박물관 칠판 화면</button><label className="oc-inline">모둠 수<select value={count} onChange={e=>onCount(Number(e.target.value))}>{GROUP_CHOICES.map(n=><option key={n} value={n}>{n}모둠</option>)}</select></label></div></div><div className="oc-board">{Array.from({length:count},(_,i)=>i+1).map(group=><GroupStatus era="goryeo" key={group} group={group} card={cardOf(group)} cardItem={state.cards.find(x=>x.data.group===group)} checks={state.checks.filter(x=>x.data.verifier===group)} cardOf={cardOf} teacherFor={teacherFor} open={openGroup===group} onToggle={()=>setOpenGroup(value=>value===group?undefined:group)} onCardPresentation={()=>setPresentCard(group)} onPresent={()=>setPresent(group)}/>)}</div><p className="oc-help">모둠을 누르면 카드와 퀴즈의 각 활동을 볼 수 있어요.</p></>}</section>{presentCard!==undefined&&<TeacherArPresentation era="goryeo" code={displayCode(session.code)} groupCount={count} cards={state.cards.map(item=>item.data)} updatedAt={updatedAt} error={error} initialGroup={presentCard??undefined} onClose={()=>setPresentCard(undefined)}/>}
 {quizMonitor&&<TeacherQuizMonitor era="goryeo" code={displayCode(session.code)} groupCount={count} state={state} updatedAt={updatedAt} error={error} onRefresh={refresh} onClose={()=>setQuizMonitor(false)}/>}
 {classBoard&&<TeacherClassBoard code={displayCode(session.code)} groupCount={count} state={state} updatedAt={updatedAt} error={error} era="goryeo" onClose={()=>setClassBoard(false)} onPresentCard={group=>{setClassBoard(false);setPresentCard(group);}} onPresentQuiz={group=>{setClassBoard(false);setPresent(group);}}/>}
 {board&&!present&&<MuseumBoard code={displayCode(session.code)} groupCount={count} state={state} updatedAt={updatedAt} error={error} era="goryeo" onClose={()=>setBoard(false)} onPresent={setPresent}/>}{present&&<div className="oc-present-modal" role="dialog" aria-modal="true" aria-label="발표 화면"><div className="oc-present-modal-bar"><b>{present}모둠 발표</b><button onClick={()=>setPresent(undefined)}>닫기</button></div><Presentation big teacherReview check={check} card={card} questions={questions} artifactName={artifact?.short} era="goryeo"/></div>}</div>;
}

export function TeacherGoryeoCards({cards,count}:{cards:GroupCard[];count:number}) {
 const [expanded,setExpanded]=useState<number>();
 const [selected,setSelected]=useState('');
 const [presentCard,setPresentCard]=useState<number>();
 return <section className="oc-panel" aria-label="모둠별 AR 카드"><h2>모둠별 AR 카드</h2><p>모둠을 선택하면 학생들이 저장한 유물과 설명을 확인하고 발표 화면으로 보여줄 수 있어요.</p><p><a href={`${import.meta.env.BASE_URL}downloads/goryeo/open-class/group-presentation-notes.pdf`} download>모둠 발표 듣기 활동지 내려받기</a></p><div className="oc-artifacts">{Array.from({length:count},(_,index)=>{const group=index+1;const card=cards.find(c=>c.group===group);const artifact=card&&goryeoArtifact(card.artifactId);return <button type="button" key={group} aria-pressed={expanded===group} onClick={()=>{setExpanded(expanded===group?undefined:group);setSelected('');}}><b>{group}모둠</b><small>{artifact?.short || '카드 작성 전'} · {card?.points.length || 0}개 설명</small></button>})}</div>{expanded!==undefined&&(()=>{const card=cards.find(c=>c.group===expanded);const artifact=card&&goryeoArtifact(card.artifactId);if(!card||!artifact)return <p role="status">{expanded}모둠이 아직 카드를 저장하지 않았어요.</p>;const points=card.points.map(p=>({...p,photoPosition:[.5,.5] as [number,number]}));const point=points.find(p=>p.id===selected);return <div className="oc-panel"><h3>{expanded}모둠 · {artifact.short}</h3><Suspense fallback={<p>유물을 불러와요…</p>}><ModelView bubbles model={goryeoModel(card.artifactId)} image="" points={points} selectedId={selected} onSelect={setSelected} targetIndex={card.artifactId-1}/></Suspense><div className="oc-actions">{points.map((p,i)=><button type="button" key={p.id} aria-pressed={selected===p.id} onClick={()=>setSelected(selected===p.id?'':p.id)}>{i+1}번 {p.title || '제목 없음'}</button>)}</div>{point&&<p><b>{point.title}</b> {point.text}</p>}{points.length===0&&<p>아직 작성한 설명이 없어요.</p>}<div className="oc-actions"><button type="button" className="oc-primary" onClick={()=>setPresentCard(card.group)}>박물관 발표 화면</button><button type="button" onClick={()=>{setExpanded(undefined);setSelected('');}}>모둠 목록으로 돌아가기</button></div></div>})()}{presentCard!==undefined&&cards.find(c=>c.group===presentCard)&&<MuseumCardStage card={cards.find(c=>c.group===presentCard)!} era="goryeo" onClose={()=>setPresentCard(undefined)}/>}</section>;
}
