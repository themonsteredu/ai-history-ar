export const heritageImages = [
  "muryeong-tomb.jpg",
  "baekje-incense-burner.jpg",
  "cheomseongdae.jpg",
  "silla-crown.jpg",
  "goguryeo-mural.jpg",
  "gaya-tombs.jpg",
] as const;

export type EvidenceKind = "confirmed" | "caution";

export interface EvidenceFact {
  id: string;
  kind: EvidenceKind;
  text: string;
}

export interface ResearchSource {
  id: string;
  label: string;
  institution: string;
  title: string;
  readGuide: string;
  facts: readonly EvidenceFact[];
  href: string;
}

export interface HeritageResearchCase {
  id: number;
  heritage: string;
  category: string;
  question: string;
  image: string;
  sources: readonly ResearchSource[];
}

const museumMuryeong = "https://www.museum.go.kr/MUSEUM/contents/M0501000000.do?relicRecommendId=16892&schM=view";
const museumBurner = "https://buyeo.museum.go.kr/rprsPsn/view.do?key=2302150017&rprsPsnCmdtyMngSn=2001010001";
const heritageCheomseongdae = "https://www.heritage.go.kr/heri/cul/culGuidePostDetail.do?ccbaCpno=1113700310000&ccgbGbtype=IND&ccgbGbtypeNo=2&pageNo=1_5_0_0";
const museumCrown = "https://www.museum.go.kr/MUSEUM/contents/M0501000000.do?pageSize=10&relicRecommendId=519954&schM=view";
const unescoKoguryo = "https://whc.unesco.org/en/list/1091";
const heritageGaya = "https://www.heritage.go.kr/heri/cul/culGuidePostDetail.do?ccbaCpno=1333803410000&ccgbGbtype=UNI&ccgbGbtypeNo=2&pageNo=1_1_5_0";

