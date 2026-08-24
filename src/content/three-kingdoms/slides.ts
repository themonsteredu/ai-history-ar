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
  | (SlideBase & {
      kind: "cover";
      tag: string;
      title: string;
      subtitle: string;
    })
  | (SlideBase & {
      kind: "fact";
      eyebrow: string;
      title: string;
      points: readonly string[];
      takeaway?: string;
    })
  | (SlideBase & {
      kind: "compare";
      eyebrow: string;
      title: string;
      left: { label: string; title: string; items: readonly string[] };
      right: { label: string; title: string; items: readonly string[] };
    })
  | (SlideBase & {
      kind: "gallery";
      eyebrow: string;
      title: string;
      instruction: string;
    })
  | (SlideBase & {
      kind: "activity";
      eyebrow: string;
      title: string;
      instruction: string;
      steps: readonly string[];
    })
  | (SlideBase & {
      kind: "quiz";
      eyebrow: string;
      title: string;
      statement: string;
      verdict: "확인" | "틀림" | "보류";
      explanation: string;
    })
  | (SlideBase & {
      kind: "closing";
      eyebrow: string;
      title: string;
      prompt: string;
      next: string;
    });

const sources = {
  overview: {
    label: "자료: 우리역사넷 ‘삼국의 발전’",
    href: "https://contents.history.go.kr/mobile/ta/view.do?levelId=ta_m31_0050_0010",
  },
  culture: {
    label: "자료: 우리역사넷 ‘삼국 및 가야의 문화’",
    href: "https://contents.history.go.kr/front/newEh/list.do?code=eh_age_10&type=eh_ty_020",
  },
  muryeong: {
    label: "자료: 국립공주박물관 웅진백제실",
    href: "https://gongju.museum.go.kr/prog/prmntDspyRelic/kor/sub02_01_01/list.do",
  },
  incense: {
    label: "자료: 국립부여박물관 백제대향로관",
    href: "https://buyeo.museum.go.kr/content.do?key=2605140001",
  },
  cheomseongdae: {
    label: "자료: 국가유산청 국가유산포털",
    href: "https://www.heritage.go.kr/heri/cul/culGuidePostDetail.do?ccbaCpno=1113700310000&ccgbGbtype=IND&ccgbGbtypeNo=2&pageNo=1_5_0_0",
  },
  cheomseongdaeStudy: {
    label: "자료: 우리역사넷 ‘경주 첨성대’",
    href: "https://contents.history.go.kr/mobile/eh/view.do?levelId=eh_r0082_0010",
  },
  crown: {
    label: "자료: 국립중앙박물관 소장품 ‘금관’",
    href: "https://www.museum.go.kr/site/main/relic/search/view?relicId=752",
  },
  crownStudy: {
    label: "자료: 우리역사넷 ‘신라 금관’",
    href: "https://contents.history.go.kr/mobile/kc/view.do?code=kc_age_10&levelId=kc_r100474",
  },
  mural: {
    label: "자료: UNESCO ‘고구려 고분군’",
    href: "https://whc.unesco.org/en/list/1091/",
  },
  gaya: {
    label: "자료: UNESCO ‘가야 고분군’",
    href: "https://whc.unesco.org/en/decisions/8393/",
  },
} as const satisfies Record<string, SlideSource>;

