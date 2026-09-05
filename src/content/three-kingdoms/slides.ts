import { getContinuitySlides } from './continuitySlides';
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
      eyebrow: "도입 · 손들기",
      title: "AI의 역사 설명을 얼마나 믿나요?",
      instruction: "거의 다 맞을 것 같다 · 반쯤은 맞을 것 같다 · 그대로 믿기는 어렵다 가운데 하나에 손을 듭니다.",
      image: "muryeong",
      source: sources.overview,
    },
    {
      kind: "fact",
      eyebrow: "오늘의 미션",
      title: "우리 모둠 유산 6문장에서 의심 문장을 찾습니다",
      points: [
        "검색하기 전에 먼저 ‘내 판단’을 표시합니다.",
        "맞는 말과 틀린 말이 섞여 있음을 기억합니다.",
        "판단한 뒤에는 ‘확인한 출처’를 꼭 적습니다.",
      ],
      takeaway: "오늘의 목표는 정답 맞히기가 아니라 판단과 출처를 함께 말하는 것입니다.",
      image: "cheomseongdae",
      source: sources.cheomseongdae,
    },
    {
      kind: "fact",
      eyebrow: "내 판단 (○×△?)",
      title: "네 가지 기호로 표시합니다",
      points: [
        "○ 자료로 확인 · × 자료와 다름",
        "△ 의견 나뉨·근거 부족 · ? 더 찾아봐야 함",
        "활동지와 이 화면은 모두 같은 기호와 같은 항목 이름을 씁니다.",
      ],
      takeaway: "△와 ?도 정답이 될 수 있습니다. 모르는 것을 억지로 채우지 않습니다.",
      image: "crown",
      source: sources.crown,
    },
    {
      kind: "fact",
      eyebrow: "활동 시간 안내",
      title: "35분을 네 덩어리로 나눕니다",
      points: [
        "8분 혼자 판단 · 6문장을 ○×△?로 표시합니다.",
        "12분 모둠 조사 · 공식 자료로 확인하고 ‘확인한 출처’ 칸을 채웁니다.",
        "7분 모둠 발표 · 문장 번호 → 내 판단 → 확인한 출처 순서로 말합니다.",
        "8분 정답 확인 · 발표한 모둠부터 답을 보고 ‘오늘의 한 문장’을 씁니다.",
      ],
      takeaway: "정답은 각 모둠이 발표한 뒤에만 공개합니다.",
      image: "incense",
      source: sources.overview,
    },
    {
      kind: "compare",
      eyebrow: "좋은 검색어 만들기",
      title: "무엇을 검색창에 넣어야 할까요?",
      left: {
        label: "좋지 않은 검색",
        title: "AI 문장 전체를 그대로 붙여넣기",
        items: ["문장이 길어 자료가 잘 나오지 않습니다.", "무엇을 확인하려는지 스스로도 흐려집니다."],
      },
      right: {
        label: "좋은 검색",
        title: "핵심 낱말 2~4개 + 확인할 쟁점",
        items: ["‘첨성대 망원경’처럼 확인할 핵심만 남깁니다.", "찾은 기관 이름을 ‘확인한 출처’ 칸에 적습니다."],
      },
      image: "cheomseongdae",
      source: sources.cheomseongdae,
    },
    {
      kind: "fact",
      eyebrow: "어디에서 확인할까?",
      title: "공식 자료부터 순서대로 찾습니다",
      points: [
        "1순위 국가유산청 국가유산포털에서 지정 정보와 안내를 봅니다.",
        "2순위 국립중앙박물관·국립부여박물관에서 소장품 설명을 봅니다.",
        "3순위 유네스코 세계유산센터·우리역사넷에서 범위와 가치를 봅니다.",
        "블로그·영상·AI 답변은 비교용으로만 보고 출처로 적지 않습니다.",
      ],
      takeaway: "확인한 곳의 기관 이름을 활동지 ‘확인한 출처’ 칸에 그대로 적습니다.",
      image: "gaya",
      source: sources.gaya,
    },
    {
      kind: "activity",
      eyebrow: "모둠 발표 순서",
      title: "발표는 세 가지만 말합니다",
      instruction: "모둠이 발표한 뒤에 교사가 그 모둠의 정답 화면을 엽니다.",
      steps: ["몇 번 문장인지 말하기", "내 판단이 ○×△? 중 무엇인지 말하기", "확인한 출처(기관 이름) 말하기"],
      image: "mural",
      source: sources.mural,
    },
    {
      kind: "fact",
      eyebrow: "1모둠 정답 · 발표 뒤 공개",
      title: "무령왕릉 판정과 근거",
      points: [
        "1. ○ 발견 연도와 경위가 공식 자료에 기록되어 있습니다.",
        "2. ○ 지석에 무덤 주인과 장례 정보가 남아 있습니다.",
        "3. × 도굴되지 않은 상태로 발견되어 많은 유물이 남아 있었습니다.",
        "4. × 배수로 공사 과정에서 공사 관계자들이 발견했습니다.",
        "5. ○ 대표 출토 유물은 박물관 자료에서 확인됩니다.",
        "6. △ 지석은 중요한 단서지만 모든 과정과 쓰임을 전부 설명하지는 않습니다.",
      ],
      takeaway: "우선 확인처: 국립공주박물관·국립중앙박물관 무령왕릉 자료",
      image: "muryeong",
      source: sources.muryeong,
    },
    {
      kind: "fact",
      eyebrow: "2모둠 정답 · 발표 뒤 공개",
      title: "백제 금동대향로 판정과 근거",
      points: [
        "1. ○ 발견 연도와 장소가 박물관 자료에 기록되어 있습니다.",
        "2. ○ 금동은 청동 바탕에 금을 입힌 재료를 뜻합니다.",
        "3. × 왕릉이 아니라 능산리 절터에서 출토되었습니다.",
        "4. ○ 향로의 형태와 장식은 소장품 사진과 설명에서 확인됩니다.",
        "5. △ 형상은 관찰되지만 모든 무늬의 뜻을 하나로 확정하기 어렵습니다.",
        "6. × 부여 지역 절터에서 발견된 백제 유물입니다.",
      ],
      takeaway: "우선 확인처: 국립부여박물관 백제 금동대향로 자료",
      image: "incense",
      source: sources.incense,
    },
    {
      kind: "fact",
      eyebrow: "3모둠 정답 · 발표 뒤 공개",
      title: "첨성대 판정과 근거",
      points: [
        "1. ○ 경주에 있는 석조 건축물임을 확인할 수 있습니다.",
        "2. ○ 공식 안내에 건립 시기와 천문 관측 관련 설명이 있습니다.",
        "3. × 망원경은 첨성대가 세워진 시대보다 훨씬 뒤에 등장했습니다.",
        "4. × 현재 남은 첨성대는 돌을 층층이 쌓은 구조물입니다.",
        "5. △ 숫자의 상징에는 여러 해석이 있어 확정된 사실로 보기 어렵습니다.",
        "6. △ 구체적인 사용 방법에는 여러 해석이 있습니다.",
      ],
      takeaway: "우선 확인처: 국가유산청 경주 첨성대 안내",
      image: "cheomseongdae",
      source: sources.cheomseongdae,
    },
    {
      kind: "fact",
      eyebrow: "4모둠 정답 · 발표 뒤 공개",
      title: "신라 금관 판정과 근거",
      points: [
        "1. ○ 출토 상황과 금관의 성격은 박물관 자료에서 확인됩니다.",
        "2. ○ 금관의 실제 형태와 장식에서 확인됩니다.",
        "3. × 높은 신분의 인물 무덤에서도 발견되어 모두 왕의 관이라 단정할 수 없습니다.",
        "4. × 얼굴이나 가슴 부근 등 서로 다른 위치에서 발견된 사례가 있습니다.",
        "5. × 일상 작업용으로 사용했다는 근거는 없습니다.",
        "6. △ 실제 착용설과 장례용 해석을 함께 살펴봐야 합니다.",
      ],
      takeaway: "우선 확인처: 국립중앙박물관 신라 금관 자료",
      image: "crown",
      source: sources.crown,
    },
    {
      kind: "fact",
      eyebrow: "5모둠 정답 · 발표 뒤 공개",
      title: "고구려 고분벽화 판정과 근거",
      points: [
        "1. ○ 벽화의 주제는 공식 자료에서 확인할 수 있습니다.",
        "2. ○ 무덤의 규모와 내용을 바탕으로 왕족·귀족 무덤으로 봅니다.",
        "3. × 고구려 무덤 가운데 일부에만 벽화가 남아 있습니다.",
        "4. × 북한과 중국 동북 지역에도 고구려 벽화무덤이 있습니다.",
        "5. △ 왕족·귀족 무덤의 장면을 모든 사람의 생활로 일반화하면 안 됩니다.",
        "6. × 모든 벽화를 한 사람이 그렸다는 기록은 확인되지 않습니다.",
      ],
      takeaway: "우선 확인처: UNESCO 고구려 고분군·국립박물관 자료",
      image: "mural",
      source: sources.mural,
    },
    {
      kind: "fact",
      eyebrow: "6모둠 정답 · 발표 뒤 공개",
      title: "가야 고분군 판정과 근거",
      points: [
        "1. ○ 세계유산은 일곱 고분군으로 구성되어 있습니다.",
        "2. ○ 고분군은 가야 정치체의 공통점과 지역 차이를 보여 줍니다.",
        "3. × 여러 정치체가 공존한 연맹적 성격으로 설명됩니다.",
        "4. × 고분군은 여러 지역에 분포합니다.",
        "5. ○ 2023년에 유네스코 세계유산으로 등재되었습니다.",
        "6. △ 문헌이 부족해 무덤 주인과 일생을 모두 특정하기 어렵습니다.",
      ],
      takeaway: "우선 확인처: 국가유산청 가야고분군·UNESCO 자료",
      image: "gaya",
      source: sources.gaya,
    },
    {
      kind: "fact",
      eyebrow: "정리 · 이름 붙이기",
      title: "오늘 우리가 한 확인에는 이름이 있습니다",
      points: [
        "출처 · 누가 만든 자료인지 확인했습니다.",
        "시기 · 언제 만든 자료인지 확인했습니다.",
        "교차 · 다른 자료와 견주어 보았습니다.",
        "원본 · 요약문 대신 원본까지 갔습니다.",
        "보류 · 확인되지 않으면 △나 ?로 그대로 두었습니다.",
      ],
      takeaway: "앞으로 어떤 역사 설명을 만나도 이 다섯 가지로 확인합니다.",
      image: "gaya",
      source: sources.overview,
    },
    {
      kind: "quiz",
      eyebrow: "판단 연습",
      title: "이 문장은 ○×△? 가운데 무엇일까요?",
      statement: "신라 금관은 왕이 살아 있을 때 매일 머리에 쓰던 관이다.",
      verdict: "보류",
      explanation: "금관이 무덤에서 발견되었다는 사실은 확인할 수 있지만, 실제 착용 여부와 방법은 한 가지 결론으로 확정하기 어렵습니다. 확인한 출처가 없으면 △나 ?로 남깁니다.",
      image: "crown",
      source: sources.crown,
    },
  ],
  4: [
    {
      kind: "gallery",
      eyebrow: "도입 · 5분",
      title: "지난 시간 우리가 한 확인에 이름 붙이기",
      instruction: "출처 · 시기 · 교차 · 원본 · 보류. 2차시에 이미 해 본 일에 이름만 붙입니다.",
      image: "muryeong",
      source: sources.overview,
    },
    {
      kind: "compare",
      eyebrow: "오늘의 미션",
      title: "조사하기가 아니라 데이터 만들기입니다",
      left: {
        label: "자유롭게 조사하면",
        title: "모둠마다 다른 내용을 적습니다",
        items: ["어떤 모둠은 시기를, 어떤 모둠은 모양을 적습니다.", "여섯 유산을 나란히 놓고 비교할 수 없습니다."],
      },
      right: {
        label: "같은 항목으로 모으면",
        title: "여섯 줄이 하나의 표가 됩니다",
        items: ["시기·가치·현재 상태를 유산끼리 견줄 수 있습니다.", "우리 모둠 카드가 학급 데이터 표의 한 줄이 됩니다."],
      },
      image: "gaya",
      source: sources.gaya,
    },
    {
      kind: "fact",
      eyebrow: "일곱 항목 1~4",
      title: "유산을 설명하는 네 가지 항목",
      points: [
        "시기 · 언제 만들었는지 (세기·왕 이름)",
        "만든 까닭 · 무엇을 위해 만들었는지",
        "가치 · 왜 중요한 유산인지",
        "현재 상태 · 지금 어디에 어떤 모습으로 남아 있는지",
      ],
      takeaway: "활동지와 이 화면의 항목 이름과 순서는 모두 같습니다.",
      image: "cheomseongdae",
      source: sources.cheomseongdae,
    },
    {
      kind: "fact",
      eyebrow: "일곱 항목 5~7",
      title: "확인한 범위를 밝히는 세 가지 항목",
      points: [
        "AI 오류 바로잡기 · 2차시에서 ×였던 문장을 바르게 고쳐 씁니다.",
        "아직 모름 · 자료로 확인되지 않은 점을 그대로 남깁니다.",
        "출처 · 확인한 기관 이름을 적습니다.",
      ],
      takeaway: "모든 칸을 채우는 것보다 어디까지 확인했는지 밝히는 것이 정확한 데이터입니다.",
      image: "crown",
      source: sources.crown,
    },
    {
      kind: "fact",
      eyebrow: "조사 시간 · 20분",
      title: "공식 자료부터 순서대로 확인합니다",
      points: [
        "1순위 국가유산청 국가유산포털에서 지정 정보와 현재 상태를 봅니다.",
        "2순위 국립중앙박물관·국립부여박물관에서 소장품 설명을 봅니다.",
        "3순위 유네스코 세계유산센터·우리역사넷에서 범위와 가치를 봅니다.",
        "블로그·영상·AI 답변은 비교용으로만 보고 출처로 적지 않습니다.",
      ],
      takeaway: "문장을 통째로 옮기지 말고 항목마다 핵심 낱말만 적습니다.",
      image: "incense",
      source: sources.incense,
    },
    {
      kind: "activity",
      eyebrow: "모둠 발표 안내",
      title: "일곱 항목을 순서대로 읽으면 발표가 됩니다",
      instruction: "활동 화면에서 모둠만 고르면 바로 시작합니다. 발표를 들은 뒤에 그 모둠의 정답을 공개합니다.",
      steps: ["시기·만든 까닭·가치·현재 상태 말하기", "AI 오류를 어떻게 고쳤는지 말하기", "아직 모름과 출처 말하기"],
      image: "mural",
      source: sources.mural,
    },
    {
      kind: "fact",
      eyebrow: "1모둠 정답 · 발표 뒤 공개",
      title: "무령왕릉 일곱 항목",
      points: [
        "시기 · 백제 무령왕 때, 6세기 초",
        "만든 까닭 · 무령왕과 왕비를 모시기 위해 만든 벽돌무덤",
        "가치 · 지석 덕분에 무덤 주인과 시기를 아는 삼국시대 왕릉",
        "현재 상태 · 공주 무령왕릉과 왕릉원에 남아 있고 유물은 국립공주박물관 소장",
        "AI 오류 바로잡기 · ‘도굴되어 유물이 사라졌다’ → 도굴되지 않아 많은 유물이 함께 나왔다",
        "아직 모름 · 유물이 놓인 까닭과 장례의 모든 과정",
        "출처 · 국립공주박물관·국립중앙박물관",
      ],
      takeaway: "우선 확인처: 국립공주박물관·국립중앙박물관 무령왕릉 자료",
      image: "muryeong",
      source: sources.muryeong,
    },
    {
      kind: "fact",
      eyebrow: "2모둠 정답 · 발표 뒤 공개",
      title: "백제 금동대향로 일곱 항목",
      points: [
        "시기 · 백제, 6~7세기 무렵 (1993년 출토)",
        "만든 까닭 · 절에서 의례에 쓰기 위해 만든 향로로 본다",
        "가치 · 백제의 금속 공예 기술과 정신세계를 보여 주는 대표 유물",
        "현재 상태 · 국립부여박물관에 소장·전시",
        "AI 오류 바로잡기 · ‘왕의 무덤에서 나온 순금 유물’ → 능산리 절터 출토, 청동에 금을 입힌 금동",
        "아직 모름 · 새겨진 인물·동물 무늬가 각각 무엇을 뜻하는지",
        "출처 · 국립부여박물관",
      ],
      takeaway: "우선 확인처: 국립부여박물관 백제 금동대향로 자료",
      image: "incense",
      source: sources.incense,
    },
    {
      kind: "fact",
      eyebrow: "3모둠 정답 · 발표 뒤 공개",
      title: "첨성대 일곱 항목",
      points: [
        "시기 · 신라 선덕여왕 때, 7세기로 본다",
        "만든 까닭 · 하늘(천문) 관측과 관련된 시설로 설명된다",
        "가치 · 남아 있는 가장 오래된 천문 관련 석조 건축물",
        "현재 상태 · 경주에 원래 자리 그대로 남아 국가유산으로 관리",
        "AI 오류 바로잡기 · ‘망원경으로 별을 보았다’ → 망원경은 훨씬 뒤에 나왔고 돌을 쌓은 구조물이다",
        "아직 모름 · 누가 어떤 자세·도구로 관측했는지, 돌 개수의 상징",
        "출처 · 국가유산청 국가유산포털",
      ],
      takeaway: "우선 확인처: 국가유산청 경주 첨성대 안내",
      image: "cheomseongdae",
      source: sources.cheomseongdae,
    },
    {
      kind: "fact",
      eyebrow: "4모둠 정답 · 발표 뒤 공개",
      title: "신라 금관 일곱 항목",
      points: [
        "시기 · 신라, 5~6세기 무렵 왕릉급 무덤",
        "만든 까닭 · 무덤 주인의 권위를 드러내는 껴묻거리로 만들었다",
        "가치 · 얇은 금판·세움 장식·굽은옥으로 신라의 황금 문화를 보여 준다",
        "현재 상태 · 국립중앙박물관·국립경주박물관 등에 소장·전시",
        "AI 오류 바로잡기 · ‘왕이 평소 매일 썼다’ → 일상 착용 근거가 없고 부장품 성격이 강하다",
        "아직 모름 · 생전에 실제로 썼는지, 장례를 위해 만들었는지",
        "출처 · 국립중앙박물관",
      ],
      takeaway: "우선 확인처: 국립중앙박물관 신라 금관 자료",
      image: "crown",
      source: sources.crown,
    },
    {
      kind: "fact",
      eyebrow: "5모둠 정답 · 발표 뒤 공개",
      title: "고구려 고분벽화 일곱 항목",
      points: [
        "시기 · 고구려, 4~7세기 무덤에 그렸다",
        "만든 까닭 · 왕족·귀족의 무덤 안에 생활과 믿음을 담아 그렸다",
        "가치 · 기록이 적은 고구려의 생활·복식·믿음을 보여 주는 세계유산",
        "현재 상태 · 북한과 중국 동북 지역에 나뉘어 있어 사진·모사도로 확인",
        "AI 오류 바로잡기 · ‘모든 고구려 무덤에 벽화가 있다’ → 일부 무덤에만 남아 있다",
        "아직 모름 · 벽화 장면이 모든 고구려 사람의 생활인지",
        "출처 · 유네스코 세계유산센터",
      ],
      takeaway: "우선 확인처: 유네스코 고구려 고분군·국립박물관 자료",
      image: "mural",
      source: sources.mural,
    },
    {
      kind: "fact",
      eyebrow: "6모둠 정답 · 발표 뒤 공개",
      title: "가야 고분군 일곱 항목",
      points: [
        "시기 · 1~6세기 무렵 가야 여러 정치체의 무덤",
        "만든 까닭 · 각 지역 지배층의 무덤으로 만들어졌다",
        "가치 · 여러 정치체가 나란히 있던 가야를 보여 주는 세계유산(2023년 등재)",
        "현재 상태 · 김해·함안·고령·합천 등 일곱 고분군으로 남아 관리",
        "AI 오류 바로잡기 · ‘처음부터 하나의 중앙집권 국가였다’ → 여러 정치체가 함께한 연맹적 성격",
        "아직 모름 · 고분마다 묻힌 사람의 이름과 일생",
        "출처 · 국가유산청·유네스코 세계유산센터",
      ],
      takeaway: "우선 확인처: 국가유산청 가야고분군·유네스코 자료",
      image: "gaya",
      source: sources.gaya,
    },
    {
      kind: "quiz",
      eyebrow: "데이터 만들기 점검",
      title: "공식 자료에서 찾지 못한 칸은 어떻게 할까요?",
      statement: "표를 완성해야 하므로 찾지 못한 항목은 가장 그럴듯한 답으로 채운다.",
      verdict: "틀림",
      explanation: "추측으로 채운 칸은 학급 데이터 표 전체를 믿을 수 없게 만듭니다. 확인되지 않은 항목은 ‘아직 모름’으로 남기고, 무엇을 더 찾아야 하는지 적어 둡니다.",
      image: "cheomseongdae",
      source: sources.cheomseongdae,
    },
  ],
  5: [
    {
      kind: "fact",
      eyebrow: "정제 실습 1 · 시작 파일",
      title: "4차시에서 만든 학급 표를 불러옵니다",
      points: [
        "선생님이 내보낸 5차시 시작 파일을 Google Sheets로 가져옵니다.",
        "우리 모둠 6줄에 2차시 AI 답변 6줄과 두 번 올라온 2줄이 더해져 14줄입니다.",
        "고치기 전에 원본 시트를 한 장 복사해 남겨 둡니다.",
      ],
      takeaway: "우리가 쓴 글과 AI가 쓴 글이 한 표에 섞여 돌아왔습니다.",
      image: "muryeong",
      source: sources.googleSheets,
    },
    {
      kind: "fact",
      eyebrow: "정제 실습 2 · 왜 이대로는 비교가 안 될까",
      title: "같은 뜻인데 모둠마다 다르게 적었습니다",
      points: [
        "시기: ‘6세기 초’ · ‘신라국 600년대’ · ‘약 1500년 전’이 섞여 있습니다.",
        "같은 모둠 줄이 두 번 올라온 것도 있습니다.",
        "출처가 아예 비어 있는 줄도 있습니다.",
      ],
      takeaway: "틀린 글이 아니라 기준이 다른 글입니다. 기준만 맞추면 됩니다.",
      image: "cheomseongdae",
      source: sources.overview,
    },
    {
      kind: "fact",
      eyebrow: "정제 실습 3 · 칸 쪼개기",
      title: "한 칸에 두 가지가 섞여 있으면 쪼갭니다",
      points: [
        "‘백제 무령왕 때, 6세기 초’ 한 칸에 나라와 세기가 함께 들어 있습니다.",
        "‘공주 무령왕릉과 왕릉원에 남아 있고…’에는 지역과 기관이 함께 있습니다.",
        "1차시 약속대로 한 칸에는 한 종류만 담아야 다른 모둠과 비교할 수 있습니다.",
      ],
      takeaway: "원래 칸은 지우지 않고, 오른쪽에 새 열을 만들어 옮겨 적습니다.",
      image: "muryeong",
      source: sources.googleSheets,
    },
    {
      kind: "fact",
      eyebrow: "정제 실습 4 · 새로 만들 다섯 열",
      title: "비교할 수 있는 열 다섯 개를 우리 손으로 만듭니다",
      points: [
        "나라 · 백제·신라·고구려·가야 가운데 하나로 적습니다.",
        "세기 · 숫자만 적습니다. 물결(~)이면 앞 숫자, 500년대는 6세기입니다.",
        "자료 종류 · 무덤·건축물·공예품·그림 가운데 하나입니다.",
        "지역 · 지금 남아 있는 시·도로 적고, 두 곳에 나뉘면 ‘확인 필요’.",
        "확인 기관 · ‘출처’ 칸의 기관 하나만, 비어 있으면 ‘확인 필요’.",
      ],
      takeaway: "이 다섯 열이 없으면 다음 시간에 그래프를 한 장도 그릴 수 없습니다.",
      image: "gaya",
      source: sources.googleSheets,
    },
    {
      kind: "compare",
      eyebrow: "정제 실습 4 · 바꾸어도 되는 것",
      title: "기준을 맞추는 것과 사실을 만드는 것은 다릅니다",
      left: {
        label: "좋은 정제",
        title: "‘국박’을 ‘국립중앙박물관’으로 통일한다",
        items: ["같은 뜻의 표기만 공통값으로 맞췄습니다.", "원래 값은 복사해 둔 시트에 남아 있습니다."],
      },
      right: {
        label: "잘못된 정제",
        title: "‘아직 모름’ 칸을 그럴듯한 말로 채운다",
        items: ["자료에 없는 사실을 새로 만들었습니다.", "‘아직 모름’은 비워 두는 것이 정확한 데이터입니다."],
      },
      image: "crown",
      source: sources.overview,
    },
    {
      kind: "activity",
      eyebrow: "정제 실습 5 · 저장",
      title: "다듬은 표를 CSV로 다시 내려받아요",
      instruction: "다섯 열을 모두 채우고 중복 줄을 정리한 뒤 파일 → 다운로드에서 CSV를 고릅니다.",
      steps: ["다섯 열 채우기(한 사람이 한 열)", "똑같은 줄은 출처 있는 쪽만 남기기", "‘학급데이터_정제.csv’로 저장하기"],
      image: "incense",
      source: sources.googleSheets,
    },
    {
      kind: "quiz",
      eyebrow: "정제 완료 확인",
      title: "빈칸이 남아 있으면 정제가 실패한 걸까요?",
      statement: "정제된 표에는 빈칸이 하나도 없어야 하므로 ‘아직 모름’ 칸도 그럴듯한 말로 채워야 한다.",
      verdict: "틀림",
      explanation: "정제는 모르는 사실을 만드는 일이 아닙니다. 확인하지 못한 칸은 ‘아직 모름’으로 남기고, 그래프를 만들 때 그 칸을 뺐다고 밝히는 것이 정확합니다.",
      image: "mural",
      source: sources.overview,
    },
  ],
  6: [
    {
      kind: "fact",
      eyebrow: "CODAP 실습 1 · 불러오기",
      title: "정제한 표가 제대로 들어왔는지 먼저 확인합니다",
      points: [
        "5차시에서 저장한 ‘학급데이터_정제.csv’를 CODAP으로 끌어다 놓습니다.",
        "새로 만든 나라·세기·자료 종류·지역·확인 기관 다섯 열이 보이는지 봅니다.",
        "‘세기’ 칸이 오른쪽으로 붙어 있으면 숫자, 왼쪽에 붙어 있으면 아직 글자입니다.",
      ],
      takeaway: "‘세기’가 숫자로 들어와야 가로축에 놓을 수 있습니다.",
      image: "muryeong",
      source: sources.codapGraphs,
    },
    {
      kind: "fact",
      eyebrow: "CODAP 실습 2 · 첫 번째 그래프",
      title: "나라별로 유산이 몇 개인지 세어 봅니다",
      points: [
        "가로축에 ‘나라’ 열을 끌어다 놓습니다.",
        "백제·신라·고구려·가야 네 무리로 점이 나뉩니다.",
        "어느 나라의 자료가 많고 적은지 소리 내어 말해 봅니다.",
      ],
      takeaway: "자유롭게 쓴 글로는 셀 수 없던 것이 정제한 열로는 한눈에 보입니다.",
      image: "gaya",
      source: sources.codapGraphs,
    },
    {
      kind: "fact",
      eyebrow: "CODAP 실습 3 · 두 번째 그래프",
      title: "세기별로 놓으면 시간의 흐름이 보입니다",
      points: [
        "가로축을 ‘세기’로 바꿉니다. 숫자라서 순서대로 늘어섭니다.",
        "1세기부터 7세기까지 어디에 자료가 몰려 있는지 봅니다.",
        "점 색을 ‘확인 기관’으로 나누면 출처가 없는 줄이 드러납니다.",
      ],
      takeaway: "같은 표라도 축에 무엇을 놓느냐에 따라 다른 것이 보입니다.",
      image: "cheomseongdae",
      source: sources.codapGraphs,
    },
    {
      kind: "compare",
      eyebrow: "CODAP 실습 4 · 그래프 고르기",
      title: "어떤 그래프가 우리 질문에 더 잘 답할까요?",
      left: {
        label: "질문과 먼 그래프",
        title: "모둠 번호별 줄 수",
        items: ["누가 많이 올렸는지만 보입니다.", "역사 질문에는 답하지 못합니다."],
      },
      right: {
        label: "질문과 이어진 그래프",
        title: "나라별·세기별 유산 수",
        items: ["어느 나라와 어느 시기의 자료가 많은지 보입니다.", "여섯 유산을 나란히 견줄 수 있습니다."],
      },
      image: "mural",
      source: sources.codapGraphs,
    },
    {
      kind: "activity",
      eyebrow: "CODAP 실습 5 · 저장",
      title: "고른 그래프를 PNG로 저장해요",
      instruction: "제목에 무엇과 무엇을 비교했는지 드러나게 쓴 뒤 저장합니다.",
      steps: ["가로축 항목 고르기", "제목·축 이름·자료 수 확인하기", "카메라 아이콘으로 PNG 저장하기"],
      image: "incense",
      source: sources.codapGraphs,
    },
    {
      kind: "quiz",
      eyebrow: "그래프 완성 확인",
      title: "막대가 가장 크면 그 나라가 가장 강했다는 뜻일까요?",
      statement: "그래프에서 자료가 가장 많은 나라는 삼국시대에 가장 강한 나라였다.",
      verdict: "틀림",
      explanation: "그래프의 크기는 우리 반이 조사한 유산이 몇 개인지를 보여 줄 뿐입니다. 우리가 여섯 유산만 골랐기 때문에 생긴 차이이며, 나라의 힘과는 다른 이야기입니다.",
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
        "어느 나라의 줄이 가장 많고 가장 적은지 이름과 함께 말합니다.",
        "몇 줄 차이인지 숫자로 확인합니다.",
        "세기 축에서 자료가 몰린 곳과 비어 있는 곳을 찾습니다.",
      ],
      takeaway: "‘백제가 강했다’가 아니라 ‘이 표에서 백제 줄이 가장 많다’로 말합니다.",
      image: "gaya",
      source: sources.codapGraphs,
    },
    {
      kind: "fact",
      eyebrow: "그래프 읽기 4 · 한계 실험",
      title: "출처 없는 줄을 빼고 다시 그려 봅니다",
      points: [
        "‘확인 기관’이 확인 필요인 여섯 줄을 그래프에서 빼 봅니다.",
        "열두 줄이 여섯 줄로 줄고 막대 높이가 절반이 됩니다.",
        "어느 나라가 가장 많은지 순위까지 바뀌는지 확인합니다.",
      ],
      takeaway: "‘자료가 적다’는 체크 문구가 아니라 눈으로 본 사실이 됩니다.",
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
        "근거 1은 그래프에서 · 나라별 줄 수 차이나 세기가 흩어진 모습입니다.",
        "근거 2는 4차시 조사 카드에서 · 가치·현재 상태·아직 모름 칸의 말입니다.",
        "두 근거가 같은 설명을 지지하는지, 서로 어긋나는지 살펴봅니다.",
      ],
      takeaway: "숫자 근거 하나와 글 근거 하나를 짝지어야 설명이 단단해집니다.",
      image: "incense",
      source: sources.overview,
    },
    {
      kind: "activity",
      eyebrow: "과거 유추 4 · 문장 만들기",
      title: "‘두 근거를 함께 보면’으로 유추 문장을 시작해요",
      instruction: "활동지에 근거 1·근거 2·가능한 설명·더 필요한 자료를 한 줄씩 기록합니다.",
      steps: ["그래프에서 관계 한 가지 고르기", "4차시 조사 카드에서 이어지는 말 찾기", "가능성 문장과 유추의 한계 함께 쓰기"],
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
  // 도입용 관찰 슬라이드는 표지 바로 뒤에 옵니다. 내려받는 PPTX와 같은 순서입니다.
  const extensions = lessonExtensions[lessonId] ?? [];
  const opener = extensions.find((slide) => slide.kind === "gallery");
  const rest = opener ? extensions.filter((slide) => slide !== opener) : extensions;

  return [
    {
      kind: "cover",
      tag: `초등학교 5학년 사회 · 삼국시대 ${lessonId}차시`,
      title: plan.title,
      subtitle: plan.subtitle,
      image: plan.coverImage,
      source: sources.overview,
    },
    ...(opener ? [opener] : []),
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
    ...rest,
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
    subtitle: "AI 문장을 ○×△?로 판단하고 공식 자료의 출처로 확인합니다.",
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
      points: ["문장 속에서 확인할 수 있는 사실을 찾습니다.", "출처가 없거나 너무 구체적인 장면에는 밑줄을 긋습니다.", "확인한 출처를 찾지 못하면 △나 ?로 남깁니다."],
      takeaway: "오늘의 목표는 정답 맞히기가 아니라 판단과 출처를 함께 말하는 것입니다.",
    },
    compare: {
      image: "crown",
      title: "두 설명은 근거의 범위가 어떻게 다를까요?",
      left: { label: "○ 자료로 확인", title: "금관은 왕릉급 무덤에서 발견되었다", items: ["출토 위치를 박물관 기록에서 확인할 수 있습니다.", "‘확인한 출처’ 칸에 국립중앙박물관을 적을 수 있습니다."] },
      right: { label: "△ 의견 나뉨·근거 부족", title: "왕이 매일 머리에 쓰고 다녔다", items: ["실제 착용 장면을 보여 주는 기록이 필요합니다.", "구조와 출토 상황만으로 단정하기 어렵습니다."] },
    },
    activity: {
      image: "incense",
      title: "활동지 한 장에 판단과 출처를 남겨요",
      instruction: "문장을 하나씩 읽고 먼저 혼자 판단한 뒤, 공식 자료에서 확인한 기관 이름을 적습니다.",
      steps: ["번호 순서대로 6문장 읽기", "내 판단 (○×△?) 칸에 표시하기", "확인한 출처 칸에 기관 이름 적기"],
    },
    closing: { image: "cheomseongdae", title: "AI가 자신 있게 말하면 모두 사실일까요?", prompt: "아니요. 출처가 없거나 학자들의 의견이 나뉘는 내용을 확정적으로 말할 수 있습니다. 오늘 우리가 한 확인에는 출처·시기·교차·원본·보류라는 이름이 있고, 다음 시간에 그 이름을 붙여 봅니다.", next: "4차시 · 우리 모둠 데이터 만들기" },
  },
  4: {
    title: "우리 모둠\n데이터 만들기",
    subtitle: "여섯 모둠이 같은 일곱 항목을 채워 학급 데이터 표를 만듭니다.",
    coverImage: "incense",
    history: {
      image: "incense",
      title: "향로는 어디에서 찾았고 어떤 모습일까요?",
      points: ["1993년, 부여 능산리의 절이 있던 자리에서 찾았어요.", "청동으로 만들고 겉에 금을 입혔어요. 이것을 금동이라고 해요.", "상상 속의 새인 봉황과 산·연꽃·용·사람·동물의 모습이 보여요."],
      takeaway: "찾은 곳, 만든 재료, 보이는 모습을 각각 한 문장으로 적어 봐요.",
      source: sources.incense,
    },
    data: {
      image: "cheomseongdae",
      title: "여섯 모둠이 같은 항목을 채워야 하나의 표가 됩니다",
      points: ["일곱 항목은 시기·만든 까닭·가치·현재 상태·AI 오류 바로잡기·아직 모름·출처입니다.", "모둠마다 다른 항목을 적으면 여섯 유산을 비교할 수 없습니다.", "우리 모둠 카드 한 장이 학급 데이터 표의 한 줄이 됩니다."],
      takeaway: "오늘은 조사하기가 아니라 비교할 수 있는 데이터를 만드는 시간입니다.",
    },
    compare: {
      image: "crown",
      title: "신라 금관의 사용 모습을 어디까지 말할 수 있을까요?",
      left: { label: "확인", title: "왕릉급 무덤의 부장품으로 발견되었다", items: ["소장품 기록과 출토 정보를 확인할 수 있습니다.", "출처 번호를 붙여 조사 카드에 기록합니다."] },
      right: { label: "아직 모름", title: "왕이 살아 있을 때 매일 머리에 썼다", items: ["실제 착용 장면을 확정할 근거가 부족합니다.", "AI가 만든 구체적인 장면은 보류합니다."] },
    },
    activity: {
      image: "muryeong",
      title: "일곱 항목을 채우고 학급 표에 올려요",
      instruction: "공식 자료와 교사 제공 자료집을 읽고, 항목마다 핵심 낱말과 확인한 기관 이름만 남깁니다.",
      steps: ["활동지에 일곱 항목 채우기", "활동 화면에서 우리 모둠 고르고 그대로 입력하기", "학급 데이터 표에 우리 줄이 올라갔는지 확인하기"],
    },
    closing: { image: "gaya", title: "여섯 모둠 데이터를 한 표로 모으면 어떻게 될까요?", prompt: "같은 일곱 항목으로 모았기 때문에 여섯 유산의 시기와 가치, 현재 상태를 나란히 비교할 수 있습니다. 다음 시간에는 이 표에서 표기가 다른 칸과 빈칸을 찾아 하나의 기준으로 정제합니다.", next: "5차시 · 역사 데이터 정제하기" },
  },
  5: {
    title: "우리 데이터를\n비교할 수 있게 다듬기",
    subtitle: "모둠마다 다르게 쓴 일곱 항목을 학급 공통값으로 다듬어 비교할 수 있는 열을 만듭니다.",
    coverImage: "incense",
    history: {
      image: "crown",
      title: "같은 곳의 이름은 똑같이 적어요",
      points: ["‘국립중앙박물관’과 줄여 쓴 ‘국박’은 같은 곳을 가리킬 수 있어요.", "다른 곳으로 잘못 세지 않도록 기관 이름을 정확히 적어요.", "문장에 적힌 역사 이야기는 마음대로 바꾸지 않아요."],
      takeaway: "자료를 찾은 곳의 이름도 빠짐없이 확인해요.",
      source: sources.crown,
    },
    data: {
      image: "incense",
      title: "정제해서 비교용 열 다섯 개를 만듭니다",
      points: ["나라·세기·자료 종류·지역·확인 기관 다섯 열을 새로 만듭니다.", "한 칸에 섞여 있던 정보를 쪼개어 옮겨 적는 일입니다.", "원래 일곱 칸은 지우지 않고 그대로 둡니다."],
      takeaway: "이 다섯 열이 다음 시간 그래프의 재료가 됩니다. 정제가 곧 분석 준비입니다.",
    },
    compare: {
      image: "cheomseongdae",
      title: "‘아직 모름’ 칸은 어떻게 해야 할까요?",
      left: { label: "잘못된 정제", title: "빈칸을 그럴듯한 말로 채운다", items: ["자료에 없는 사실을 새로 만들었습니다.", "나중에 그래프에서 사실처럼 쓰이게 됩니다."] },
      right: { label: "근거를 지킨 정제", title: "‘아직 모름’으로 그대로 둔다", items: ["우리가 확인한 범위를 정직하게 지켰습니다.", "그래프를 만들 때 그 칸을 뺐다고 밝히면 됩니다."] },
    },
    activity: {
      image: "gaya",
      title: "Google Sheets에서 학급 데이터를 다듬어요",
      instruction: "5차시 시작 파일을 불러와 다섯 열을 채우고 중복을 정리한 뒤 다시 내려받습니다.",
      steps: ["원본 시트를 복사해 남기기", "나라·세기·자료 종류·지역·확인 기관 채우기", "중복 줄 정리하고 CSV로 저장하기"],
    },
    closing: { image: "muryeong", title: "빈칸을 비워 두면 데이터가 완성되지 않은 것 아닐까요?", prompt: "모르는 값을 추측해 채우는 것보다 ‘아직 모름’으로 남기는 편이 정확합니다. 그래프를 만들 때 어떤 칸을 뺐는지 밝히면 됩니다.", next: "6차시 · 우리 데이터를 그래프로 보기" },
  },
  6: {
    title: "역사 데이터를\n그림으로 보기",
    subtitle: "정제해서 만든 다섯 열을 축에 놓고 여섯 유산을 나란히 견주어 봅니다.",
    coverImage: "mural",
    history: {
      image: "mural",
      title: "벽화 한 장으로 모든 사람의 생활을 알 수 있을까요?",
      points: ["고구려 무덤 벽에는 사냥하거나 줄지어 가는 모습이 남아 있어요.", "주로 왕의 가족이나 높은 신분의 사람들의 무덤이에요.", "그 그림만으로 모든 고구려 사람이 똑같이 살았다고 말할 수는 없어요."],
      takeaway: "우리 그래프도 어떤 자료를 골랐는지 함께 말해요.",
      source: sources.mural,
    },
    data: {
      image: "gaya",
      title: "어제 만든 다섯 열이 그래프의 재료입니다",
      points: ["나라·세기·자료 종류·지역·확인 기관을 축에 놓을 수 있습니다.", "정제하지 않은 일곱 칸은 글이라서 셀 수 없습니다.", "가로축을 바꾸면 같은 표에서 다른 것이 보입니다."],
      takeaway: "정제를 해 두었기 때문에 오늘 그래프를 그릴 수 있습니다.",
    },
    compare: {
      image: "mural",
      title: "어떤 그래프가 질문에 더 잘 답할까요?",
      left: { label: "질문과 먼 그래프", title: "모둠 번호별 줄 수", items: ["누가 많이 올렸는지만 보입니다.", "역사 질문에 답하기 어렵습니다."] },
      right: { label: "질문과 이어진 그래프", title: "나라별·세기별 유산 수", items: ["어느 나라와 시기의 자료가 많은지 보입니다.", "여섯 유산을 나란히 견줄 수 있습니다."] },
    },
    activity: {
      image: "gaya",
      title: "같은 표를 다른 축으로 읽어 봐요",
      instruction: "가로축을 나라에서 세기로 바꾸면 무엇이 보이고 무엇이 사라지는지 말합니다.",
      steps: ["가로축에 ‘나라’ 놓기", "가로축을 ‘세기’로 바꾸기", "제목·자료 수 확인하고 저장하기"],
    },
    closing: { image: "muryeong", title: "그래프가 역사 문제의 정답을 바로 보여 줄까요?", prompt: "아니요. 그래프는 우리 반이 조사한 열두 줄 안의 차이만 보여 줍니다. 축과 자료 수, 그리고 출처가 없는 줄이 몇 개인지까지 함께 말해야 합니다.", next: "7차시 · 그래프를 읽고 설명하기" },
  },
  7: {
    title: "그래프를 읽고\n설명하기",
    subtitle: "그래프가 말해 주는 점과 말하지 못하는 점을 함께 설명합니다.",
    coverImage: "gaya",
    history: {
      image: "gaya",
      title: "가야 무덤은 지역마다 무엇이 같고 다를까요?",
      points: ["여러 지역에 옛 무덤들이 모여 있어요. 이를 고분군이라고 해요.", "무덤의 모양과 함께 묻은 물건에는 같은 점도, 다른 점도 있어요.", "가야에는 여러 작은 나라가 있었어요."],
      takeaway: "다른 점을 찾았다면 왜 다른지는 다른 자료도 읽고 생각해요.",
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
      title: "향로를 어디에서 찾았는지 함께 생각해요",
      points: ["이 향로는 절이 있던 자리에서 찾았어요.", "사람·동물·산·연꽃의 모습이 새겨져 있어요.", "모든 무늬가 무엇을 뜻하는지는 아직 다 알 수 없어요."],
      takeaway: "장소와 모양을 함께 보며 무엇에 썼을지 생각하고, 아직 모르는 점도 말해요.",
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
      title: "그래프와 사진을 함께 보여 줘요",
      points: ["그래프는 우리가 고른 문장이 몇 개인지 보여 줘요.", "유산 사진에서는 금관에 세워진 장식처럼 실제 모양을 볼 수 있어요.", "우리가 찾은 문장을 사진 옆에 놓고 설명해요."],
      takeaway: "자료에서 확인한 것과 우리가 생각한 것을 나누어 말해요.",
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
      title: "유산을 보여 주며 설명해 볼까요?",
      points: ["무령왕릉에서는 무덤 주인을 알려 주는 글자가 적힌 돌, 지석이 나왔어요.", "향로와 벽화에는 옛사람이 만든 여러 모습이 남아 있어요.", "유산을 살펴봐도 아직 답을 모르는 질문이 있어요."],
      takeaway: "친구에게 아는 것은 자료를 보여 주고, 모르는 것은 아직 모른다고 말해요.",
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
  const continuation = getContinuitySlides(lessonId, deckPlans[lessonId] ? { kind: 'fact', eyebrow: '유산 이야기', ...deckPlans[lessonId].history } : undefined);
  if (continuation) return continuation;
  return decks[lessonId] ?? decks[1];
}