export const heritageResearchCases: readonly HeritageResearchCase[] = [
  {
    id: 1,
    heritage: "무령왕릉",
    category: "백제",
    question: "이름이 적힌 돌로 무덤 주인을 어떻게 알게 되었을까?",
    image: heritageImages[0],
    sources: [
      {
        id: "m1-record",
        label: "자료 1 · 발견 기록",
        institution: "국립중앙박물관",
        title: "물을 빼는 길을 만들다가 찾은 벽돌무덤",
        readGuide: "언제, 어떤 상황에서 발견되었는지 찾으세요.",
        facts: [
          { id: "m1-a", kind: "confirmed", text: "무령왕릉은 1971년 송산리 옛 무덤 주변에서 물을 빼는 길을 만들다가 발견했다." },
          { id: "m1-b", kind: "confirmed", text: "무덤은 벽돌을 쌓아 만든 벽돌무덤이다." },
        ],
        href: museumMuryeong,
      },
      {
        id: "m1-clue",
        label: "자료 2 · 유물 단서",
        institution: "국립중앙박물관",
        title: "무덤 주인의 이름을 적은 돌, 지석",
        readGuide: "돌에 적힌 글자로 무엇을 알게 되었는지 살펴보세요.",
        facts: [
          { id: "m1-c", kind: "confirmed", text: "지석에 적힌 글자를 읽고 무령왕과 왕비의 무덤임을 확인했다." },
          { id: "m1-d", kind: "confirmed", text: "무덤 안에서는 금동신발, 청동거울, 도자기 등 여러 유물이 나왔다." },
        ],
        href: museumMuryeong,
      },
      {
        id: "m1-limit",
        label: "자료 3 · 조심할 점",
        institution: "국립중앙박물관 전시 해설",
        title: "무덤을 조사한 기록만으로 모든 일을 알 수는 없다",
        readGuide: "확인된 사실과 우리가 짐작한 장면을 구분하세요.",
        facts: [
          { id: "m1-e", kind: "caution", text: "지석만으로 물건을 왜 그 자리에 놓았는지, 장례를 어떻게 치렀는지 모두 알 수는 없다." },
        ],
        href: museumMuryeong,
      },
    ],
  },
  {
    id: 2,
    heritage: "백제 금동대향로",
    category: "백제",
    question: "향로에는 어떤 모습이 있고, 그 모습은 무엇을 뜻할까?",
    image: heritageImages[1],
    sources: [
      {
        id: "b2-record",
        label: "자료 1 · 발견한 곳",
        institution: "국립부여박물관",
        title: "능산리 절터에서 나온 향로",
        readGuide: "발견 장소와 재료를 찾아보세요.",
        facts: [
          { id: "b2-a", kind: "confirmed", text: "백제 금동대향로는 1993년 부여 능산리 절터에서 발견되었다." },
          { id: "b2-b", kind: "confirmed", text: "청동으로 만들고 겉에 금을 입혔다. 이것을 금동이라고 한다." },
        ],
        href: museumBurner,
      },
      {
        id: "b2-shape",
        label: "자료 2 · 모양 관찰",
        institution: "국립부여박물관",
        title: "봉황·산봉우리·연꽃·용",
        readGuide: "사진에서 어떤 모습이 보이는지 찾아보세요.",
        facts: [
          { id: "b2-c", kind: "confirmed", text: "꼭대기에는 봉황, 받침에는 용이 표현되어 있다." },
          { id: "b2-d", kind: "confirmed", text: "산봉우리와 연꽃, 악기를 연주하는 사람과 여러 동물의 모습이 작은 부분까지 자세히 새겨져 있다." },
        ],
        href: museumBurner,
      },
      {
        id: "b2-limit",
        label: "자료 3 · 조심할 점",
        institution: "국립부여박물관 소장품 해설",
        title: "모든 무늬의 뜻이 하나로 정해진 것은 아니다",
        readGuide: "눈에 보이는 모양과 그 뜻에 대한 우리 생각을 나누어 말하세요.",
        facts: [
          { id: "b2-e", kind: "caution", text: "향로에 새긴 모든 사람과 동물의 뜻을 하나로 정해 말할 수는 없다." },
        ],
        href: museumBurner,
      },
    ],
  },
  {
    id: 3,
    heritage: "첨성대",
    category: "신라",
    question: "첨성대에서 하늘을 어떻게 살폈을까? 어디까지 알 수 있을까?",
    image: heritageImages[2],
    sources: [
      {
        id: "c3-record",
        label: "자료 1 · 국가유산 기록",
        institution: "국가유산청",
        title: "선덕여왕 때 세운 것으로 보는 돌 건축물",
        readGuide: "시기와 재료를 확인하세요.",
        facts: [
          { id: "c3-a", kind: "confirmed", text: "첨성대는 신라 선덕여왕 때 세운 것으로 본다." },
          { id: "c3-b", kind: "confirmed", text: "다듬은 돌을 층층이 쌓아 만든 건축물이다." },
        ],
        href: heritageCheomseongdae,
      },
      {
        id: "c3-use",
        label: "자료 2 · 어디에 썼을까?",
        institution: "국가유산청",
        title: "하늘의 별 등을 살피는 데 쓴 것으로 보는 시설",
        readGuide: "공식 설명이 어디까지 말하는지 읽으세요.",
        facts: [
          { id: "c3-c", kind: "confirmed", text: "첨성대는 신라에서 하늘의 별 등을 살피는 데 쓴 것으로 설명된다." },
          { id: "c3-d", kind: "confirmed", text: "몸통 가운데에 네모난 창이 있고 위아래의 돌을 쌓은 모습이 다르다." },
        ],
        href: heritageCheomseongdae,
      },
      {
        id: "c3-limit",
        label: "자료 3 · 아직 모르는 점",
        institution: "국가유산청 안내 비교",
        title: "하늘을 정확히 어떻게 살폈는지는 아직 알기 어렵다",
        readGuide: "하늘을 살폈다는 것과, 어떤 자세나 도구로 살폈는지는 나누어 생각하세요.",
        facts: [
          { id: "c3-e", kind: "caution", text: "첨성대에서 누가 어떤 자세와 도구로 하늘을 살폈는지는 아직 하나로 밝혀지지 않았다." },
        ],
        href: heritageCheomseongdae,
      },
    ],
  },
  {
    id: 4,
    heritage: "신라 금관",
    category: "신라",
    question: "금관의 모양과 발견한 곳을 보면 어떻게 썼는지 알 수 있을까?",
    image: heritageImages[3],
    sources: [
      {
        id: "s4-record",
        label: "자료 1 · 소장품 기록",
        institution: "국립중앙박물관",
        title: "왕의 무덤만큼 큰 무덤에서 나온 금관",
        readGuide: "어디에서 어떤 상태로 발견되었는지 확인하세요.",
        facts: [
          { id: "s4-a", kind: "confirmed", text: "신라 금관은 왕의 무덤만큼 큰 무덤에서 다른 물건과 함께 묻힌 채 발견되었다." },
          { id: "s4-b", kind: "confirmed", text: "얇은 금판으로 만든 금관은 무덤에 묻힌 사람이 높은 신분이었음을 보여 준다." },
        ],
        href: museumCrown,
      },
      {
        id: "s4-shape",
        label: "자료 2 · 모양 관찰",
        institution: "국립중앙박물관",
        title: "위로 세운 장식과 굽은 모양의 옥",
        readGuide: "사진에서 반복되는 장식을 찾아보세요.",
        facts: [
          { id: "s4-c", kind: "confirmed", text: "금관에는 나뭇가지 모양으로 위로 세운 장식이 있다." },
          { id: "s4-d", kind: "confirmed", text: "굽은 모양의 옥과 둥글고 얇은 장식이 달려 있다." },
        ],
        href: museumCrown,
      },
      {
        id: "s4-limit",
        label: "자료 3 · 아직 모르는 점",
        institution: "국립중앙박물관 소장품 해설",
        title: "실제로 머리에 썼는지는 더 살펴야 한다",
        readGuide: "‘금관’이라는 이름만 듣고 평소에 썼을 것이라고 정해 말하지 마세요.",
        facts: [
          { id: "s4-e", kind: "caution", text: "금관을 살아 있을 때 썼는지, 장례 때 묻으려고 만들었는지는 아직 확실히 알기 어렵다." },
        ],
        href: museumCrown,
      },
    ],
  },
  {
    id: 5,
    heritage: "고구려 고분벽화",
    category: "고구려",
    question: "벽화는 고구려인의 생활과 믿음을 어디까지 보여 줄까?",
    image: heritageImages[4],
    sources: [
      {
        id: "g5-record",
        label: "자료 1 · 세계유산 기록",
        institution: "유네스코 세계유산센터",
        title: "왕족과 귀족의 무덤에 남은 벽화",
        readGuide: "어떤 사람들의 무덤인지 살펴보세요.",
        facts: [
          { id: "g5-a", kind: "confirmed", text: "고구려 고분벽화는 왕족과 귀족의 무덤에 남아 있다." },
          { id: "g5-b", kind: "confirmed", text: "벽화는 고구려의 문화와 장례 모습을 알려 주는 자료이다." },
        ],
        href: unescoKoguryo,
      },
      {
        id: "g5-scene",
        label: "자료 2 · 장면 관찰",
        institution: "유네스코 세계유산센터",
        title: "생활·사냥·줄지어 가는 사람들·지켜 주는 신의 모습",
        readGuide: "보이는 장면과 그 장면으로 알 수 있는 점을 연결하세요.",
        facts: [
          { id: "g5-c", kind: "confirmed", text: "벽화에는 사람들, 줄지어 가는 모습, 사냥과 생활 모습이 나타난다." },
          { id: "g5-d", kind: "confirmed", text: "네 방향을 지켜 주는 신을 그린 사신도 등에서 죽은 뒤의 세계를 어떻게 생각했는지 살펴볼 수 있다." },
        ],
        href: unescoKoguryo,
      },
      {
        id: "g5-limit",
        label: "자료 3 · 조심할 점",
        institution: "유네스코 자료 비교",
        title: "벽화 한 장이 모든 사람의 삶은 아니다",
        readGuide: "누구의 무덤에 그린 그림인지 확인하세요.",
        facts: [
          { id: "g5-e", kind: "caution", text: "왕의 가족과 높은 신분의 사람들 무덤에 남은 그림을 보고, 모든 고구려 사람이 똑같이 살았다고 말할 수는 없다." },
        ],
        href: unescoKoguryo,
      },
    ],
  },
  {
    id: 6,
    heritage: "가야 고분군",
    category: "가야",
    question: "여러 지역의 가야 무덤은 무엇이 같고 무엇이 다를까?",
    image: heritageImages[5],
    sources: [
      {
        id: "a6-record",
        label: "자료 1 · 국가유산 기록",
        institution: "국가유산청",
        title: "여러 지역에 남은 옛 무덤 무리 일곱 곳",
        readGuide: "옛 무덤이 몇 곳에, 어디에 모여 있는지 확인하세요.",
        facts: [
          { id: "a6-a", kind: "confirmed", text: "가야고분군 세계유산은 여러 지역의 일곱 고분군으로 이루어져 있다." },
          { id: "a6-b", kind: "confirmed", text: "1세기부터 6세기 무렵 가야의 여러 작은 나라가 무덤을 어떻게 만들었는지 보여 준다." },
        ],
        href: heritageGaya,
      },
      {
        id: "a6-relation",
        label: "자료 2 · 같은 점과 다른 점",
        institution: "국가유산청",
        title: "공통점과 지역 차이가 함께 보이는 무덤",
        readGuide: "같은 점과 다른 점을 모두 찾아보세요.",
        facts: [
          { id: "a6-c", kind: "confirmed", text: "무덤과 그 안에 함께 묻은 물건에는 지역마다 같은 점과 다른 점이 보인다." },
          { id: "a6-d", kind: "confirmed", text: "흙으로 만든 그릇과 주고받은 물건은 가야의 여러 작은 나라가 서로 오갔음을 보여 준다." },
        ],
        href: heritageGaya,
      },
      {
        id: "a6-limit",
        label: "자료 3 · 조심할 점",
        institution: "국가유산청 세계유산 해설",
        title: "가야를 처음부터 한 나라로 보면 안 된다",
        readGuide: "가야에 여러 작은 나라가 있었다는 점을 생각하세요.",
        facts: [
          { id: "a6-e", kind: "caution", text: "가야를 처음부터 왕 한 명이 모두 다스린 나라라고 말해서는 안 된다." },
        ],
        href: heritageGaya,
      },
    ],
  },
];

