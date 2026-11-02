import { useState } from 'react';
import { ArCard, ArCameraView } from './ArCard';
import { HeritageReading } from './HeritageReading';
import { ARTIFACTS, artifactById } from './artifacts';
import { saveLabel, type useSyncedDraft } from './useSyncedDraft';
import type { CardPoint, GroupCard } from './model';

const descriptions: Record<number, [string,string,string]> = {
  1:['측우기는 비가 얼마나 왔는지 재는 기구예요.','쇠로 만든 그릇에 빗물을 받아 자로 깊이를 쟀어요.','각 지역의 비를 기록해 농사에 필요한 정보를 얻었어요.'],
  2:['자격루는 스스로 시각을 알려 주는 물시계예요.','물이 흐르면서 장치가 움직여 종과 북 등으로 시간을 알렸어요.','사람들이 정해진 시각에 맞춰 일을 할 수 있게 도왔어요.'],
  3:['간의는 해와 별의 위치를 살피는 천문 기구예요.','둥근 고리와 관측 장치를 이용해 하늘을 관측했어요.','천체의 움직임을 살펴 시간과 달력을 연구하는 데 도움을 주었어요.'],
  4:['앙부일구는 솥 모양의 해시계예요.','바늘의 그림자가 가리키는 선으로 시각과 절기를 살폈어요.','길가에도 설치해 백성들이 시각을 알 수 있도록 했어요.'],
  5:['혼천의는 해와 달, 별의 위치와 움직임을 살피는 기구예요.','여러 겹의 둥근 고리를 이용해 하늘의 움직임을 나타냈어요.','하늘을 관측하고 달력을 연구하는 데 도움을 주었어요.'],
  6:['농사직설은 조선 세종 때 펴낸 농사책이에요.','지방 농부들의 경험을 모아 우리 땅에 맞는 농사법을 정리했어요.','농사에 필요한 지식을 널리 전하는 데 도움을 주었어요.'],
};
const places: [number,number,number][] = [[-.24,.7,.18],[.25,.45,.2],[-.15,.2,.18]];
export function readyJoseonPoints(id: number): CardPoint[] {
  const text=descriptions[id]; if(!text) return [];
  return text.map((value,i)=>({id:`ready-${id}-${i+1}`,title:['유물 소개','어떻게 사용했을까?','어떤 도움을 주었을까?'][i],text:value,position:places[i]}));
}
type Draft = ReturnType<typeof useSyncedDraft<GroupCard>>;
export function ReadyJoseonCards({draft,taken,hasVerification=false}:{draft:Draft;taken:Map<number,number[]>;hasVerification?:boolean}) {
 const card=draft.data, artifact=artifactById(card.artifactId); const [ar,setAr]=useState(false);
 const choose=(id:number)=>{if(card.artifactId===id && card.points.length===3 && card.points.every(p=>p.id.startsWith(`ready-${id}-`)))return;
   if(card.points.length && (hasVerification || card.questions.some(q=>q.statement.trim()))){window.alert('이미 작성한 AI 문제와 검증 기록이 있어 유물을 바꿀 수 없어요. 기존 기록을 확인하거나 다른 수업코드로 새로 시작해 주세요.');return;}
   if(card.points.length && !window.confirm('다른 완성 카드를 선택하면 현재 카드의 설명이 바뀝니다. 계속할까요?'))return;
   draft.update(current=>({...current,artifactId:id,points:readyJoseonPoints(id),questions:current.questions.map(q=>({...q,pointId:''}))}));};
 return <><section className="oc-panel"><h2>완성된 AR 카드 고르기</h2><p>우리 모둠 유물을 선택하면 미리 준비된 설명 3개가 함께 열려요. 직접 만들지 않아도 됩니다.</p><div className="oc-artifacts">{ARTIFACTS.map(item=><button type="button" key={item.id} aria-pressed={card.artifactId===item.id} onClick={()=>choose(item.id)}><b>{item.name}</b><small>{item.kind}</small>{(taken.get(item.id)||[]).some(n=>n!==card.group)&&<em>다른 모둠도 골랐어요</em>}</button>)}</div></section>
 {artifact&&<section className="oc-panel"><h2>{artifact.name} 완성 카드</h2><p>번호를 눌러 미리 준비된 설명을 살펴보세요.</p><ArCard artifactId={card.artifactId} points={card.points} /><button type="button" onClick={()=>setAr(true)}>이 카드 AR로 보기</button><ol>{card.points.map(point=><li key={point.id}><b>{point.title}</b> {point.text}</li>)}</ol><HeritageReading era="joseon" id={card.artifactId}/></section>}
 <section className="oc-save"><p role="status">{saveLabel(draft.state,draft.dirty,draft.savedAt)} {draft.message}</p>{draft.state==='conflict'?<div className="oc-actions"><button onClick={draft.takeServer}>저장된 카드 불러오기</button><button onClick={draft.keepMine}>이 카드로 저장</button></div>:<button disabled={draft.state==='saving'||!artifact} onClick={()=>void draft.saveNow(true)}>지금 우리 반에 저장</button>}</section>{ar&&artifact&&<ArCameraView artifactId={card.artifactId} points={card.points} title={artifact.name} onClose={()=>setAr(false)}/>}</>;
}
