export type HeritageImageKey = "muryeong" | "incense" | "cheomseongdae" | "crown" | "mural" | "gaya";

export interface SlideSource {
  label: string;
  href: string;
}

interface SlideBase {
  image: HeritageImageKey;
  source?: SlideSource;
}

export type LessonSlide =
  | (SlideBase & { kind: "cover"; tag: string; title: string; subtitle: string })
  | (SlideBase & { kind: "fact"; eyebrow: string; title: string; points: readonly string[]; takeaway?: string })
  | (SlideBase & {
      kind: "compare";
      eyebrow: string;
      title: string;
      left: { label: string; title: string; items: readonly string[] };
      right: { label: string; title: string; items: readonly string[] };
    })
  | (SlideBase & { kind: "gallery"; eyebrow: string; title: string; instruction: string })
  | (SlideBase & { kind: "activity"; eyebrow: string; title: string; instruction: string; steps: readonly string[] })
  | (SlideBase & { kind: "quiz"; eyebrow: string; title: string; statement: string; verdict: "확인" | "틀림" | "보류"; explanation: string })
  | (SlideBase & { kind: "closing"; eyebrow: string; title: string; prompt: string; next: string });

const sources = {
  overview: { label: "자료: 우리역사넷 ‘삼국 및 가야의 문화’", href: "https://contents.history.go.kr/front/newEh/list.do?code=eh_age_10&type=eh_ty_020" },
  muryeong: { label: "자료: 국립공주박물관 웅진백제실", href: "https://gongju.museum.go.kr/prog/prmntDspyRelic/kor/sub02_01_01/list.do" },
  incense: { label: "자료: 국립부여박물관 ‘백제금동대향로’", href: "https://buyeo.museum.go.kr/rprsPsn/view.do?rprsPsnCmdtyMngSn=2001010001" },
  cheomseongdae: { label: "자료: 국가유산청 국가유산포털", href: "https://www.heritage.go.kr/heri/cul/culGuidePostDetail.do?ccbaCpno=1113700310000&ccgbGbtype=IND&ccgbGbtypeNo=2&pageNo=1_5_0_0" },
  crown: { label: "자료: 국립중앙박물관 소장품 ‘금관’", href: "https://www.museum.go.kr/site/main/relic/search/view?relicId=752" },
  crownCulture: { label: "자료: 국립경주박물관 ‘신라 황금 문화유산’", href: "https://gyeongju.museum.go.kr/kor/html/sub04/0403.html" },
  mural: { label: "자료: UNESCO ‘고구려 고분군’", href: "https://whc.unesco.org/en/list/1091/" },
  gaya: { label: "자료: UNESCO ‘가야 고분군’", href: "https://whc.unesco.org/en/list/1666/" },
} as const satisfies Record<string, SlideSource>;

interface DeckPlan {
  title: string;
  subtitle: string;
  coverImage: HeritageImageKey;
  history: {
    image: HeritageImageKey;
    title: string;
    points: readonly string[];
    takeaway: string;
    source: SlideSource;
  };
  data: {
    image: HeritageImageKey;
    title: string;
    points: readonly string[];
    takeaway: string;
  };
  compare: {
    image: HeritageImageKey;
    title: string;
    left: { label: string; title: string; items: readonly string[] };
    right: { label: string; title: string; items: readonly string[] };
  };
  activity: {
    image: HeritageImageKey;
    title: string;
    instruction: string;
    steps: readonly string[];
  };
  closing: {
    image: HeritageImageKey;
    title: string;
    prompt: string;
    next: string;
  };
}

