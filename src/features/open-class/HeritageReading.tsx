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
 return <details className="heritage-reading">
  <summary>{item.name} 역사신문 읽기</summary>
  <article className="heritage-reading__body" aria-label={`${item.name} 역사신문`}>
   <header>
    <div className="heritage-reading__edition"><span>유물로 읽는 사람들의 생활</span><span>{era==='goryeo'?'고려':'조선'} 특집 · 제{id}호</span></div>
    <div className="heritage-reading__masthead"><b>역사 탐구 신문</b><a href={readingUrl(era,id)} target="_blank" rel="noopener noreferrer">A4 신문 열기 · 인쇄</a></div>
    <div className="heritage-reading__heading"><span className="heritage-reading__subject">{item.name}</span><h3>{item.headline}</h3><p>{item.deck}</p></div>
    <p className="heritage-reading__curriculum"><b>교과 연계</b> {item.learningFocus}</p>
   </header>
   <div className="heritage-reading__lead"><p>{item.paragraphs[0]}</p>{photo&&<figure><img src={`${import.meta.env.BASE_URL}${path}`} alt={item.photoCaption}/><figcaption><span>{item.photoCaption}</span><small>사진: <a href={photo.source} target="_blank" rel="noopener noreferrer">{photo.author}</a> · <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">{photo.license}</a> · 크기 조정</small></figcaption></figure>}</div>
   <div className="heritage-reading__text">{item.paragraphs.slice(1).map((paragraph,i)=><section key={i}><h4>{item.sectionTitles[i]}</h4><p>{paragraph}</p></section>)}</div>
   <footer className="heritage-reading__sources"><b>자료 출처 · 확인한 내용</b><ul>{item.sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.name}</a><span>{source.supports}</span></li>)}</ul><p>공공기관 자료를 바탕으로 수업용으로 재구성했습니다. 사진 출처는 각 사진 아래에 표시했습니다.</p></footer>
  </article>
 </details>;
}