export type QuizVerdict = "확인됨" | "틀림" | "판단 보류";

export interface VerificationQuestion {
  id: string;
  statement: string;
  verdict: QuizVerdict;
  explanation: string;
}

export interface VerificationCase {
  id: number;
  heritage: string;
  sourceLabel: string;
  sourceHref: string;
  questions: readonly VerificationQuestion[];
}

export const verificationCases: readonly VerificationCase[] = [
  {
    id: 1, heritage: "무령왕릉", sourceLabel: "국립중앙박물관 무령왕릉 해설", sourceHref: museumMuryeong,
    questions: [
      { id: "m1", statement: "무령왕릉은 1971년 배수로 공사 중 우연히 발견되었다.", verdict: "확인됨", explanation: "1971년 송산리 고분의 배수로 공사 중 발견되었습니다." },
      { id: "m2", statement: "무덤 안 지석 덕분에 무령왕과 왕비의 무덤임을 확인했다.", verdict: "확인됨", explanation: "지석에 무덤 주인과 장례 관련 정보가 남아 있었습니다." },
      { id: "m3", statement: "무령왕릉은 신라 왕의 무덤이다.", verdict: "틀림", explanation: "백제 제25대 무령왕과 왕비의 무덤입니다." },
      { id: "m4", statement: "무령왕릉에서는 금동신발과 청동거울 같은 유물이 나왔다.", verdict: "확인됨", explanation: "장신구, 금동신발, 청동거울, 도자기 등 여러 유물이 출토되었습니다." },
      { id: "m5", statement: "무령왕릉은 나무만으로 만든 무덤이다.", verdict: "틀림", explanation: "벽돌을 쌓아 만든 벽돌무덤입니다." },
    ],
  },
  {
    id: 2, heritage: "백제 금동대향로", sourceLabel: "국립부여박물관 대표 소장품", sourceHref: museumBurner,
    questions: [
      { id: "b1", statement: "백제 금동대향로는 1993년 부여 능산리 절터에서 발견되었다.", verdict: "확인됨", explanation: "부여 능산리 절터 발굴 중 출토되었습니다." },
      { id: "b2", statement: "향로 꼭대기에는 봉황이 표현되어 있다.", verdict: "확인됨", explanation: "꼭대기의 봉황과 받침의 용이 특징입니다." },
      { id: "b3", statement: "백제 금동대향로는 순금만으로 만들었다.", verdict: "틀림", explanation: "청동으로 만들고 표면에 금을 입힌 금동 유물입니다." },
      { id: "b4", statement: "향로에는 산, 연꽃, 악사와 여러 동물이 표현되어 있다.", verdict: "확인됨", explanation: "다양한 인물과 동물, 식물 형상이 정교하게 새겨져 있습니다." },
      { id: "b5", statement: "향로에 새겨진 모든 형상의 뜻은 하나로 완전히 밝혀졌다.", verdict: "판단 보류", explanation: "보이는 형상은 확인할 수 있지만 모든 의미를 하나로 단정하기는 어렵습니다." },
    ],
  },
  {
    id: 3, heritage: "첨성대", sourceLabel: "국가유산청 경주 첨성대 안내", sourceHref: heritageCheomseongdae,
    questions: [
      { id: "c1", statement: "첨성대는 신라 선덕여왕 때 세운 것으로 본다.", verdict: "확인됨", explanation: "국가유산 안내는 선덕여왕 재위 때 축조된 것으로 설명합니다." },
      { id: "c2", statement: "첨성대는 다듬은 돌을 층층이 쌓은 건축물이다.", verdict: "확인됨", explanation: "돌을 쌓아 올린 석조 건축물입니다." },
      { id: "c3", statement: "첨성대는 나무로만 지은 건물이다.", verdict: "틀림", explanation: "첨성대는 돌로 만든 건축물입니다." },
      { id: "c4", statement: "첨성대는 천문 관측과 관련된 시설로 설명된다.", verdict: "확인됨", explanation: "국가유산 안내에서 신라의 천문 관측과 관련된 시설로 설명합니다." },
      { id: "c5", statement: "첨성대에서 매일 어떤 방식으로 관측했는지 모두 밝혀졌다.", verdict: "판단 보류", explanation: "구체적인 사용 방식에는 여러 해석이 있어 하나로 단정하기 어렵습니다." },
    ],
  },
  {
    id: 4, heritage: "신라 금관", sourceLabel: "국립중앙박물관 신라 금관 해설", sourceHref: museumCrown,
    questions: [
      { id: "s1", statement: "신라 금관은 왕릉급 무덤의 부장품으로 발견되었다.", verdict: "확인됨", explanation: "무덤에 묻힌 사람의 권위를 드러내는 유물이었습니다." },
      { id: "s2", statement: "금관에는 나뭇가지 모양 세움 장식과 굽은옥이 보인다.", verdict: "확인됨", explanation: "세움 장식과 굽은옥은 신라 금관의 대표 특징입니다." },
      { id: "s3", statement: "발견된 금관은 모두 머리에 쓴 상태였다.", verdict: "틀림", explanation: "얼굴을 덮는 위치 등 여러 상태로 발견된 사례가 있습니다." },
      { id: "s4", statement: "신라 사람들이 금관을 평소 노동할 때 매일 썼다.", verdict: "틀림", explanation: "무덤 부장품의 성격이 강해 일상 착용으로 볼 근거가 없습니다." },
      { id: "s5", statement: "신라 금관의 정확한 사용 방식은 한 가지 결론만 있다.", verdict: "판단 보류", explanation: "실제 착용과 장례용 제작 등 여러 해석의 근거를 비교해야 합니다." },
    ],
  },
  {
    id: 5, heritage: "고구려 고분벽화", sourceLabel: "유네스코 고구려 고분군", sourceHref: unescoKoguryo,
    questions: [
      { id: "g1", statement: "고구려 고분벽화에는 당시 사람들의 생활 모습이 담겨 있다.", verdict: "확인됨", explanation: "인물, 행렬, 사냥, 생활 장면은 고구려 문화를 이해하는 자료입니다." },
      { id: "g2", statement: "발견된 모든 고구려 무덤에 벽화가 있다.", verdict: "틀림", explanation: "벽화가 있는 무덤은 발견된 고구려 무덤 중 일부입니다." },
      { id: "g3", statement: "벽화무덤은 왕족과 귀족의 장례와 관련된 것으로 본다.", verdict: "확인됨", explanation: "유네스코 설명은 왕족과 귀족의 무덤으로 봅니다." },
      { id: "g4", statement: "고분벽화는 고구려인의 사후 세계관을 보여 준다.", verdict: "확인됨", explanation: "생활과 수호신 그림에서 삶과 죽음에 대한 믿음을 살필 수 있습니다." },
      { id: "g5", statement: "벽화 한 장만 보면 모든 고구려 사람의 생활을 알 수 있다.", verdict: "판단 보류", explanation: "왕족과 귀족 무덤의 자료를 모든 사람의 삶으로 일반화할 수는 없습니다." },
    ],
  },
  {
    id: 6, heritage: "가야 고분군", sourceLabel: "국가유산청 가야고분군", sourceHref: heritageGaya,
    questions: [
      { id: "a1", statement: "가야고분군 세계유산은 일곱 고분군으로 이루어져 있다.", verdict: "확인됨", explanation: "김해, 함안, 합천, 고령 등 여러 지역의 일곱 고분군이 연속유산을 이룹니다." },
      { id: "a2", statement: "가야고분군은 1세기부터 6세기 무렵의 가야를 보여 준다.", verdict: "확인됨", explanation: "가야 정치체와 매장 문화를 보여 주는 지배층 무덤입니다." },
      { id: "a3", statement: "가야는 처음부터 하나의 중앙집권 국가로만 운영되었다.", verdict: "틀림", explanation: "여러 정치체가 자율성과 수평적 관계를 유지한 특징을 보입니다." },
      { id: "a4", statement: "무덤의 껴묻거리는 가야 여러 지역의 교류를 보여 준다.", verdict: "확인됨", explanation: "토기와 교역품에서 지역성과 교류 관계를 확인할 수 있습니다." },
      { id: "a5", statement: "가야고분군에는 무덤이 한 기만 남아 있다.", verdict: "틀림", explanation: "여러 지역에 군집을 이룬 많은 고분으로 구성됩니다." },
    ],
  },
];

