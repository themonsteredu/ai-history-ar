import { readingFor, readingUrl, readingsPackUrl, type ReadingEra } from './HeritageReading';

/** Printable resources remain available before a class code is entered. */
export function OpenLessonMaterials({era}:{era:ReadingEra}) {
 const base=import.meta.env.BASE_URL;
 const label=era==='goryeo'?'고려':'조선';
 return <section className="oc-panel" aria-label={`${label} 수업 자료`}>
  <h2>{label} 수업 자료 모아보기</h2>
  <p>활동지와 유물별 역사신문을 열거나 인쇄해 주세요.</p>
  <div className="oc-actions">
   <a className="button button--outline" href={`${base}downloads/${era}/open-class/student-worksheet.pdf`} target="_blank" rel="noopener noreferrer">수업 활동지 · 2쪽</a>
   <a className="button button--outline" href={`${base}downloads/${era}/open-class/group-presentation-notes.pdf`} target="_blank" rel="noopener noreferrer">모둠 발표 듣기 활동지 · 1쪽</a>
   <a className="button button--outline" href={readingsPackUrl(era)} target="_blank" rel="noopener noreferrer">역사신문 6종 모아보기</a>
  </div>
  <details className="oc-look"><summary>유물별 역사신문 열기</summary><div className="oc-actions">{Array.from({length:6},(_,i)=>i+1).map(id=>{const item=readingFor(era,id);return item?<a className="button button--outline" key={id} href={readingUrl(era,id)} target="_blank" rel="noopener noreferrer">{item.name}</a>:null;})}</div></details>
 </section>;
}