const lessonExtensions: Partial<Record<number, readonly LessonSlide[]>> = {
  1: [
    {
      kind: "gallery",
      eyebrow: "오늘의 탐구 대상",
      title: "여섯 문화유산을 같은 기준으로 살펴봅니다",
      instruction: "이름을 외우기보다 사진에서 확인되는 단서를 먼저 찾으세요.",
      image: "muryeong",
      source: sources.overview,
    },
    {
      kind: "fact",
      eyebrow: "데이터 수업 1 · 관찰",
      title: "보이는 사실과 떠오른 생각을 나누어 기록해요",
      points: [
        "관찰: 사진에서 직접 확인되는 모양·색·글자·위치를 적습니다.",
        "해석: 그 모습이 무엇을 뜻하는지는 자료를 찾아 설명합니다.",
        "모름: 아직 확인하지 못한 내용은 빈칸이나 판단 보류로 남깁니다.",
      ],
      takeaway: "관찰과 해석을 한 칸에 섞지 않는 것이 역사 데이터의 첫 번째 약속입니다.",
      image: "incense",
      source: sources.incense,
    },
    {
      kind: "compare",
      eyebrow: "데이터 수업 1 · 구분 연습",
      title: "두 문장은 어떤 점이 다를까요?",
      left: {
        label: "눈으로 확인",
        title: "뚜껑에 산봉우리와 여러 동물이 보인다",
        items: ["사진에서 위치와 모양을 확인할 수 있습니다.", "관찰 데이터로 먼저 기록할 수 있습니다."],
      },
      right: {
        label: "자료로 확인",
        title: "이 장식은 백제인의 세계관을 나타낸다",
        items: ["뜻을 설명하려면 역사 자료가 필요합니다.", "출처와 함께 해석으로 기록합니다."],
      },
      image: "incense",
      source: sources.incense,
    },
    {
      kind: "fact",
      eyebrow: "데이터 수업 2 · 질문",
      title: "좋은 데이터 질문에는 세 가지가 들어갑니다",
      points: [
        "비교 대상: 어떤 유산들을 서로 살펴볼지 정합니다.",
        "공통 항목: 시기·지역·재료·모양처럼 같은 기준을 고릅니다.",
        "확인 방법: 박물관·국가기관 자료처럼 다시 찾을 수 있는 출처를 정합니다.",
      ],
      takeaway: "‘무엇과 무엇의 어떤 항목을 비교할까?’라고 물으면 모을 데이터가 분명해집니다.",
      image: "gaya",
      source: sources.gaya,
    },
    {
      kind: "fact",
      eyebrow: "데이터 수업 3 · 표 만들기",
      title: "문화유산 한 점을 표의 한 행으로 바꿔요",
      points: [
        "유산 이름·나라·시기를 각각 다른 칸에 적습니다.",
        "발견 지역·종류·재료·사진 단서를 공통 항목으로 나눕니다.",
        "설명을 가져온 기관과 원문 주소를 출처 칸에 남깁니다.",
      ],
      takeaway: "한 칸에는 한 종류의 정보만 적어야 다른 모둠의 행과 정확히 비교할 수 있습니다.",
      image: "muryeong",
      source: sources.muryeong,
    },
    {
      kind: "activity",
      eyebrow: "30초 데이터 연습",
      title: "사진 한 장을 데이터 한 행으로 바꿔 봅시다",
      instruction: "선생님이 보여 주는 유산 사진에서 확인되는 것만 말하고, 조사할 항목은 따로 표시합니다.",
      steps: ["눈으로 보이는 사실 한 가지 말하기", "표에 넣을 공통 항목 한 가지 고르기", "자료로 확인할 질문 한 문장 만들기"],
      image: "crown",
      source: sources.crown,
    },
    {
      kind: "quiz",
      eyebrow: "데이터 판단 퀴즈",
      title: "사진과 데이터의 한계",
      statement: "사진에서 모양이 잘 보이면 유물의 정확한 쓰임도 바로 확정할 수 있다.",
      verdict: "틀림",
      explanation: "사진은 모양과 위치를 관찰하게 하지만 정확한 쓰임은 출토 맥락·기록·연구 자료를 함께 확인해야 합니다. 근거가 부족하면 판단 보류로 남깁니다.",
      image: "cheomseongdae",
      source: sources.cheomseongdae,
    },
  ],
  2: [
    {
      kind: "gallery",
      eyebrow: "합쳐야 할 여섯 모둠 자료",
      title: "유산은 달라도 표의 공통 약속은 같아야 합니다",
      instruction: "각 유산에서 무엇을 같은 항목으로 기록할 수 있을지 찾아보세요.",
      image: "gaya",
      source: sources.overview,
    },
    {
      kind: "fact",
      eyebrow: "데이터 수업 1 · 항목과 값",
      title: "열 이름은 질문이고, 셀의 값은 그 질문에 대한 답입니다",
      points: [
        "항목(열 이름): 나라·시대 범위·발견 지역처럼 모두에게 같은 질문입니다.",
        "값(셀 내용): 백제·6세기·충청남도 부여처럼 유산마다 달라지는 답입니다.",
        "한 열에는 한 종류의 값만 넣어야 서로 비교할 수 있습니다.",
      ],
      takeaway: "‘이 칸은 무엇을 묻는가?’를 한 문장으로 설명할 수 있어야 좋은 열 이름입니다.",
      image: "muryeong",
      source: sources.muryeong,
    },
    {
      kind: "compare",
      eyebrow: "데이터 수업 1 · 표 비교",
      title: "두 모둠의 열 이름을 그대로 합칠 수 있을까요?",
      left: {
        label: "1모둠 표",
        title: "나라 · 만든 때 · 나온 곳",
        items: ["쉬운 말이지만 뜻의 범위가 분명하지 않습니다.", "다른 모둠 열과 자동으로 합쳐지지 않습니다."],
      },
      right: {
        label: "2모둠 표",
        title: "국가 · 시대 · 출토지",
        items: ["비슷한 뜻을 다른 이름으로 썼습니다.", "학급 공통 열 이름으로 바꿔야 합니다."],
      },
      image: "crown",
      source: sources.overview,
    },
    {
      kind: "fact",
      eyebrow: "데이터 수업 2 · 시간 나누기",
      title: "정확한 연도와 시대 범위는 서로 다른 항목입니다",
      points: [
        "정확한 연도: 525년처럼 자료에서 직접 확인되는 한 시점을 적습니다.",
        "시대 범위: 6세기·삼국시대처럼 여러 해를 묶은 범주를 적습니다.",
        "연도가 확실하지 않으면 억지로 숫자를 만들지 않고 빈칸이나 판단 보류로 남깁니다.",
      ],
      takeaway: "두 항목을 나누면 정확한 기록과 넓은 시대 비교를 모두 할 수 있습니다.",
      image: "muryeong",
      source: sources.muryeong,
    },
    {
      kind: "fact",
      eyebrow: "데이터 수업 3 · 관계 만들기",
      title: "항목 두 개를 연결하면 비교 질문이 됩니다",
      points: [
        "나라 ↔ 발견 지역: 어느 나라의 유산이 어느 지역에서 발견되었을까?",
        "시대 범위 ↔ 자료 종류: 시대에 따라 남은 자료의 종류가 다를까?",
        "자료 종류 ↔ 확인된 사실: 자료 종류마다 알 수 있는 사실은 무엇일까?",
      ],
      takeaway: "관계는 원인을 단정하는 답이 아니라 함께 비교해 볼 두 항목의 연결입니다.",
      image: "gaya",
      source: sources.gaya,
    },
    {
      kind: "activity",
      eyebrow: "학급 데이터 설계 회의",
      title: "여섯 모둠이 함께 쓸 열 이름을 결정해요",
      instruction: "꼭 필요한 공통 항목과 모둠별 선택 항목을 나누고, 같은 뜻의 표기를 하나로 정합니다.",
      steps: ["비슷한 열 이름끼리 묶기", "학급 공통 열 이름 하나로 바꾸기", "항목 두 개를 연결해 비교 질문 만들기"],
      image: "cheomseongdae",
      source: sources.overview,
    },
    {
      kind: "quiz",
      eyebrow: "데이터 설계 판단 퀴즈",
      title: "한 칸에 여러 정보를 넣어도 될까요?",
      statement: "표가 짧아지도록 ‘나라와 발견 지역’을 한 열에 함께 적는 것이 좋다.",
      verdict: "틀림",
      explanation: "나라와 발견 지역은 서로 다른 질문에 답하는 값입니다. 각각의 열로 나누어야 나라별·지역별 비교와 항목 관계 분석을 할 수 있습니다.",
      image: "gaya",
      source: sources.gaya,
    },
  ],
};

