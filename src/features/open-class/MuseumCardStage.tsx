import { lazy, Suspense, useState, type ReactNode } from 'react';
import { usePresentationDialog } from './usePresentationDialog';
import type { GroupCard } from './model';
import { artifactModel, joseonPhotoLabel } from './ArCard';
import { GoryeoBackPhoto } from './GoryeoBackPhoto';
import { JoseonBackPhoto } from './JoseonBackPhoto';
import { artifactById } from './artifacts';
import { joseonModelFor } from '../../lib/ar/joseon/catalog';
import { goryeoArtifact, goryeoModel, goryeoPhoto } from '../goryeo/readyCards';
import './museum-card-stage.css';
const ModelView = lazy(() => import('../../components/HeritageModelView'));

export function MuseumCardStage({card, era, onClose, example=false, navigation, onBack, closeLabel='발표 닫기'}:{card:GroupCard;era:'goryeo'|'joseon';onClose:()=>void;example?:boolean;navigation?:ReactNode;onBack?:()=>void;closeLabel?:string}) {
 const [selected,setSelected]=useState(''); const root=usePresentationDialog(onClose);
 const item=era==='goryeo'?goryeoArtifact(card.artifactId):artifactById(card.artifactId);
 const name=era==='goryeo'?goryeoArtifact(card.artifactId)?.short:artifactById(card.artifactId)?.name;
 const model=era==='goryeo'?goryeoModel(card.artifactId):artifactModel(card.artifactId);
 const photo=era==='goryeo'?goryeoPhoto(card.artifactId):joseonModelFor(card.artifactId)?.photo;
 const path=photo?('texture' in photo ? photo.texture || photo.path : photo.path):'';
 const points=card.points.map(p=>({...p,photoPosition:[.5,.5] as [number,number]}));
 const active=points.find(p=>p.id===selected);
 const modelCredit=era==='goryeo'&&card.artifactId>=4?'국립중앙박물관 실물 3D 자료':'사진 참고 재현 · 확인되지 않은 부분은 추정';
 if(!item||!model)return null;
 return <section ref={root} className={`museum-card-stage${navigation?' has-navigation':''}`} role="dialog" aria-modal="true" aria-label={`${card.group}모둠 AR 카드 발표`}>
  <header className="museum-card-stage__header"><div><p>{example?'화면 예시 · 실제 수업에 저장되지 않음 · ':''}{era==='goryeo'?'고려':'조선'} 유물 전시실 · {card.group}모둠</p><h1>{name}</h1></div><div className="museum-card-stage__header-actions">{onBack&&<button type="button" onClick={onBack}>모둠 목록</button>}<button data-autofocus type="button" onClick={onClose}>{closeLabel}</button></div></header>
  {navigation}
  <div className="museum-card-stage__content"><div className="museum-card-stage__model"><div className="museum-card-stage__label">우리 모둠 AR 카드 <span>유물을 돌리고 번호를 눌러 보세요</span></div><p className="museum-card-stage__model-credit">{modelCredit}</p><Suspense fallback={<p>유물을 불러오는 중입니다…</p>}><ModelView observe bubbles fallbackImage={path ? `${import.meta.env.BASE_URL}${path}` : undefined} model={model} image="" points={points} selectedId={selected} onSelect={id=>setSelected(id===selected?'':id)} targetIndex={card.artifactId-1} eraId={era==='joseon'?'joseon':'three-kingdoms'} /></Suspense></div>
  <aside className="museum-card-stage__info">{path&&photo&&<figure><img src={`${import.meta.env.BASE_URL}${path}`} alt={`${name} 실물 또는 복원 사진`}/><figcaption>{era==='joseon'&&<>{joseonPhotoLabel(card.artifactId)} · </>}사진: <a href={photo.source} target="_blank" rel="noreferrer">{photo.author}</a> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a></figcaption></figure>}<GoryeoBackPhoto era={era} artifactId={card.artifactId}/><JoseonBackPhoto era={era} artifactId={card.artifactId}/><div className="museum-card-stage__notes"><p>우리 모둠의 설명</p><div className="museum-card-stage__buttons">{points.map((p,i)=><button key={p.id} type="button" aria-pressed={p.id===selected} onClick={()=>setSelected(p.id===selected?'':p.id)}>{i+1}</button>)}</div>{active?<div className="museum-card-stage__text"><h2>{active.title || '제목 없음'}</h2><p>{active.text || '아직 설명이 없습니다.'}</p></div>:<p className="museum-card-stage__hint">{points.length?'번호를 눌러 설명을 확인하세요.':'아직 작성한 설명이 없습니다.'}</p>}</div></aside></div>
 </section>;
}
