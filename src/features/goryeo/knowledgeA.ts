// 공식 기관 자료를 어린이 눈높이로 풀어쓴 설명이에요.
// source는 해당 답변의 근거이며 답변은 원문을 그대로 인용하지 않았어요.
const metal = 'https://www.heritage.go.kr/heri/html/HtmlPage.do?pg=%2Fhwalja%2Fhwalja01.jsp';
const print = 'https://www.heritage.go.kr/heri/html/HtmlPage.do?pg=%2Fhwalja%2Fhwalja01_04.jsp';
const metalObject = 'https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?relicId=1348&schM=view';
const jikji = 'https://www.unesco.org/en/memory-world/baegun-hwasang-chorok-buljo-jikji-simche-yojeol-volii-second-volume-anthology-great-buddhist-priests?hub=915';
const jikjiPlace = 'https://heritage.go.kr/heri/html/HtmlPage.do?pageNo=5_5_3_0&pg=%2Funesco%2FMemHeritage%2FMemHeritage_03.jsp';
const woodblocks = 'https://www.heritage.go.kr/heri/html/HtmlPage.do?pg=%2Fhwalja%2Fhwalja02_01.jsp';
const woodblocksDetail = 'https://www.heritage.go.kr/heri/cul/culSelectDetail.do?ccbaCpno=1113800320000&pageNo=1_1_1_1';
const storage = 'https://heritage.go.kr/heri/html/HtmlPage.do?pageNo=5_5_3_0&pg=%2Funesco%2FMemHeritage%2FMemHeritage_06.jsp';
const buddhaSource = 'https://www.heritage.go.kr/heri/cul/culGuidePostDetail.do?ccbaCpno=1113403230000&ccgbGbtype=IND&ccgbGbtypeNo=1&pageNo=1_5_0_0';
const buddhaDetail = 'https://www.heritage.go.kr/heri/cul/culSelectDetail.do?ccbaCpno=1113403230000&pageNo=1_1_1_1';