function makeDeck(lessonId: number, plan: DeckPlan): readonly LessonSlide[] {
  const historyDetail = historyDetails[lessonId] ?? plan.history;

  return [
    {
      kind: "cover",
      tag: `초등학교 5학년 사회 · 삼국시대 ${lessonId}차시`,
      title: plan.title,
      subtitle: plan.subtitle,
      image: plan.coverImage,
      source: sources.overview,
    },
    {
      kind: "fact",
      eyebrow: "오늘의 역사",
      title: plan.history.title,
      points: plan.history.points,
      takeaway: plan.history.takeaway,
      image: plan.history.image,
      source: plan.history.source,
    },
    {
      kind: "fact",
      eyebrow: "자료에서 더 찾기",
      title: historyDetail.title,
      points: historyDetail.points,
      takeaway: historyDetail.takeaway,
      image: historyDetail.image,
      source: historyDetail.source,
    },
    {
      kind: "fact",
      eyebrow: "오늘의 데이터",
      title: plan.data.title,
      points: plan.data.points,
      takeaway: plan.data.takeaway,
      image: plan.data.image,
      source: sources.overview,
    },
    ...(lessonExtensions[lessonId] ?? []),
    {
      kind: "compare",
      eyebrow: "질문 뒤 답 확인",
      title: plan.compare.title,
      left: plan.compare.left,
      right: plan.compare.right,
      image: plan.compare.image,
      source: sources.overview,
    },
    {
      kind: "activity",
      eyebrow: "모둠 활동",
      title: plan.activity.title,
      instruction: plan.activity.instruction,
      steps: plan.activity.steps,
      image: plan.activity.image,
      source: sources.overview,
    },
    {
      kind: "closing",
      eyebrow: `${lessonId}차시 마지막 Q&A`,
      title: plan.closing.title,
      prompt: plan.closing.prompt,
      next: plan.closing.next,
      image: plan.closing.image,
      source: sources.overview,
    },
  ];
}

