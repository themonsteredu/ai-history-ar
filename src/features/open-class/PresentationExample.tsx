import { useState } from 'react';
import { TeacherGroupDashboard } from './TeacherGroupDashboard';
import { MuseumCardStage } from './MuseumCardStage';
import { Presentation } from './Presentation';
import { newCard, newPoint, newSelfVerification, newVerifyItem, selfQuestions } from './model';
import './open-class.css';
const card = newCard(1, 1);
card.points = [{...newPoint([0,0,0]),title:'첫 번째 설명',text:'학생들이 쓴 설명입니다.'},{...newPoint([.2,.2,0]),title:'두 번째 설명',text:'두 번째 설명입니다.'}];
const check = newSelfVerification(1);
check.selfQuestions!.forEach((q,i)=>{q.statement=i===0?'첫 번째 OX 문제입니다.':'두 번째 OX 문제입니다.';q.answer=i===0?'O':'X';q.explanation='AI의 설명입니다.';});
check.items=check.selfQuestions!.map(q=>({...newVerifyItem(q.id,'student'),why:'교과서 12쪽',solved:q.answer,decision:'adopt',reason:'자료를 확인했습니다.'}));
export default function PresentationExample() {
 const [era,setEra]=useState<'goryeo'|'joseon'>('goryeo'),[mode,setMode]=useState<'card'|'quiz'|''>('');
 const item={key:'1',version:1,data:card,updatedAt:new Date().toISOString()},verified={key:'1:1',version:1,data:check,updatedAt:new Date().toISOString()};
 return <main className="oc-page page-width"><div className="oc-actions"><button onClick={()=>setEra('goryeo')}>고려</button><button onClick={()=>setEra('joseon')}>조선</button></div><section className="oc-panel"><TeacherGroupDashboard key={era} group={1} era={era} cardItem={item} checkItem={verified} onBack={()=>alert('모둠 목록')} onCardPresentation={()=>setMode('card')} onQuizPresentation={()=>setMode('quiz')}/></section>{mode==='card'&&<MuseumCardStage card={card} era={era} onClose={()=>setMode('')}/>}
 {mode==='quiz'&&<div className="oc-present-modal"><div className="oc-present-modal-bar"><button onClick={()=>setMode('')}>닫기</button></div><Presentation big check={check} card={card} questions={selfQuestions(check)} era={era}/></div>}</main>
}