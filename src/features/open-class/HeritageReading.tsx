import readings from './heritage-reading.json';
import { joseonModelFor } from '../../lib/ar/joseon/catalog';
import { goryeoPhoto } from '../goryeo/readyCards';
import './heritage-reading.css';
export type ReadingEra = 'goryeo' | 'joseon';
export function readingFor(era:ReadingEra,id:number) { return readings[era].find(item=>item.id===id); }
export function readingUrl(era:ReadingEra,id:number) { const reading=readingFor(era,id); return reading ? `${import.meta.env.BASE_URL}downloads/${era}/open-class/readings/${reading.id}-${reading.key}.pdf` : ''; }
export const readingsPackUrl = (era:ReadingEra) => `${import.meta.env.BASE_URL}downloads/${era}/open-class/readings/all-readings.pdf`;
export function HeritageReading({era,id}:{era:ReadingEra;id:number}) {
 const item=readingFor(era,id); if(!item)return null;
 const photo=era==='goryeo'?goryeoPhoto(id):joseonModelFor(id)?.photo;
 const path=photo?('texture' in photo ? photo.texture || photo.path : photo.path):'';
 return <details className="heritage-reading"><summary>{item.name} 역사신문 읽기</summary><article className="heritage-reading__body"><div className="heritage-reading__masthead"><b>역사 탐구 신문</b><span>{era==='goryeo'?'고려시대':'조선시대'} · 유물 이야기</span></div><div className="heritage-reading__heading"><div><h3>{item.name}</h3><p>사진과 글을 살펴보고, 중요한 내용에 밑줄을 그어 보세요.</p></div><a href={readingUrl(era,id)} target="_blank" rel="noopener noreferrer">A4 신문 열기 · 인쇄</a></div><div className="heritage-reading__lead"><p>{item.paragraphs[0]}</p>{photo&&<figure><img src={`${import.meta.env.BASE_URL}${path}`} alt={`${item.name} 유물 또는 복원품 사진`}/><figcaption>사진: <a href={photo.source} target="_blank" rel="noopener noreferrer">{photo.author}</a> · <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">{photo.license}</a> · 크기 조정</figcaption></figure>}</div><div className="heritage-reading__text">{item.paragraphs.slice(1).map((paragraph,i)=><p key={i}>{paragraph}</p>)}</div><div className="heritage-reading__sources"><b>자료 출처</b><p>공공기관 자료를 바탕으로 어린이가 읽기 쉽게 새로 쓴 글입니다.</p><ul>{item.sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.name} ↗</a></li>)}</ul></div></article></details>;
}
