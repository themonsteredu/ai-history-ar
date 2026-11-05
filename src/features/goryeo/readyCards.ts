import { artifacts } from './data';
import { photos } from './photos';
import type { GroupCard, Verification } from '../open-class/model';
import type { OpenState } from '../open-class/api';
import type { ExhibitModel } from '../../lib/ar/exhibit';
export const GORYEO_TAG = 'goryeo-open-v2';
export const goryeoArtifact = (id:number) => artifacts[id-1];
const assets: Record<string, ExhibitModel['asset']> = {buddha:'goryeo-buddha',type:'goryeo-type',tripitaka:'goryeo-tripitaka',vase:'goryeo-vase',incense:'goryeo-incense',lacquer:'goryeo-lacquer'};
export function goryeoCard(group:number,id:number): GroupCard {
 const item=goryeoArtifact(id); if(!item) throw new Error('유물을 다시 골라 주세요.');
 return {version:1,group,artifactId:id,members:'',questions:[],points:[], lesson:GORYEO_TAG} as GroupCard;
}
export function goryeoModel(id:number):ExhibitModel|undefined {
 const item=goryeoArtifact(id);if(!item)return;
 return {format:'glb',asset:assets[item.id],data:'',name:item.name,credit:['buddha','type','tripitaka'].includes(item.id)?'사진 참고 학습용 3D 재현 · 확인되지 않은 부분은 추정':'국립중앙박물관 3D 데이터 · 공공누리 제1유형',source:photos[item.id].source,rotation:[0,0,0]};
}
export const goryeoCode = (displayCode:string) => `89${displayCode}`;
export const isGoryeo = (value: GroupCard|Verification) => (value as {lesson?:string}).lesson===GORYEO_TAG;
/** Reject foreign records before any edit to prevent overwriting other lessons using the same backing code. */
export const goryeoRoomSafe = (state:OpenState) => state.cards.every(x=>isGoryeo(x.data)) && state.checks.every(x=>isGoryeo(x.data)) && state.teacher.length===0;
export const goryeoPhoto = (id:number) => {const item=goryeoArtifact(id); if(!item)return; const photo=photos[item.id];return {name:item.short,path:`images/goryeo-photos/${item.id}.jpg`,author:photo.credit,source:photo.source,license:photo.license,licenseUrl:photo.licenseUrl};};
