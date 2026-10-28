import type { ModelPart } from '../../lib/ar/primitives';

export interface Question { statement: string; answer: 'O'|'X'; reason: string; robot: string; deliberatelyWrong?: boolean }
export interface Artifact { id:string; name:string; short:string; role:string; source:string; sourceName:string; evidence:string[]; questions:[Question,Question]; parts:ModelPart[] }
const part=(id:string,kind:ModelPart['kind'],position:ModelPart['position'],scale:ModelPart['scale'],color:string):ModelPart=>({id,kind,position,scale,color,rotation:[0,0,0]});
const cel='#83ad98', wood='#8b6747', stone='#92918a', gold='#b69b62';
export const artifacts:Artifact[]=[
 {id:'buddha',name:'논산 관촉사 석조미륵보살입상',short:'관촉사 미륵보살',role:'선생님 시범',source:'https://www.heritage.go.kr/heri/cul/culGuidePostDetail.do?ccbaCpno=1113403230000&ccgbGbtype=IND&ccgbGbtypeNo=1&pageNo=1_5_0_0',sourceName:'국가유산포털 · 관촉사 안내판',evidence:['논산 관촉사의 석조미륵보살입상은 높이 약 18m의 석불로 은진미륵이라고도 불립니다.','고려 초 불교 예술의 대범한 모습과 지방의 특색을 보여 줍니다.'],questions:[
  {statement:'관촉사 석조미륵보살입상은 돌로 만든 불상이다.',answer:'O',reason:'석조는 돌로 만들었다는 뜻이에요.',robot:'O예요. 돌로 만든 거대한 보살상이에요.'},
  {statement:'이 불상은 높이가 약 18m이다.',answer:'O',reason:'안내판에서 높이 약 18m라고 확인할 수 있어요.',robot:'O예요. 높이가 약 18m인 커다란 석불이에요.'}],parts:[part('base','box',[0,.08,0],[1,.16,.6],stone),part('body','cylinder',[0,.8,0],[.6,1.35,.5],stone),part('head','cylinder',[0,1.62,0],[.55,.5,.48],stone),part('hat','box',[0,1.98,0],[.8,.18,.6],stone)]},
 {id:'type',name:'고려 금속활자',short:'금속활자',role:'학생 탐구',source:'https://www.museum.go.kr/MUSEUM/contents/M0701010000.do?arcDataType=&arcId=7236&catCustomType=united&catId=128&schM=view',sourceName:'국립중앙박물관 · 고려 금속활자',evidence:['고려의 금속활자 인쇄술로 책을 찍었습니다. 현존하는 가장 오래된 금속활자본 직지는 1377년에 간행되었습니다.','금속활자는 금속으로 글자 하나하나를 만들어 인쇄에 쓰는 도구입니다.'],questions:[
  {statement:'금속활자는 책을 인쇄하는 데 사용한다.',answer:'O',reason:'금속활자를 이용해 책을 찍었어요.',robot:'O예요. 금속으로 만든 글자를 이용해 책을 찍었어요.'},
  {statement:'금속활자는 나무로 만든 글자이다.',answer:'X',reason:'금속활자는 나무가 아니라 금속으로 만들어요.',robot:'X예요. 이름처럼 금속으로 만든 글자예요.'}],parts:[part('base','box',[0,.28,0],[1.05,.55,.85],gold),part('mark1','box',[0,.59,0],[.65,.08,.12],wood),part('mark2','box',[0,.59,0],[.12,.08,.57],wood)]},
 {id:'tripitaka',name:'팔만대장경',short:'팔만대장경',role:'학생 탐구',source:'https://www.heritage.go.kr/heri/html/HtmlPage.do?pg=%2Fhwalja%2Fhwalja02_01.jsp',sourceName:'국가유산포털 · 고려대장경',evidence:['고려대장경은 불교 경전을 새긴 목판으로 인쇄한 대장경입니다.','대장경판은 8만여 개에 이르러 팔만대장경이라고도 부르며, 해인사에 대장경판이 보관됩니다.'],questions:[
  {statement:'팔만대장경은 불교 경전을 나무판에 새겨 인쇄하는 것과 관련이 있다.',answer:'O',reason:'대장경판은 불교 경전을 새긴 나무판이에요.',robot:'O예요. 불교 경전을 나무판에 새겨 인쇄했어요.'},
  {statement:'팔만대장경을 찍는 대장경판은 금속판으로 만들었다.',answer:'X',reason:'대장경판은 금속판이 아닌 나무판이에요.',robot:'O예요. 대장경판은 금속판으로 만들어 책을 찍었어요.',deliberatelyWrong:true}],parts:[part('plate','box',[0,.25,0],[1.55,.3,.9],wood),part('rim1','box',[-.68,.3,0],[.15,.4,1],gold),part('rim2','box',[.68,.3,0],[.15,.4,1],gold)]},
 {id:'vase',name:'청자 상감운학문 매병',short:'청자 매병',role:'학생 탐구',source:'https://www.museum.go.kr/CHILD/contents/C1100000000.do?exT=&schExiId=23&schM=view',sourceName:'국립중앙박물관 어린이박물관 · 청자',evidence:['청자 상감 구름 학무늬 매병에는 구름과 학 무늬가 표현되어 있습니다.','상감은 표면에 무늬를 새기고 다른 색의 흙을 채워 무늬를 나타내는 방법입니다.'],questions:[
  {statement:'청자 상감운학문 매병에는 구름과 학 무늬가 있다.',answer:'O',reason:'운학문은 구름과 학 무늬를 뜻해요.',robot:'O예요. 구름과 학 무늬가 있어요.'},
  {statement:'상감은 무늬를 파고 다른 색의 흙을 채우는 기법이다.',answer:'O',reason:'무늬를 새긴 자리에 다른 색 흙을 채워요.',robot:'O예요. 새긴 부분에 다른 색 흙을 채워 무늬를 나타내요.'}],parts:[part('foot','cylinder',[0,.1,0],[.65,.2,.65],cel),part('body','cylinder',[0,.62,0],[1.05,.9,1.05],cel),part('shoulder','cylinder',[0,1.13,0],[.85,.2,.85],cel),part('neck','cylinder',[0,1.32,0],[.37,.24,.37],cel)]},
 {id:'incense',name:'청자 투각칠보문뚜껑 향로',short:'칠보무늬 향로',role:'학생 탐구',source:'https://www.museum.go.kr/MUSEUM/contents/M0201020000.do?relicId=1227&schM=search',sourceName:'국립중앙박물관 · 청자 투각 칠보무늬 향로',evidence:['향로는 향을 태우는 몸통, 향이 빠져나가는 뚜껑과 받침으로 이루어져 있습니다.','뚜껑에 칠보무늬를 뚫어 나타낸 투각 기법이 사용되었습니다.'],questions:[
  {statement:'이 향로는 향을 태우는 데 쓴다.',answer:'O',reason:'향로의 몸통에서 향을 태워요.',robot:'O예요. 몸통에서 향을 태우는 도구예요.'},
  {statement:'향로의 뚜껑에는 칠보무늬를 뚫어 나타낸 부분이 있다.',answer:'O',reason:'뚜껑의 칠보무늬는 투각 기법으로 만들었어요.',robot:'O예요. 뚜껑에 칠보무늬를 뚫어 표현했어요.'}],parts:[part('base','cylinder',[0,.1,0],[.9,.2,.9],cel),part('body','cylinder',[0,.45,0],[1,.55,1],cel),part('lid','ring',[0,.85,0],[.8,.8,.8],cel),part('top','cylinder',[0,1,0],[.28,.4,.28],cel)]},
 {id:'lacquer',name:'고려 나전칠기 · 나전 경전함',short:'나전칠기',role:'선택 탐구 · 아직 배우지 않음',source:'https://www.museum.go.kr/MUSEUM/contents/M0501000000.do?relicRecommendId=140602&schM=view',sourceName:'국립중앙박물관 · 나전 경전함',evidence:['나전은 전복이나 소라 등 조개껍데기의 안쪽을 얇게 갈고 무늬대로 오려 장식하는 기법입니다.','고려의 나전 경전함은 불교 경전을 담는 함입니다.'],questions:[
  {statement:'나전 장식에는 얇게 간 조개껍데기를 사용한다.',answer:'O',reason:'나전은 조개껍데기를 무늬대로 오려 장식해요.',robot:'O예요. 얇게 간 조개껍데기로 무늬를 만들어요.'},
  {statement:'나전 경전함은 불교 경전을 담는 함이다.',answer:'O',reason:'경전함은 불교 경전을 보관하는 함이에요.',robot:'O예요. 불교 경전을 담아 보관하는 함이에요.'}],parts:[part('box','box',[0,.38,0],[1.3,.7,.8],'#302d2b'),part('lid','box',[0,.79,0],[1.38,.13,.88],'#49382e'),part('decor','box',[0,.88,0],[.7,.05,.35],'#d5d1ae')]}
];
