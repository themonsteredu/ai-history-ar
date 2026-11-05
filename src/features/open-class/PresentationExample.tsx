import { useState } from 'react';
import { MuseumCardStage } from './MuseumCardStage';
import { newSelfVerification, newVerifyItem, selfQuestions, type GroupCard } from './model';
import { Presentation } from './Presentation';
import './open-class.css';

const sample: GroupCard = { version:1, group:1, artifactId:3, members:'', questions:[], points:[
 {id:'example-1',position:[0,0.3,0],title:'경판',text:'나무판에 불교 경전을 새겼어요.'},
 {id:'example-2',position:[0.4,0.2,0],title:'인쇄',text:'새긴 경판을 이용해 경전을 찍었어요.'},
] };
const joseonSample: GroupCard = {...sample, artifactId:1, points:[
 {id:'example-1',position:[0,0.3,0],title:'빗물 받는 통',text:'빗물을 모아 비가 내린 양을 살폈어요.'},
 {id:'example-2',position:[0,-0.3,0],title:'받침',text:'통을 받침 위에 놓았어요.'},
]};
/** An isolated illustration of the real presentation component; it never joins or writes a class. */
export default function PresentationExample() {
 const params = new URLSearchParams(window.location.search);
 const requestedArtifact = Number(params.get('artifact'));
 const joseonArtifact = Number.isInteger(requestedArtifact) && requestedArtifact >= 1 && requestedArtifact <= 6 ? requestedArtifact : 1;
 const [era,setEra]=useState<'goryeo'|'joseon'>(params.get('era') === 'joseon' ? 'joseon' : 'goryeo'); const [open,setOpen]=useState(true);
 const quiz = params.get('quiz') === '1';
 const joseonArExample = joseonArtifact === 1 ? joseonSample : {...joseonSample, artifactId:joseonArtifact, points:[]};
 if(quiz) { const card = era==='goryeo'?sample:joseonSample; const check=newSelfVerification(1); const statements=era==='goryeo'?['팔만대장경은 불교 경전을 나무판에 새긴 것이다.','팔만대장경의 경판은 금속으로 만들었다.']:['측우기는 비가 내린 양을 재는 데 사용했다.','측우기는 바람의 방향을 재는 기구이다.']; check.selfQuestions=check.selfQuestions!.map((q,i)=>({...q,statement:statements[i],answer:i===0?'O':'X',explanation:i===0?'자료에서 확인할 수 있어요.':'자료에서 다르게 설명해요.'})); check.items=check.selfQuestions.map((q,i)=>({...newVerifyItem(q.id,'student'),solved:i===0?'O':'X',why:era==='goryeo'?'팔만대장경 역사신문':'측우기 역사신문',decision:'adopt',reason:'자료의 설명과 비교했습니다.',explanation:i===0?'자료에 적힌 내용과 일치합니다.':'자료에서 해당 설명이 틀렸음을 확인했습니다.'})); return <main className="oc-page page-width"><p className="oc-eyebrow">발표 화면 예시 · 실제 수업에 저장되지 않음</p><h1>퀴즈 발표 화면</h1><p>예시 문제입니다. 실제 수업에서는 모둠이 검증한 문제가 나옵니다.</p><div className="oc-actions"><button onClick={()=>setEra('goryeo')}>고려 예시</button><button onClick={()=>setEra('joseon')}>조선 예시</button></div><Presentation key={era} big check={check} card={card} questions={selfQuestions(check)} era={era} artifactName={era==='goryeo'?'팔만대장경':'측우기'}/></main>; }
 return <main className="oc-page page-width"><h1>AR 카드 발표 화면 예시</h1><p>아래 내용은 화면을 보여 주기 위한 예시입니다. 실제 수업에는 저장되지 않으며 학생들이 직접 카드를 만듭니다.</p><div className="oc-actions"><button onClick={()=>{setEra('goryeo');setOpen(true);}}>고려 발표 예시</button><button onClick={()=>{setEra('joseon');setOpen(true);}}>조선 발표 예시</button></div>{open&&<MuseumCardStage example key={era} card={era==='goryeo'?sample:joseonArExample} era={era} onClose={()=>setOpen(false)}/>}</main>;
}
