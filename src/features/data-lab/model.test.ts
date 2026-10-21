import {describe,it,expect} from 'vitest';
import {emptyData,counts,countedRows,parseData,mergeData,type DataRow} from './model';
const row=(id:string,patch:Partial<DataRow>={}):DataRow=>({id,group:1,heritage:'실록',category:'쓰임·생활',text:'기록을 보관했다.',source:'국사편찬위원회',confirmed:true,...patch});
describe('built-in data lab',()=>{
 it('counts evidence once and excludes unverified/incomplete facts',()=>{const rows=[row('1'),row('2'),row('3',{confirmed:false}),row('4',{source:''}),row('5',{text:'다른 근거'})];expect(countedRows(rows)).toHaveLength(2);expect(counts(rows)[3].count).toBe(2);});
 it('merges repeated group files without multiplying rows',()=>{const d={...emptyData('joseon'),rows:[row('1')]};expect(mergeData(d,d).rows).toHaveLength(1);expect(()=>mergeData(d,{...d,rows:[row('1',{text:'고친 내용'})]})).toThrow();});
 it('rejects other eras, malformed rows and duplicate row ids',()=>{const d={...emptyData('joseon'),rows:[row('1')]};expect(parseData(JSON.stringify(d),'joseon').rows).toHaveLength(1);expect(()=>parseData(JSON.stringify(d),'three-kingdoms')).toThrow();expect(()=>parseData(JSON.stringify({...d,rows:[row('1',{group:7})]}),'joseon')).toThrow();expect(()=>parseData(JSON.stringify({...d,rows:[row('1'),row('1')]}),'joseon')).toThrow();});
});
