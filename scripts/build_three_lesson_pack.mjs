import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const ROOT = '/workspace/scratch/52722db94801';
const SKILL = '/root/.codex/skills/builtins/presentations';
const runtime = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
process.env.RUNTIME_NODE_MODULES = runtime;
const { Presentation, PresentationFile } = await import(pathToFileURL(path.join(runtime, '@oai/artifact-tool/dist/artifact_tool.mjs')).href).catch(async () => {
  const { importRuntimeModule } = await import(pathToFileURL(`${SKILL}/container_tools/runtime_helpers.mjs`));
  return importRuntimeModule('@oai/artifact-tool');
});
const { finalizePresentation, applyPresentationChartFont } = await import(pathToFileURL(`${SKILL}/container_tools/artifact_tool_utils.mjs`));
const out = `${ROOT}/outputs/history-three-lessons`, tmp = `${ROOT}/tmp/history-three-lessons`;
await fs.mkdir(out,{recursive:true}); await fs.mkdir(`${tmp}/draft-renders`,{recursive:true});
const p = Presentation.create({slideSize:{width:1280,height:720}});
const font = 'S-Core Dream';
const C = {ink:'#243833',muted:'#65726C',green:'#236D5D',light:'#E8F0EA',gold:'#BC8650',bg:'#FAFBF7',line:'#C8D3CB'};
const sources = {
  ai:'https://www.ibm.com/think/topics/machine-learning',
  codap:'https://codap.concord.org/help/faqs/',
  table:'https://codap.concord.org/how-to/input-data-by-hand/',
  graph:'https://codap.concord.org/how-to/getting-started-with-graphs/',
  bars:'https://codap.concord.org/how-to/fuse-dots-into-bars-create-a-stacked-bar-chart-and-use-a-formula-to-determine-bar-length/',
  save:'https://codap.concord.org/how-to/save-codap-work-to-your-hard-drive/',
  heritage1:'https://www.museum.go.kr/MUSEUM/contents/M0501000000.do?relicRecommendId=16892&schM=view',
  heritage2:'https://buyeo.museum.go.kr/rprsPsn/view.do?key=2302150017&rprsPsnCmdtyMngSn=2001010001',
  heritage3:'https://www.heritage.go.kr/heri/cul/culGuidePostDetail.do?ccbaCpno=1113700310000&ccgbGbtype=IND&ccgbGbtypeNo=2&pageNo=1_5_0_0',
  heritage4:'https://www.museum.go.kr/MUSEUM/contents/M0501000000.do?pageSize=10&relicRecommendId=519954&schM=view',
  heritage5:'https://whc.unesco.org/en/list/1091/',
  heritage6:'https://whc.unesco.org/en/list/1666/'
};
const tables=[], charts=[];
function txt(s,text,x,y,w,h,size=30,color=C.ink,bold=false){
  const q=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
  q.text=text; q.text.style={typeface:font,fontSize:size,color,bold,autoFit:'none'}; return q;
}
function rect(s,x,y,w,h,fill){s.shapes.add({geometry:'rect',position:{left:x,top:y,width:w,height:h},fill,line:{fill:'none',width:0}});}
function base(section,title,note='',refs=[]){
  const s=p.slides.add(); s.background.fill=C.bg;
  txt(s,section,64,29,1110,28,19,C.green,true);
  txt(s,title,64,81,1150,102,44,C.ink,true);
  rect(s,64,660,1152,1,C.line);
  txt(s,'AI·문화유산 데이터 탐구  |  3차시 개정',64,676,960,25,15,C.muted);
  txt(s,String(p.slides.items.length).padStart(2,'0'),1165,673,52,25,17,C.muted);
  s.speakerNotes.textFrame.setText(note+'\n\n자료: '+refs.map(k=>sources[k]??k).join('\n')+'\n기준: 2026-09-09. 연습 자료는 실제 학급 조사 결과가 아닙니다.');
  return s;
}
function lines(s,items,{x=78,y=210,w=1110,size=31,gap=98}={}){
  items.forEach((t,i)=>{txt(s,String(i+1).padStart(2,'0'),x,y+i*gap,62,45,28,C.gold,true);txt(s,t,x+86,y+i*gap,w-86,gap-12,size);});
}
function bottom(s,t){txt(s,t,78,592,1120,49,26,C.green,true);}
function table(s,values,widths,{x=64,y=211,h=300,size=25}={}){
  const t=s.tables.add({rows:values.length,columns:values[0].length,left:x,top:y,width:widths.reduce((a,b)=>a+b,0),height:h,columnWidths:widths,values});
  t.borders.assign({style:'solid',fill:C.line,width:1});
  for(let r=0;r<values.length;r++)for(let c=0;c<values[0].length;c++){
    const cell=t.getCell(r,c);cell.fill=r===0?C.green:(r%2===0?'#F0F4EF':'#FFFFFF');
    cell.text.style={typeface:font,fontSize:r===0?size-1:size,color:r===0?'#FFFFFF':C.ink,bold:r===0};
  }
  tables.push(p.slides.items.length);return t;
}
async function img(s,file,x,y,w,h,fit='contain'){
  s.images.add({blob:await fs.readFile(file),contentType:'image/jpeg',position:{left:x,top:y,width:w,height:h},fit,alt:path.basename(file)});
}
async function screen(title,file,caption,note,refs=['codap']){
  const s=base('3차시 · CODAP 실습',title,note+'\n실제 화면: CODAP v3.1.0 (2985), 한국어. Screenshot credit: The Concord Consortium (https://concord.org).',refs);
  await img(s,`${tmp}/screens/${file}`,64,185,1152,380);
  txt(s,caption,78,579,1120,60,26,C.green,true);return s;
}