/**
 * 2차시 공통 어휘.
 * PPT(scripts/generate_lesson2_onepage.py)·활동지·활동 화면이 모두 이 표현을 그대로 사용합니다.
 */
export const judgementMarks = [
  { symbol: "○", meaning: "자료로 확인" },
  { symbol: "×", meaning: "자료와 다름" },
  { symbol: "△", meaning: "의견 나뉨·근거 부족" },
  { symbol: "?", meaning: "더 찾아봐야 함" },
] as const;

export interface LessonTwoStatement {
  id: string;
  text: string;
}

export interface LessonTwoStatementSet {
  groupId: number;
  heritage: string;
  aiQuestion: string;
  statements: readonly LessonTwoStatement[];
}

export const lessonTwoStatementSets: readonly LessonTwoStatementSet[] = [
  {
    groupId: 1,
    heritage: "무령왕릉",
    aiQuestion: "무령왕릉은 어떻게 발견되었고, 무엇을 알게 되었나요?",
    statements: [
      { id: "g1-1", text: "무령왕릉은 1971년 공주 송산리 고분군의 배수로 공사 중 우연히 발견되었습니다." },
      { id: "g1-2", text: "무덤 안의 지석 덕분에 무덤의 주인이 무령왕과 왕비라는 사실을 확인할 수 있었습니다." },
      { id: "g1-3", text: "발견 당시 이미 여러 차례 도굴되어 중요한 유물 대부분이 사라진 상태였습니다." },
      { id: "g1-4", text: "무령왕릉을 처음 발견한 사람은 현장 학습을 온 초등학생이었습니다." },
      { id: "g1-5", text: "무덤 안에서는 진묘수, 금제 관식, 금동 신발, 청동 거울 등 여러 유물이 나왔습니다." },
      { id: "g1-6", text: "지석만 읽으면 장례의 모든 과정과 유물 하나하나의 정확한 쓰임까지 완전히 알 수 있습니다." },
    ],
  },
  {
    groupId: 2,
    heritage: "백제 금동대향로",
    aiQuestion: "백제 금동대향로는 어디에서 발견되었고, 어떤 모습인가요?",
    statements: [
      { id: "g2-1", text: "백제 금동대향로는 1993년 부여 능산리 절터를 발굴하던 중 발견되었습니다." },
      { id: "g2-2", text: "이 향로는 청동으로 만든 뒤 표면에 금을 입힌 금동 유물입니다." },
      { id: "g2-3", text: "향로는 백제 왕의 무덤 안에서 발견되었습니다." },
      { id: "g2-4", text: "향로의 꼭대기에는 봉황, 받침에는 용이 있고 산·연꽃·동물·악사도 표현되어 있습니다." },
      { id: "g2-5", text: "향로에 새겨진 모든 동물과 인물이 무엇을 뜻하는지 당시 기록에 남아 있어 완전히 밝혀졌습니다." },
      { id: "g2-6", text: "이 향로는 신라의 황룡사에서 만들어져 발견된 유물입니다." },
    ],
  },
  {
    groupId: 3,
    heritage: "첨성대",
    aiQuestion: "첨성대는 무엇을 하던 곳이며, 사용 방법은 모두 밝혀졌나요?",
    statements: [
      { id: "g3-1", text: "첨성대는 경주에 남아 있는 돌로 쌓은 신라시대 건축물입니다." },
      { id: "g3-2", text: "국가유산 안내에서는 첨성대를 선덕여왕 때 세운 천문 관측대로 설명합니다." },
      { id: "g3-3", text: "첨성대 꼭대기에는 별을 확대해서 보는 망원경이 설치되어 있었습니다." },
      { id: "g3-4", text: "첨성대는 나무 기둥과 기와로만 만든 건물이었습니다." },
      { id: "g3-5", text: "첨성대의 돌 개수와 모든 층의 수가 달력을 뜻한다는 사실이 옛 문헌으로 완전히 증명되었습니다." },
      { id: "g3-6", text: "신라 사람들이 첨성대 안팎에서 별을 관찰한 정확한 방법은 학자들이 모두 같은 결론을 내렸습니다." },
    ],
  },
  {
    groupId: 4,
    heritage: "신라 금관",
    aiQuestion: "신라 금관은 누가, 언제, 어떻게 사용했나요?",
    statements: [
      { id: "g4-1", text: "신라 금관은 왕릉급의 큰 무덤에서 권위를 보여 주는 부장품으로 발견되었습니다." },
      { id: "g4-2", text: "금관에는 얇은 금판으로 만든 세움 장식과 굽은옥 같은 장식이 보입니다." },
      { id: "g4-3", text: "신라 금관은 오직 왕의 무덤에서만 발견되었으므로 모두 왕이 쓴 왕관입니다." },
      { id: "g4-4", text: "발견된 금관은 모두 무덤 주인의 머리에 똑바로 씌워진 상태였습니다." },
      { id: "g4-5", text: "신라 사람들은 금관을 농사나 일상 노동을 할 때도 매일 쓰고 다녔습니다." },
      { id: "g4-6", text: "금관이 생전에 실제로 착용된 것인지 장례를 위해 제작된 것인지에 대해서는 여러 연구 의견이 있습니다." },
    ],
  },
  {
    groupId: 5,
    heritage: "고구려 고분벽화",
    aiQuestion: "고구려 고분벽화에는 어떤 장면이 있으며, 무엇을 알 수 있나요?",
    statements: [
      { id: "g5-1", text: "고구려 고분벽화에는 사냥, 행렬, 생활 모습, 무늬와 사신도 같은 그림이 남아 있습니다." },
      { id: "g5-2", text: "벽화무덤은 주로 왕족과 귀족의 무덤과 관련된 것으로 설명됩니다." },
      { id: "g5-3", text: "발견된 고구려 무덤에는 하나도 빠짐없이 모두 벽화가 그려져 있습니다." },
      { id: "g5-4", text: "고구려 고분벽화는 모두 현재 대한민국 안에서만 발견되었습니다." },
      { id: "g5-5", text: "벽화에 보이는 장면은 모든 고구려 사람의 하루를 사진처럼 정확히 보여 줍니다." },
      { id: "g5-6", text: "한 명의 유명한 화가가 고구려의 모든 고분벽화를 혼자 그렸다는 기록이 남아 있습니다." },
    ],
  },
  {
    groupId: 6,
    heritage: "가야 고분군",
    aiQuestion: "가야 고분군은 어떤 나라의 모습을 보여 주나요?",
    statements: [
      { id: "g6-1", text: "가야 고분군 세계유산은 여러 지역에 있는 일곱 고분군으로 이루어져 있습니다." },
      { id: "g6-2", text: "가야는 여러 정치체가 함께 존재한 연맹적 성격을 지녔으며 지역마다 차이도 있었습니다." },
      { id: "g6-3", text: "가야는 처음부터 한 명의 왕이 모든 지역을 다스린 하나의 중앙집권 제국이었습니다." },
      { id: "g6-4", text: "세계유산에 포함된 가야 고분군 일곱 곳은 모두 같은 한 도시 안에 있습니다." },
      { id: "g6-5", text: "가야 고분군은 2023년에 유네스코 세계유산으로 등재되었습니다." },
      { id: "g6-6", text: "고분 하나마다 묻힌 사람의 이름과 일생이 모두 문헌에 남아 있어 정확히 알 수 있습니다." },
    ],
  },
];