export const knowledgeA: Record<string, Array<{topics:string[]; answer:string; source:string}>> = {
  type: [
    {topics:['금속활자재료','활자재료','무엇으로만들','뭘로만들','뭐로만들','재료'], answer:'금속활자는 쇠붙이를 녹여 틀에 부어 만든 글자예요. 국립중앙박물관에 있는 고려 금속활자 한 점은 구리를 섞은 금속으로 만들어졌어요.', source:metalObject},
    {topics:['어디에쓰','어디에사용','무엇에쓰','어떻게쓰','쓰임','용도','사용목적'], answer:'금속활자는 글자를 골라 차례대로 배열한 뒤 책을 인쇄하는 데 쓰였어요.', source:print},
    {topics:['언제','시기','몇년','몇세기'], answer:'금속활자는 고려 시대에 사용했어요. 현존하는 가장 오래된 금속활자 인쇄본인 직지는 1377년에 인쇄했어요.', source:jikji},
    {topics:['인쇄순서','인쇄방법','어떻게찍','어떻게인쇄','책찍는법','책을찍'], answer:'필요한 글자들을 골라 차례대로 틀에 놓고 먹물을 고루 묻힌 뒤 종이를 올려 문질러 찍어요.', source:print},
    {topics:['무슨글자','어떤글자','覆','복자'], answer:'국립중앙박물관에는 ‘덮을 복(覆)’ 글자가 새겨진 고려 금속활자가 있어요. 개성 부근에서 나왔다고 전해져요.', source:metalObject},
    {topics:['활자크기','크기','얼마나작','몇센티'], answer:'국립중앙박물관의 고려 금속활자 ‘복’은 너비 약 1cm, 길이 약 1.2cm인 작은 활자예요.', source:metalObject},
    {topics:['재사용','다시쓰','다시사용','여러번','다른책'], answer:'활자는 글자마다 따로 되어 있어서 필요한 글자를 골라 배열할 수 있어요. 인쇄한 뒤 글자들을 다시 배열해 다른 책을 만들 수 있어요.', source:'https://heritage.go.kr/heri/html/HtmlPage.do?pageNo=3_3_2_0&pg=%2Fmem%2Fmemory_sub01.jsp'},
    {topics:['직지언제','직지몇년','직지년도','1377','직지인쇄시기'], answer:'직지는 고려 시대인 1377년에 금속활자로 인쇄했어요.', source:jikji},
    {topics:['직지어디서','직지만든곳','직지찍은곳','흥덕사','직지인쇄장소'], answer:'직지는 충청북도 청주에 있던 흥덕사에서 금속활자로 인쇄했어요.', source:jikji},
    {topics:['직지어디에있','직지어디있','직지보관','직지소장','직지현재','프랑스'], answer:'금속활자로 인쇄한 직지는 상·하 두 권이었지만 현재 하권만 프랑스 국립도서관에 남아 있어요.', source:jikjiPlace},
    {topics:['직지내용','직지무슨책','직지어떤책','부처의말씀','불교책'], answer:'직지는 백운 스님이 부처와 여러 스님의 가르침 가운데 중요한 내용을 뽑아 엮은 불교 책이에요.', source:jikji},
    {topics:['가장오래','세계최초','세계에서제일','제일오래'], answer:'직지는 지금까지 남아 있는 책 가운데 금속활자로 인쇄한 가장 오래된 책이에요. 그보다 앞선 금속활자 인쇄에 관한 기록도 전해져요.', source:jikji},
  ],
  tripitaka: [
    {topics:['재료','무엇으로만들','뭘로만들','뭐로만들','무슨판','나무판','금속판','목판'], answer:'팔만대장경을 찍는 대장경판은 불교 경전의 글자를 새긴 나무판이에요.', source:woodblocks},
    {topics:['팔만인이유','왜팔만','팔만뜻','이름이유','왜8만'], answer:'경판의 수가 8만여 장에 이르러 팔만대장경이라고 불러요. 고려 시대에 만들어 고려대장경이라고도 해요.', source:woodblocks},
    {topics:['몇장','몇개','개수','판수','얼마나많'], answer:'국가유산포털에 따르면 합천 해인사 대장경판은 81,258장이에요. 그래서 보통 8만여 장이라고 말해요.', source:woodblocksDetail},
    {topics:['보관','어디있','어디에있','어디서볼','장경판전','해인사'], answer:'대장경판은 경상남도 합천의 해인사에 있는 장경판전에 보관돼요. 장경판전은 경판을 보관하는 건물이에요.', source:storage},
    {topics:['언제','시기','몇년','몇세기'], answer:'대장경판은 고려 고종 때인 1237년부터 1248년까지 새겼어요.', source:woodblocks},
    {topics:['왜만들','만든이유','목적','몽골','몽고','침입'], answer:'앞서 만든 대장경판이 몽골 침입 때 불타자, 불교의 힘으로 침입을 물리치고자 다시 만들었어요. 그래서 재조대장경이라고도 해요.', source:woodblocks},
    {topics:['누가만들','누가새겼','만든사람','만든기관','대장도감'], answer:'고려에서는 대장도감이라는 임시 기관을 두고 나라 차원에서 경판을 새겼어요. 많은 사람이 글자를 새기고 내용을 살폈어요.', source:woodblocks},
    {topics:['내용','무슨글','어떤글','무엇을새','무슨책','어떤책','불교경전'], answer:'대장경에는 부처의 가르침을 담은 여러 불교 경전이 들어 있어요. 이 글을 나무판에 새겨 종이에 찍어 책을 만들었어요.', source:woodblocks},
    {topics:['보존방법','어떻게보관','바람','통풍','습기','잘보존'], answer:'장경판전은 자연환경을 이용해 나무 경판을 오래 보존하도록 지은 건물이에요. 햇빛과 바람이 드는 환경을 살펴볼 수 있어요.', source:storage},
    {topics:['차이','금속활자와','금속활자랑','금속활자하고','금속활자와비교'], answer:'대장경판은 나무판에 경전의 글을 한꺼번에 새겨 인쇄해요. 금속활자는 금속 글자들을 골라 배열해 인쇄한다는 점이 달라요.', source:woodblocks},
  ],
  buddha: [
    {topics:['재료','무엇으로만들','뭘로만들','뭐로만들','돌로','석조뜻'], answer:'‘석조’는 돌로 만들었다는 뜻이에요. 관촉사 미륵보살은 돌로 만든 보살상이랍니다.', source:buddhaDetail},
    {topics:['어디있','어디에있','어디서볼','위치','어느절','장소'], answer:'충청남도 논산시에 있는 관촉사에서 볼 수 있어요.', source:buddhaSource},
    {topics:['높이','몇미터','몇m','얼마나커','크기'], answer:'높이가 약 18m에 이르는 아주 큰 석불이에요.', source:buddhaSource},
    {topics:['다른이름','별명','또다른이름','은진미륵'], answer:'관촉사 석조미륵보살입상은 은진미륵이라고도 불러요.', source:buddhaSource},
    {topics:['언제','시대','시기','몇년','몇세기'], answer:'고려 전기에 만든 불상이에요. 절의 기록에 따르면 고려 광종 때 공사를 시작했어요.', source:buddhaSource},
    {topics:['누가만들','누가조각','누가세웠','혜명'], answer:'절에 남은 기록에 따르면 혜명대사가 많은 석공과 함께 만드는 일을 시작했다고 해요.', source:buddhaSource},
    {topics:['만드는데얼마나','몇년걸','만든기간','얼마나걸'], answer:'절에 남은 기록에는 공사를 시작해 완성하기까지 37년이 걸렸다고 적혀 있어요.', source:buddhaSource},
    {topics:['국보','보물','지정'], answer:'관촉사 석조미륵보살입상은 나라가 보호하는 국보예요.', source:buddhaDetail},
    {topics:['무슨보살','어떤보살','미륵보살뜻','불상종류'], answer:'이 상은 서 있는 미륵보살의 모습을 표현한 것이에요. 이름의 ‘입상’은 서 있는 모습을 뜻해요.', source:buddhaDetail},
  ],
};
