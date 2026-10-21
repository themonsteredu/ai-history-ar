import DataLab from '../features/data-lab/DataLab';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import lessons from '../content/joseon/six-course.json';
import { researchForEra, heritageImageUrl } from '../content/heritageCatalog';
import { newProject, parseProject, downloadProjectFile, type HeritageProject } from '../content/three-kingdoms/project';
import { newArExhibit } from '../lib/ar/exhibit';
import { loadProjectDraft, saveProjectDraft } from '../lib/projectDraftStore';
import ArRecognitionCard from '../components/ArRecognitionCard';
import { NotFoundPage } from './NotFoundPage';
import '../styles/data-inquiry.css';
const ArExhibitEditor = lazy(() => import('../components/ArExhibitEditor'));
const TrackedHeritageAr = lazy(() => import('../components/TrackedHeritageAr'));
const heritage = researchForEra('joseon');
const base = `${import.meta.env.BASE_URL}downloads/joseon/course/`;
function Workspace({ lesson }: { lesson: number }) {
  const [project, setProject] = useState<HeritageProject>(() => newProject(1, 1, 'joseon'));
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [params] = useSearchParams();
  const key = `joseon-six-course:${params.get('code') || 'local'}:${params.get('group') || 'local'}`;
  const current = useRef(project);current.current=project;
  useEffect(() => {let active=true;setReady(false);void loadProjectDraft(key).then(raw => {if(!active)return;try{setProject(raw?parseProject(raw,'joseon'):newProject(1,1,'joseon'));}catch{setError('임시 기록을 읽지 못했어요. 저장한 작업 파일을 열어 주세요.');}setReady(true);}).catch(()=>{if(active){setError('임시 저장 공간을 열지 못했어요. 작업 파일을 꼭 저장해 주세요.');setReady(true);}});return()=>{active=false;};},[key]);
  useEffect(()=>{if(!ready)return;void saveProjectDraft(key,JSON.stringify(project)).catch(()=>setError('임시 저장에 실패했어요. 작업 파일을 저장해 주세요.'));},[project,key,ready]);
  async function open(file?:File){if(!file)return;try{if(file.size>23_000_000)throw Error('파일이 너무 커요.');const next=parseProject(await file.text(),'joseon');setProject(next);setError('');}catch{setError('조선시대 작업 JSON 파일인지 확인해 주세요.');}}
  const item=heritage[project.heritageId-1];
  if(!ready)return <p role="status">전시 작업을 불러오는 중…</p>;
  return <section className="heritage-project"><div className="data-inquiry-actions"><label>모둠 <select disabled={busy} value={project.group} onChange={e=>setProject({...project,group:Number(e.target.value)})}>{[1,2,3,4,5,6].map(g=><option key={g}>{g}</option>)}</select></label><label>유산 <select disabled={busy} value={project.heritageId} onChange={e=>{if(window.confirm('유산을 바꾸면 현재 전시가 새로 시작됩니다. 작업 파일을 저장했나요?'))setProject(newProject(project.group,Number(e.target.value),'joseon'));}}>{heritage.map(h=><option key={h.id} value={h.id}>{h.heritage}</option>)}</select></label><button className="button button--primary" disabled={busy} onClick={()=>downloadProjectFile(JSON.stringify(current.current),`조선_${project.group}모둠_전시.json`,'application/json')}>작업 파일 저장</button><label>작업 파일 열기<input disabled={busy} type="file" accept=".json" onChange={e=>{void open(e.target.files?.[0]);e.target.value='';}} /></label></div><p>다른 기기에서는 작업 파일을 먼저 열어요. 임시 저장만으로 친구 기기에 전달되지는 않아요.</p>{error&&<p role="alert">{error}</p>}
  <Suspense fallback={<p>AR 도구를 준비하는 중…</p>}>{lesson===6?<><ArRecognitionCard eraId="joseon" heritageId={project.heritageId} heritage={item.heritage} /><TrackedHeritageAr eraId="joseon" heritageId={project.heritageId} ar={project.ar || newArExhibit()} /></>:<ArExhibitEditor key={project.heritageId} eraId="joseon" heritageId={project.heritageId} heritage={item.heritage} image={heritageImageUrl('joseon',item.id)} value={project.ar || newArExhibit()} onBusy={setBusy} onChange={ar=>setProject(p=>({...p,ar}))} />}</Suspense></section>;
}
export default function JoseonCoursePage({teacher=false}:{teacher?:boolean}){
 const {sessionId}=useParams();const lesson=lessons.find(l=>String(l.id)===sessionId);const [params]=useSearchParams();const [slide,setSlide]=useState(0);const stage=useRef<HTMLDivElement>(null);
 useEffect(()=>setSlide(0),[sessionId]);
 if(!lesson)return <NotFoundPage/>;
 const active=lesson.slides[Math.min(slide,lesson.slides.length-1)];const prefix=teacher?'/teacher/joseon/course/':'/joseon/course/';const view=params.get('view')||'start';
 const path=(id:number,v='start')=>{const p=new URLSearchParams(params);p.set('view',v);return `${prefix}${id}?${p}`;};
 return <div className="page-width classroom-content"><Link to={teacher?'/teacher':'/joseon'}>← 조선시대 6차시</Link><p className="eyebrow">{lesson.id}차시 · {lesson.timing}</p><h1>{lesson.title}</h1><p>{lesson.objective}</p><nav className="data-inquiry-actions" aria-label="수업 화면">{[['start','수업 안내'],['ppt','수업 PPT'],['activity','학생 활동']].map(([v,t])=><Link key={v} className="button button--outline" aria-current={view===v?'page':undefined} to={path(lesson.id,v)}>{t}</Link>)}</nav>
 {view==='ppt'?<section><div className="course-slide" ref={stage} tabIndex={0} onKeyDown={e=>{if(e.key==='ArrowRight')setSlide(n=>Math.min(lesson.slides.length-1,n+1));if(e.key==='ArrowLeft')setSlide(n=>Math.max(0,n-1));}}><p>조선시대 {lesson.id}차시</p><h2>{active.title}</h2>{active.body.map(line=><p key={line}>{line}</p>)}</div><div className="data-inquiry-actions"><button disabled={!slide} onClick={()=>setSlide(n=>n-1)}>이전</button><span aria-live="polite">{slide+1} / {lesson.slides.length}</span><button disabled={slide===lesson.slides.length-1} onClick={()=>setSlide(n=>n+1)}>다음</button><button onClick={()=>{void stage.current?.requestFullscreen().catch(()=>{});}}>전체 화면</button></div></section>:<><ol className="data-inquiry-steps">{lesson.tasks.map(t=><li key={t.title}><b>{t.title}</b><p>{t.prompt}</p></li>)}</ol>{view==='activity'&&(lesson.id>=4?<Workspace lesson={lesson.id}/>:<section className="data-inquiry-practice">{lesson.id===1?<><h2>모둠별 원문 자료</h2>{heritage.map(h=><details key={h.id}><summary>{h.heritage} · {h.question}</summary>{h.sources.map(s=><p key={s.id}><a href={s.href} target="_blank" rel="noreferrer">{s.institution} · {s.title} ↗</a></p>)}</details>)}</>:<DataLab era="joseon" graph={lesson.id===3}/>}</section>)}</>}
 <section className="data-inquiry-materials"><h2>이번 차시 자료</h2><div className="data-inquiry-actions"><a href={`${base}lesson-${lesson.id}-student.pdf`} download>학생 활동지 PDF</a><a href={`${base}lesson-${lesson.id}-teaching.pptx`} download>편집용 수업 PPT</a>{teacher&&<a href={`${base}teacher-guide.pdf`} download>6차시 교사 안내</a>}</div></section><nav className="classroom-pagination">{lesson.id>1?<Link to={path(lesson.id-1)}>← {lesson.id-1}차시</Link>:<span/>}{lesson.id<6?<Link to={path(lesson.id+1)}>{lesson.id+1}차시 →</Link>:<Link to={teacher?'/teacher/joseon/open-class':'/joseon/open-class'}>공개수업으로 이어 가기 →</Link>}</nav></div>;
}