/**
 * 4차시 공통 항목.
 * PPT(scripts/generate_lesson4_datacards.py)·활동지·활동 화면·학급 표가 모두 이 일곱 이름을 그대로 사용합니다.
 * 여섯 모둠이 같은 항목을 채워야 학급 데이터 표의 한 줄이 됩니다.
 */
export const dataCardFields = [
  { id: "period", label: "시기", hint: "언제 만들었는지 (세기·왕 이름)" },
  { id: "purpose", label: "만든 까닭", hint: "무엇을 위해 만들었는지" },
  { id: "value", label: "가치", hint: "왜 중요한 유산인지" },
  { id: "condition", label: "현재 상태", hint: "지금 어디에 어떤 모습으로 남아 있는지" },
  { id: "correction", label: "AI 오류 바로잡기", hint: "2차시에서 ×였던 문장을 바르게 고쳐 쓰기" },
  { id: "unknown", label: "아직 모름", hint: "자료로 확인되지 않은 점" },
  { id: "source", label: "출처", hint: "확인한 기관 이름" },
] as const;

export type DataCardFieldId = (typeof dataCardFields)[number]["id"];

export type DataCardValues = Record<DataCardFieldId, string>;

export interface ClassDataRow {
  groupId: number;
  heritage: string;
  values: DataCardValues;
  updatedAt: string;
}