// 공통 안내 + 1차시 (1–9)
{
 const s=base('문화유산으로 배우는 AI·데이터', '조사한 문장이\n우리 반 그래프가 되기까지', '3차시 전체 안내. 학생들은 앞서 조사한 문화유산 자료를 가져온다. 이번 수업은 AI 모델을 훈련하거나 AR을 제작하는 시간이 아니다.');
 txt(s,'자료조사 · 표로 정제 · 그래프로 설명',72,331,690,92,31,C.green,true);
 txt(s,'모둠에서는 자료를 정리하고,\n마지막에는 1~6모둠의 자료를 합칩니다.',72,467,700,96,29);
 await img(s,`${ROOT}/public/images/heritage/three-kingdoms/baekje-incense-burner.jpg`,850,183,328,424,'contain');
 s.speakerNotes.textFrame.setText('표지 사진은 사용자 연결 저장소의 public/images/heritage/three-kingdoms/baekje-incense-burner.jpg를 재사용. 문화유산 설명은 국립부여박물관 자료 참조: '+sources.heritage2);
}
{
 const s=base('수업의 흐름','세 번의 수업, 하나로 이어지는 자료','각 차시 40분. 1차시 이론10·기존조사정리25·공유5, 2차시 이론10·표정제25·합치기준비5, 3차시 이론8·학급통합및그래프22·해석저장10. 활동지 각1쪽.');
 table(s,[['차시','배우는 것','남기는 것'],['1','AI·데이터·출처 확인','출처가 있는 근거 문장'],['2','행과 열·분류·정제','모둠별 정제 표'],['3','학급 통합·빈도·그래프','학급 공통 그래프와 해석']],[105,480,567],{h:306,size:28});
 bottom(s,'이미 조사한 자료를 사용해요. 문장을 억지로 늘리지 않아요.');
}
{
 const s=base('1차시 · AI와 자료조사','데이터는 숫자만이 아닙니다','학생이 준비한 자료를 보여 주며 글, 사진, 숫자도 기록된 데이터가 될 수 있음을 설명한다. 오늘 분석 단위는 사진이나 유물 개수가 아니라 근거 문장이다.');
 table(s,[['형태','문화유산 조사에서 찾는 예'],['글','“무령왕릉은 벽돌을 쌓아 만들었다.”'],['사진','유산의 모양과 재료를 살펴보는 사진'],['숫자','발견 연도, 크기 등 기록된 값']],[190,962],{size:28,h:320});
 bottom(s,'오늘은 확인한 글을 한 줄씩 정리해 데이터로 만들어요.');
}
{
 const s=base('1차시 · AI와 자료조사','AI는 배운 패턴을 바탕으로 답합니다','데이터로 학습하는 AI를 초등학생 수준으로 설명한다. 모든 AI가 동일한 방식으로 작동한다는 주장은 피한다. 생성형 AI의 답은 틀리거나 근거가 없는 부분을 포함할 수 있다. 학생에게 새 AI 계정을 요구하지 않는다.',['ai']);
 lines(s,['학습: 여러 자료에서 특징과 규칙을 찾습니다.','활용: 배운 것을 바탕으로 분류하거나 답을 만듭니다.','확인: 그럴듯한 답도 자료와 비교해야 합니다.'],{gap:104});
 bottom(s,'오늘은 AI 학습이 아니라, 믿을 만한 데이터를 준비하는 연습!');
}
{
 const s=base('1차시 · AI와 자료조사','“그럴듯함”과 “근거가 있음”은 다릅니다','교사가 만든 가상의 AI 답변이다. 실제 AI 실행 결과로 소개하지 않는다. 무령왕릉은 1971년 발견 사실을 공식자료와 비교한다.',['heritage1']);
 txt(s,'확인 연습용 문장',78,201,1100,40,24,C.muted);
 txt(s,'“무령왕릉은 1972년에 발견되었다.”',78,254,1100,68,36,C.ink,true);
 txt(s,'공식 자료를 읽어 보니 → 발견 연도는 1971년',78,382,1100,65,31,C.green,true);
 txt(s,'고친 문장과 함께 자료를 만든 기관·제목·링크를 남겨요.',78,493,1110,75,29);
}
{
 const s=base('1차시 · AI와 자료조사','출처는 다시 찾아갈 수 있는 길입니다','출처는 기관 이름만 쓰고 끝내지 않는다. 활동지의 모둠번호-출처번호(예1-1)는 전 학급에서 고유하다. 한 출처에서 여러 사실을 찾아도 된다. 학급 표에서는 출처번호를 사용하고 출처목록에 URL을 보존한다.');
 lines(s,['누가 만들었나요?  →  박물관·국가유산청 등 기관','어떤 자료인가요?  →  자료 제목과 해당 부분','어디서 다시 보나요?  →  링크 또는 배부자료 쪽수'],{gap:107});
 bottom(s,'검색 결과의 제목만 보지 말고, 원문을 읽고 확인해요.');
}
{
 const s=base('1차시 · AI와 자료조사','자료에 있는 말과 나의 생각을 구분해요','분류를 위한 예시. 관찰/근거와 과장된 추측을 구분한다. 확인하지 못한 내용은 거짓이라고 단정하지 않고 보류한다.',['heritage1']);
 table(s,[['문장','지금 할 일'],['“벽돌을 쌓아 만들었다.”','출처와 맞으면 근거로 기록'],['“가장 훌륭한 무덤이다.”','평가의 기준·근거가 있는지 확인'],['“모든 사람이 같은 무덤을 썼다.”','확인되지 않으면 보류']],[724,428],{size:27,h:319});
 bottom(s,'모르는 내용은 만들어 채우지 않습니다.');
}
{
 const s=base('1차시 · 활동지 1쪽','기존 조사 자료에서 근거를 골라요','활동지1의1~3번 순서와 일치. 모둠당 근거2~3개는 예시이며 할당량이 아니다. 이미 충분한 조사자료가 있으면 검색을 반복하지 않는다. 부족한근거만보완.');
 lines(s,['우리 문화유산과 조사 질문을 확인합니다.','자료를 읽고 짧은 근거 문장과 출처를 남깁니다.','친구와 원문을 대조하고, 미확인 내용은 표시합니다.'],{gap:103});
 bottom(s,'모둠에서 한 장으로 정리해도 좋아요. 빈칸을 다 채울 필요는 없어요.');
}
{
 const s=base('1차시 · 마무리','다음 시간에 쓸 문장을 확인해요','1차시 정리5분. 학생들이 출처와 확인된 사실을 연결해 설명하도록 한다. 새 과제나분량추가를주지않는다.');
 lines(s,['자료에서 직접 확인한 내용인가요?','친구가 출처를 다시 찾아갈 수 있나요?','아직 모르는 내용을 따로 표시했나요?'],{gap:105});
 bottom(s,'이 문장들을 그대로 가져와, 다음 시간에 표로 정리합니다.');
}

