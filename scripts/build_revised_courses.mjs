import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const runtime=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
process.env.RUNTIME_NODE_MODULES=runtime;
const {Presentation,PresentationFile}=await import(pathToFileURL(path.join(runtime,'@oai/artifact-tool/dist/artifact_tool.mjs')).href);
const skill='/root/.codex/skills/builtins/presentations';
const {finalizePresentation}=await import(pathToFileURL(skill+'/container_tools/artifact_tool_utils.mjs'));
const tmp=path.join(root,'tmp/revised-courses');await fs.mkdir(tmp,{recursive:true});await fs.mkdir(path.join(tmp,'final'),{recursive:true});
const font='S-Core Dream';
function txt(s,t,x,y,w,h,size=32,bold=false,color='#213e32'){const q=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});q.text=t;q.text.style={typeface:font,fontSize:size,bold,color,autoFit:'none'};}
async function build(era,lessons,file,render=false){
 const p=Presentation.create({slideSize:{width:1280,height:720}});const name=era==='joseon'?'조선':'삼국';let i=0;
 const research=era==='joseon'?JSON.parse(await fs.readFile(root+'/src/content/joseon/research.json','utf8')):[];
 for(const lesson of lessons)for(const [index,item] of lesson.slides.entries()){
  const s=p.slides.add();s.background.fill='#f8f8f0';
  txt(s,`${name} 유산 탐구 · ${lesson.id}차시`,64,38,1152,36,22,false,'#4a6957');
  txt(s,item.title,64,105,1152,135,index===0?52:43,true);
  item.body.forEach((line,n)=>txt(s,line,72,275+n*100,1128,90,31));
  txt(s,`${++i}`,1170,668,50,24,16,false);
  const refs=research.flatMap(h=>h.sources.map(x=>x.href));
  s.speakerNotes.textFrame.setText(`수업 목표: ${lesson.objective}\n운영: ${lesson.timing}\n활동지: ${lesson.tasks.map(t=>t.title).join(', ')}\n교사 안내: 학생이 근거와 출처를 말하도록 기다린 뒤 다음 화면으로 넘깁니다. 연습용 수치는 실제 학급 결과와 구분합니다.\n자료: ${era==='joseon'?refs.join('\n'):'저장소의 삼국시대 자료와 기존 교사용 판단 근거'}\n표·그래프는 이 사이트의 내장 탐구실에서 작성합니다.`);
  if(render){const png=await p.export({slide:s,format:'png',scale:1});const target=era==='three-kingdoms'?root+`/public/images/three-kingdoms/data-inquiry/slide-${i}.png`:tmp+`/joseon-${i}.png`;await fs.writeFile(target,new Uint8Array(await png.arrayBuffer()));}
 }
 const slug=era+'-'+path.basename(file);const candidate=path.join(tmp,slug+'.candidate.pptx');const final=path.join(tmp,'final',slug+'.pptx');
 await fs.rm(final,{force:true});await(await PresentationFile.exportPptx(p)).save(candidate);
 await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath:final,pythonExecutable:process.env.CODEX_PRIMARY_RUNTIME_PYTHON,integrityValidatorPath:skill+'/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:skill+'/container_tools/inspect_presentation_layout_geometry.py',layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],explicitTotalSlideCount:i,fontPolicy:{basis:'design',families:[font]},verifyArtifactToolImport:true,receiptPath:path.join(tmp,slug+'.validation.json')});
 await fs.mkdir(path.dirname(file),{recursive:true});await fs.copyFile(final,file);console.log(`Built ${era} ${path.basename(file)} (${i} slides)`);
}
const joseon=JSON.parse(await fs.readFile(root+'/src/content/joseon/six-course.json','utf8'));
await build('joseon',joseon,root+'/public/downloads/joseon/course/teaching.pptx',true);
for(const l of joseon)await build('joseon',[l],root+`/public/downloads/joseon/course/lesson-${l.id}-teaching.pptx`);
const samguk=JSON.parse(await fs.readFile(root+'/src/content/three-kingdoms/data-course.json','utf8'));
samguk[2].slides.push({title:'다음은 AR 전시',body:['표와 그래프를 저장해요.','자료에서 확인한 근거로 유물의 특징을 설명해요.','4차시에 유물 모형을 만들고 해설할 곳을 골라요.']});
await build('three-kingdoms',samguk,root+'/public/downloads/three-kingdoms/data-inquiry/teaching.pptx',true);
