import { useState } from 'react';
import { MuseumCardStage } from './MuseumCardStage';
import type { GroupCard } from './model';

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
 const [era,setEra]=useState<'goryeo'|'joseon'>('goryeo'); const [open,setOpen]=useState(true);
 return <main className="oc-page page-width"><h1>AR 카드 발표 화면 예시</h1><p>아래 내용은 화면을 보여 주기 위한 예시입니다. 실제 수업에는 저장되지 않으며 학생들이 직접 카드를 만듭니다.</p><div className="oc-actions"><button onClick={()=>{setEra('goryeo');setOpen(true);}}>고려 발표 예시</button><button onClick={()=>{setEra('joseon');setOpen(true);}}>조선 발표 예시</button></div>{open&&<MuseumCardStage example key={era} card={era==='goryeo'?sample:joseonSample} era={era} onClose={()=>setOpen(false)}/>}</main>;
}
