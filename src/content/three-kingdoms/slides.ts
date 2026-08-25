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
  incense: { label: "자료: 국립부여박물관 백제대향로관", href: "https://buyeo.museum.go.kr/content.do?key=2605140001" },
  cheomseongdae: { label: "자료: 국가유산청 국가유산포털", href: "https://www.heritage.go.kr/heri/cul/culGuidePostDetail.do?ccbaCpno=1113700310000&ccgbGbtype=IND&ccgbGbtypeNo=2&pageNo=1_5_0_0" },
  crown: { label: "자료: 국립중앙박물관 소장품 ‘금관’", href: "https://www.museum.go.kr/site/main/relic/search/view?relicId=752" },
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

function makeDeck(lessonId: number, plan: DeckPlan): readonly LessonSlide[] {
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
      eyebrow: "오늘의 데이터",
      title: plan.data.title,
      points: plan.data.points,
      takeaway: plan.data.takeaway,
      image: plan.data.image,
      source: sources.overview,
    },
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
      eyebrow: `${lessonId}차시 정리`,
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
      title: "유산을 보고 데이터 질문 하나를 정해요",
      instruction: "웹앱의 여섯 유산을 관찰한 뒤 활동지에는 최종 질문만 남깁니다.",
      steps: ["눈에 보이는 특징 말하기", "비교할 정보 고르기", "모둠 질문 한 문장 만들기"],
    },
    closing: { image: "mural", title: "우리 질문은 자료로 확인할 수 있나요?", prompt: "모둠 질문에 ‘시기·지역·종류·출처’ 중 어떤 데이터가 필요한지 말해 봅시다.", next: "2차시 · 데이터 항목과 관계 정하기" },
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
      title: "Google Sheets에서 공통 항목을 정해요",
      instruction: "읽기용 예시 표를 보고 모둠 설계표를 완성합니다.",
      steps: ["꼭 필요한 열 표시하기", "항목과 질문 연결하기", "모둠 추가 항목 정하기"],
    },
    closing: { image: "muryeong", title: "정확한 연도가 없으면 어떻게 기록할까요?", prompt: "‘6세기’처럼 확인된 범위를 그대로 남겨야 하는 까닭을 말해 봅시다.", next: "3차시 · 믿을 수 있는 자료 수집 방법" },
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
      title: "Google Forms에 같은 방식으로 입력해요",
      instruction: "연습 자료 한 건을 읽고 출처·사실·자료 상태를 입력합니다.",
      steps: ["기관과 원주소 확인하기", "사실과 해석 나누기", "자료 상태 선택하기"],
    },
    closing: { image: "crown", title: "다시 확인할 수 있는 데이터인가요?", prompt: "내가 입력한 자료를 친구도 같은 출처에서 확인할 수 있는지 점검해 봅시다.", next: "4차시 · 우리 모둠 역사 데이터 모으기" },
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
      title: "모둠 수집 폼에 자료를 입력해요",
      instruction: "공식 자료를 읽고 모둠 코드로 한 건씩 정확하게 입력합니다.",
      steps: ["공식 자료 찾기", "공통 항목 입력하기", "수집량과 빠진 칸 확인하기"],
    },
    closing: { image: "gaya", title: "우리 자료는 충분하고 고르게 모였나요?", prompt: "출처 없는 행, 빈칸, 같은 내용의 중복 행이 없는지 함께 확인합시다.", next: "5차시 · 데이터 깨끗하게 다듬기" },
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
      title: "Google Sheets에서 원자료를 다듬어요",
      instruction: "원본 탭은 남겨 두고 편집 사본에서 전처리합니다.",
      steps: ["중복 찾기", "빈칸·오탈자 확인하기", "표기 통일 후 CSV 저장하기"],
    },
    closing: { image: "cheomseongdae", title: "판단 보류 행도 지워야 할까요?", prompt: "분석하기 불편하다는 이유로 확인되지 않은 자료를 삭제하면 안 되는 까닭을 말해 봅시다.", next: "6차시 · 역사 데이터를 그림으로 보기" },
  },
  6: {
    title: "역사 데이터를\n그림으로 보기",
    subtitle: "정리한 데이터를 CODAP에서 비교 목적에 맞는 그래프로 나타냅니다.",
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
      title: "CODAP에서 그래프 한 장을 완성해요",
      instruction: "정리된 CSV를 불러오고 비교할 항목을 축에 놓습니다.",
      steps: ["CSV 불러오기", "축에 항목 놓기", "제목·단위 확인 후 PNG 저장하기"],
    },
    closing: { image: "muryeong", title: "우리 그래프는 질문에 답하고 있나요?", prompt: "그래프에서 가장 먼저 보이는 한 가지를 말하고 탐구 질문과 연결해 봅시다.", next: "7차시 · 그래프를 읽고 설명하기" },
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
      title: "보이는 점과 모르는 점을 나누어 발표해요",
      instruction: "모둠 그래프를 가리키며 1분 안에 설명합니다.",
      steps: ["큰 값과 작은 값 찾기", "경향 한 문장 만들기", "자료의 한계 함께 말하기"],
    },
    closing: { image: "mural", title: "그래프만으로 전체 역사를 말할 수 있나요?", prompt: "우리 자료가 어느 지역·시기·사람을 중심으로 모였는지 확인해 봅시다.", next: "8차시 · 데이터로 과거 유추하기" },
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
      title: "근거 2개와 과거 유추 1개를 만들어요",
      instruction: "CODAP 관계 그래프를 보고 근거부터 말합니다.",
      steps: ["관계 있는 두 항목 고르기", "반복되는 모습 찾기", "근거 2개 → 유추 1개 쓰기"],
    },
    closing: { image: "crown", title: "유추와 확인된 사실을 구분했나요?", prompt: "우리 문장에 ‘가능성이 있다’가 필요한지 자료 근거와 함께 점검해 봅시다.", next: "9차시 · 데이터로 미래 변화 예측하기" },
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
      title: "Desmos에서 세 가지 미래를 그려요",
      instruction: "연도별 수치를 입력하고 조건에 따른 시나리오를 만듭니다.",
      steps: ["연도·수치 입력하기", "추세선 확인하기", "세 시나리오와 한계 기록하기"],
    },
    closing: { image: "mural", title: "예측이 빗나갈 수 있는 까닭은 무엇인가요?", prompt: "정책·날씨·관람 환경처럼 그래프 밖에서 달라질 수 있는 조건을 한 가지 말해 봅시다.", next: "10차시 · AR 데이터 박물관 열기" },
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
      title: "AR 카드와 데이터 결과를 함께 보여 주세요",
      instruction: "AR이 멈추면 그래프 PNG와 QR 대체 자료로 계속 설명합니다.",
      steps: ["그래프 경향 설명하기", "과거 유추와 AR 사실 연결하기", "예측 조건·한계 말하고 질문받기"],
    },
    closing: { image: "gaya", title: "1차시의 나와 무엇이 달라졌나요?", prompt: "첫 생각 카드를 다시 읽고 데이터와 AI를 역사 공부에 어떻게 사용할지 한 문장으로 씁니다.", next: "삼국시대 데이터·AI·AR 탐구 완료" },
  },
};

const decks = Object.fromEntries(
  Object.entries(deckPlans).map(([lessonId, plan]) => [Number(lessonId), makeDeck(Number(lessonId), plan)]),
) as Record<number, readonly LessonSlide[]>;

export function getThreeKingdomsSlides(lessonId: number) {
  return decks[lessonId] ?? decks[1];
}
