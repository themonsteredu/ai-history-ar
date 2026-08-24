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
    question: "지석은 무엇을 알려 주고, 발굴에는 어떤 아쉬움이 남았을까?",
    image: heritageImages[0],
    sources: [
      {
        id: "m1-record",
        label: "자료 1 · 발견 기록",
        institution: "국립중앙박물관",
        title: "배수로 공사 중 발견된 벽돌무덤",
        readGuide: "언제, 어떤 상황에서 발견되었는지 찾으세요.",
        facts: [
          { id: "m1-a", kind: "confirmed", text: "무령왕릉은 1971년 송산리 고분의 배수로 공사 중 발견되었다." },
          { id: "m1-b", kind: "confirmed", text: "무덤은 벽돌을 쌓아 만든 벽돌무덤이다." },
        ],
        href: museumMuryeong,
      },
      {
        id: "m1-clue",
        label: "자료 2 · 유물 단서",
        institution: "국립중앙박물관",
        title: "무덤 주인을 알려 준 지석",
        readGuide: "지석으로 무엇을 확인했는지 살펴보세요.",
        facts: [
          { id: "m1-c", kind: "confirmed", text: "지석의 기록으로 무령왕과 왕비의 무덤임을 확인했다." },
          { id: "m1-d", kind: "confirmed", text: "무덤 안에서는 금동신발, 청동거울, 도자기 등 여러 유물이 나왔다." },
        ],
        href: museumMuryeong,
      },
      {
        id: "m1-limit",
        label: "자료 3 · 조심할 점",
        institution: "국립중앙박물관 전시 해설",
        title: "발굴 기록만으로 모든 장면을 알 수는 없다",
        readGuide: "확인된 사실과 우리가 짐작한 장면을 구분하세요.",
        facts: [
          { id: "m1-e", kind: "caution", text: "유물이 놓인 까닭과 장례의 모든 순간까지 지석만으로 확정할 수는 없다." },
        ],
        href: museumMuryeong,
      },
    ],
  },
  {
    id: 2,
    heritage: "백제 금동대향로",
    category: "백제",
    question: "향로의 여러 형상에서 무엇을 확인하고 무엇을 해석할 수 있을까?",
    image: heritageImages[1],
    sources: [
      {
        id: "b2-record",
        label: "자료 1 · 출토 기록",
        institution: "국립부여박물관",
        title: "능산리 절터에서 나온 향로",
        readGuide: "발견 장소와 재료를 찾아보세요.",
        facts: [
          { id: "b2-a", kind: "confirmed", text: "백제 금동대향로는 1993년 부여 능산리 절터에서 발견되었다." },
          { id: "b2-b", kind: "confirmed", text: "청동으로 만든 뒤 표면에 금을 입힌 금동 유물이다." },
        ],
        href: museumBurner,
      },
      {
        id: "b2-shape",
        label: "자료 2 · 모양 관찰",
        institution: "국립부여박물관",
        title: "봉황·산봉우리·연꽃·용",
        readGuide: "사진에서 실제로 보이는 형상을 확인하세요.",
        facts: [
          { id: "b2-c", kind: "confirmed", text: "꼭대기에는 봉황, 받침에는 용이 표현되어 있다." },
          { id: "b2-d", kind: "confirmed", text: "산봉우리와 연꽃, 악사와 여러 동물 모습이 정교하게 새겨져 있다." },
        ],
        href: museumBurner,
      },
      {
        id: "b2-limit",
        label: "자료 3 · 조심할 점",
        institution: "국립부여박물관 소장품 해설",
        title: "모든 무늬의 뜻이 하나로 정해진 것은 아니다",
        readGuide: "관찰한 모양과 그 뜻에 대한 해석을 구분하세요.",
        facts: [
          { id: "b2-e", kind: "caution", text: "향로에 새긴 모든 인물과 동물의 뜻을 한 가지로 단정해서는 안 된다." },
        ],
        href: museumBurner,
      },
    ],
  },
  {
    id: 3,
    heritage: "첨성대",
    category: "신라",
    question: "천문 관측과 관련 있다는 설명과 정확한 사용 방법을 구분할 수 있을까?",
    image: heritageImages[2],
    sources: [
      {
        id: "c3-record",
        label: "자료 1 · 국가유산 기록",
        institution: "국가유산청",
        title: "선덕여왕 때 세운 것으로 보는 석조 건축물",
        readGuide: "시기와 재료를 확인하세요.",
        facts: [
          { id: "c3-a", kind: "confirmed", text: "첨성대는 신라 선덕여왕 때 세운 것으로 본다." },
          { id: "c3-b", kind: "confirmed", text: "다듬은 돌을 층층이 쌓아 만든 석조 건축물이다." },
        ],
        href: heritageCheomseongdae,
      },
      {
        id: "c3-use",
        label: "자료 2 · 기능 해설",
        institution: "국가유산청",
        title: "천문 관측과 관련된 시설",
        readGuide: "공식 설명이 어디까지 말하는지 읽으세요.",
        facts: [
          { id: "c3-c", kind: "confirmed", text: "첨성대는 신라의 천문 관측과 관련된 시설로 설명된다." },
          { id: "c3-d", kind: "confirmed", text: "몸통 가운데에 네모난 창이 있고 위아래의 돌 구조가 다르다." },
        ],
        href: heritageCheomseongdae,
      },
      {
        id: "c3-limit",
        label: "자료 3 · 판단 보류",
        institution: "국가유산청 안내 비교",
        title: "정확한 관측 방법은 확정하기 어렵다",
        readGuide: "‘천문대였다’와 ‘어떻게 관측했다’를 나누어 생각하세요.",
        facts: [
          { id: "c3-e", kind: "caution", text: "첨성대에서 누가 어떤 자세와 도구로 관측했는지는 하나로 확정되지 않았다." },
        ],
        href: heritageCheomseongdae,
      },
    ],
  },
  {
    id: 4,
    heritage: "신라 금관",
    category: "신라",
    question: "금관의 모양과 출토 위치로 실제 사용 모습을 어디까지 알 수 있을까?",
    image: heritageImages[3],
    sources: [
      {
        id: "s4-record",
        label: "자료 1 · 소장품 기록",
        institution: "국립중앙박물관",
        title: "왕릉급 무덤에서 나온 금관",
        readGuide: "어디에서 어떤 상태로 발견되었는지 확인하세요.",
        facts: [
          { id: "s4-a", kind: "confirmed", text: "신라 금관은 왕릉급 무덤의 부장품으로 발견되었다." },
          { id: "s4-b", kind: "confirmed", text: "얇은 금판으로 만들어 무덤에 묻힌 사람의 권위를 보여 준다." },
        ],
        href: museumCrown,
      },
      {
        id: "s4-shape",
        label: "자료 2 · 모양 관찰",
        institution: "국립중앙박물관",
        title: "세움 장식과 굽은옥",
        readGuide: "사진에서 반복되는 장식을 찾아보세요.",
        facts: [
          { id: "s4-c", kind: "confirmed", text: "금관에는 나뭇가지 모양의 세움 장식이 있다." },
          { id: "s4-d", kind: "confirmed", text: "굽은옥과 둥근 달개가 달려 있다." },
        ],
        href: museumCrown,
      },
      {
        id: "s4-limit",
        label: "자료 3 · 판단 보류",
        institution: "국립중앙박물관 소장품 해설",
        title: "실제로 머리에 썼는지는 더 살펴야 한다",
        readGuide: "‘금관’이라는 이름만으로 사용법을 단정하지 마세요.",
        facts: [
          { id: "s4-e", kind: "caution", text: "금관을 살아 있을 때 직접 썼는지, 장례를 위해 만들었는지는 한 가지 결론으로 확정하기 어렵다." },
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
        title: "생활·사냥·행렬·수호신 장면",
        readGuide: "보이는 장면과 그 장면으로 알 수 있는 점을 연결하세요.",
        facts: [
          { id: "g5-c", kind: "confirmed", text: "벽화에는 인물, 행렬, 사냥과 생활 모습이 나타난다." },
          { id: "g5-d", kind: "confirmed", text: "사신도 같은 그림에서 죽음 뒤의 세계에 대한 믿음을 살펴볼 수 있다." },
        ],
        href: unescoKoguryo,
      },
      {
        id: "g5-limit",
        label: "자료 3 · 조심할 점",
        institution: "유네스코 자료 비교",
        title: "벽화 한 장이 모든 사람의 삶은 아니다",
        readGuide: "자료의 주인과 범위를 확인하세요.",
        facts: [
          { id: "g5-e", kind: "caution", text: "왕족·귀족 무덤의 벽화를 모든 고구려 사람의 일상으로 일반화해서는 안 된다." },
        ],
        href: unescoKoguryo,
      },
    ],
  },
  {
    id: 6,
    heritage: "가야 고분군",
    category: "가야",
    question: "여러 지역의 고분은 가야의 관계를 어떻게 보여 줄까?",
    image: heritageImages[5],
    sources: [
      {
        id: "a6-record",
        label: "자료 1 · 국가유산 기록",
        institution: "국가유산청",
        title: "여러 지역에 이어진 일곱 고분군",
        readGuide: "고분군의 수와 분포를 확인하세요.",
        facts: [
          { id: "a6-a", kind: "confirmed", text: "가야고분군 세계유산은 여러 지역의 일곱 고분군으로 이루어져 있다." },
          { id: "a6-b", kind: "confirmed", text: "1세기부터 6세기 무렵 가야 정치체의 무덤 문화를 보여 준다." },
        ],
        href: heritageGaya,
      },
      {
        id: "a6-relation",
        label: "자료 2 · 관계 해설",
        institution: "국가유산청",
        title: "공통점과 지역 차이가 함께 보이는 무덤",
        readGuide: "같은 점과 다른 점을 모두 찾아보세요.",
        facts: [
          { id: "a6-c", kind: "confirmed", text: "무덤과 껴묻거리에는 가야 문화의 공통점과 지역별 차이가 함께 나타난다." },
          { id: "a6-d", kind: "confirmed", text: "토기와 교역품은 가야 여러 정치체의 교류를 보여 준다." },
        ],
        href: heritageGaya,
      },
      {
        id: "a6-limit",
        label: "자료 3 · 조심할 점",
        institution: "국가유산청 세계유산 해설",
        title: "가야를 처음부터 한 나라로 보면 안 된다",
        readGuide: "여러 정치체라는 특징을 생각하세요.",
        facts: [
          { id: "a6-e", kind: "caution", text: "가야를 처음부터 하나의 왕이 다스린 단일 국가로 단정해서는 안 된다." },
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