export const emptyDataCard = (): DataCardValues =>
  Object.fromEntries(dataCardFields.map((field) => [field.id, ""])) as DataCardValues;

/** 5차시 정제 수업이 그대로 불러 쓰는 학급 표의 열 이름. */
export const classTableColumns = ["모둠", "유산", ...dataCardFields.map((field) => field.label)] as const;

export function classTableCsv(rows: readonly ClassDataRow[]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const body = [...rows]
    .sort((left, right) => left.groupId - right.groupId)
    .map((row) => [`${row.groupId}모둠`, row.heritage, ...dataCardFields.map((field) => row.values[field.id])]);
  return [classTableColumns, ...body].map((line) => line.map((cell) => escape(String(cell ?? ""))).join(",")).join("\r\n");
}

/**
 * 5차시에서 학생이 직접 만드는 비교용 열.
 * 4차시 일곱 항목은 한 칸에 두 가지 정보가 섞여 있다(예: "백제 무령왕 때, 6세기 초" = 나라 + 세기).
 * 그 칸을 쪼개 아래 다섯 열을 만들어야 6~8차시에서 그래프를 그릴 수 있다.
 * PPT(slides.ts)·활동지(generate_printables.py)·지도안이 이 낱말을 그대로 쓴다.
 */
export const cleaningColumns = [
  { id: "country", label: "나라", from: "시기", standards: ["백제", "신라", "고구려", "가야"], rule: "네 나라 가운데 하나로 적습니다." },
  { id: "century", label: "세기", from: "시기", standards: ["1", "4", "5", "6", "7"], rule: "숫자만 적습니다. 물결(~)이면 앞 숫자, ○○○년대는 그다음 세기입니다(500년대 = 6세기)." },
  { id: "kind", label: "자료 종류", from: "유산", standards: ["무덤", "건축물", "공예품", "그림"], rule: "네 가지 가운데 하나로 적습니다." },
  { id: "region", label: "지역", from: "현재 상태", standards: ["충청남도", "경상북도", "북한·중국", "영남 여러 곳"], rule: "지금 남아 있는 시·도로 적습니다. 두 곳에 나뉘어 있으면 ‘확인 필요’." },
  { id: "institution", label: "확인 기관", from: "출처", standards: ["국가유산청", "국립중앙박물관", "국립공주박물관", "국립부여박물관", "유네스코 세계유산센터"], rule: "기관 하나만 적습니다. 비어 있으면 ‘확인 필요’." },
] as const;