const deckPlans: Record<number, DeckPlan> = {
  1: {
    title: "역사 데이터\n질문 찾기",
    subtitle: "문화유산을 관찰하고 자료로 조사할 수 있는 질문을 만듭니다.",
    coverImage: "muryeong",
    history: {
      image: "muryeong",
      title: "남은 유물은 옛사람의 삶을 알려 줍니다",
      points: ["무령왕릉의 지석은 무덤 주인을 알려 줍니다.", "고분벽화는 생활과 믿음의 장면을 남겼습니다.", "금관과 향로는 왕실의 힘과 뛰어난 기술을 보여 줍니다."],
      takeaway: "역사는 유물 하나를 보고 끝내지 않고 여러 자료의 관계로 설명합니다.",
      source: sources.muryeong,
    },
    data: {
      image: "gaya",
      title: "데이터는 질문에 답하기 위해 모은 자료입니다",
      points: ["시기: 언제 만들어지거나 발견되었나요?", "지역: 어디에서 발견되었나요?", "종류: 무덤·건축·그림·공예품 중 무엇인가요?"],
      takeaway: "먼저 질문을 정해야 필요한 데이터를 고를 수 있습니다.",
    },
    compare: {
      image: "crown",
      title: "어떤 질문이 데이터로 조사하기 좋을까요?",
      left: { label: "막연한 질문", title: "어느 유물이 제일 멋질까?", items: ["사람마다 답이 달라집니다.", "무엇을 모아야 할지 분명하지 않습니다."] },
      right: { label: "데이터 질문", title: "유산의 시기와 지역은 어떻게 다를까?", items: ["공통 항목을 모을 수 있습니다.", "모둠 자료를 서로 비교할 수 있습니다."] },
    },
    activity: {
      image: "incense",
      title: "사진 근거로 질문을 고쳐 말해요",
      instruction: "유산 한 점을 고르고 ‘무엇이 궁금한가’와 ‘어떤 자료가 필요한가’를 연결해 말합니다.",
      steps: ["사진에서 보이는 사실 말하기", "비교할 정보 한 가지 고르기", "자료로 확인할 질문 만들기"],
    },
    closing: { image: "mural", title: "유물 하나만 보면 과거를 정확히 알 수 있을까요?", prompt: "아니요. 유물의 모양뿐 아니라 시기·발견 장소·용도·출처를 연결해야 하며, 확인할 수 없는 내용은 모른다고 남겨야 합니다.", next: "2차시 · 데이터 항목과 관계 정하기" },
  },
  2: {
    title: "데이터 항목과\n관계 정하기",
    subtitle: "여섯 모둠이 함께 비교할 공통 데이터 약속을 정합니다.",
    coverImage: "gaya",
    history: {
      image: "gaya",
      title: "가야 고분군은 여러 지역을 함께 보아야 합니다",
      points: ["가야 고분군은 여러 지역의 일곱 고분군으로 이루어집니다.", "공통점과 지역별 차이가 함께 나타납니다.", "분포와 껴묻거리는 여러 정치체의 관계를 보여 줍니다."],
      takeaway: "지역·시기·출토품을 연결하면 한 유물만 볼 때보다 더 많은 역사를 알 수 있습니다.",
      source: sources.gaya,
    },
    data: {
      image: "cheomseongdae",
      title: "열 이름이 같아야 모둠 자료를 합칠 수 있어요",
      points: ["‘나라’와 ‘국가’를 섞지 않고 한 이름을 씁니다.", "정확한 연도와 ‘6세기’ 같은 시대 범위를 나눕니다.", "사실·해석·판단 보류를 다른 항목으로 기록합니다."],
      takeaway: "공통 항목은 데이터를 비교하기 위한 학급의 약속입니다.",
    },
    compare: {
      image: "gaya",
      title: "두 표를 한 번에 비교할 수 있을까요?",
      left: { label: "표기 제각각", title: "경주·경주시·경상북도 경주", items: ["같은 지역이 여러 종류로 나뉩니다.", "그래프에서 다른 값처럼 보입니다."] },
      right: { label: "표기 통일", title: "경상북도 경주", items: ["같은 지역을 한 값으로 셉니다.", "다른 모둠 자료와 바로 비교합니다."] },
    },
    activity: {
      image: "crown",
      title: "열 이름을 학급 공통 약속으로 정해요",
      instruction: "서로 다른 모둠의 표 두 개를 비교해 어떤 열 이름을 같게 해야 하는지 토론합니다.",
      steps: ["꼭 필요한 열 찾기", "각 열이 답할 질문 말하기", "정확한 연도와 시대 범위 나누기"],
    },
    closing: { image: "muryeong", title: "왜 모든 모둠이 같은 항목 이름을 써야 할까요?", prompt: "같은 뜻을 같은 이름으로 기록해야 자료를 합치고 비교할 수 있습니다. 정확한 연도와 ‘6세기’ 같은 시대 범위는 서로 다른 열에 남깁니다.", next: "3차시 · 믿을 수 있는 자료 수집 방법" },
  },
  3: {
    title: "믿을 수 있는\n자료 수집 방법",
    subtitle: "출처를 확인하고 사실과 해석을 나누어 같은 방식으로 입력합니다.",
    coverImage: "cheomseongdae",
    history: {
      image: "cheomseongdae",
      title: "첨성대는 확인과 보류를 함께 보여 줍니다",
      points: ["신라 선덕여왕 때 세운 것으로 봅니다.", "천문 관측과 관련된 시설로 설명됩니다.", "정확한 관측 방법은 하나로 확정하기 어렵습니다."],
      takeaway: "알려진 사실과 아직 모르는 내용을 나누어 기록하는 것이 정확한 역사 공부입니다.",
      source: sources.cheomseongdae,
    },
    data: {
      image: "muryeong",
      title: "좋은 데이터에는 출처와 상태가 함께 있습니다",
      points: ["누가 만든 자료인지 기관 이름을 적습니다.", "처음 자료의 주소를 남깁니다.", "확인됨·주의·판단 보류를 표시합니다."],
      takeaway: "출처가 없으면 친구가 같은 내용을 다시 확인할 수 없습니다.",
    },
    compare: {
      image: "cheomseongdae",
      title: "두 문장은 같은 수준의 사실일까요?",
      left: { label: "확인된 설명", title: "천문 관측과 관련된 시설이다", items: ["공식 자료에서 확인할 수 있습니다.", "출처를 함께 기록합니다."] },
      right: { label: "단정하면 안 됨", title: "매일 꼭대기에서 별을 보았다", items: ["정확한 사용 장면은 확인하기 어렵습니다.", "판단 보류로 남깁니다."] },
    },
    activity: {
      image: "mural",
      title: "출처가 다른 두 설명을 평가해요",
      instruction: "같은 유산을 설명한 두 자료에서 만든 곳·작성 시기·근거를 찾아 비교합니다.",
      steps: ["자료를 만든 기관 확인하기", "사실과 해석에 밑줄 긋기", "확인·주의·보류로 판단하기"],
    },
    closing: { image: "crown", title: "공식 기관 자료라면 모두 그대로 믿어도 될까요?", prompt: "공식 자료는 좋은 출발점이지만 작성 시기와 근거를 확인하고 다른 자료와도 비교해야 합니다. 확인된 사실과 해석도 구분합니다.", next: "4차시 · 우리 모둠 역사 데이터 모으기" },
  },
  4: {
    title: "우리 모둠 역사\n데이터 모으기",
    subtitle: "공식 자료에서 담당 유산 데이터를 12~20건 수집합니다.",
    coverImage: "incense",
    history: {
      image: "incense",
      title: "백제 금동대향로는 발견 장소도 중요한 정보입니다",
      points: ["1993년 부여 능산리 절터에서 발견되었습니다.", "청동으로 만들고 표면에 금을 입혔습니다.", "봉황·산·연꽃·용과 여러 인물·동물이 표현되었습니다."],
      takeaway: "유산 이름뿐 아니라 장소·재료·모양을 함께 모아야 역사적 의미를 설명할 수 있습니다.",
      source: sources.incense,
    },
    data: {
      image: "mural",
      title: "한 행에는 한 자료의 정보를 담아요",
      points: ["같은 자료를 두 번 입력하지 않습니다.", "출처 URL과 확인 날짜를 빠뜨리지 않습니다.", "모둠원은 조사·입력·중복 확인 역할을 나눕니다."],
      takeaway: "많은 자료보다 확인할 수 있는 자료가 중요합니다.",
    },
    compare: {
      image: "incense",
      title: "어느 쪽이 분석할 수 있는 원자료일까요?",
      left: { label: "확인 어려움", title: "인터넷에서 봤음", items: ["기관과 주소가 없습니다.", "같은 내용을 다시 찾기 어렵습니다."] },
      right: { label: "확인 가능", title: "국립부여박물관·원주소", items: ["자료를 만든 곳이 분명합니다.", "친구가 다시 확인할 수 있습니다."] },
    },
    activity: {
      image: "muryeong",
      title: "한 자료를 30초 안에 검수해요",
      instruction: "자료 한 건을 읽고 친구가 다시 확인할 수 있는 기록인지 짝과 점검합니다.",
      steps: ["기관·주소·확인 날짜 찾기", "한 행에 한 자료인지 확인하기", "빈칸과 중복 표시하기"],
    },
    closing: { image: "gaya", title: "자료를 많이 모으면 무조건 좋은 데이터일까요?", prompt: "아니요. 출처를 확인할 수 있고 중복과 빈칸이 적으며, 여러 시기와 지역이 고르게 포함되어야 질문에 답할 수 있는 데이터가 됩니다.", next: "5차시 · 데이터 깨끗하게 다듬기" },
  },
  5: {
    title: "데이터 깨끗하게\n다듬기",
    subtitle: "중복·빈칸·표기 차이를 찾아 분석할 수 있는 자료로 고칩니다.",
    coverImage: "crown",
    history: {
      image: "crown",
      title: "신라 금관도 ‘금관’ 한 단어만으로는 부족합니다",
      points: ["왕릉급 무덤의 부장품으로 발견되었습니다.", "나뭇가지 모양 장식과 굽은옥이 보입니다.", "실제 착용 방법은 하나의 결론으로 확정하기 어렵습니다."],
      takeaway: "자료의 종류와 상태를 자세히 나누면 사실과 해석을 섞지 않을 수 있습니다.",
      source: sources.crown,
    },
    data: {
      image: "gaya",
      title: "전처리는 분석 전에 데이터를 고치는 일입니다",
      points: ["중복 행을 찾아 원본과 비교합니다.", "빈칸과 오탈자를 확인합니다.", "같은 뜻의 표기를 하나로 맞춥니다."],
      takeaway: "무엇을 왜 고쳤는지 기록해야 원자료를 지킬 수 있습니다.",
    },
    compare: {
      image: "crown",
      title: "‘금관’과 ‘신라 금관’은 같은 값일까요?",
      left: { label: "고치기 전", title: "금관·신라금관·신라 금관", items: ["그래프에서 세 값으로 나뉩니다.", "수량이 잘못 계산됩니다."] },
      right: { label: "고친 뒤", title: "신라 금관", items: ["한 가지 표기로 통일합니다.", "수정 이유를 기록합니다."] },
    },
    activity: {
      image: "gaya",
      title: "수정 전과 수정 후를 비교해요",
      instruction: "원자료는 보존하고 사본에서 한 번에 한 가지 문제만 고친 뒤 이유를 말합니다.",
      steps: ["중복과 빈칸 표시하기", "같은 뜻의 표기 묶기", "무엇을 왜 고쳤는지 기록하기"],
    },
    closing: { image: "cheomseongdae", title: "판단 보류 자료는 분석하기 불편하니 지워도 될까요?", prompt: "지우면 안 됩니다. 원자료는 남겨 두고 사본에서 분석 여부만 구분해야 합니다. 삭제하면 아직 모른다는 중요한 사실까지 사라집니다.", next: "6차시 · 역사 데이터를 그림으로 보기" },
  },
  6: {
    title: "역사 데이터를\n그림으로 보기",
    subtitle: "정리한 데이터를 탐구 질문에 맞는 그래프로 나타내고 무엇이 보이는지 살핍니다.",
    coverImage: "mural",
    history: {
      image: "mural",
      title: "고구려 벽화는 장면과 자료 범위를 함께 봐야 합니다",
      points: ["생활·사냥·행렬·수호신 장면이 남아 있습니다.", "왕족과 귀족의 무덤 자료가 중심입니다.", "벽화 한 장을 모든 고구려 사람의 삶으로 볼 수는 없습니다."],
      takeaway: "그래프도 어떤 자료를 모았는지에 따라 보여 주는 범위가 달라집니다.",
      source: sources.mural,
    },
    data: {
      image: "gaya",
      title: "그래프는 두 항목의 차이와 경향을 보여 줍니다",
      points: ["가로축과 세로축이 무엇인지 확인합니다.", "제목과 단위를 빠뜨리지 않습니다.", "탐구 질문에 맞는 항목을 선택합니다."],
      takeaway: "멋진 모양보다 무엇을 비교했는지가 먼저입니다.",
    },
    compare: {
      image: "mural",
      title: "어떤 그래프가 질문에 더 잘 답할까요?",
      left: { label: "질문과 무관", title: "모둠 번호별 행 수", items: ["누가 많이 입력했는지만 보입니다.", "역사 질문에 답하기 어렵습니다."] },
      right: { label: "질문과 연결", title: "지역별 자료 종류", items: ["어디에 어떤 자료가 많은지 보입니다.", "유산의 분포를 비교할 수 있습니다."] },
    },
    activity: {
      image: "gaya",
      title: "같은 자료를 다른 그래프로 읽어 봐요",
      instruction: "같은 자료라도 비교 항목이 달라지면 무엇이 보이고 사라지는지 말합니다.",
      steps: ["탐구 질문 다시 읽기", "가로축·세로축 항목 정하기", "제목·단위·자료 수 확인하기"],
    },
    closing: { image: "muryeong", title: "그래프가 역사 문제의 정답을 바로 보여 줄까요?", prompt: "아니요. 그래프는 우리가 모은 자료 안의 차이와 관계를 보여 줍니다. 축·단위·자료 수와 출처를 확인하고 다른 역사 자료와 함께 해석해야 합니다.", next: "7차시 · 그래프를 읽고 설명하기" },
  },
  7: {
    title: "그래프를 읽고\n설명하기",
    subtitle: "그래프가 말해 주는 점과 말하지 못하는 점을 함께 설명합니다.",
    coverImage: "gaya",
    history: {
      image: "gaya",
      title: "가야의 여러 고분군은 공통점과 차이를 함께 보여 줍니다",
      points: ["여러 지역에 큰 무덤 떼가 남아 있습니다.", "무덤과 껴묻거리에는 지역별 특징이 있습니다.", "한 나라가 아니라 여러 정치체의 관계를 살펴야 합니다."],
      takeaway: "차이가 보인다고 곧바로 원인을 단정하지 말고 다른 역사 자료와 함께 확인합니다.",
      source: sources.gaya,
    },
    data: {
      image: "cheomseongdae",
      title: "해석은 관찰·경향·한계 순서로 말해요",
      points: ["관찰: 그래프에서 실제로 보이는 값", "경향: 반복되거나 함께 나타나는 모습", "한계: 자료만으로는 알 수 없는 점"],
      takeaway: "‘많다’고 말할 때도 무엇보다 얼마나 많은지 근거를 가리킵니다.",
    },
    compare: {
      image: "gaya",
      title: "어느 설명이 그래프에 더 정직할까요?",
      left: { label: "과장", title: "가야 사람은 모두 같은 방식으로 살았다", items: ["일부 자료를 전체로 넓혔습니다.", "자료의 한계를 말하지 않았습니다."] },
      right: { label: "근거 있음", title: "이 자료에서는 지역별 공통점과 차이가 보인다", items: ["자료 범위를 밝혔습니다.", "보이는 관계만 설명했습니다."] },
    },
    activity: {
      image: "incense",
      title: "그래프 발표를 질문으로 다듬어요",
      instruction: "한 친구가 해석을 말하면 다른 친구는 근거 위치와 자료의 한계를 질문합니다.",
      steps: ["실제로 보이는 값 말하기", "그 값의 역사 의미 설명하기", "그래프로 모르는 점 덧붙이기"],
    },
    closing: { image: "mural", title: "그래프에서 가장 큰 값이 역사적으로 가장 중요할까요?", prompt: "꼭 그렇지는 않습니다. 자료에 많이 남았다는 뜻일 수 있지만 역사적 중요성은 시대 배경·자료의 성격·다른 근거를 함께 보아 판단해야 합니다.", next: "8차시 · 데이터로 과거 유추하기" },
  },
  8: {
    title: "데이터로 과거\n유추하기",
    subtitle: "두 가지 이상의 근거를 연결해 옛사람의 생활과 교류를 조심스럽게 설명합니다.",
    coverImage: "incense",
    history: {
      image: "incense",
      title: "금동대향로의 장소와 모양을 함께 보면 질문이 넓어집니다",
      points: ["절터에서 발견된 향로라는 장소 정보가 있습니다.", "다양한 인물·동물·산과 연꽃 표현이 있습니다.", "모든 무늬의 뜻을 하나로 단정할 수는 없습니다."],
      takeaway: "발견 장소와 유물 모양을 연결하면 당시 의식과 믿음을 유추할 단서가 됩니다.",
      source: sources.incense,
    },
    data: {
      image: "muryeong",
      title: "유추는 근거에서 시작하는 가능한 설명입니다",
      points: ["서로 관계 있는 항목 두 개를 고릅니다.", "반복되거나 함께 나타나는 모습을 찾습니다.", "‘~했을 가능성이 있다’라고 범위를 지킵니다."],
      takeaway: "상상한 장면이 아니라 자료가 허용하는 만큼만 설명합니다.",
    },
    compare: {
      image: "incense",
      title: "어느 문장이 역사 유추일까요?",
      left: { label: "근거 없는 상상", title: "향로를 매일 모든 백성이 사용했다", items: ["누가 사용했는지 확인되지 않았습니다.", "모든 백성으로 넓힐 근거가 없습니다."] },
      right: { label: "근거 있는 유추", title: "절터의 의식과 관련됐을 가능성이 있다", items: ["발견 장소를 근거로 삼았습니다.", "가능성으로 조심스럽게 표현했습니다."] },
    },
    activity: {
      image: "gaya",
      title: "근거와 유추를 구분해 발표해요",
      instruction: "확인된 사실 두 개를 먼저 말한 뒤 그 사실로 가능한 설명 한 문장을 만듭니다.",
      steps: ["관계 있는 근거 두 개 고르기", "근거가 가리키는 공통점 찾기", "‘가능성이 있다’로 유추 말하기"],
    },
    closing: { image: "crown", title: "데이터가 있으면 과거를 확실하게 알 수 있을까요?", prompt: "데이터는 유추의 근거를 주지만 모든 장면을 확정하지는 못합니다. 확인된 사실과 가능한 설명을 나누고 ‘가능성이 있다’처럼 범위를 밝혀야 합니다.", next: "9차시 · 데이터로 미래 변화 예측하기" },
  },
  9: {
    title: "데이터로 미래\n변화 예측하기",
    subtitle: "연도별 수치의 흐름으로 세 가지 가능성과 한계를 설명합니다.",
    coverImage: "cheomseongdae",
    history: {
      image: "cheomseongdae",
      title: "문화유산의 과거 사실과 미래 관리는 다른 질문입니다",
      points: ["첨성대가 미래에 무엇으로 쓰일지 역사 사실처럼 만들 수는 없습니다.", "관람객 수·디지털 이용·보존 점검 수치는 시간에 따라 달라집니다.", "이런 수치의 경향은 관리 계획을 생각하는 자료가 됩니다."],
      takeaway: "미래 예측은 새로운 역사 이야기를 만드는 활동이 아니라 관리 조건의 변화를 살피는 활동입니다.",
      source: sources.cheomseongdae,
    },
    data: {
      image: "gaya",
      title: "예측에는 데이터·가정·한계가 함께 있어야 합니다",
      points: ["5개년 이상의 수치에서 흐름을 봅니다.", "기본·좋은 조건·나쁜 조건을 나눕니다.", "자료가 실제인지 수업용 모의 데이터인지 밝힙니다."],
      takeaway: "예측값 하나보다 어떤 조건에서 달라지는지 설명하는 것이 중요합니다.",
    },
    compare: {
      image: "cheomseongdae",
      title: "예측과 점치기는 무엇이 다를까요?",
      left: { label: "점치기", title: "10년 뒤 꼭 이런 일이 생긴다", items: ["근거 자료가 없습니다.", "달라질 조건을 말하지 않습니다."] },
      right: { label: "데이터 예측", title: "현재 흐름이 계속되면 값이 늘 수 있다", items: ["과거 수치를 근거로 삼습니다.", "가정과 한계를 함께 말합니다."] },
    },
    activity: {
      image: "gaya",
      title: "예측 문장에 조건을 붙여요",
      instruction: "같은 연도별 흐름에서 기본·좋은 조건·나쁜 조건의 세 문장을 만들어 비교합니다.",
      steps: ["과거의 증가·감소 흐름 찾기", "달라질 조건 한 가지 정하기", "예측과 한계를 함께 말하기"],
    },
    closing: { image: "mural", title: "미래 예측도 역사적 사실이라고 할 수 있을까요?", prompt: "아니요. 예측은 과거 수치의 흐름과 가정을 바탕으로 만든 조건부 설명입니다. 사용한 데이터·가정·빗나갈 수 있는 이유를 함께 밝혀야 합니다.", next: "10차시 · AR 데이터 박물관 열기" },
  },
  10: {
    title: "AR 데이터\n박물관 열기",
    subtitle: "수집·그래프·해석·유추·예측을 AR 문화유산 해설과 연결합니다.",
    coverImage: "gaya",
    history: {
      image: "muryeong",
      title: "문화유산은 근거를 따라 설명할 때 살아납니다",
      points: ["무령왕릉은 지석으로 무덤 주인을 확인했습니다.", "금동대향로와 고분벽화는 모양과 장면을 남겼습니다.", "첨성대·금관·가야 고분군에는 판단을 보류할 질문도 있습니다."],
      takeaway: "좋은 도슨트는 아는 것과 모르는 것을 나누고 출처를 보여 줍니다.",
      source: sources.muryeong,
    },
    data: {
      image: "gaya",
      title: "한 모둠의 데이터 이야기는 다섯 단계로 이어집니다",
      points: ["모으기 → 다듬기 → 그래프로 보기", "그래프 읽기 → 과거 유추하기", "미래 예측의 조건과 한계 말하기"],
      takeaway: "AR은 결과를 꾸미는 장식이 아니라 근거와 해설을 연결하는 전시 도구입니다.",
    },
    compare: {
      image: "mural",
      title: "관람객에게 어떤 해설이 더 잘 남을까요?",
      left: { label: "결과만 말하기", title: "우리 그래프가 제일 멋집니다", items: ["무엇을 비교했는지 알기 어렵습니다.", "역사 의미가 남지 않습니다."] },
      right: { label: "근거와 한계", title: "이 자료에서는 이런 경향이 보입니다", items: ["그래프 근거를 가리킵니다.", "과거 유추와 예측 한계를 나눕니다."] },
    },
    activity: {
      image: "crown",
      title: "관람객 질문에 도슨트로 답해요",
      instruction: "유산 사진과 그래프를 가리키며 사실·유추·예측을 구분해 설명하고 질문을 받습니다.",
      steps: ["출처와 확인된 사실 설명하기", "그래프 근거와 과거 유추 연결하기", "예측 조건·한계를 말하고 질문받기"],
    },
    closing: { image: "gaya", title: "좋은 AR 역사 도슨트는 어떻게 설명해야 할까요?", prompt: "출처와 확인된 사실을 먼저 보여 주고, 그래프 해석·과거 유추·미래 예측을 구분합니다. 모르는 질문에는 꾸며내지 않고 더 확인하겠다고 답합니다.", next: "삼국시대 데이터·AI·AR 탐구 완료" },
  },
};