const decks: Record<number, readonly LessonSlide[]> = {
  1: [
    {
      kind: "cover",
      tag: "초등학교 5학년 사회 · 삼국시대 1차시",
      title: "1500년 전에는\n무엇이 있었을까?",
      subtitle: "문화유산을 보고 삼국과 가야 사람들의 삶을 만나 봅시다.",
      image: "muryeong",
      source: sources.muryeong,
    },
    {
      kind: "fact",
      eyebrow: "역사 먼저 배우기",
      title: "삼국과 가야는 같은 나라가 아니었어요",
      points: [
        "고구려·백제·신라는 서로 다른 나라로 성장했어요.",
        "한반도 남쪽에는 여러 가야 세력이 연맹을 이루었어요.",
        "이 나라들은 경쟁하면서도 사람과 기술, 문화를 주고받았어요.",
      ],
      takeaway: "오늘은 왕 이름보다 문화유산에 남은 생활 모습을 살펴봅니다.",
      image: "mural",
      source: sources.overview,
    },
    {
      kind: "fact",
      eyebrow: "문화유산은 역사 증거",
      title: "남은 물건과 그림이 옛사람을 말해 줍니다",
      points: [
        "무덤과 껴묻거리는 죽음 뒤의 세계를 어떻게 생각했는지 보여 줘요.",
        "벽화에는 옷차림·사냥·춤·집 안 생활이 그려져 있어요.",
        "향로와 금관에서는 믿음, 뛰어난 공예 기술, 권위를 찾을 수 있어요.",
      ],
      image: "incense",
      source: sources.culture,
    },
    {
      kind: "gallery",
      eyebrow: "모둠 선택 활동",
      title: "어떤 유물이 가장 궁금한가요?",
      instruction: "사진을 자세히 보고 한 장을 고른 뒤 이유를 말해요.",
      image: "crown",
      source: sources.culture,
    },
    {
      kind: "compare",
      eyebrow: "한눈에 보는 여섯 이야기",
      title: "유산마다 알려 주는 역사가 달라요",
      left: {
        label: "사람과 나라",
        title: "권력·교류·정치",
        items: ["무령왕릉: 백제 왕실과 국제 교류", "신라 금관: 왕족의 권위와 장례", "가야 고분군: 여러 가야 세력의 연맹"],
      },
      right: {
        label: "생활과 생각",
        title: "기술·믿음·예술",
        items: ["금동대향로: 백제의 공예와 이상세계", "첨성대: 신라의 천문 지식", "고분벽화: 고구려인의 생활과 믿음"],
      },
      image: "gaya",
      source: sources.culture,
    },
    {
      kind: "activity",
      eyebrow: "사진 탐정 활동",
      title: "보이는 것부터 천천히 관찰해요",
      instruction: "사진만으로 알 수 있는 것과 아직 알 수 없는 것을 나눕니다.",
      steps: ["모양·무늬·재료 찾기", "궁금한 점을 질문으로 만들기", "근거 없는 짐작은 ‘아직 모름’에 두기"],
      image: "incense",
    },
    {
      kind: "activity",
      eyebrow: "모둠에서 정하는 방법",
      title: "같은 유물을 골라도 괜찮아요",
      instruction: "다른 모둠과 유물이 같아도 질문이 다르면 새로운 탐구가 됩니다.",
      steps: ["각자 가장 궁금한 유물 고르기", "‘왜냐하면’으로 이유 말하기", "유물 이름·선택 이유·궁금한 점 기록하기"],
      image: "cheomseongdae",
    },
    {
      kind: "closing",
      eyebrow: "오늘의 마무리",
      title: "우리 모둠은 무엇을 알고 싶나요?",
      prompt: "유물 이름과 가장 궁금한 질문 한 가지를 발표해 봅시다.",
      next: "다음 시간에는 AI의 설명과 실제 역사 자료를 비교합니다.",
      image: "mural",
    },
  ],
  2: [
    {
      kind: "cover",
      tag: "초등학교 5학년 사회 · 삼국시대 2차시",
      title: "AI에게\n물어보았습니다",
      subtitle: "그럴듯한 설명 속에서 확인이 필요한 문장을 찾아봅시다.",
      image: "incense",
      source: sources.incense,
    },
    {
      kind: "fact",
      eyebrow: "비교할 역사 사실 ①",
      title: "무령왕릉은 주인을 알 수 있는 왕릉입니다",
      points: [
        "1971년 공주에서 배수로를 정비하다 우연히 발견했어요.",
        "무덤 입구의 지석에 무령왕과 왕비의 기록이 남아 있었어요.",
        "진묘수·관꾸미개·거울 등 많은 유물이 함께 발견되었어요.",
      ],
      takeaway: "AI가 ‘주인을 모르는 무덤’이라고 말하면 자료와 어긋납니다.",
      image: "muryeong",
      source: sources.muryeong,
    },
    {
      kind: "compare",
      eyebrow: "AI 문장과 자료 비교",
      title: "비슷하게 들려도 사실은 다를 수 있어요",
      left: {
        label: "확인이 필요한 AI 문장",
        title: "“무령왕릉은 도굴된 뒤 발견되었다.”",
        items: ["출처가 적혀 있지 않아요.", "발견 과정을 단정하고 있어요."],
      },
      right: {
        label: "박물관 자료",
        title: "“배수로 공사 중 우연히 발견되었다.”",
        items: ["발견 시기와 장소가 분명해요.", "지석으로 무덤 주인을 확인했어요."],
      },
      image: "muryeong",
      source: sources.muryeong,
    },
    {
      kind: "fact",
      eyebrow: "비교할 역사 사실 ②",
      title: "금동대향로는 왕릉이 아닌 절터에서 나왔어요",
      points: [
        "1993년 부여 능산리 절터에서 온전한 모습으로 발견됐어요.",
        "받침의 용, 연꽃 몸체, 산 모양 뚜껑, 꼭대기의 봉황으로 이루어져요.",
        "사람·동물·산봉우리가 어우러져 백제인의 이상세계를 떠올리게 해요.",
      ],
      image: "incense",
      source: sources.incense,
    },
    {
      kind: "compare",
      eyebrow: "확인된 것과 남은 질문",
      title: "모든 역사 질문에 하나의 답이 있는 것은 아니에요",
      left: {
        label: "확인된 사실",
        title: "자료로 말할 수 있어요",
        items: ["첨성대는 신라 선덕여왕 때 세워진 것으로 봐요.", "신라 금관은 왕족급 무덤에서 발견됐어요."],
      },
      right: {
        label: "아직 논의 중",
        title: "단정하지 않아요",
        items: ["첨성대의 구체적인 관측 방법", "금관을 생전에 언제 어떻게 썼는지"],
      },
      image: "crown",
      source: sources.crownStudy,
    },
    {
      kind: "quiz",
      eyebrow: "잠깐 판단하기",
      title: "이 문장은 그대로 믿어도 될까요?",
      statement: "“신라 왕은 금관을 매일 쓰고 나라를 다스렸다.”",
      verdict: "보류",
      explanation: "금관이 왕족의 권위를 보여 주는 것은 맞지만, 생전에 실제로 어떻게 사용했는지는 명쾌한 결론이 없습니다.",
      image: "crown",
      source: sources.crownStudy,
    },
    {
      kind: "activity",
      eyebrow: "오류 발견 기록지",
      title: "이상한 문장에는 밑줄을 그어요",
      instruction: "틀렸다고 바로 결정하지 말고 왜 더 확인해야 하는지 적습니다.",
      steps: ["숫자·시기·장소 확인하기", "‘반드시·모두·매일’ 같은 단정 표현 찾기", "확인할 자료를 한 가지 적기"],
      image: "cheomseongdae",
    },
    {
      kind: "closing",
      eyebrow: "오늘의 결론",
      title: "AI의 말은 답이 아니라 확인의 시작입니다",
      prompt: "우리 모둠이 찾은 ‘확인이 필요한 문장’ 한 가지를 발표해 봅시다.",
      next: "다음 시간에는 믿을 만한 자료를 고르는 5단계를 배웁니다.",
      image: "gaya",
    },
  ],
  3: [
    {
      kind: "cover",
      tag: "초등학교 5학년 사회 · 삼국시대 3차시",
      title: "진짜인지\n확인하는 방법",
      subtitle: "출처·시기·교차·원본·보류의 다섯 단계를 익혀 봅시다.",
      image: "cheomseongdae",
      source: sources.cheomseongdae,
    },
    {
      kind: "fact",
      eyebrow: "역사는 증거로 설명해요",
      title: "무령왕릉의 지석은 강한 증거입니다",
      points: [
        "지석에는 무덤에 묻힌 사람과 날짜를 알려 주는 글이 남아 있어요.",
        "그래서 무령왕릉은 무덤 주인을 정확히 아는 중요한 왕릉이에요.",
        "유물 자체와 그 유물이 나온 장소를 함께 살펴야 해요.",
      ],
      image: "muryeong",
      source: sources.muryeong,
    },
    {
      kind: "activity",
      eyebrow: "검증 5단계",
      title: "다섯 질문을 차례로 던져요",
      instruction: "답을 빨리 내는 것보다 근거를 정확히 찾는 것이 중요합니다.",
      steps: ["출처: 누가 만들었나?", "시기: 언제 만든 자료인가?", "교차: 다른 자료도 같은가?", "원본: 실제 유물·기록과 연결되는가?", "보류: 근거가 부족하면 멈출 수 있는가?"],
      image: "mural",
    },
    {
      kind: "compare",
      eyebrow: "자료의 성격 비교",
      title: "자료마다 역할과 믿을 정도가 달라요",
      left: {
        label: "먼저 확인할 자료",
        title: "박물관·국가유산·원문 기록",
        items: ["누가 관리하는지 분명해요.", "유물의 출토 장소와 연구 내용을 밝혀요."],
      },
      right: {
        label: "추가 확인이 필요한 자료",
        title: "블로그·짧은 영상·AI 답변",
        items: ["쉽게 설명하지만 출처가 빠질 수 있어요.", "다른 자료와 반드시 비교해요."],
      },
      image: "incense",
      source: sources.incense,
    },
    {
      kind: "quiz",
      eyebrow: "보류가 필요한 사례",
      title: "첨성대의 모든 사용법을 알고 있을까요?",
      statement: "“첨성대에서는 매일 사람이 꼭대기에 올라가 별을 관측했다.”",
      verdict: "보류",
      explanation: "천문 관측과 관련된 시설로 보지만, 구체적으로 어떻게 사용했는지에는 여러 의견이 있습니다.",
      image: "cheomseongdae",
      source: sources.cheomseongdaeStudy,
    },
    {
      kind: "quiz",
      eyebrow: "원본을 살피는 사례",
      title: "벽화 한 장으로 모두를 말할 수 있을까요?",
      statement: "“고구려 사람은 모두 말을 타고 사냥했다.”",
      verdict: "틀림",
      explanation: "수렵도는 사냥 장면을 보여 주지만, 그림 한 장을 고구려 사람 전체의 생활로 넓혀 말할 수는 없습니다.",
      image: "mural",
      source: sources.mural,
    },
    {
      kind: "activity",
      eyebrow: "자료 3종 비교",
      title: "같은 질문을 세 자료에서 찾아봅시다",
      instruction: "국가기관 자료, 블로그, AI 답변을 나란히 놓고 근거를 표시합니다.",
      steps: ["같이 말하는 사실에 동그라미", "서로 다른 설명에 물음표", "출처가 없는 문장에 밑줄", "결론을 못 내리면 ‘보류’"],
      image: "gaya",
    },
    {
      kind: "closing",
      eyebrow: "검증 약속",
      title: "모른다고 말하는 것도 정확한 역사 공부입니다",
      prompt: "다섯 단계 중 내가 가장 놓치기 쉬운 한 가지를 고릅니다.",
      next: "다음 시간에는 이 기준으로 여섯 문화유산을 깊이 조사합니다.",
      image: "crown",
    },
  ],
  4: [
    {
      kind: "cover",
      tag: "초등학교 5학년 사회 · 삼국시대 4차시 · 역사 내용 집중",
      title: "우리 모둠 유산\n파헤치기",
      subtitle: "여섯 문화유산이 들려주는 정치·생활·믿음·기술을 배웁니다.",
      image: "gaya",
      source: sources.gaya,
    },
    {
      kind: "compare",
      eyebrow: "백제의 두 문화유산",
      title: "무덤과 향로에서 백제의 힘을 읽어요",
      left: {
        label: "무령왕릉",
        title: "왕실과 국제 교류",
        items: ["523년에 세상을 떠난 무령왕과 왕비의 무덤", "지석·중국계 벽돌무덤·다양한 출토품"],
      },
      right: {
        label: "금동대향로",
        title: "공예와 이상세계",
        items: ["6세기 후반 백제의 뛰어난 금속 공예", "용·연꽃·산·봉황과 수많은 사람·동물"],
      },
      image: "incense",
      source: sources.incense,
    },
    {
      kind: "compare",
      eyebrow: "신라의 두 문화유산",
      title: "금관과 첨성대는 왕권과 지식을 보여 줘요",
      left: {
        label: "신라 금관",
        title: "왕족의 권위",
        items: ["나뭇가지·사슴뿔 모양 세움 장식", "금판·곱은옥·달개로 화려하게 장식"],
      },
      right: {
        label: "첨성대",
        title: "하늘을 살핀 지식",
        items: ["선덕여왕 때 세워진 것으로 보는 석조 건축", "천문 관측과 관련되지만 사용법은 논의 중"],
      },
      image: "crown",
      source: sources.crown,
    },
    {
      kind: "compare",
      eyebrow: "고구려와 가야의 문화유산",
      title: "그림과 무덤 떼가 사회의 모습을 남겼어요",
      left: {
        label: "고구려 고분벽화",
        title: "생활과 믿음",
        items: ["옷차림·사냥·행렬·집 안 생활", "죽은 뒤의 세계와 수호신에 대한 생각"],
      },
      right: {
        label: "가야 고분군",
        title: "여러 나라의 연맹",
        items: ["여러 지역에 나뉜 지배층의 큰 무덤", "공통 문화와 각 세력의 독자성을 함께 확인"],
      },
      image: "mural",
      source: sources.mural,
    },
    {
      kind: "fact",
      eyebrow: "시간의 흐름에 놓아 보기",
      title: "문화유산은 서로 다른 시기에 만들어졌어요",
      points: [
        "5~6세기: 고구려 벽화무덤과 신라 왕족의 금관 문화가 발달했어요.",
        "6세기: 무령왕릉과 백제 금동대향로가 백제 문화를 보여 줘요.",
        "7세기: 신라에서 첨성대가 세워졌어요. 가야는 그보다 앞선 여러 세력의 역사를 남겼어요.",
      ],
      image: "cheomseongdae",
      source: sources.culture,
    },
    {
      kind: "activity",
      eyebrow: "조사 카드 네 칸",
      title: "사실을 생활 모습과 연결해요",
      instruction: "정보를 베끼지 말고 ‘이 유산으로 무엇을 알 수 있는가’를 씁니다.",
      steps: ["언제·어디서 만들어졌나?", "무엇이 보이고 어떤 기술을 썼나?", "당시 사람의 생활·생각을 무엇으로 짐작하나?", "아직 모르는 점과 출처는 무엇인가?"],
      image: "muryeong",
    },
    {
      kind: "activity",
      eyebrow: "출처 기록",
      title: "놀라운 사실 옆에 자료 이름을 남겨요",
      instruction: "박물관이나 국가유산 자료의 제목과 주소를 짧게 기록합니다.",
      steps: ["사실 한 문장으로 쓰기", "그 사실을 보여 주는 사진 부분 찾기", "자료를 만든 기관 적기", "확인하지 못한 내용은 ‘아직 모름’"],
      image: "gaya",
    },
    {
      kind: "closing",
      eyebrow: "역사 내용 확인",
      title: "우리 유산이 알려 준 옛 생활은 무엇인가요?",
      prompt: "‘이 유산을 보면 당시 사람들이 …했음을 알 수 있다’로 발표합니다.",
      next: "다음 시간에는 확인한 역사 사실을 AR 장면으로 바꿉니다.",
      image: "incense",
    },
  ],
  5: [
    {
      kind: "cover",
      tag: "초등학교 5학년 사회 · 삼국시대 5차시",
      title: "AR로 만나는\n문화유산",
      subtitle: "확인한 역사 사실을 움직임과 해설이 있는 장면으로 설계합니다.",
      image: "crown",
      source: sources.crown,
    },
    {
      kind: "fact",
      eyebrow: "AR의 역사 원칙",
      title: "멋진 장면보다 근거 있는 장면이 먼저예요",
      points: [
        "유물에서 보이는 모양과 조사한 사실을 장면의 중심으로 삼아요.",
        "이름·대사·행동을 마음대로 만들어 실제 역사처럼 보이게 하지 않아요.",
        "확실하지 않은 내용은 질문이나 ‘아직 모름’으로 보여 줘요.",
      ],
      image: "mural",
      source: sources.mural,
    },
    {
      kind: "compare",
      eyebrow: "사실을 장면으로 바꾸기",
      title: "유물의 특징이 움직임의 근거가 됩니다",
      left: {
        label: "금동대향로",
        title: "향이 피어오르는 구조",
        items: ["뚜껑과 봉황 부분의 구멍", "산봉우리 사이 사람과 동물 확대"],
      },
      right: {
        label: "고구려 고분벽화",
        title: "사냥 장면의 움직임",
        items: ["말을 타고 활을 쏘는 모습", "복식과 사냥 도구를 그대로 관찰"],
      },
      image: "incense",
      source: sources.incense,
    },
    {
      kind: "compare",
      eyebrow: "표현해도 되는 것",
      title: "확인된 장면과 상상 장면을 구분해요",
      left: {
        label: "근거 있는 표현",
        title: "사진·자료와 연결됩니다",
        items: ["금관의 달개가 움직이는 모습", "첨성대 돌층을 차례로 살펴보기"],
      },
      right: {
        label: "표시가 필요한 상상",
        title: "사실처럼 단정하지 않습니다",
        items: ["왕이 금관을 쓰고 매일 회의하는 장면", "첨성대 위에서 망원경을 보는 장면"],
      },
      image: "cheomseongdae",
      source: sources.cheomseongdaeStudy,
    },
    {
      kind: "activity",
      eyebrow: "AR 기획 네 칸",
      title: "무엇이 나타나고, 무엇을 알려 줄까요?",
      instruction: "한 장면에 한 가지 역사 메시지만 담습니다.",
      steps: ["등장 요소: 유물의 어느 부분?", "움직임: 사실과 어울리는가?", "한 문장 해설: 무엇을 알게 하나?", "터치·회전: 무엇을 더 관찰하나?"],
      image: "crown",
    },
    {
      kind: "quiz",
      eyebrow: "기획 판단",
      title: "이 장면은 그대로 만들어도 될까요?",
      statement: "“첨성대 위에 현대식 망원경을 세우고 별을 관측한다.”",
      verdict: "틀림",
      explanation: "현대식 망원경은 당시의 유물이 아닙니다. 별과 하늘의 움직임을 살피는 상징 장면으로 바꾸는 편이 정확합니다.",
      image: "cheomseongdae",
      source: sources.cheomseongdaeStudy,
    },
    {
      kind: "activity",
      eyebrow: "모둠 AR 설계",
      title: "역사 사실 하나를 선명하게 보여 주세요",
      instruction: "조사 카드에서 가장 중요한 사실을 골라 3칸 장면으로 그립니다.",
      steps: ["처음: 유물 전체 보기", "가운데: 중요한 부분 확대·움직임", "끝: 사실 한 문장과 출처 표시"],
      image: "muryeong",
    },
    {
      kind: "closing",
      eyebrow: "기획 발표",
      title: "우리 장면의 역사 근거는 무엇인가요?",
      prompt: "‘이 장면은 ○○ 자료에서 확인한 …을 보여 줍니다’로 설명합니다.",
      next: "다음 시간에는 참·거짓·보류 문제로 역사 사실을 다시 점검합니다.",
      image: "gaya",
    },
  ],
  6: [
    {
      kind: "cover",
      tag: "초등학교 5학년 사회 · 삼국시대 6차시",
      title: "헤리티지\n검증 공방",
      subtitle: "정답을 외우는 대신 자료의 근거로 확인·틀림·보류를 판단합니다.",
      image: "mural",
      source: sources.mural,
    },
    {
      kind: "fact",
      eyebrow: "도전 전 역사 복습",
      title: "여섯 유산의 핵심 사실을 기억해요",
      points: [
        "무령왕릉은 지석으로 주인을 확인했고, 금동대향로는 능산리 절터에서 발견됐어요.",
        "첨성대는 천문 관측과 관련되고, 신라 금관은 왕족의 권위를 보여 줘요.",
        "고구려 벽화는 생활과 믿음을, 가야 고분군은 여러 세력의 연맹을 보여 줘요.",
      ],
      image: "gaya",
      source: sources.culture,
    },
    {
      kind: "quiz",
      eyebrow: "문항 1",
      title: "무령왕릉의 주인은 지석으로 확인했다",
      statement: "무덤 입구에서 왕과 왕비의 기록이 적힌 지석이 발견되었다.",
      verdict: "확인",
      explanation: "국립공주박물관 자료와 실제 출토 지석이 함께 뒷받침합니다.",
      image: "muryeong",
      source: sources.muryeong,
    },
    {
      kind: "quiz",
      eyebrow: "문항 2",
      title: "금동대향로는 무령왕릉에서 발견됐다",
      statement: "백제 금동대향로는 무령왕과 함께 묻혀 있던 유물이다.",
      verdict: "틀림",
      explanation: "금동대향로는 1993년 부여 능산리 절터에서 발견됐습니다.",
      image: "incense",
      source: sources.incense,
    },
    {
      kind: "quiz",
      eyebrow: "문항 3",
      title: "첨성대의 사용법은 모두 밝혀졌다",
      statement: "첨성대에서 사람이 별을 관측한 정확한 방법이 기록에 자세히 남아 있다.",
      verdict: "보류",
      explanation: "천문 관측과 관련된 시설로 보지만, 구체적인 사용 방법은 확정하기 어렵습니다.",
      image: "cheomseongdae",
      source: sources.cheomseongdaeStudy,
    },
    {
      kind: "quiz",
      eyebrow: "문항 4",
      title: "신라 왕은 금관을 매일 썼다",
      statement: "왕은 평상시에도 무거운 금관을 늘 머리에 쓰고 생활했다.",
      verdict: "보류",
      explanation: "금관의 실제 착용 방식과 시점에는 여러 견해가 있어 ‘매일’이라고 말할 수 없습니다.",
      image: "crown",
      source: sources.crownStudy,
    },
    {
      kind: "activity",
      eyebrow: "검증 공방 규칙",
      title: "판단 뒤에는 반드시 근거를 남겨요",
      instruction: "맞힌 개수보다 어떤 자료를 사용했는지가 더 중요합니다.",
      steps: ["문장의 핵심 낱말 표시", "검증 5단계 적용", "확인·틀림·보류 선택", "자료 이름과 이유 한 문장 기록"],
      image: "gaya",
    },
    {
      kind: "closing",
      eyebrow: "도슨트 자격 확인",
      title: "가장 헷갈린 문항이 가장 좋은 공부가 됩니다",
      prompt: "처음 판단과 자료를 본 뒤 판단이 어떻게 달라졌는지 말합니다.",
      next: "다음 시간에는 검증한 사실을 앞뒤가 있는 AR 카드로 만듭니다.",
      image: "incense",
    },
  ],
  7: [
    {
      kind: "cover",
      tag: "초등학교 5학년 사회 · 삼국시대 7차시",
      title: "AR 카드\n만들기",
      subtitle: "앞면에는 유산의 특징을, 뒷면에는 검증한 역사 사실을 담습니다.",
      image: "crown",
      source: sources.crown,
    },
    {
      kind: "fact",
      eyebrow: "앞면에 담을 역사",
      title: "대표 모양은 유산을 알아보는 단서예요",
      points: [
        "무령왕릉: 아치형 벽돌 입구와 연꽃무늬 벽돌",
        "금동대향로: 용·연꽃·산봉우리·봉황",
        "신라 금관: 나뭇가지와 사슴뿔 모양 장식, 곱은옥과 달개",
      ],
      image: "incense",
      source: sources.incense,
    },
    {
      kind: "fact",
      eyebrow: "나머지 세 유산의 시각 단서",
      title: "그림만 보아도 유산이 구별되어야 해요",
      points: [
        "첨성대: 돌을 층층이 쌓은 둥근 몸통과 가운데 창",
        "고구려 고분벽화: 달리는 말·활·힘찬 선",
        "가야 고분군: 능선을 따라 이어지는 여러 봉분과 철기 유물",
      ],
      image: "mural",
      source: sources.culture,
    },
    {
      kind: "compare",
      eyebrow: "카드 앞면과 뒷면",
      title: "그림은 질문을 열고, 글은 사실을 확인해요",
      left: {
        label: "앞면",
        title: "한눈에 보이는 특징",
        items: ["굵은 윤곽과 서로 다른 무늬", "유산의 실제 모양에서 가져온 소재"],
      },
      right: {
        label: "뒷면",
        title: "검증한 역사 3줄",
        items: ["언제·어디의 유산인가", "무엇을 알 수 있는가", "출처와 아직 모르는 점"],
      },
      image: "cheomseongdae",
    },
    {
      kind: "quiz",
      eyebrow: "뒷면 문장 점검",
      title: "이 문장을 카드에 써도 될까요?",
      statement: "“첨성대는 신라 사람이 망원경으로 별을 본 곳이다.”",
      verdict: "틀림",
      explanation: "망원경은 당시 사용된 도구가 아닙니다. ‘천문 관측과 관련된 시설’로 고쳐 씁니다.",
      image: "cheomseongdae",
      source: sources.cheomseongdaeStudy,
    },
    {
      kind: "activity",
      eyebrow: "인식이 잘되는 그림",
      title: "서로 다른 카드가 되도록 특징을 크게 살려요",
      instruction: "예쁘게 꾸미는 것보다 카메라가 구별할 수 있는 차이가 중요합니다.",
      steps: ["진한 선과 강한 명암", "유산마다 다른 중심 모양", "빈 공간을 줄이고 고유 무늬 넣기", "QR 영역은 비워 두기"],
      image: "gaya",
    },
    {
      kind: "activity",
      eyebrow: "카드 제작",
      title: "그림과 역사 문장을 서로 확인해요",
      instruction: "그림에 없는 내용을 뒷면에서 새로 지어내지 않습니다.",
      steps: ["앞면 스케치", "모둠끼리 여섯 카드 비교", "뒷면 사실 3줄 쓰기", "출처와 보류 문장 점검"],
      image: "muryeong",
    },
    {
      kind: "closing",
      eyebrow: "완성 확인",
      title: "우리 카드의 역사 특징이 보이나요?",
      prompt: "다른 모둠이 그림만 보고 유산 이름과 특징을 말할 수 있는지 시험합니다.",
      next: "다음 시간에는 카드에 연결할 30초 역사 해설을 만듭니다.",
      image: "crown",
    },
  ],
  8: [
    {
      kind: "cover",
      tag: "초등학교 5학년 사회 · 삼국시대 8차시",
      title: "30초\n해설사",
      subtitle: "검증한 역사 사실을 친구가 이해하기 쉬운 말로 설명합니다.",
      image: "mural",
      source: sources.mural,
    },
    {
      kind: "activity",
      eyebrow: "30초 해설 네 부분",
      title: "짧지만 역사 내용은 빠지지 않아요",
      instruction: "한 문장씩 또박또박 이어 30초 해설을 만듭니다.",
      steps: ["인사와 유산 이름", "가장 중요한 역사 사실", "AI 설명에서 바로잡은 점", "왜 소중한지와 마무리 질문"],
      image: "gaya",
    },
    {
      kind: "fact",
      eyebrow: "해설 예시 ① 무령왕릉",
      title: "지석이 무덤의 주인을 알려 주었습니다",
      points: [
        "“안녕하세요. 무령왕릉 도슨트입니다.”",
        "“이 무덤은 1971년에 발견됐고, 지석 덕분에 무령왕과 왕비의 무덤임을 알았습니다.”",
        "“AI가 주인을 모른다고 말했다면 이 지석 자료로 바로잡을 수 있습니다.”",
      ],
      image: "muryeong",
      source: sources.muryeong,
    },
    {
      kind: "fact",
      eyebrow: "해설 예시 ② 금동대향로",
      title: "작은 향로 안에 백제의 이상세계가 펼쳐집니다",
      points: [
        "“받침의 용 위로 연꽃과 산봉우리가 이어지고, 꼭대기에는 봉황이 있습니다.”",
        "“사람과 동물, 다섯 연주자의 모습에서 백제의 공예와 생각을 볼 수 있습니다.”",
        "“이 향로는 왕릉이 아니라 부여 능산리 절터에서 발견됐습니다.”",
      ],
      image: "incense",
      source: sources.incense,
    },
    {
      kind: "compare",
      eyebrow: "단정하지 않는 해설",
      title: "모르는 부분까지 정직하게 설명해요",
      left: {
        label: "첨성대",
        title: "확인 + 보류",
        items: ["천문 관측과 관련된 신라 건축", "정확한 관측 방법에는 여러 의견"],
      },
      right: {
        label: "신라 금관",
        title: "확인 + 보류",
        items: ["왕족의 권위를 보여 주는 금관", "생전의 사용 방식은 확정하기 어려움"],
      },
      image: "crown",
      source: sources.crownStudy,
    },
    {
      kind: "quiz",
      eyebrow: "해설 문장 고치기",
      title: "도슨트가 이렇게 말해도 될까요?",
      statement: "“고구려 사람은 모두 매일 말을 타고 사냥했습니다.”",
      verdict: "틀림",
      explanation: "벽화 속 사냥 장면을 전체 사람의 매일 생활로 넓힐 수 없습니다. ‘벽화에는 말을 탄 사냥꾼이 그려져 있습니다’로 고칩니다.",
      image: "mural",
      source: sources.mural,
    },
    {
      kind: "activity",
      eyebrow: "녹음·촬영",
      title: "자료를 읽지 말고 청중에게 말해요",
      instruction: "어려운 낱말은 쉬운 말로 바꾸고, 유물 사진의 부분을 가리키며 설명합니다.",
      steps: ["30초 안에 소리 내어 읽기", "역사 사실과 출처 다시 확인", "얼굴·음성 촬영 동의 확인", "작은 목소리·빠른 말은 다시 녹음"],
      image: "cheomseongdae",
    },
    {
      kind: "closing",
      eyebrow: "해설 완성",
      title: "친구가 듣고 역사 사실 하나를 기억했나요?",
      prompt: "서로의 해설을 듣고 기억에 남은 사실 한 가지를 말합니다.",
      next: "다음 시간에는 카드와 해설이 교실 어디에서도 잘 작동하는지 시험합니다.",
      image: "gaya",
    },
  ],
  9: [
    {
      kind: "cover",
      tag: "초등학교 5학년 사회 · 삼국시대 9차시",
      title: "카드에 생명\n불어넣기",
      subtitle: "기술 작동과 역사 내용이 모두 정확한지 실전에서 시험합니다.",
      image: "cheomseongdae",
      source: sources.cheomseongdae,
    },
    {
      kind: "compare",
      eyebrow: "두 가지 실전 테스트",
      title: "잘 보이는 것과 바르게 말하는 것을 함께 봐요",
      left: {
        label: "기술 테스트",
        title: "카드와 AR",
        items: ["거리·각도·빛이 달라도 인식되는가", "음성·영상·QR이 바로 재생되는가"],
      },
      right: {
        label: "역사 테스트",
        title: "사실과 해설",
        items: ["카드 글과 해설의 사실이 같은가", "단정한 문장과 출처 없는 문장이 없는가"],
      },
      image: "muryeong",
    },
    {
      kind: "fact",
      eyebrow: "역사 품질 점검",
      title: "여섯 유산의 핵심이 바뀌지 않았나요?",
      points: [
        "무령왕릉=지석, 금동대향로=능산리 절터, 첨성대=천문 관측 관련",
        "신라 금관=왕족의 권위, 고분벽화=생활과 믿음, 가야 고분군=여러 세력의 연맹",
        "이 핵심과 다른 문장이 있으면 조사 자료로 돌아가 고쳐요.",
      ],
      image: "incense",
      source: sources.culture,
    },
    {
      kind: "quiz",
      eyebrow: "관람객 질문 연습",
      title: "“무령왕릉의 주인을 어떻게 알았나요?”",
      statement: "우리 모둠은 유물이 화려해서 왕릉이라고 생각했습니다.",
      verdict: "틀림",
      explanation: "화려함만으로 정한 것이 아니라 무덤에서 발견된 지석의 기록으로 무령왕과 왕비의 무덤임을 확인했습니다.",
      image: "muryeong",
      source: sources.muryeong,
    },
    {
      kind: "quiz",
      eyebrow: "관람객 질문 연습",
      title: "“가야는 왜 하나의 큰 왕국이 아니었나요?”",
      statement: "가야 고분군은 여러 지역 세력이 공통 문화를 나누면서도 각자 힘을 유지했음을 보여 줍니다.",
      verdict: "확인",
      explanation: "여러 지역에 분포한 지배층 무덤과 껴묻거리가 가야의 독특한 연맹 체제를 보여 줍니다.",
      image: "gaya",
      source: sources.gaya,
    },
    {
      kind: "activity",
      eyebrow: "교차 리허설",
      title: "다른 모둠이 관람객이 되어 질문해요",
      instruction: "1↔4, 2↔5, 3↔6 모둠이 서로 카드와 해설을 시험합니다.",
      steps: ["AR을 세 번 다시 인식하기", "예상 질문 세 개 묻기", "답의 역사 근거 확인하기", "고칠 부분과 담당자 기록하기"],
      image: "crown",
    },
    {
      kind: "activity",
      eyebrow: "실패했을 때의 준비",
      title: "AR이 멈춰도 역사 수업은 계속됩니다",
      instruction: "기술 대신 카드 사진과 학생 해설만으로도 설명할 수 있어야 합니다.",
      steps: ["QR 대체 주소 확인", "사진을 가리키며 30초 해설", "출처가 적힌 뒷면 보여 주기", "기술 문제와 역사 문제를 따로 기록"],
      image: "mural",
    },
    {
      kind: "closing",
      eyebrow: "개관 전 마지막 확인",
      title: "우리 부스는 어떤 역사 질문에 답하나요?",
      prompt: "부스의 핵심 질문과 근거 자료 한 가지를 모둠 전체가 함께 말합니다.",
      next: "다음 시간에는 여섯 부스를 연결해 삼국시대 문화유산 박물관을 엽니다.",
      image: "cheomseongdae",
    },
  ],
  10: [
    {
      kind: "cover",
      tag: "초등학교 5학년 사회 · 삼국시대 10차시",
      title: "삼국시대 유산\n박물관 개관",
      subtitle: "여섯 문화유산으로 옛사람들의 정치·생활·믿음·기술을 설명합니다.",
      image: "gaya",
      source: sources.gaya,
    },
    {
      kind: "fact",
      eyebrow: "박물관의 큰 이야기",
      title: "문화유산은 나라 이름보다 더 많은 것을 말해 줍니다",
      points: [
        "무덤과 금관은 왕실의 권위와 장례 문화를 보여 줘요.",
        "향로와 벽화는 믿음·예술·음악·생활 모습을 보여 줘요.",
        "첨성대와 가야 고분군은 지식과 정치 조직을 생각하게 해요.",
      ],
      image: "crown",
      source: sources.culture,
    },
    {
      kind: "compare",
      eyebrow: "이야기 ① 권력과 교류",
      title: "왕의 무덤과 금관은 나라의 힘을 보여 줍니다",
      left: {
        label: "무령왕릉",
        title: "백제의 왕실과 교류",
        items: ["지석으로 확인한 왕과 왕비", "벽돌무덤과 여러 지역의 영향을 받은 유물"],
      },
      right: {
        label: "신라 금관",
        title: "신라 왕족의 권위",
        items: ["금·곱은옥·달개의 화려함", "큰 무덤과 함께 남은 장례 문화"],
      },
      image: "muryeong",
      source: sources.muryeong,
    },
    {
      kind: "compare",
      eyebrow: "이야기 ② 믿음과 예술",
      title: "향로와 벽화에는 사람들이 꿈꾼 세계가 있습니다",
      left: {
        label: "금동대향로",
        title: "백제의 이상세계",
        items: ["용·연꽃·산·봉황의 조화", "음악가와 여러 동물의 섬세한 표현"],
      },
      right: {
        label: "고구려 고분벽화",
        title: "생활과 죽음 뒤의 믿음",
        items: ["옷차림·사냥·행렬·집 안 장면", "무덤을 지키는 상상 동물"],
      },
      image: "incense",
      source: sources.incense,
    },
    {
      kind: "compare",
      eyebrow: "이야기 ③ 지식과 정치",
      title: "돌 건축과 무덤의 분포도 역사를 말해 줍니다",
      left: {
        label: "첨성대",
        title: "하늘을 살핀 신라",
        items: ["돌을 정교하게 쌓은 건축", "천문 관측과 국가 운영의 지식"],
      },
      right: {
        label: "가야 고분군",
        title: "여러 세력의 연맹",
        items: ["일곱 지역의 지배층 무덤", "공통 문화와 각 나라의 독자성"],
      },
      image: "cheomseongdae",
      source: sources.gaya,
    },
    {
      kind: "activity",
      eyebrow: "박물관 관람 방법",
      title: "사진을 보고, 해설을 듣고, 근거를 질문해요",
      instruction: "관람객은 여섯 부스에서 유산이 알려 주는 생활 모습을 찾습니다.",
      steps: ["카드 사진 관찰", "AR과 30초 도슨트 해설", "‘어떻게 알았나요?’ 질문", "스탬프와 기억한 사실 기록"],
      image: "mural",
    },
    {
      kind: "activity",
      eyebrow: "첫 생각과 지금 생각",
      title: "1차시의 나와 무엇이 달라졌나요?",
      instruction: "처음 쓴 카드를 다시 읽고 역사와 AI를 바라보는 변화를 적습니다.",
      steps: ["처음에는 무엇을 믿었나?", "어떤 자료로 생각이 바뀌었나?", "아직 모르는 것은 무엇인가?", "앞으로 AI를 어떻게 사용할까?"],
      image: "crown",
    },
    {
      kind: "closing",
      eyebrow: "10차시의 결론",
      title: "역사는 외우는 답이 아니라 증거로 설명하는 이야기입니다",
      prompt: "문화유산 하나를 골라 ‘이 유산으로 알 수 있는 옛 생활’을 자신의 말로 설명합니다.",
      next: "AI의 말도 역사 자료도 출처와 근거를 살피는 습관을 이어 갑니다.",
      image: "gaya",
    },
  ],
};

export function getThreeKingdomsSlides(lessonId: number) {
  return decks[lessonId] ?? decks[1];
}