/**
 * 2차시 AI 답변에서 옮겨 온 줄.
 * 사실은 틀리지 않았고 **표기와 빈칸만** 어긋난다.
 * (정제 수업과 검증 수업을 섞지 않기 위해서다.)
 */
export const aiDraftRows: readonly { groupId: number; heritage: string; values: DataCardValues }[] = [
  { groupId: 1, heritage: "무령왕릉", values: { period: "백 제 6세기", purpose: "왕과 왕비의 무덤", value: "백제 왕릉", condition: "공주", correction: "", unknown: "", source: "" } },
  { groupId: 2, heritage: "백제 금동대향로", values: { period: "약 1500년 전", purpose: "의례에 쓰려고", value: "백제 공예", condition: "부여", correction: "", unknown: "", source: "" } },
  { groupId: 3, heritage: "첨성대", values: { period: "신라국 600년대", purpose: "하늘을 보려고", value: "오래된 천문 건축물", condition: "경주시", correction: "", unknown: "", source: "" } },
  { groupId: 4, heritage: "신라 금관", values: { period: "Silla 500년대", purpose: "권위를 드러내려고", value: "황금 문화", condition: "경주", correction: "", unknown: "", source: "" } },
  { groupId: 5, heritage: "고구려 고분벽화", values: { period: "고구려 4~7세기", purpose: "무덤 안에 그림", value: "생활 모습", condition: "북한 중국", correction: "", unknown: "", source: "" } },
  { groupId: 6, heritage: "가야 고분군", values: { period: "가야 1세기~6세기", purpose: "지배층 무덤", value: "세계유산", condition: "영남", correction: "", unknown: "", source: "" } },
];

