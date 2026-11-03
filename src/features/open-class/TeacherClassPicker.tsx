import { useEffect, useState } from 'react';
import { NumericCodeStatus } from '../ar-studio/NumericCodeStatus';
import { addTeacherClass, classNameFor, isClassCode, normalizeClassCode, readTeacherClasses, removeTeacherClass, writeTeacherClasses, type TeacherClass } from '../ar-studio/teacherClasses';
import { goryeoCode } from '../goryeo/readyCards';

export function TeacherClassPicker({ era, code, onSelect }: { era: 'goryeo' | 'joseon'; code: string; onSelect: (code: string) => void }) {
 const [classes,setClasses]=useState<TeacherClass[]>([]),[quick,setQuick]=useState(''),[name,setName]=useState(''),[newCode,setNewCode]=useState('');
 useEffect(()=>{setClasses(readTeacherClasses(window.localStorage));},[]);
 const valid=(value:string)=>era==='goryeo'?/^\d{4,10}$/.test(value):isClassCode(value);
 function save(next:TeacherClass[]){setClasses(next);writeTeacherClasses(next,window.localStorage);}
 function add(){if(!valid(newCode)||!name.trim())return;const next=addTeacherClass(classes,name,newCode);save(next);onSelect(normalizeClassCode(newCode));setName('');setNewCode('');}
 return <><section className="oc-panel" aria-label="수업코드로 시작"><h2>수업코드로 시작</h2><p>학생에게 알려 줄 숫자 수업코드를 입력하세요.</p><form className="oc-class-add" onSubmit={e=>{e.preventDefault();if(valid(quick))onSelect(normalizeClassCode(quick));}}><label>수업코드<input inputMode="numeric" maxLength={era==='goryeo'?10:12} value={quick} onChange={e=>setQuick(e.target.value.replace(/\D/g,''))} placeholder="숫자 수업코드"/></label><button type="submit" className="oc-primary" disabled={!valid(quick)}>수업 현황 열기</button></form></section>
 <section className="oc-panel" aria-label="내 반 목록"><h2>내 반</h2>{classes.length>0&&<ul className="oc-class-list">{classes.map(item=><li key={item.code} className={item.code===code?'is-open':undefined}><button type="button" disabled={!valid(item.code)} title={!valid(item.code)?'고려 수업은 숫자 4~10자리 코드가 필요해요.':undefined} onClick={()=>onSelect(item.code)}><b>{item.name}</b><span>{item.code}</span></button><button type="button" className="oc-class-remove" aria-label={`${item.name} 목록에서 빼기`} onClick={()=>{if(window.confirm(`${item.name}(${item.code})을 목록에서 뺄까요? 학생 기록은 서버에 그대로 남아요.`))save(removeTeacherClass(classes,item.code));}}>×</button></li>)}</ul>}
 <form className="oc-class-add" onSubmit={e=>{e.preventDefault();add();}}><label>반 이름<input value={name} maxLength={30} placeholder="예: 5학년 2반" onChange={e=>setName(e.target.value)}/></label><label>수업코드 (숫자)<input value={newCode} inputMode="numeric" autoCapitalize="none" spellCheck={false} maxLength={era==='goryeo'?10:12} placeholder="예: 520301" onChange={e=>setNewCode(e.target.value.replace(/\D/g,''))}/></label><button type="submit" className="oc-primary" disabled={!name.trim()||!valid(newCode)}>{classes.length?'반 추가':'첫 반 등록'}</button></form><NumericCodeStatus code={newCode} serverCode={era==='goryeo'&&valid(newCode)?goryeoCode(newCode):undefined} /><p className="oc-help">같은 기기에서 반 목록을 함께 사용해요. {era==='goryeo'?'고려 수업은 숫자 4~10자리 코드를 사용해요.':'숫자를 넣으면 수업코드가 자동으로 저장돼요.'}</p></section></>;
}
export { classNameFor };
