export const categories = ['언제·어디','재료·방법','생김새','쓰임·생활'] as const;
export type DataRow = { id:string; group:number; heritage:string; category:string; text:string; source:string; confirmed:boolean };
export type DataSet = { version:1; era:'joseon'|'three-kingdoms'; title:string; rows:DataRow[] };
export const emptyData = (era:DataSet['era']):DataSet => ({version:1,era,title:`우리 반이 조사한 ${era==='joseon'?'조선':'삼국'} 유산의 이야기종류`,rows:[]});
export function parseData(text:string,era:DataSet['era']):DataSet{
 if(text.length>2_000_000)throw Error('2MB 이하의 수업 자료 파일을 골라 주세요.');
 const v=JSON.parse(text);const short=(x:unknown,max:number):x is string=>typeof x==='string'&&x.length<=max;
 if(!v||v.version!==1||v.era!==era||!short(v.title,120)||!Array.isArray(v.rows)||v.rows.length>2000)throw Error('이 시대의 표·그래프 작업 파일인지 확인해 주세요.');
 const ids=new Set<string>();
 for(const r of v.rows){if(!r||!short(r.id,100)||!r.id||ids.has(r.id)||!Number.isInteger(r.group)||r.group<1||r.group>6||!short(r.heritage,100)||!short(r.text,500)||!short(r.source,500)||!short(r.category,30)||!['',...categories].includes(r.category)||typeof r.confirmed!=='boolean')throw Error('파일의 행 또는 열을 읽을 수 없어요.');ids.add(r.id);}
 return {version:1,era,title:v.title,rows:v.rows.map((r:DataRow)=>({...r}))};
}
const factKey=(r:DataRow)=>`${r.heritage.trim()}|${r.text.replace(/\s+/g,'').trim()}`;
export function countedRows(rows:DataRow[]){const seen=new Set<string>();return rows.filter(r=>{if(!r.confirmed||!r.text.trim()||!r.source.trim()||!r.heritage.trim()||!categories.includes(r.category as typeof categories[number]))return false;const k=factKey(r);if(seen.has(k))return false;seen.add(k);return true;});}
export function mergeData(current:DataSet,incoming:DataSet){if(current.era!==incoming.era)throw Error('다른 시대의 자료는 합칠 수 없어요.');const rows=new Map(current.rows.map(r=>[r.id,r]));for(const r of incoming.rows){const old=rows.get(r.id);if(!old)rows.set(r.id,r);else if(JSON.stringify(old)!==JSON.stringify(r))throw Error('같은 행의 서로 다른 수정본이 있어요. 기존 행을 확인한 뒤 다시 합쳐 주세요.');}if(rows.size>2000)throw Error('한 표에는 최대 2,000행을 합칠 수 있어요.');return {...current,rows:[...rows.values()]};}
export function counts(rows:DataRow[]){const valid=countedRows(rows);return categories.map(label=>({label,count:valid.filter(r=>r.category===label).length}));}