/** 5차시 시작 파일의 열. 4차시 일곱 항목을 그대로 이어받는다. */
export const lessonFiveStartColumns = ["모둠", "기록한 곳", "유산", ...dataCardFields.map((field) => field.label)] as const;

/** 정제한 표의 열 이름. 시작 파일에 다섯 열을 더한 것이며 6~8차시 그래프는 이 표에서 그린다. */
export const cleanedTableColumns = [...lessonFiveStartColumns, ...cleaningColumns.map((column) => column.label)] as const;

/** 같은 모둠이 두 기기에서 올려 두 번 들어온 줄. 5차시 중복 정리 연습에 쓴다. */
const duplicatedGroupIds = [1, 4];

/**
 * 5차시 시작 파일.
 * 우리 모둠 줄 + 두 번 올라온 줄 + 2차시 AI 답변 줄을 합쳐 정제할 거리가 있는 표를 만든다.
 */
export function lessonFiveStartCsv(rows: readonly ClassDataRow[]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const line = (groupId: number, origin: string, heritage: string, values: DataCardValues) =>
    [`${groupId}모둠`, origin, heritage, ...dataCardFields.map((field) => values[field.id] ?? "")];

  const ours = [...rows].sort((left, right) => left.groupId - right.groupId);
  const body = [
    ...ours.map((row) => line(row.groupId, "우리 모둠", row.heritage, row.values)),
    ...ours.filter((row) => duplicatedGroupIds.includes(row.groupId)).map((row) => line(row.groupId, "우리 모둠", row.heritage, row.values)),
    ...aiDraftRows.map((row) => line(row.groupId, "AI 답변", row.heritage, row.values)),
  ];
  return [lessonFiveStartColumns, ...body].map((cells) => cells.map((cell) => escape(String(cell ?? ""))).join(",")).join("\r\n");
}