// 2차시 (10–18)
{
 const s=base('2차시 · 표로 정리·정제','표는 같은 기준으로 자료를 놓는 약속','행과열의용어를설명한다. 행은한사실,열은항목. 데이터표에개수열을넣을필요없음. 출처번호1-1은활동지1의목록과대응한다.');
 table(s,[['모둠','유산','이야기종류','핵심내용','출처번호'],['1','무령왕릉','재료·방법','벽돌을 쌓아 만들었다.','1-1'],['1','무령왕릉','언제·어디','1971년에 발견되었다.','1-1']],[90,200,210,492,160],{h:226,size:25});
 txt(s,'가로 한 줄 = 한 가지 사실   /   세로 한 칸의 묶음 = 같은 항목',78,477,1120,67,30,C.green,true);
 bottom(s,'한 행에 사실이 두 개 있으면 나눕니다.');
}
{
 const s=base('2차시 · 표로 정리·정제','문장을 네 가지 이야기로 분류해요','범주는순서나크기의의미가없는범주형데이터이다. 네종류는수업에서합의한분류이며보편적정답으로다루지않는다. 판단이어려운경우핵심질문을정해한종류로합의한다.');
 table(s,[['이야기종류','어떤 내용인가요?','예'],['언제·어디','시기·발견·장소','1971년에 발견'],['재료·방법','재료·만드는 방법','벽돌을 쌓음'],['생김새','모양·장식·그림','봉황 장식'],['쓰임·생활','쓰임·당시 생활','향을 피우는 도구']],[226,457,469],{h:352,size:27});
 bottom(s,'모든 모둠이 같은 이름을 씁니다. “재료”도 “재료·방법”으로!');
}
{
 const s=base('2차시 · 표로 정리·정제','정제는 뜻을 지키며 자료를 다듬는 일','내용을만들어내거나불리한자료를지우는것이아니다. 원자료는활동지1에남기고수정내용을활동지2에기록한다. 중복판단은동일유산동일사실기준.');
 lines(s,['통일하기  →  같은 종류의 이름을 같게 씁니다.','나누기  →  한 행에 한 가지 사실만 남깁니다.','점검하기  →  중복·빈칸·출처를 확인합니다.'],{gap:105});
 bottom(s,'원래 뜻은 그대로, 비교하고 셀 수 있게 정리해요.');
}
{
 const s=base('2차시 · 정제 시범','같은 사실을 두 번 세면 어떻게 될까요?','가상의정제전예시. 동일유산동일사실2행을1행으로묶는다. 출처가복수이면출처목록에보존한다. 핵심내용이다르면같은출처여도별도행유지.');
 table(s,[['유산','정제 전','판단'],['무령왕릉','벽돌을 쌓아 만들었다.','같은 사실'],['무령왕릉','벽돌로 무덤을 만들었다.','같은 사실']],[218,668,266],{h:241,size:29});
 txt(s,'정제 후: 무령왕릉 | 재료·방법 | 벽돌을 쌓아 만들었다.',78,506,1110,70,29,C.green,true);
}
{
 const s=base('2차시 · 정제 시범','긴 문장은 사실을 나누어 기록해요','두사실의복합문장을나누는과정시범. 출처1-1예시. 실제학생자료의수를늘리기위한분할이아니라분석단위를일정하게하기위한분할이다.',['heritage1']);
 txt(s,'“1971년에 발견되었고, 벽돌을 쌓아 만들었다.”',78,202,1120,75,32);
 table(s,[['이야기종류','정제한 핵심내용'],['언제·어디','1971년에 발견되었다.'],['재료·방법','벽돌을 쌓아 만들었다.']],[310,842],{y:324,h:212,size:29});
 bottom(s,'두 행 모두 같은 출처번호를 남깁니다.');
}
{
 const s=base('2차시 · 표로 정리·정제','빠진 정보는 “없음”과 다릅니다','유효행은필수항목이완성되고확인된행. 빈값을0으로채우지않는다. 보류문장은지우지않고종이활동지에남긴다. 수업시간내해결되지않아도실패가아니다.');
 table(s,[['발견한 문제','우리의 처리'],['출처를 아직 못 찾았다.','활동지에 보류 → 집계에는 아직 넣지 않기'],['이야기종류가 비어 있다.','핵심내용을 읽고 친구와 분류하기'],['두 유산이 모두 돌로 만들어졌다.','서로 다른 유산이므로 각각 남기기']],[472,680],{h:312,size:26});
 bottom(s,'실제 자료가 적어도 괜찮아요. 빈칸을 상상으로 채우지 않아요.');
}
{
 const s=base('2차시 · 활동지 2쪽','우리 모둠의 정제 표를 완성해요','활동지2의1~3번과일치. 모둠명·유산은활동지상단에쓰고반복입력은교사가통합시채운다. 학생은3열 핵심내용/이야기종류/출처번호만작성해필기부담을줄인다.');
 lines(s,['1쪽에서 확인한 문장을 표로 옮깁니다.','뜻을 지키며 나누고, 같은 사실은 한 번만 남깁니다.','친구와 검토한 뒤 학급 통합용 표로 제출합니다.'],{gap:105});
 bottom(s,'최소 개수·최대 개수를 맞추는 활동이 아닙니다.');
}
{
 const s=base('2차시 · 학급 표 준비','1~6모둠의 자료를 한 표로 모읍니다','실시간공동편집이아니다. 교사는활동지2를수합하고기존순서로1~6모둠자료를CODAP단일표에이어붙여입력한다. 새열을6개만드는것이아니다. 3차시전통합권장,교사입력부담을숨기지않음.');
 table(s,[['구분','통합하는 방법'],['행','1모둠 다음에 2모둠…6모둠의 문장을 이어 넣기'],['열','모둠 / 유산 / 이야기종류 / 핵심내용 / 출처번호'],['확인','중복·빈칸·출처를 점검한 유효 행만 세기']],[180,972],{h:285,size:27});
 bottom(s,'“모둠 6개”가 아니라 “학급 전체의 근거 문장”을 분석해요.');
}
{
 const s=base('2차시 · 도구 안내','로그인 없이 시작하는 CODAP','교사단일기기실습이기본이다. 인터넷과지원브라우저필요. CODAP실시간공동편집아님. 더많은기기에배부하려면교사가저장한동일파일을각자열어별도수정한다.',['codap','table']);
 txt(s,'codap.concord.org/app/',78,205,1120,65,37,C.green,true);
 lines(s,['새 문서 → 테이블 → 새 데이터셋','속성명 클릭 → 이름 바꾸기 / + 버튼 → 열 추가','빈 행의 칸에 입력 → Tab 키로 다음 칸 이동'],{y:307,gap:86,size:29});
 bottom(s,'교사 기기에 하나의 학급 표를 만듭니다. 동시에 공동 입력하지 않아요.');
}

