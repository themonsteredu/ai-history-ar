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
  googleSheets: { label: "도구 도움말: Google Sheets 파일 가져오기·내보내기", href: "https://support.google.com/docs/answer/9331167?hl=ko" },
  codapGraphs: { label: "도구 도움말: CODAP 그래프 시작하기", href: "https://codap.concord.org/how-to/getting-started-with-graphs/" },
  rawgraphs: { label: "선택 도구 도움말: RAWGraphs 데이터 불러오기", href: "https://www.rawgraphs.io/learning/how-to-load-and-format-your-data-for-rawgraphs" },
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
      steps: ["눈으로 보이는 사실 한 가지 말하기", "표에 넣을 공통 항목 한 가지 고르기", "질문 종류를 고르고 모둠에서 말하기"],
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
      eyebrow: "여섯 모둠의 AI 질문",
      title: "같은 시대를 물어도 AI는 그럴듯한 답을 만들 수 있습니다",
      instruction: "각 모둠은 담당 유산의 답변에서 ‘근거 없이 확정한 문장’을 먼저 찾습니다.",
      image: "muryeong",
      source: sources.overview,
    },
    {
      kind: "fact",
      eyebrow: "AI 의심 수업 1 · 말투",
      title: "자신 있는 말투가 정확한 근거를 뜻하지는 않습니다",
      points: [
        "AI는 여러 글에서 자주 함께 나온 표현을 자연스럽게 이어 답합니다.",
        "출처가 없거나 연구자 의견이 나뉘는 내용도 확정된 사실처럼 말할 수 있습니다.",
        "‘반드시·정확히·모두’ 같은 단정 표현이 나오면 근거를 다시 찾아야 합니다.",
      ],
      takeaway: "AI 답변은 조사의 출발점이지 역사 자료의 출처가 아닙니다.",
      image: "cheomseongdae",
      source: sources.cheomseongdae,
    },
    {
      kind: "compare",
      eyebrow: "AI 의심 수업 1 · 문장 비교",
      title: "두 문장 가운데 무엇을 더 확인해야 할까요?",
      left: {
        label: "확인 가능한 사실",
        title: "첨성대는 돌을 층층이 쌓은 건축물이다",
        items: ["사진과 공식 설명에서 구조를 확인할 수 있습니다.", "자료를 만든 기관과 원문 주소를 다시 찾을 수 있습니다."],
      },
      right: {
        label: "더 확인할 주장",
        title: "첨성대 안에서 망원경으로 별을 관찰했다",
        items: ["당시 망원경을 사용했다는 근거가 없습니다.", "관측 방법을 하나의 장면으로 확정해서는 안 됩니다."],
      },
      image: "cheomseongdae",
      source: sources.cheomseongdae,
    },
    {
      kind: "fact",
      eyebrow: "AI 의심 수업 2 · 사실과 해석",
      title: "사진에서 보이는 것과 사용 모습을 추측한 것은 다릅니다",
      points: [
        "신라 금관에 얇은 금판과 굽은옥 장식이 있다는 것은 관찰할 수 있습니다.",
        "왕이 살아 있을 때 실제로 썼는지는 출토 상황과 연구 자료를 더 살펴야 합니다.",
        "알 수 없는 사용 장면을 AI가 만들어 냈다면 ‘확인 필요’로 표시합니다.",
      ],
      takeaway: "이름이 ‘금관’이라는 이유만으로 실제 착용 장면까지 확정할 수는 없습니다.",
      image: "crown",
      source: sources.crown,
    },
    {
      kind: "fact",
      eyebrow: "AI 의심 수업 3 · 세 가지 신호",
      title: "이런 문장이 보이면 밑줄을 그으세요",
      points: [
        "출처가 없는데 정확한 사람·연도·도구를 말하는 문장",
        "여러 학설 가운데 하나만 정답이라고 단정하는 문장",
        "유물의 모양만 보고 옛사람의 행동과 생각을 모두 설명하는 문장",
      ],
      takeaway: "틀렸다고 바로 결론 내리기보다 ‘왜 의심했는지’를 먼저 기록합니다.",
      image: "mural",
      source: sources.mural,
    },
    {
      kind: "activity",
      eyebrow: "교사 화면 공동 활동",
      title: "문장을 보고 학급 전체가 함께 판단해요",
      instruction: "교사가 한 문장씩 보여 주면 학생은 손이나 말로 판단하고, 활동지에는 이유 카드 하나를 고릅니다.",
      steps: ["문장에서 단정 표현 찾기", "자료와 맞음·확인 필요 중 하나 고르기", "출처 없음·너무 확실함·시대 불일치 중 하나 고르기"],
      image: "incense",
      source: sources.overview,
    },
    {
      kind: "quiz",
      eyebrow: "AI 문장 의심 퀴즈",
      title: "이 설명을 그대로 믿어도 될까요?",
      statement: "신라 금관은 왕이 살아 있을 때 매일 머리에 쓰던 관이다.",
      verdict: "보류",
      explanation: "금관이 무덤에서 발견되었다는 사실은 확인할 수 있지만, 실제 착용 여부와 방법은 한 가지 결론으로 확정하기 어렵습니다. 출처를 확인할 때까지 판단을 보류합니다.",
      image: "crown",
      source: sources.crown,
    },
  ],
  3: [
    {
      kind: "gallery",
      eyebrow: "같은 유산, 세 가지 설명",
      title: "국가기관 자료·여행 블로그·AI 요약문을 비교합니다",
      instruction: "유명하거나 말투가 자신 있다는 이유로 고르지 말고, 누가 어떤 근거로 썼는지 찾으세요.",
      image: "cheomseongdae",
      source: sources.cheomseongdae,
    },
    {
      kind: "fact",
      eyebrow: "검증 1단계 · 출처",
      title: "누가 왜 만든 자료인지 먼저 확인해요",
      points: [
        "기관·작성자 이름이 있는지 확인합니다.",
        "문화유산 안내·여행 후기·AI 요약처럼 자료의 목적을 구분합니다.",
        "출처가 없으면 다음 단계로 가기 전에 원문부터 찾습니다.",
      ],
      takeaway: "출처는 유명한 이름을 찾는 일이 아니라 책임지고 설명한 주체를 확인하는 일입니다.",
      image: "muryeong",
      source: sources.muryeong,
    },
    {
      kind: "fact",
      eyebrow: "검증 2단계 · 시기",
      title: "유산의 시대와 자료를 쓴 시기를 나누어 봐요",
      points: [
        "첨성대가 세워진 신라 시대와 오늘날 설명문이 작성된 때는 다릅니다.",
        "오래된 기록은 당시 관점을 보여 주지만 새로운 발굴 결과를 담지 못할 수 있습니다.",
        "최신 글도 근거 없이 옛 내용을 반복했다면 다시 확인해야 합니다.",
      ],
      takeaway: "‘언제의 일인가’와 ‘언제 쓴 자료인가’를 모두 확인해야 합니다.",
      image: "cheomseongdae",
      source: sources.cheomseongdae,
    },
    {
      kind: "compare",
      eyebrow: "검증 3단계 · 교차",
      title: "한 자료의 문장을 다른 자료와 나란히 놓아요",
      left: {
        label: "서로 일치",
        title: "돌을 층층이 쌓은 신라의 건축물",
        items: ["사진과 여러 기관 설명에서 구조를 확인할 수 있습니다.", "겹치는 근거의 범위를 사실로 기록합니다."],
      },
      right: {
        label: "서로 다름",
        title: "꼭대기에서 매일 별을 관찰했다",
        items: ["정확한 사용 방법은 자료마다 설명이 다릅니다.", "차이가 생긴 이유와 근거를 더 확인합니다."],
      },
      image: "cheomseongdae",
      source: sources.cheomseongdae,
    },
    {
      kind: "fact",
      eyebrow: "검증 4단계 · 원본",
      title: "요약문에서 원래 기록과 유물 정보까지 거슬러 올라가요",
      points: [
        "AI 답변이나 블로그가 인용한 기관·책·발굴 기록을 찾습니다.",
        "링크가 다시 다른 요약문으로 이어지면 최초 자료까지 더 이동합니다.",
        "원본의 문맥과 요약문이 같은 뜻인지 비교합니다.",
      ],
      takeaway: "원본을 찾으면 중간에 빠지거나 과장된 내용을 발견할 수 있습니다.",
      image: "mural",
      source: sources.mural,
    },
    {
      kind: "fact",
      eyebrow: "검증 5단계 · 보류",
      title: "근거가 부족하면 ‘아직 모름’으로 남겨요",
      points: [
        "자료가 없거나 서로 충돌하면 정답을 서둘러 만들지 않습니다.",
        "첨성대의 모든 사용 방법과 신라 금관의 실제 착용 방식에는 남은 질문이 있습니다.",
        "무엇까지 확인했고 무엇이 부족한지 함께 기록합니다.",
      ],
      takeaway: "보류는 포기가 아니라 현재 근거보다 더 많이 말하지 않는 정확한 판단입니다.",
      image: "crown",
      source: sources.crown,
    },
    {
      kind: "activity",
      eyebrow: "검증 5단계 공동 연습",
      title: "자료 카드 하나를 끝까지 확인해 봅시다",
      instruction: "교사가 자료 카드를 고르면 학급은 단계별 질문에 답하고 학생은 비교지에 근거만 기록합니다.",
      steps: ["출처·시기 표시하기", "다른 자료 및 원본과 비교하기", "확인·추가 확인·보류로 최종 판단하기"],
      image: "incense",
      source: sources.overview,
    },
    {
      kind: "quiz",
      eyebrow: "검증 5단계 마무리",
      title: "공식 기관 자료면 교차 확인을 생략해도 될까요?",
      statement: "국가기관이 만든 자료는 언제나 최신이고 완전하므로 다른 자료와 비교할 필요가 없다.",
      verdict: "틀림",
      explanation: "공식 기관 자료는 좋은 출발점이지만 작성 시기와 근거를 확인하고, 다른 기관 자료·원본 기록과도 비교해야 합니다.",
      image: "muryeong",
      source: sources.muryeong,
    },
  ],
  4: [
    {
      kind: "gallery",
      eyebrow: "여섯 모둠 조사 출발",
      title: "담당 유산마다 확인할 질문이 다릅니다",
      instruction: "사진에서 보이는 단서를 출발점으로 삼고, 정확한 설명은 공식 자료에서 확인하세요.",
      image: "muryeong",
      source: sources.overview,
    },
    {
      kind: "fact",
      eyebrow: "조사 방법 1 · 자료 고르기",
      title: "유산을 직접 관리하거나 기록을 공개한 기관부터 찾아요",
      points: [
        "국가유산청에서는 지정 정보와 유산의 현재 상태를 확인합니다.",
        "국립박물관에서는 소장품 설명·출토 기록·사진을 확인합니다.",
        "유네스코 자료에서는 세계유산의 범위와 가치를 확인합니다.",
      ],
      takeaway: "기관 이름과 원문 주소를 함께 기록해야 친구도 같은 근거를 다시 찾을 수 있습니다.",
      image: "gaya",
      source: sources.gaya,
    },
    {
      kind: "fact",
      eyebrow: "조사 방법 2 · 일곱 칸",
      title: "조사 카드는 확인한 내용과 남은 질문을 함께 담습니다",
      points: [
        "제작 시기, 만든 사람·집단과 목적을 확인합니다.",
        "유산의 가치와 지금 남아 있거나 보관된 상태를 기록합니다.",
        "AI 오류의 정답, 아직 모르는 점, 확인한 출처를 빠뜨리지 않습니다.",
      ],
      takeaway: "빈칸을 억지로 채우는 것보다 왜 아직 모르는지 밝히는 것이 정확한 조사입니다.",
      image: "cheomseongdae",
      source: sources.cheomseongdae,
    },
    {
      kind: "compare",
      eyebrow: "조사 방법 3 · 기록하기",
      title: "자료의 문장을 어떻게 조사 카드에 옮겨야 할까요?",
      left: {
        label: "그대로 베끼기",
        title: "긴 설명을 복사해서 붙인다",
        items: ["무슨 뜻인지 설명하기 어렵습니다.", "사실과 해석이 섞인 부분을 찾기 어렵습니다."],
      },
      right: {
        label: "자기 말로 기록",
        title: "확인한 사실과 출처를 짧게 쓴다",
        items: ["핵심 내용을 이해했는지 확인할 수 있습니다.", "출처 번호를 붙여 근거를 다시 찾을 수 있습니다."],
      },
      image: "muryeong",
      source: sources.muryeong,
    },
    {
      kind: "fact",
      eyebrow: "조사 방법 4 · 현재 상태",
      title: "‘현재 상태’는 지금 어디에 어떻게 남아 있는지를 묻습니다",
      points: [
        "유적은 원래 장소에 남아 있는지, 보존·정비된 범위는 어디까지인지 확인합니다.",
        "유물은 어느 박물관이 소장하고 있는지 확인합니다.",
        "벽화나 고분군처럼 여러 장소에 나뉜 유산은 조사 범위를 분명히 적습니다.",
      ],
      takeaway: "과거에 만들어진 유산도 오늘날의 위치와 보존 상태를 함께 기록해야 정확합니다.",
      image: "mural",
      source: sources.mural,
    },
    {
      kind: "fact",
      eyebrow: "조사 방법 5 · AI 오류 바로잡기",
      title: "틀린 문장만 지우지 말고 근거 있는 문장으로 고쳐요",
      points: [
        "AI가 단정한 문장에서 확인해야 할 낱말을 표시합니다.",
        "공식 자료에서 확인한 범위까지만 새 문장으로 씁니다.",
        "출처 번호와 아직 확인하지 못한 부분을 함께 남깁니다.",
      ],
      takeaway: "‘틀렸다’에서 끝내지 않고 어떤 근거로 어디까지 고쳤는지를 보여 줍니다.",
      image: "crown",
      source: sources.crown,
    },
    {
      kind: "activity",
      eyebrow: "모둠 조사 실전",
      title: "공식 자료를 읽고 조사 카드 한 칸씩 완성해요",
      instruction: "모둠별 자료실에서 담당 유산을 고르고, 학생 활동지에는 핵심 낱말과 출처 번호만 적습니다.",
      steps: ["조사할 항목과 읽을 자료 나누기", "핵심 낱말 찾고 출처 번호 고르기", "AI 오류와 아직 모르는 점에 체크하기"],
      image: "incense",
      source: sources.incense,
    },
    {
      kind: "quiz",
      eyebrow: "조사 카드 마무리",
      title: "공식 자료 한 곳에서 답을 찾지 못하면 빈칸을 추측해도 될까요?",
      statement: "조사 카드를 완성해야 하므로 공식 자료에 없는 내용은 가장 그럴듯한 답으로 채운다.",
      verdict: "틀림",
      explanation: "다른 자료와 교차 확인해도 근거가 없으면 ‘아직 모름’으로 남기고, 무엇을 더 찾아야 하는지 질문으로 기록합니다.",
      image: "cheomseongdae",
      source: sources.cheomseongdae,
    },
  ],
  5: [
    {
      kind: "fact",
      eyebrow: "정제 실습 1 · 시작 파일",
      title: "먼저 CSV를 Google Sheets에 불러옵니다",
      points: [
        "학생 화면에서 ‘예비 데이터 받기’를 눌러 시작 CSV를 저장합니다.",
        "Google Sheets에서 파일 → 가져오기 → 업로드 순서로 파일을 고릅니다.",
        "유산명·나라·시기·지역·종류·출처 열이 모두 보이는지 확인합니다.",
      ],
      takeaway: "표를 고치기 전에 원본을 남기고 문제 종류에 체크합니다.",
      image: "muryeong",
      source: sources.googleSheets,
    },
    {
      kind: "compare",
      eyebrow: "정제 실습 2 · 바꾸어도 되는 것",
      title: "표기를 통일하는 것과 사실을 바꾸는 것은 다릅니다",
      left: {
        label: "좋은 정제",
        title: "백제·Baekje를 ‘백제’로 통일한다",
        items: ["같은 뜻의 표기만 공통값으로 맞춥니다.", "고친 항목에 체크합니다."],
      },
      right: {
        label: "잘못된 정제",
        title: "빈 연도를 그럴듯한 숫자로 채운다",
        items: ["원자료에 없는 사실을 새로 만들었습니다.", "‘확인 필요’로 남기고 분석 제외 여부를 적습니다."],
      },
      image: "crown",
      source: sources.overview,
    },
    {
      kind: "fact",
      eyebrow: "정제 실습 3 · 네 가지 확인",
      title: "중복·빈칸·표기 차이·출처를 차례로 살펴요",
      points: [
        "중복: 같은 유산과 같은 출처가 반복된 행인지 확인합니다.",
        "빈칸: 모르는 값은 추측하지 않고 ‘확인 필요’로 표시합니다.",
        "표기·출처: 같은 뜻은 통일하고 원문 주소와 확인 날짜를 남깁니다.",
      ],
      takeaway: "한 번에 모두 고치지 말고 항목 하나를 끝낸 뒤 다음 항목으로 이동합니다.",
      image: "incense",
      source: sources.overview,
    },
    {
      kind: "activity",
      eyebrow: "정제 실습 4 · 수정 기록",
      title: "셀을 고칠 때마다 ‘무엇을 왜’ 바꿨는지 적어요",
      instruction: "정제 활동지는 문제 종류와 완료 여부만 체크합니다.",
      steps: ["문제가 있는 셀과 원래 값 찾기", "학급 표준표에 따라 값 고치기", "중복·빈칸·표기·출처 중 하나에 체크하기"],
      image: "gaya",
      source: sources.googleSheets,
    },
    {
      kind: "fact",
      eyebrow: "정제 실습 5 · 저장",
      title: "정제된 표는 CSV로 다시 내려받습니다",
      points: [
        "파일 → 다운로드에서 CSV 형식을 선택합니다.",
        "파일 이름을 ‘모둠번호_유산명_정제.csv’로 통일합니다.",
        "정제 전후 행 수가 다른 경우 삭제·합친 까닭을 기록합니다.",
      ],
      takeaway: "6차시 CODAP에서 열 파일과 정제 기록지를 한 폴더에 함께 둡니다.",
      image: "cheomseongdae",
      source: sources.googleSheets,
    },
    {
      kind: "quiz",
      eyebrow: "정제 완료 확인",
      title: "빈칸이 남아 있으면 정제가 실패한 걸까요?",
      statement: "정제된 표에는 빈칸이 하나도 없어야 하므로 모르는 값도 반드시 숫자나 낱말로 채워야 한다.",
      verdict: "틀림",
      explanation: "정제는 모르는 사실을 만드는 일이 아닙니다. 근거가 없는 값은 ‘확인 필요’로 남기고 어떤 분석에서 제외했는지 밝히는 것이 정확합니다.",
      image: "mural",
      source: sources.overview,
    },
  ],
  6: [
    {
      kind: "fact",
      eyebrow: "CODAP 실습 1 · 불러오기",
      title: "정제한 CSV가 표로 열렸는지 먼저 확인합니다",
      points: [
        "5차시에서 저장한 정제 CSV를 준비합니다.",
        "CODAP 화면에서 데이터 표의 열 이름과 행 수를 확인합니다.",
        "글자가 깨지거나 열이 섞였다면 원래 CSV를 다시 확인합니다.",
      ],
      takeaway: "그래프를 만들기 전에 표가 정확히 들어왔는지 확인해야 오류를 되돌릴 수 있습니다.",
      image: "muryeong",
      source: sources.codapGraphs,
    },
    {
      kind: "fact",
      eyebrow: "CODAP 실습 2 · 질문과 축",
      title: "탐구 질문에 답하는 두 항목을 축에 놓아요",
      points: [
        "가로축에는 비교할 시기·지역·자료 종류 중 하나를 놓습니다.",
        "세로축에는 개수나 연도처럼 질문에 필요한 값을 놓습니다.",
        "열 이름을 축으로 끌어 놓은 뒤 데이터 점이 어떻게 달라지는지 봅니다.",
      ],
      takeaway: "CODAP에서는 표의 열 이름을 가로축과 세로축에 놓아 관계를 살펴볼 수 있습니다.",
      image: "cheomseongdae",
      source: sources.codapGraphs,
    },
    {
      kind: "compare",
      eyebrow: "CODAP 실습 3 · 그래프 선택",
      title: "질문의 종류에 따라 그래프 모양도 달라집니다",
      left: {
        label: "종류별 개수",
        title: "지역·유산 종류를 범주로 비교한다",
        items: ["같은 값끼리 묶어 개수 차이를 봅니다.", "어느 항목이 더 많고 적은지 말합니다."],
      },
      right: {
        label: "시간의 흐름",
        title: "연도에 따라 값이 어떻게 달라지는지 본다",
        items: ["가로축의 순서가 시간 순서인지 확인합니다.", "증가·감소·반복되는 모습을 살펴봅니다."],
      },
      image: "gaya",
      source: sources.codapGraphs,
    },
    {
      kind: "activity",
      eyebrow: "CODAP 실습 4 · 한 번에 따라 하기",
      title: "표 확인 → 축 배치 → 제목 쓰기 순서로 만듭니다",
      instruction: "선생님 화면과 같은 속도로 한 단계씩 멈추며 모둠 그래프를 완성합니다.",
      steps: ["CSV의 열 이름과 행 수 확인하기", "질문에 맞는 두 항목을 축에 놓기", "그래프 제목·축 이름·단위를 확인하기"],
      image: "incense",
      source: sources.codapGraphs,
    },
    {
      kind: "fact",
      eyebrow: "CODAP 실습 5 · 결과 저장",
      title: "카메라 아이콘으로 그래프를 PNG로 저장해요",
      points: [
        "그래프 제목에 무엇을 비교했는지 드러나게 씁니다.",
        "축 이름·단위·자료 수가 보이는지 마지막으로 확인합니다.",
        "카메라 아이콘으로 화면을 저장하고 모둠 파일 이름을 붙입니다.",
      ],
      takeaway: "저장한 PNG는 7차시 해석 활동지와 10차시 박물관 전시에 다시 사용합니다.",
      image: "crown",
      source: sources.codapGraphs,
    },
    {
      kind: "quiz",
      eyebrow: "그래프 완성 확인",
      title: "막대가 가장 크면 그 유산이 가장 중요하다는 뜻일까요?",
      statement: "그래프에서 값이 가장 큰 문화유산은 삼국시대 전체에서 역사적 가치도 가장 크다.",
      verdict: "틀림",
      explanation: "그래프의 크기는 이번 수업 데이터에 들어 있는 값이나 개수를 보여 줄 뿐입니다. 역사적 중요성과 같지 않으며 자료 범위를 함께 말해야 합니다.",
      image: "crown",
      source: sources.overview,
    },
  ],
  7: [
    {
      kind: "fact",
      eyebrow: "그래프 읽기 1 · 겉표지",
      title: "제목·가로축·세로축·자료 수부터 확인해요",
      points: [
        "제목에서 무엇과 무엇을 비교했는지 찾습니다.",
        "각 축의 항목과 단위를 소리 내어 읽습니다.",
        "자료 수와 조사 범위를 확인한 뒤 값의 크기를 봅니다.",
      ],
      takeaway: "축을 읽지 않고 막대 모양만 보면 전혀 다른 뜻으로 해석할 수 있습니다.",
      image: "cheomseongdae",
      source: sources.codapGraphs,
    },
    {
      kind: "compare",
      eyebrow: "그래프 읽기 2 · 관찰과 추측",
      title: "그래프에서 보이는 점과 그 까닭을 나누어 말해요",
      left: {
        label: "그래프에서 보임",
        title: "이 자료에서는 신라 유산 행이 3개로 가장 많다",
        items: ["값과 항목을 직접 가리킬 수 있습니다.", "이번 데이터 범위 안에서 말했습니다."],
      },
      right: {
        label: "그래프만으로 모름",
        title: "신라가 가장 뛰어났기 때문에 많다",
        items: ["원인과 가치 판단은 그래프에 없습니다.", "다른 역사 자료가 더 필요합니다."],
      },
      image: "crown",
      source: sources.overview,
    },
    {
      kind: "fact",
      eyebrow: "그래프 읽기 3 · 세 가지 단서",
      title: "가장 큰 값·작은 값·눈에 띄는 차이를 찾습니다",
      points: [
        "가장 큰 값과 가장 작은 값을 항목 이름과 함께 말합니다.",
        "두 값의 차이가 얼마나 되는지 확인합니다.",
        "비슷하게 모이거나 특별히 떨어진 값이 있는지 찾습니다.",
      ],
      takeaway: "먼저 숫자로 보이는 사실을 말하고, 까닭은 다음 차시의 근거와 연결합니다.",
      image: "gaya",
      source: sources.codapGraphs,
    },
    {
      kind: "fact",
      eyebrow: "그래프 읽기 4 · 한계",
      title: "그래프에 들어오지 않은 사람과 자료도 생각해요",
      points: [
        "여섯 유산만으로 삼국시대 모든 사람의 생활을 설명할 수 없습니다.",
        "왕실·무덤 자료가 많으면 평범한 사람의 모습이 적게 보일 수 있습니다.",
        "어떤 행을 제외했는지와 아직 확인하지 못한 값을 함께 밝힙니다.",
      ],
      takeaway: "좋은 해석은 그래프가 보여 주는 범위와 보여 주지 못하는 범위를 함께 말합니다.",
      image: "mural",
      source: sources.mural,
    },
    {
      kind: "activity",
      eyebrow: "그래프 읽기 5 · 발표 문장",
      title: "값 → 경향 → 한계 순서로 1분 설명을 만듭니다",
      instruction: "그래프를 손으로 가리키며 문장틀의 빈칸을 모둠 데이터에 맞게 채웁니다.",
      steps: ["‘이 그래프는 ○○을 비교했습니다’로 시작하기", "숫자가 들어간 경향 한 문장 말하기", "‘하지만 ○○까지는 알 수 없습니다’로 마무리하기"],
      image: "incense",
      source: sources.overview,
    },
    {
      kind: "quiz",
      eyebrow: "그래프 해석 확인",
      title: "그래프만으로 원인까지 설명할 수 있을까요?",
      statement: "두 지역의 값이 다르면 그래프만 보고 그 차이가 생긴 역사적 원인을 바로 알 수 있다.",
      verdict: "틀림",
      explanation: "그래프는 값의 차이를 보여 주지만 원인은 보여 주지 않습니다. 4차시 공식 자료와 다른 역사 근거를 함께 확인해야 합니다.",
      image: "muryeong",
      source: sources.overview,
    },
  ],
  8: [
    {
      kind: "fact",
      eyebrow: "과거 유추 1 · 근거 사슬",
      title: "그래프 한 점에서 바로 결론으로 뛰어가지 않습니다",
      points: [
        "먼저 그래프에서 확인한 값이나 관계를 말합니다.",
        "공식 자료에서 연결되는 역사 사실을 하나 더 찾습니다.",
        "두 근거가 함께 가리키는 가능한 설명을 만듭니다.",
      ],
      takeaway: "그래프 근거 → 역사 자료 → 가능한 설명의 순서를 지키면 유추의 길이 보입니다.",
      image: "gaya",
      source: sources.gaya,
    },
    {
      kind: "compare",
      eyebrow: "과거 유추 2 · 말의 세기",
      title: "확인된 사실과 가능한 설명을 다른 말투로 씁니다",
      left: {
        label: "사실처럼 단정",
        title: "가야 사람들은 모두 같은 생활을 했다",
        items: ["자료 범위를 전체 사람에게 넓혔습니다.", "예외와 다른 지역 자료를 설명하지 못합니다."],
      },
      right: {
        label: "근거 있는 유추",
        title: "여러 지역이 교류했을 가능성이 있다",
        items: ["그래프와 출토 자료의 관계를 근거로 삼습니다.", "‘가능성이 있다’로 결론의 범위를 밝힙니다."],
      },
      image: "gaya",
      source: sources.gaya,
    },
    {
      kind: "fact",
      eyebrow: "과거 유추 3 · 근거 두 개",
      title: "서로 다른 종류의 근거를 연결하면 설명이 단단해집니다",
      points: [
        "그래프에서는 지역별 유산 종류나 분포의 관계를 찾습니다.",
        "공식 자료에서는 출토 위치·재료·무늬·기록을 확인합니다.",
        "두 근거가 같은 설명을 지지하는지, 서로 어긋나는지 살펴봅니다.",
      ],
      takeaway: "근거가 서로 어긋나면 억지로 하나의 결론을 만들지 않고 더 필요한 자료를 적습니다.",
      image: "incense",
      source: sources.overview,
    },
    {
      kind: "activity",
      eyebrow: "과거 유추 4 · 문장 만들기",
      title: "‘두 근거를 함께 보면’으로 유추 문장을 시작해요",
      instruction: "활동지에 근거 1·근거 2·가능한 설명·더 필요한 자료를 한 줄씩 기록합니다.",
      steps: ["그래프에서 관계 한 가지 고르기", "공식 자료에서 연결 사실 찾기", "가능성 문장과 유추의 한계 함께 쓰기"],
      image: "mural",
      source: sources.mural,
    },
    {
      kind: "fact",
      eyebrow: "선택 도구 · RAWGraphs",
      title: "관계가 복잡한 모둠은 RAWGraphs로 한 번 더 표현할 수 있어요",
      points: [
        "정제된 한 개의 표를 CSV로 준비합니다.",
        "파일을 불러온 뒤 관계를 잘 보여 주는 그래프를 선택합니다.",
        "기본 활동은 CODAP으로 완성하고 시간이 남을 때만 사용합니다.",
      ],
      takeaway: "도구를 바꾸는 목적은 더 화려하게 꾸미는 것이 아니라 관계를 더 분명히 보여 주는 것입니다.",
      image: "cheomseongdae",
      source: sources.rawgraphs,
    },
    {
      kind: "quiz",
      eyebrow: "과거 유추 확인",
      title: "근거가 두 개면 반드시 하나의 정답이 나올까요?",
      statement: "그래프와 공식 자료를 하나씩 사용했으므로 우리 모둠의 과거 설명은 확정된 사실이다.",
      verdict: "틀림",
      explanation: "두 근거는 가능성을 높이지만 과거의 모든 상황을 확정하지는 못합니다. 유추 표현과 더 필요한 자료를 함께 밝혀야 합니다.",
      image: "crown",
      source: sources.overview,
    },
  ],
  9: [
    {
      kind: "gallery",
      eyebrow: "여섯 유산 · 여섯 가지 표현",
      title: "같은 AR 효과를 모든 유산에 똑같이 쓰지 않습니다",
      instruction: "CODAP 그래프의 경향 한 가지와 조사 카드의 사실을 연결해 가장 먼저 보여 줄 특징을 고르세요.",
      image: "incense",
      source: sources.overview,
    },
    {
      kind: "fact",
      eyebrow: "AR 기획 1 · 등장 요소",
      title: "카드를 찾은 순간 무엇이 가장 먼저 나타나야 할까요?",
      points: ["유산 이름과 핵심 위치 표시는 한눈에 보여야 합니다.", "그래프에서 찾은 경향을 짧은 문장으로 먼저 보여 줍니다.", "4차시 조사 카드에서 확인한 사실과 연결되는 특징만 장면에 넣습니다."],
      takeaway: "등장 요소는 많을수록 좋은 것이 아니라 관람객의 시선을 어디로 보낼지 정하는 선택입니다.",
      image: "crown",
      source: sources.crown,
    },
    {
      kind: "fact",
      eyebrow: "AR 기획 2 · 움직임",
      title: "움직임에는 보여 주려는 까닭이 있어야 합니다",
      points: ["회전은 앞뒤와 옆면을 비교할 때 사용합니다.", "확대는 무늬·재료·구조처럼 작은 특징을 볼 때 사용합니다.", "순서 공개는 제작 과정이나 확인·보류 내용을 나눠 보여 줄 때 사용합니다."],
      takeaway: "재미만을 위한 빠른 움직임보다 역사적 특징을 발견하게 하는 느리고 분명한 움직임이 좋습니다.",
      image: "incense",
      source: sources.incense,
    },
    {
      kind: "compare",
      eyebrow: "AR 기획 3 · 범위 줄이기",
      title: "어느 기획이 교실에서 더 잘 구현될까요?",
      left: { label: "너무 큼", title: "궁궐·전투·인물 20명을 모두 재현한다", items: ["확인되지 않은 장면이 섞이기 쉽습니다.", "관람객이 무엇을 봐야 할지 알기 어렵습니다."] },
      right: { label: "구현 가능", title: "확인된 특징 하나를 확대하고 설명한다", items: ["조사 카드의 출처와 바로 연결됩니다.", "짧은 체험 안에 핵심이 분명해집니다."] },
      image: "mural",
      source: sources.mural,
    },
    {
      kind: "fact",
      eyebrow: "AR 기획 4 · 한 문장 해설",
      title: "한 문장 해설은 그래프와 유산의 특징을 연결합니다",
      points: ["‘이 그래프에서는 무엇이 보이나요?’로 경향을 먼저 말합니다.", "‘AR에서 이 특징을 찾아보세요’로 관람객의 시선을 이끕니다.", "아직 모르는 내용은 확정된 장면처럼 설명하지 않습니다."],
      takeaway: "예: 이 자료에서는 신라 장신구가 많이 보입니다. AR에서 금관의 세움 장식과 굽은옥을 찾아보세요.",
      image: "crown",
      source: sources.crown,
    },
    {
      kind: "fact",
      eyebrow: "AR 기획 5 · 관람객 행동",
      title: "관람객에게 한 가지 행동을 부탁해요",
      points: ["표시된 특징을 사진에서 직접 찾게 합니다.", "두 부분을 눌러 차이를 비교하게 합니다.", "확인된 사실과 아직 모르는 점 중 하나를 고르게 합니다."],
      takeaway: "관람객 행동은 게임 점수보다 유산을 더 자세히 관찰하게 해야 합니다.",
      image: "cheomseongdae",
      source: sources.cheomseongdae,
    },
    {
      kind: "activity",
      eyebrow: "AR 체험과 기획",
      title: "체험한 뒤 우리 모둠의 한 장면을 설계해요",
      instruction: "담당 유산의 카메라 또는 대체 체험을 실행하고, CODAP 그래프와 공식 자료를 연결한 30초 해설 장면을 정합니다.",
      steps: ["그래프에서 설명할 경향 한 가지 고르기", "조사 카드에서 연결되는 확인 사실 찾기", "카드 인식 뒤 이어질 장면·관람객 행동·자료의 한계 스케치하기"],
      image: "muryeong",
      source: sources.muryeong,
    },
    {
      kind: "quiz",
      eyebrow: "AR 기획 마무리",
      title: "효과가 많고 화려할수록 좋은 AR일까요?",
      statement: "회전·불꽃·큰 소리·여러 인물을 한 장면에 모두 넣으면 관람객이 역사를 더 정확히 이해한다.",
      verdict: "틀림",
      explanation: "그래프 경향과 검증한 사실이 연결되고 관람객이 직접 특징을 찾을 때 좋은 AR입니다. 확인되지 않은 장면과 불필요한 효과는 줄입니다.",
      image: "gaya",
      source: sources.gaya,
    },
  ],
  10: [
    {
      kind: "fact",
      eyebrow: "박물관 준비 1 · 부스 구성",
      title: "그래프·AR 카드·출처·대체 자료를 한자리에 둡니다",
      points: [
        "정제된 데이터로 만든 최종 그래프 PNG를 세웁니다.",
        "AR 카드와 카메라 없이 볼 수 있는 QR 대체 자료를 함께 준비합니다.",
        "공식 자료의 기관명과 원문 주소가 보이는 출처표를 붙입니다.",
      ],
      takeaway: "관람객이 해설을 듣지 않아도 근거의 출처와 자료 흐름을 찾을 수 있어야 합니다.",
      image: "muryeong",
      source: sources.overview,
    },
    {
      kind: "fact",
      eyebrow: "박물관 준비 2 · 30초 해설",
      title: "그래프에서 보이는 점부터 말하고 AR로 특징을 찾게 해요",
      points: [
        "첫 문장: 무엇을 비교한 그래프인지 소개합니다.",
        "둘째 문장: 값과 경향을 말하고 공식 자료의 사실을 연결합니다.",
        "마지막: AR에서 볼 특징과 아직 모르는 점을 안내합니다.",
      ],
      takeaway: "결론부터 외우기보다 관람객이 근거를 따라갈 수 있는 순서로 설명합니다.",
      image: "crown",
      source: sources.crown,
    },
    {
      kind: "compare",
      eyebrow: "박물관 준비 3 · 질문에 답하기",
      title: "모르는 질문을 받았을 때 도슨트는 어떻게 답할까요?",
      left: {
        label: "꾸며서 답하기",
        title: "아마 그랬을 거예요라고 바로 말한다",
        items: ["근거와 상상을 구분하기 어렵습니다.", "관람객에게 잘못된 사실이 남을 수 있습니다."],
      },
      right: {
        label: "근거로 답하기",
        title: "확인한 범위와 더 찾아볼 자료를 말한다",
        items: ["출처에서 확인한 내용까지만 답합니다.", "모르는 점은 질문 기록지에 남깁니다."],
      },
      image: "cheomseongdae",
      source: sources.cheomseongdae,
    },
    {
      kind: "activity",
      eyebrow: "박물관 준비 4 · 모둠 리허설",
      title: "도슨트·기기 담당·관람객 역할을 바꾸어 연습합니다",
      instruction: "한 번의 리허설마다 관람객 질문과 멈춘 지점을 기록한 뒤 역할을 바꿉니다.",
      steps: ["30초 해설과 AR 체험 순서 실행하기", "관람객이 기억한 근거 한 가지 확인하기", "말이 길거나 자료가 끊긴 부분 고쳐 다시 연습하기"],
      image: "incense",
      source: sources.overview,
    },
    {
      kind: "fact",
      eyebrow: "박물관 준비 5 · 실패 대비",
      title: "AR이 멈춰도 그래프와 해설은 계속되어야 합니다",
      points: [
        "카메라가 열리지 않으면 QR 대체 체험이나 유산 사진을 보여 줍니다.",
        "인터넷이 느리면 미리 저장한 그래프 PNG와 출처표를 사용합니다.",
        "기기 문제를 고치는 동안 다른 학생이 질문과 해설을 이어 갑니다.",
      ],
      takeaway: "좋은 수업 도구는 기술이 멈췄을 때도 역사 설명과 학생 활동이 이어집니다.",
      image: "mural",
      source: sources.overview,
    },
    {
      kind: "quiz",
      eyebrow: "박물관 운영 확인",
      title: "관람객 질문에 모두 바로 답해야 좋은 도슨트일까요?",
      statement: "도슨트는 전문가처럼 보여야 하므로 출처에서 확인하지 못한 질문에도 즉시 답을 만들어야 한다.",
      verdict: "틀림",
      explanation: "좋은 도슨트는 확인한 사실과 유추를 구분하고, 모르는 질문에는 꾸며내지 않고 더 확인할 자료와 방법을 안내합니다.",
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
    closing: { image: "mural", title: "유물 하나만 보면 과거를 정확히 알 수 있을까요?", prompt: "아니요. 유물의 모양뿐 아니라 시기·발견 장소·용도·출처를 연결해야 하며, 확인할 수 없는 내용은 모른다고 남겨야 합니다.", next: "2차시 · AI에게 물어보았습니다" },
  },
  2: {
    title: "AI에게\n물어보았습니다",
    subtitle: "그럴듯한 역사 설명에서 틀렸거나 더 확인해야 할 내용을 찾습니다.",
    coverImage: "cheomseongdae",
    history: {
      image: "cheomseongdae",
      title: "첨성대는 확인된 사실과 아직 모르는 점이 함께 있습니다",
      points: ["신라 선덕여왕 때 세운 것으로 보는 석조 건축물입니다.", "천문 관측과 관련된 시설이라는 설명을 확인할 수 있습니다.", "누가 어떤 자세와 도구로 관측했는지는 하나로 확정되지 않았습니다."],
      takeaway: "AI가 빈 부분을 구체적인 장면으로 채웠다면 근거를 다시 확인해야 합니다.",
      source: sources.cheomseongdae,
    },
    data: {
      image: "muryeong",
      title: "AI 답변은 출처가 아니라 확인할 주장입니다",
      points: ["문장 속에서 확인할 수 있는 사실을 찾습니다.", "출처가 없거나 너무 구체적인 장면에는 밑줄을 긋습니다.", "틀림으로 단정하기 어려우면 ‘확인 필요’로 남깁니다."],
      takeaway: "오늘의 목표는 정답 맞히기가 아니라 의심할 근거를 말하는 것입니다.",
    },
    compare: {
      image: "crown",
      title: "두 설명은 근거의 범위가 어떻게 다를까요?",
      left: { label: "자료에서 확인", title: "금관은 왕릉급 무덤에서 발견되었다", items: ["출토 위치를 박물관 기록에서 확인할 수 있습니다.", "다른 사람이 같은 자료를 다시 찾을 수 있습니다."] },
      right: { label: "더 확인할 주장", title: "왕이 매일 머리에 쓰고 다녔다", items: ["실제 착용 장면을 보여 주는 기록이 필요합니다.", "구조와 출토 상황만으로 단정하기 어렵습니다."] },
    },
    activity: {
      image: "incense",
      title: "AI 답변에 밑줄을 긋고 의심한 이유를 써요",
      instruction: "문장을 하나씩 읽고 먼저 혼자 판단한 뒤, 활동지에 의심한 근거를 기록합니다.",
      steps: ["단정하거나 너무 구체적인 문장 찾기", "자료와 맞음·확인 필요로 표시하기", "왜 더 확인해야 하는지 기록하기"],
    },
    closing: { image: "cheomseongdae", title: "AI가 자신 있게 말하면 모두 사실일까요?", prompt: "아니요. 출처가 없거나 학자들의 의견이 나뉘는 내용을 확정적으로 말할 수 있습니다. 의심한 문장은 다음 시간에 출처·시기·교차·원본·보류의 순서로 확인합니다.", next: "3차시 · 진짜인지 확인하는 방법" },
  },
  3: {
    title: "진짜인지\n확인하는 방법",
    subtitle: "출처·시기·교차·원본·보류의 검증 5단계를 자료에 적용합니다.",
    coverImage: "cheomseongdae",
    history: {
      image: "cheomseongdae",
      title: "첨성대에는 확인할 수 있는 사실과 남은 질문이 함께 있습니다",
      points: ["신라 선덕여왕 때 세운 것으로 설명됩니다.", "천문 관측과 관련된 시설이라는 해석이 널리 사용됩니다.", "정확한 관측 방법과 모든 쓰임은 하나로 확정하기 어렵습니다."],
      takeaway: "확인된 사실과 아직 모르는 내용을 구분하는 것이 검증의 시작입니다.",
      source: sources.cheomseongdae,
    },
    data: {
      image: "incense",
      title: "검증 5단계는 자료를 믿거나 버리는 순서가 아닙니다",
      points: ["출처와 시기를 확인하고 다른 자료와 교차합니다.", "요약문에서 원본 자료까지 거슬러 올라갑니다.", "근거가 부족하면 억지로 정답을 만들지 않고 보류합니다."],
      takeaway: "검증은 근거의 범위를 확인해 말할 수 있는 만큼만 말하는 과정입니다.",
    },
    compare: {
      image: "crown",
      title: "검증 뒤 두 문장을 어떻게 다르게 기록할까요?",
      left: { label: "확인", title: "금관은 왕릉급 무덤에서 출토되었다", items: ["박물관 소장품 기록과 발굴 정보를 확인합니다.", "출처를 붙여 확인된 사실로 기록합니다."] },
      right: { label: "보류", title: "왕이 살아 있을 때 매일 직접 썼다", items: ["출토 위치와 구조만으로 착용 장면을 확정하기 어렵습니다.", "현재 근거의 한계를 밝히고 보류합니다."] },
    },
    activity: {
      image: "mural",
      title: "자료 3종에 검증 5단계를 적용해요",
      instruction: "국가기관 자료·여행 블로그·AI 요약문을 한 단계씩 확인하고 활동지에 근거를 적습니다.",
      steps: ["출처와 작성 시기 표시하기", "다른 자료 및 원본과 비교하기", "확인·추가 확인·보류로 판단하기"],
    },
    closing: { image: "crown", title: "끝까지 확인해도 알 수 없다면 어떻게 해야 할까요?", prompt: "모르는 내용을 꾸며내지 않고 ‘아직 모름’으로 보류합니다. 보류는 실패가 아니라 현재 근거의 한계를 정확히 밝히는 역사 공부입니다.", next: "4차시 · 우리 모둠 유산 파헤치기" },
  },
  4: {
    title: "우리 모둠 유산\n파헤치기",
    subtitle: "신뢰할 수 있는 자료로 담당 유산을 조사하고 아직 모르는 점까지 기록합니다.",
    coverImage: "incense",
    history: {
      image: "incense",
      title: "백제 금동대향로는 출토 기록과 모양을 함께 살펴야 합니다",
      points: ["1993년 부여 능산리 절터에서 발견되었습니다.", "청동으로 만든 뒤 표면에 금을 입힌 금동 유물입니다.", "봉황·산봉우리·연꽃·용과 여러 인물·동물이 표현되어 있습니다."],
      takeaway: "발견 장소·재료·모양을 출처와 함께 기록하면 유산의 가치와 남은 질문을 구분할 수 있습니다.",
      source: sources.incense,
    },
    data: {
      image: "cheomseongdae",
      title: "좋은 조사 카드에는 확인한 사실과 아직 모르는 점이 함께 있습니다",
      points: ["제작 시기·주체와 목적·가치·현재 상태를 조사합니다.", "AI의 잘못된 설명을 근거가 확인된 문장으로 고칩니다.", "결론이 나지 않은 내용은 ‘아직 모름’과 출처 칸에 남깁니다."],
      takeaway: "모든 칸을 채우는 것보다 근거의 범위를 정확히 밝히는 것이 중요합니다.",
    },
    compare: {
      image: "crown",
      title: "신라 금관의 사용 모습을 어디까지 말할 수 있을까요?",
      left: { label: "확인", title: "왕릉급 무덤의 부장품으로 발견되었다", items: ["소장품 기록과 출토 정보를 확인할 수 있습니다.", "출처 번호를 붙여 조사 카드에 기록합니다."] },
      right: { label: "아직 모름", title: "왕이 살아 있을 때 매일 머리에 썼다", items: ["실제 착용 장면을 확정할 근거가 부족합니다.", "AI가 만든 구체적인 장면은 보류합니다."] },
    },
    activity: {
      image: "muryeong",
      title: "담당 유산의 조사 카드를 완성해요",
      instruction: "공식 자료와 교사 제공 자료집을 읽고, 핵심 낱말과 출처 번호만 남깁니다.",
      steps: ["시기·목적·가치·현재 상태 확인하기", "AI 오류를 근거 있는 문장으로 바로잡기", "아직 모르는 점과 출처 기록하기"],
    },
    closing: { image: "gaya", title: "조사 카드의 모든 칸을 꼭 답으로 채워야 할까요?", prompt: "아니요. 신뢰할 수 있는 자료로 확인한 내용만 쓰고, 결론이 나지 않거나 근거가 부족한 내용은 ‘아직 모름’으로 남겨야 합니다.", next: "5차시 · 역사 데이터 정제하기" },
  },
  5: {
    title: "역사 데이터를\n깨끗하게 정제하기",
    subtitle: "Google Sheets에서 중복·누락·표기 차이를 찾아 분석 가능한 학급 공통 표로 만듭니다.",
    coverImage: "incense",
    history: {
      image: "crown",
      title: "같은 신라 금관도 표기가 다르면 다른 데이터가 됩니다",
      points: ["‘신라 금관·금관·Silla crown’은 같은 유산을 가리킬 수 있습니다.", "‘5세기·서기 400년대·약 1500년 전’은 그대로 비교하기 어렵습니다.", "출처가 없는 값과 정확한 연도가 없는 값은 따로 표시해야 합니다."],
      takeaway: "역사적 의미를 바꾸지 않으면서 비교 기준만 통일하는 것이 데이터 정제입니다.",
      source: sources.crown,
    },
    data: {
      image: "incense",
      title: "정제에서는 네 가지를 먼저 확인합니다",
      points: ["중복 행은 하나만 남깁니다.", "빈칸은 추측하지 않고 ‘확인 필요’로 둡니다.", "나라·지역·자료 종류는 학급 표준값으로 통일합니다.", "원문 링크와 시기 범위를 다시 확인합니다."],
      takeaway: "정제 기록지에는 무엇을 왜 고쳤는지 남겨 원자료와의 차이를 설명할 수 있어야 합니다.",
    },
    compare: {
      image: "cheomseongdae",
      title: "빈칸과 시기 표기는 어떻게 고쳐야 할까요?",
      left: { label: "잘못된 정제", title: "빈 연도를 632년으로 추측해 채운다", items: ["자료에 없는 정확한 연도를 새로 만들었습니다.", "나중에 그래프에서 사실처럼 사용될 수 있습니다."] },
      right: { label: "근거를 지킨 정제", title: "‘선덕여왕 재위 시기·정확한 연도 확인 필요’로 둔다", items: ["원자료가 말하는 범위를 유지했습니다.", "정확한 값이 필요한 분석에서는 제외할 수 있습니다."] },
    },
    activity: {
      image: "gaya",
      title: "Google Sheets에서 학급 데이터를 정제해요",
      instruction: "시작 CSV를 불러온 뒤 중복·누락·표기·출처를 확인하고 정제된 CSV를 다시 내려받습니다.",
      steps: ["학급 표준값으로 표기 통일하기", "중복·빈칸·출처 없는 값 처리하기", "정제 기록을 남기고 CSV 내보내기"],
    },
    closing: { image: "muryeong", title: "빈칸을 비워 두면 데이터가 완성되지 않은 것 아닐까요?", prompt: "모르는 값을 추측해 채우는 것보다 ‘확인 필요’로 남기는 편이 정확합니다. 분석할 때는 어떤 값을 제외했는지 밝혀야 합니다.", next: "6차시 · CODAP으로 역사 데이터 시각화" },
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
      instruction: "근거 카드 두 장을 고른 뒤 문장틀의 빈칸 하나만 채워 말합니다.",
      steps: ["관계 있는 근거 두 개 고르기", "근거가 가리키는 공통점 찾기", "‘가능성이 있다’로 유추 말하기"],
    },
    closing: { image: "crown", title: "데이터가 있으면 과거를 확실하게 알 수 있을까요?", prompt: "데이터는 유추의 근거를 주지만 모든 장면을 확정하지는 못합니다. 확인된 사실과 가능한 설명을 나누고 ‘가능성이 있다’처럼 범위를 밝혀야 합니다.", next: "9차시 · 데이터 해석을 AR로 표현하기" },
  },
  9: {
    title: "데이터 해석을\nAR로 표현하기",
    subtitle: "CODAP 그래프의 경향과 검증한 역사 사실을 AR 장면과 30초 해설로 연결합니다.",
    coverImage: "crown",
    history: {
      image: "crown",
      title: "그래프와 AR은 서로 다른 근거를 보여 줍니다",
      points: ["그래프는 모둠이 모은 자료 안의 경향을 보여 줍니다.", "AR은 금관의 세움 장식과 굽은옥처럼 실제 특징을 가리킬 수 있습니다.", "두 자료가 같은 주장과 출처를 가리켜야 해설이 정확해집니다."],
      takeaway: "그래프의 큰 값을 역사적 중요성으로 바꾸지 않고, AR 장면도 확인된 사실까지만 표현합니다.",
      source: sources.crown,
    },
    data: {
      image: "mural",
      title: "30초 데이터 해설에는 네 가지가 필요합니다",
      points: ["그래프에서 보이는 값이나 경향 한 가지", "공식 자료로 확인한 역사 사실 한 가지", "AR에서 관람객이 볼 특징 한 가지", "자료만으로 알 수 없는 한계 한 가지"],
      takeaway: "관람객은 그래프·유산·출처가 어떻게 연결되는지 들어야 합니다.",
    },
    compare: {
      image: "cheomseongdae",
      title: "첨성대를 AR로 어떻게 보여 주어야 할까요?",
      left: { label: "근거 부족", title: "관측 장면을 실제 모습처럼 재현한다", items: ["구체적인 관측 방법은 하나로 확정되지 않았습니다.", "상상한 장면을 사실처럼 보이게 합니다."] },
      right: { label: "근거 연결", title: "돌 구조와 창의 위치를 표시한다", items: ["사진과 국가유산 설명으로 확인할 수 있습니다.", "관람객이 실제 특징을 찾아볼 수 있습니다."] },
    },
    activity: {
      image: "incense",
      title: "AR 데이터 해설 한 장면을 기획해요",
      instruction: "담당 유산의 AR을 체험하고 모둠 그래프와 공식 자료를 연결한 30초 해설을 만듭니다.",
      steps: ["그래프 경향과 역사 사실 연결하기", "AR에서 가리킬 특징과 관람객 행동 정하기", "자료의 한계를 포함해 30초 해설하기"],
    },
    closing: { image: "gaya", title: "멋있지만 근거가 없는 장면도 AR에 넣어도 될까요?", prompt: "넣지 않습니다. AR은 상상을 사실처럼 보이게 할 수 있으므로 확인한 특징만 표현하고, 아직 모르는 부분은 해설에서 분명히 밝힙니다.", next: "10차시 · AR 데이터 박물관 열기" },
  },
  10: {
    title: "AR 데이터\n박물관 열기",
    subtitle: "수집·정제·그래프·해석·유추를 AR 문화유산 해설과 연결합니다.",
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
      points: ["모으기 → 정제하기 → 그래프로 보기", "그래프 읽기 → 과거 유추하기", "AR로 근거와 자료의 한계 설명하기"],
      takeaway: "AR은 결과를 꾸미는 장식이 아니라 근거와 해설을 연결하는 전시 도구입니다.",
    },
    compare: {
      image: "mural",
      title: "관람객에게 어떤 해설이 더 잘 남을까요?",
      left: { label: "결과만 말하기", title: "우리 그래프가 제일 멋집니다", items: ["무엇을 비교했는지 알기 어렵습니다.", "역사 의미가 남지 않습니다."] },
      right: { label: "근거와 한계", title: "이 자료에서는 이런 경향이 보입니다", items: ["그래프 근거를 가리킵니다.", "과거 유추와 자료의 한계를 나눕니다."] },
    },
    activity: {
      image: "crown",
      title: "관람객 질문에 도슨트로 답해요",
      instruction: "유산 사진과 그래프를 가리키며 사실·유추·자료의 한계를 구분해 설명하고 질문을 받습니다.",
      steps: ["출처와 확인된 사실 설명하기", "그래프 근거와 과거 유추 연결하기", "자료의 한계와 아직 모르는 점을 말하기"],
    },
    closing: { image: "gaya", title: "좋은 AR 역사 도슨트는 어떻게 설명해야 할까요?", prompt: "출처와 확인된 사실을 먼저 보여 주고, 그래프 해석·과거 유추·자료의 한계를 구분합니다. 모르는 질문에는 꾸며내지 않고 더 확인하겠다고 답합니다.", next: "삼국시대 데이터·AI·AR 탐구 완료" },
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
    title: "무령왕릉처럼 기록으로 바로 확인할 수 있는 내용도 있습니다",
    points: [
      "무덤에서 나온 지석에 무령왕과 왕비에 관한 기록이 남아 있습니다.",
      "그래서 ‘무령왕릉은 누구의 무덤인지 모른다’는 AI 문장을 자료와 비교할 수 있습니다.",
      "하지만 지석만으로 장례의 모든 장면과 유물의 의미까지 확정할 수는 없습니다.",
    ],
    takeaway: "한 문장 안에서도 확인된 사실과 더 살펴야 할 해석을 나누어야 합니다.",
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
    image: "crown",
    title: "그래프와 AR은 같은 근거를 서로 다르게 보여 줍니다",
    points: [
      "그래프는 정제된 학급 데이터 안에서 발견한 경향을 보여 줍니다.",
      "AR은 금관의 세움 장식처럼 유산 사진의 구체적인 특징을 가리킵니다.",
      "두 자료를 연결할 때는 같은 공식 출처와 확인된 사실을 사용해야 합니다.",
    ],
    takeaway: "AR은 그래프를 대신하지 않고, 그래프가 말하는 역사 내용을 관람객이 실제 유산에서 찾게 합니다.",
    source: sources.crown,
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