const historyDetails: Record<number, DeckPlan["history"]> = {
  1: {
    image: "crown",
    title: "유물마다 남기는 정보가 다릅니다",
    points: [
      "무령왕릉 지석은 이름과 사망·매장 시기를 글자로 남겼습니다.",
      "금동대향로는 발견 장소와 모양으로 왕실 의식과 사상을 살필 단서를 줍니다.",
      "가야 고분군은 여러 지역의 무덤과 껴묻거리를 서로 비교하게 합니다.",
    ],
    takeaway: "그래서 ‘언제·어디서·무엇이·어떤 출처에’가 역사 데이터의 기본 항목이 됩니다.",
    source: sources.overview,
  },
  2: {
    image: "muryeong",
    title: "글자·연도·출토 위치를 연결하면 이야기가 됩니다",
    points: [
      "왕의 지석에는 523년 사망과 525년 안장 기록이 있습니다.",
      "왕비의 지석에는 526년 사망과 529년 안장 기록이 남아 있습니다.",
      "유물이 놓인 위치까지 기록해 왕과 왕비의 물건을 구분합니다.",
    ],
    takeaway: "같은 무덤 자료도 사람·연도·위치 항목을 연결해야 변화와 차이가 보입니다.",
    source: sources.muryeong,
  },
  3: {
    image: "cheomseongdae",
    title: "확인되는 구조와 해석이 필요한 쓰임은 다릅니다",
    points: [
      "다듬은 돌을 27단으로 쌓아 둥근 몸체를 만들었습니다.",
      "남쪽 13~15단 사이에 네모난 출입구가 있습니다.",
      "천문 관측대라는 설명이 널리 쓰이지만 제단·기념물이라는 견해도 있습니다.",
    ],
    takeaway: "눈으로 확인되는 구조는 사실로, 쓰임에 관한 여러 견해는 해석으로 기록합니다.",
    source: sources.cheomseongdae,
  },
  4: {
    image: "incense",
    title: "향로 한 점에도 여러 종류의 데이터가 있습니다",
    points: [
      "높이 61.8cm의 금동 향로로 부여 능산리 절터에서 발견되었습니다.",
      "용 받침·연꽃 몸통·산 모양 뚜껑·봉황으로 이루어져 있습니다.",
      "산과 동식물 사이에는 서로 다른 악기를 연주하는 다섯 악사가 보입니다.",
    ],
    takeaway: "크기·재료·발견 장소·무늬를 같은 기준으로 모으면 백제인의 기술과 생각을 비교할 수 있습니다.",
    source: sources.incense,
  },
  5: {
    image: "crown",
    title: "신라 금관은 지배층의 권위를 보여 줍니다",
    points: [
      "신라의 황금 문화는 5세기부터 6세기 전반까지 약 150년간 이어졌습니다.",
      "지배층은 큰 무덤에 금관·귀걸이·허리띠 같은 정교한 금제품을 남겼습니다.",
      "황금 장신구는 무덤 주인의 신성함과 정통성, 오래가는 권위를 드러냈습니다.",
    ],
    takeaway: "‘금으로 만든 관’만 기록하지 말고 시기·출토 무덤·함께 나온 유물을 연결해야 합니다.",
    source: sources.crownCulture,
  },
  6: {
    image: "mural",
    title: "벽화가 남은 무덤은 전체 가운데 일부입니다",
    points: [
      "중국과 한반도에서 발견된 고구려 무덤은 1만 기가 넘습니다.",
      "그중 벽화가 있는 무덤은 약 100기로 알려져 있습니다.",
      "벽화묘는 왕·왕족·귀족의 무덤으로 본다는 점도 함께 살펴야 합니다.",
    ],
    takeaway: "벽화 자료는 귀중하지만 모든 고구려 사람의 생활을 똑같이 보여 주는 표본은 아닙니다.",
    source: sources.mural,
  },
  7: {
    image: "gaya",
    title: "가야 고분군의 공통점과 차이는 모두 근거입니다",
    points: [
      "세계유산 가야 고분군은 일곱 지역의 고분군으로 이루어집니다.",
      "가야식 돌덧널무덤과 토기는 여러 지역의 문화적 공통점을 보여 줍니다.",
      "무덤과 껴묻거리의 지역별 차이는 각 정치체의 자율성을 보여 주는 단서입니다.",
    ],
    takeaway: "공통점만 말하면 지역 차이를 놓치고, 차이만 말하면 가야가 공유한 문화를 놓칩니다.",
    source: sources.gaya,
  },
  8: {
    image: "muryeong",
    title: "같은 무덤 안에서도 유추의 강도는 다릅니다",
    points: [
      "무령왕 지석의 이름과 연도는 글자로 직접 확인할 수 있습니다.",
      "일본 군마현 고분의 거울과 비슷한 청동거울은 교류를 살필 단서가 됩니다.",
      "왕비 발 부근의 작은 귀걸이는 어린 시절 물건으로 추정됩니다.",
    ],
    takeaway: "직접 적힌 기록·비교 가능한 유물·학자의 추정을 같은 수준의 사실처럼 쓰면 안 됩니다.",
    source: sources.muryeong,
  },
  9: {
    image: "mural",
    title: "보존 데이터는 문화유산의 미래를 준비하게 합니다",
    points: [
      "고분벽화는 습기·유해 세균·자연 풍화에 영향을 받을 수 있습니다.",
      "온도와 습도를 계속 측정하면 갑작스러운 변화를 빨리 발견할 수 있습니다.",
      "관람 환경과 보존 조치가 달라지면 미래 수치도 달라질 수 있습니다.",
    ],
    takeaway: "예측은 유산의 운명을 맞히는 일이 아니라 어떤 관리가 필요한지 미리 생각하는 일입니다.",
    source: sources.mural,
  },
  10: {
    image: "incense",
    title: "여섯 유산은 서로 다른 방식으로 과거를 증언합니다",
    points: [
      "지석은 글자로, 벽화는 장면으로, 금관과 향로는 재료와 기술로 말합니다.",
      "첨성대는 남은 구조로, 가야 고분군은 여러 지역의 분포와 관계로 말합니다.",
      "모든 유산에는 확인된 사실과 더 연구해야 할 질문이 함께 있습니다.",
    ],
    takeaway: "도슨트의 역할은 정답을 외우는 것이 아니라 근거를 보여 주며 질문을 이어 가는 것입니다.",
    source: sources.overview,
  },
};

const decks = Object.fromEntries(
  Object.entries(deckPlans).map(([lessonId, plan]) => [Number(lessonId), makeDeck(Number(lessonId), plan)]),
) as Record<number, readonly LessonSlide[]>;

export function getThreeKingdomsSlides(lessonId: number) {
  return decks[lessonId] ?? decks[1];
}