// 3차시 (19–28)
{
 const s=base('3차시 · 그래프와 해석','그래프를 만들기 전에 질문부터 정해요','학급의조사내용구성을살펴보는빈도그래프이다. 표본이작고유산선택및원자료분량이다르므로국가별비교나모둠평가에사용하지않는다.');
 txt(s,'“우리 반은 어떤 종류의 내용을\n많이 조사했을까?”',78,210,1110,143,43,C.green,true);
 txt(s,'가로축: 이야기종류\n세로축: 정제한 근거 문장 수(건)',78,414,1090,113,32);
 bottom(s,'문장 1행을 1건으로 셉니다. 발견 연도 숫자를 더하지 않아요.');
}
{
 const s=base('3차시 · 표에서 그래프로','종류별로 세면 집계표가 됩니다','설명용연습18행. 실제학급자료가아님. 같은원자료가CODAP스크린샷에도사용됨. 분류순서는달라도범주별값일치. 실제표에없는범주는0건으로기록하되미확인값은0으로간주하지않는다.');
 table(s,[['이야기종류','문장 수(건)'],['언제·어디','6'],['재료·방법','4'],['생김새','5'],['쓰임·생활','3'],['합계','18']],[700,452],{h:350,size:28});
 bottom(s,'연습용 예시입니다. 네 종류의 합계 = 학급 표의 유효 행 수');
}
{
 const s=base('3차시 · 표에서 그래프로','막대의 높이가 문장 수를 보여 줍니다','이그래프는수정가능한네이티브막대그래프. 출처:설명용으로구성한18건,학생실제자료아님. 빈도6,4,5,3 합계18. 시간의연속적변화가아니므로꺾은선보다막대가적합.');
 const chart=s.charts.add('bar',{position:{left:82,top:195,width:1090,height:380},categories:['언제·어디','재료·방법','생김새','쓰임·생활'],series:[{name:'문장 수(건)',values:[6,4,5,3],fill:C.green}],barOptions:{direction:'column',grouping:'clustered',gapWidth:130},hasLegend:false,title:'우리 반 조사 내용의 이야기종류별 문장 수 (연습)',titleTextStyle:{typeface:font,fontSize:23,fill:C.ink},xAxis:{textStyle:{typeface:font,fontSize:23,fill:C.ink},title:{text:'이야기종류',textStyle:{typeface:font,fontSize:22}}},yAxis:{min:0,max:8,majorUnit:2,title:{text:'문장 수(건)',textStyle:{typeface:font,fontSize:22}},textStyle:{typeface:font,fontSize:22}},dataLabels:{showValue:true,position:'outEnd',textStyle:{typeface:font,fontSize:27,fill:C.ink}}});
 applyPresentationChartFont(chart,{fontFamily:font});charts.push(p.slides.items.length);
 bottom(s,'세로축은 0부터! 제목·축 이름·단위를 확인해요.');
}
{
 const s=base('3차시 · CODAP 실습','열 이름을 그래프의 가로축으로 옮겨요','실제 CODAP v3.1.0 (2985) 한국어 UI에서 확인한 순서. 캡처 파일 전달 실패로 설명을 텍스트로 구성했다. 상단 그래프 버튼을 누른 후 표의 이야기종류 머리글을 그래프 가로축에 드래그한다. 점은 문장과 1:1로 대응한다.',['graph']);
 lines(s,['상단의 “그래프”를 눌러 그래프 창을 엽니다.','표의 “이야기종류” 열 이름을 가로축으로 끕니다.','종류별로 모인 점을 살펴봅니다.'],{gap:103});
 bottom(s,'점 하나 = 문장 한 건. “모둠”이나 “출처번호”를 세는 것이 아니에요.');
}
{
 const s=base('3차시 · CODAP 실습','점들을 묶으면 막대가 됩니다','실제 한국어 UI에는 Config, Measure 등 영어가 남아 있다. Config의 점을 막대로 변환을 켜고 Measure에서 빈도수를 확인한다. 연습 자료로 직접 수행하여 범주별 6,4,5,3건을 확인했다.',['bars']);
 table(s,[['그래프 오른쪽 메뉴','선택할 항목','달라지는 것'],['Config','점을 막대로 변환','점들이 막대로 묶임'],['Measure','빈도수','종류별 개수를 표시']],[270,420,462],{h:240,size:28});
 txt(s,'빈도수 = 각 종류에 들어 있는 문장의 개수',78,508,1120,67,31,C.green,true);
}
{
 const s=base('3차시 · 활동지 3쪽','학급 전체 그래프를 함께 완성해요','활동지3의1~3번과일치. 교사기기에서학급표확인후한그래프를제작. 모둠대표가축지정과설정을이어조작할수있다. 모두는활동지집계표를채우고해석에참여. 개별조작이필요하면같은통합파일배부하되개별그래프는선택이다.');
 lines(s,['합친 자료의 종류별 개수와 합계를 확인합니다.','학급 그래프를 만들고 제목·축·단위를 점검합니다.','모든 모둠이 같은 그래프를 보고 한 문장씩 설명합니다.'],{gap:103});
 bottom(s,'모둠별로 따로 그래프를 만들지 않습니다.');
}
{
 const s=base('3차시 · 그래프 해석','그래프가 말해 주는 것, 말하지 못하는 것','연습그래프에서언제어디6건,쓰임생활3건임을읽는다. 문장수차이는관심분야나제공자료구성의영향을받는다. 더많은문장이더우수한문화유산/모둠이라는추론은안됨.');
 table(s,[['설명','판단'],['“이 연습 자료에는 언제·어디가 6건이다.”','그래프에서 알 수 있음'],['“우리는 쓰임·생활을 더 조사할 수 있다.”','자료를 보고 세운 다음 질문'],['“문장이 많은 유산이 더 훌륭하다.”','이 그래프로 판단할 수 없음']],[809,343],{h:322,size:26});
 bottom(s,'“우리 반이 모은 자료에서는…”이라고 범위를 붙여 말해요.');
}
{
 const s=base('3차시 · 저장','표와 그래프는 파일로 남깁니다','아래절차는공식도움말과실제메뉴확인기반. 저장은브라우저의다운로드허용및학교기기환경에따라다를수있다. 로컬파일저장은계정이필요없다. 화면이미지만남기면원자료를다시수정할수없으므로.codap파일우선.',['codap','save']);
 lines(s,['File → 저장 → Local File 탭 선택','파일명 입력 → “컴퓨터에 저장하기”','다시 수정할 .codap 파일을 꼭 보관하기'],{gap:103});
 bottom(s,'인터넷은 필요하지만, Google 계정 로그인은 필요하지 않아요.');
}
{
 const s=base('3차시 · 마무리','좋은 데이터가 좋은 설명을 만듭니다','교사마무리발문. AI와데이터품질을다시연결하되CODAP가AI를학습시키는프로그램이라고설명하지않는다. 세가지학생응답으로형성평가.');
 lines(s,['자료조사  →  출처를 확인한 사실을 남겼나요?','표로 정제  →  같은 기준으로 한 행씩 정리했나요?','그래프 해석  →  자료가 보여 주는 만큼만 말했나요?'],{gap:105});
 bottom(s,'많이 모으는 것보다, 믿고 설명할 수 있게 정리하는 것이 중요해요.');
}
{
 const s=base('교사용 · 준비와 출처','수업 전에 이것만 준비하세요','교사용부록으로학생수업시간에길게설명하지않는다. 모든외부URL은강의노트에수록. 사진은기존저장소제공자료재사용. CODAP화면ConcordConsortium크레딧. 원자료18건은동저장소webActivities의공식기관근거를기초로재서술.',[...Object.keys(sources)]);
 lines(s,['활동지 3쪽 + 기존 조사 자료와 출처 목록','교사 PC·인터넷·프로젝터 / CODAP 접속 확인','2차시 후 자료 수합 → 3차시 전 학급 통합 표 준비'],{gap:95,size:29});
 txt(s,'예시 18건·그래프 수치는 연습용입니다. 실제 학급 자료로 바꾸세요.\n학교망에서 접속이 안 되면 종이 집계표와 칠판 막대그래프로 진행합니다.',78,515,1110,107,26,C.muted);
}

const candidate=`${tmp}/candidate.pptx`;
await (await PresentationFile.exportPptx(p)).save(candidate);
console.log(JSON.stringify({stage:'candidate',slides:p.slides.items.length,tables,charts}));
const result=await finalizePresentation({workspaceDir:ROOT,candidatePath:candidate,finalPath:`${out}/AI_데이터탐구_3차시_이론수업.pptx`,pythonExecutable:process.env.CODEX_PRIMARY_RUNTIME_PYTHON,integrityValidatorPath:`${SKILL}/container_tools/inspect_presentation_package_integrity.py`,layoutValidatorPath:`${SKILL}/container_tools/inspect_presentation_layout_geometry.py`,layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit',...tables.flatMap(n=>['--require-native-table-slide',String(n)])],requiredNativeTableOwnerSlides:tables,requiredNativeChartOwnerSlides:charts,materializeLiteralChartWorkbooks:true,fontPolicy:{basis:'design',families:[font]},verifyArtifactToolImport:true,receiptPath:`${tmp}/validation.json`});
console.log(JSON.stringify(result));
