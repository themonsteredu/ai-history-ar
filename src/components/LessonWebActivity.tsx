import { useEffect, useState } from "react";
import { lessonDownloadPath } from "../content/downloads";
import { classroomModeInfo } from "../content/lesson-helpers";
import type { Era, HeritageGroup, Lesson } from "../types/curriculum";
import { Icon } from "./Icon";

const threeKingdomsImages = [
  "muryeong-tomb.jpg",
  "baekje-incense-burner.jpg",
  "cheomseongdae.jpg",
  "silla-crown.jpg",
  "goguryeo-mural.jpg",
  "gaya-tombs.jpg",
] as const;

const threeKingdomsImageRoot = `${import.meta.env.BASE_URL}images/heritage/three-kingdoms`;

const joseonImagePositions = ["50% 50%", "61% 46%", "20% 50%", "88% 48%", "50% 22%", "74% 58%"] as const;

const sourceLinks = {
  "three-kingdoms": [
    { label: "국가유산포털", description: "문화유산의 공식 설명과 지정 정보를 확인합니다.", href: "https://www.heritage.go.kr/" },
    { label: "국립중앙박물관", description: "유물 사진과 소장품 설명을 찾아봅니다.", href: "https://www.museum.go.kr/" },
    { label: "우리역사넷", description: "초등학생이 읽을 수 있는 역사 해설을 비교합니다.", href: "https://contents.history.go.kr/" },
  ],
  joseon: [
    { label: "조선왕조실록", description: "번역된 원문 기록을 직접 검색합니다.", href: "https://sillok.history.go.kr/" },
    { label: "국가유산포털", description: "건축·기록·과학 문화유산의 공식 설명을 확인합니다.", href: "https://www.heritage.go.kr/" },
    { label: "국립고궁박물관", description: "조선 왕실 문화유산과 전시 자료를 살펴봅니다.", href: "https://www.gogung.go.kr/" },
  ],
} as const;

const verificationSourceExamples = {
  "three-kingdoms": [
    {
      id: "official",
      label: "자료 A · 국가기관",
      title: "국가유산포털 첨성대 설명",
      excerpt: "첨성대는 신라 선덕여왕 때 세운 것으로 전하는 천문 관련 문화유산이다.",
      heritageId: 3,
      findings: [
        "국가유산청이 문화유산 안내를 위해 제공한 자료입니다.",
        "오늘날 작성·갱신된 설명이며, 다루는 대상은 신라 시대입니다.",
        "우리역사넷과 다른 기관 설명에서도 천문 관련성과 남은 구조를 확인할 수 있습니다.",
        "지정 정보와 참고 자료로 이어지는 국가유산포털 상세 페이지를 확인합니다.",
        "천문과 관련된 유산이라는 범위까지만 확인하고 정확한 관측 방법은 보류합니다.",
      ],
      verdict: "근거 범위를 밝혀 사용",
      verdictDetail: "좋은 출발 자료입니다. 다만 모든 사용 방법이 확정된 것처럼 넓혀 말하지 않습니다.",
    },
    {
      id: "blog",
      label: "자료 B · 여행 블로그",
      title: "경주 여행 후기",
      excerpt: "신라 사람들은 매일 첨성대 안으로 들어가 망원경으로 별을 관찰했다.",
      heritageId: 3,
      findings: [
        "개인 여행자가 방문 경험을 소개한 글이며 역사 연구 자료가 아닙니다.",
        "최근 작성된 글이지만 신라 시대의 사용 장면을 직접 기록한 자료는 아닙니다.",
        "공식 자료와 비교하면 ‘망원경’과 ‘매일’이라는 설명을 뒷받침할 근거가 없습니다.",
        "인용한 기록이나 발굴 자료가 제시되지 않아 원본으로 이동할 수 없습니다.",
        "정확한 관측 장면은 확인할 수 없으므로 해당 주장을 보류합니다.",
      ],
      verdict: "그대로 사용하지 않음",
      verdictDetail: "사진 감상에는 활용할 수 있지만 역사 설명은 원본 근거를 찾기 전까지 인용하지 않습니다.",
    },
    {
      id: "ai",
      label: "자료 C · AI 요약",
      title: "출처 없는 AI 답변",
      excerpt: "첨성대의 돌 365개는 1년의 날짜를 뜻하며 꼭대기에서 매일 별을 관측했다.",
      heritageId: 3,
      findings: [
        "답변을 만든 모델만 보이고 어떤 역사 자료를 이용했는지는 제시되지 않았습니다.",
        "서로 다른 시기의 설명을 한 문장으로 합쳤을 가능성을 확인해야 합니다.",
        "기관 자료마다 돌의 수와 상징 해석, 관측 방법에 관한 설명 범위가 다릅니다.",
        "AI가 참고했다는 최초 기록·발굴 보고서·연구 자료를 바로 확인할 수 없습니다.",
        "돌의 상징과 정확한 관측 방법은 근거를 더 찾을 때까지 보류합니다.",
      ],
      verdict: "질문 출발점으로만 사용",
      verdictDetail: "확인할 질문을 만드는 데 활용하고, 역사 사실의 출처로는 기록하지 않습니다.",
    },
  ],
  joseon: [
    {
      id: "official",
      label: "자료 A · 국가기관",
      title: "훈민정음 해례본 소장·해설 자료",
      excerpt: "훈민정음 해례본에는 새 문자를 만든 원리와 사용 예가 설명되어 있다.",
      heritageId: 1,
      findings: ["소장 기관과 국가유산 관련 기관이 제공한 자료입니다.", "해례본이 만들어진 조선 시대와 오늘날 해설 작성 시기를 구분합니다.", "여러 기관의 번역·해설에서 책의 구성과 내용을 함께 확인합니다.", "해례본 원문 이미지와 번역 자료로 이동해 문맥을 확인합니다."],
      verdict: "출처와 함께 사용",
      verdictDetail: "원문 이미지와 해설의 범위를 구분해 확인된 사실로 기록합니다.",
    },
    {
      id: "blog",
      label: "자료 B · 개인 게시물",
      title: "출처 없는 한글 이야기",
      excerpt: "세종은 어느 날 혼자서 한글을 모두 만들고 곧바로 백성에게 사용하게 했다.",
      heritageId: 1,
      findings: ["작성자의 전문성과 자료 작성 목적을 확인하기 어렵습니다.", "최근 글이 조선 시대의 복잡한 창제·반포 과정을 단순한 장면으로 바꿨습니다.", "해례본·실록·기관 해설과 비교하면 ‘혼자서 모두’라는 표현을 더 확인해야 합니다.", "인용한 원문 기록이 없어 최초 자료로 이동할 수 없습니다."],
      verdict: "그대로 사용하지 않음",
      verdictDetail: "드라마처럼 만든 장면을 역사적 사실로 기록하지 않습니다.",
    },
    {
      id: "ai",
      label: "자료 C · AI 요약",
      title: "근거가 빠진 AI 답변",
      excerpt: "훈민정음은 집현전 학자들이 만들었고 세종은 이름만 붙였다.",
      heritageId: 1,
      findings: ["어떤 기록을 근거로 답했는지 출처가 표시되지 않았습니다.", "창제와 해례본 편찬의 시기·주체를 한 문장에 섞었는지 확인해야 합니다.", "실록과 해례본 해설, 기관 자료를 서로 비교합니다.", "AI 요약 대신 번역된 원문 기록까지 이동해 확인합니다."],
      verdict: "추가 확인 뒤 판단",
      verdictDetail: "창제와 해설서 편찬을 구분한 뒤 근거가 확인된 범위만 사용합니다.",
    },
  ],
} as const;

const lessonTwoChallenges = {
  "three-kingdoms": [
    {
      statement: "무령왕릉은 누구의 무덤인지 아직 모른다.", answer: "확인 필요", feedback: "무덤에서 나온 지석으로 무령왕과 왕비의 무덤임을 확인했습니다.",
      heritage: "무령왕릉", image: `${threeKingdomsImageRoot}/muryeong-tomb.jpg`, imageAlt: "공주 무령왕릉 내부 재현 공간",
      observation: "사진에 보이지 않는 기록 유물이 무덤의 주인을 알려 줄 수도 있습니다.", credit: "Bernard Gagnon · CC0",
      creditHref: "https://commons.wikimedia.org/wiki/File:King_Muryeong_Tomb_01.jpg",
    },
    {
      statement: "백제 금동대향로에 새겨진 모든 동물의 뜻은 하나로 확정되었다.", answer: "확인 필요", feedback: "사진에서 동물 형상은 확인할 수 있지만 모든 무늬의 의미를 하나로 단정할 수는 없습니다.",
      heritage: "백제 금동대향로", image: `${threeKingdomsImageRoot}/baekje-incense-burner.jpg`, imageAlt: "백제 금동대향로",
      observation: "향로에 표현된 산·동물·인물을 찾아보고, 사진만으로 뜻까지 확정할 수 있는지 생각합니다.", credit: "Gary Todd · CC0",
      creditHref: "https://commons.wikimedia.org/wiki/File:Baekje_Gilt_Bronze_Incense_Burner,_6th-7th_Cent._(30165906226).jpg",
    },
    {
      statement: "첨성대에서는 망원경으로 별을 관찰했다.", answer: "확인 필요", feedback: "당시 망원경을 사용했다는 근거가 없습니다.",
      heritage: "첨성대", image: `${threeKingdomsImageRoot}/cheomseongdae.jpg`, imageAlt: "경주 첨성대",
      observation: "남아 있는 돌 구조와 AI가 말한 ‘망원경’ 사이에 근거가 있는지 살펴봅니다.", credit: "Matt & Nayoung Wilson · CC BY 2.0",
      creditHref: "https://commons.wikimedia.org/wiki/File:Korea-Gyeongju-Cheomseongdae-02.jpg",
    },
    {
      statement: "신라 금관은 왕이 살아 있을 때 매일 쓴 관이다.", answer: "확인 필요", feedback: "금관의 출토 위치와 구조만으로 실제 착용 방법을 확정하기 어렵습니다.",
      heritage: "신라 금관", image: `${threeKingdomsImageRoot}/silla-crown.jpg`, imageAlt: "국립중앙박물관의 신라 금관",
      observation: "금관의 얇은 장식과 출토 상황만으로 일상적인 착용 모습을 확정할 수 있는지 생각합니다.", credit: "Ismoon · CC BY-SA 4.0",
      creditHref: "https://commons.wikimedia.org/wiki/File:Royal_Crown_of_Silla._National_Museum_of_Korea.jpg",
    },
    {
      statement: "무령왕릉에서는 무덤 주인을 알려 주는 지석이 발견되었다.", answer: "자료와 맞음", feedback: "지석은 무덤 주인을 확인하게 해 준 중요한 기록입니다.",
      heritage: "무령왕릉", image: `${threeKingdomsImageRoot}/muryeong-tomb.jpg`, imageAlt: "공주 무령왕릉 내부 재현 공간",
      observation: "무덤의 모습과 함께 출토 기록을 확인해야 주인을 판단할 수 있습니다.", credit: "Bernard Gagnon · CC0",
      creditHref: "https://commons.wikimedia.org/wiki/File:King_Muryeong_Tomb_01.jpg",
    },
    {
      statement: "고구려 고분벽화에는 사냥과 생활 모습이 그려져 있다.", answer: "자료와 맞음", feedback: "벽화에서 인물·사냥·행렬과 생활 장면을 확인할 수 있습니다.",
      heritage: "고구려 고분벽화", image: `${threeKingdomsImageRoot}/goguryeo-mural.jpg`, imageAlt: "고구려 무용총 수렵도 벽화",
      observation: "말을 탄 인물과 동물, 활을 쏘는 장면처럼 눈으로 확인할 수 있는 사실을 찾습니다.", credit: "작자 미상 · Public domain",
      creditHref: "https://commons.wikimedia.org/wiki/File:Goguryeo_tomb_mural.jpg",
    },
  ],
  joseon: [
    { statement: "훈민정음은 세종 혼자 아무 도움 없이 만들었다.", answer: "확인 필요", feedback: "창제와 해설서 편찬 과정을 나누어 자료로 확인해야 합니다." },
    { statement: "임금은 완성된 실록을 마음대로 고칠 수 있었다.", answer: "확인 필요", feedback: "실록 편찬과 보관 원칙을 기록으로 확인해야 합니다." },
    { statement: "조선왕조실록은 여러 사고에 나누어 보관되었다.", answer: "자료와 맞음", feedback: "한곳의 사고에 대비해 여러 지역에 나누어 보관했습니다." },
  ],
} as const;

const lessonSixChallenges = {
  "three-kingdoms": [
    { statement: "첨성대가 천문 관측과 관련된 시설이라는 설명은 확인할 수 있다.", answer: "진짜", feedback: "다만 정확한 관측 방법과 쓰임에는 여러 의견이 있습니다." },
    { statement: "신라 금관은 왕이 매일 쓰고 다닌 모자였다.", answer: "가짜", feedback: "출토 상황과 구조만으로 일상에서 썼다고 단정할 수 없습니다." },
    { statement: "첨성대에서 별을 관측한 정확한 방법은 하나로 확정되었다.", answer: "판단 보류", feedback: "여러 해석이 있어 모르는 부분을 보류해야 합니다." },
  ],
  joseon: [
    { statement: "훈민정음 해례본에는 새 문자의 원리가 설명되어 있다.", answer: "진짜", feedback: "글자를 만든 원리와 사용 예가 담겨 있습니다." },
    { statement: "거중기 한 대가 수원 화성을 모두 지었다.", answer: "가짜", feedback: "많은 사람과 여러 도구·기술을 함께 살펴야 합니다." },
    { statement: "장영실의 마지막 삶은 모든 기록으로 정확히 확인된다.", answer: "판단 보류", feedback: "기록이 충분하지 않은 부분은 드라마 장면으로 채우지 않습니다." },
  ],
} as const;

function shuffled<T>(items: readonly T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function heritageImage(era: Era, groupId: number) {
  if (era.id === "three-kingdoms") {
    return `${import.meta.env.BASE_URL}images/heritage/three-kingdoms/${threeKingdomsImages[groupId - 1]}`;
  }
  return `${import.meta.env.BASE_URL}images/joseon-cover.webp`;
}

function ArtifactExplorer({ era }: { era: Era }) {
  const [selectedId, setSelectedId] = useState(era.groups[0].id);
  const [assignments, setAssignments] = useState<HeritageGroup[]>([]);
  const selected = era.groups.find((group) => group.id === selectedId) ?? era.groups[0];

  return (
    <div className="web-tool web-tool--artifacts">
      <div className="web-tool__instruction">
        <strong>사진을 눌러 크게 관찰하세요.</strong>
        <span>기록하지 않고, 화면을 보며 모둠에서 말로 선택합니다.</span>
      </div>
      <div className="artifact-explorer__grid">
        {era.groups.map((group) => (
          <button
            aria-pressed={group.id === selected.id}
            className={group.id === selected.id ? "artifact-explorer__card is-selected" : "artifact-explorer__card"}
            key={group.id}
            onClick={() => setSelectedId(group.id)}
            type="button"
          >
            <img
              alt={`${group.heritage} 관찰 이미지`}
              src={heritageImage(era, group.id)}
              style={era.id === "joseon" ? { objectPosition: joseonImagePositions[group.id - 1] } : undefined}
            />
            <span>{group.category}</span>
            <strong>{group.heritage}</strong>
          </button>
        ))}
      </div>
      <div className="artifact-explorer__spotlight">
        <img
          alt={`${selected.heritage} 크게 보기`}
          src={heritageImage(era, selected.id)}
          style={era.id === "joseon" ? { objectPosition: joseonImagePositions[selected.id - 1] } : undefined}
        />
        <div><span>{selected.category}</span><h3>{selected.heritage}</h3><p>“{selected.inquiryQuestion}”</p></div>
      </div>
      <div className="artifact-explorer__assign">
        <div><strong>모둠 빠른 배정</strong><span>여섯 유산을 1~6모둠에 겹치지 않게 즉시 배정합니다.</span></div>
        <button className="button button--primary" onClick={() => setAssignments(shuffled(era.groups))} type="button">모둠 자동 배정</button>
      </div>
      {assignments.length > 0 ? (
        <ol className="artifact-explorer__results">
          {assignments.map((group, index) => <li key={group.id}><span>{index + 1}모둠</span><strong>{group.heritage}</strong></li>)}
        </ol>
      ) : null}
    </div>
  );
}

interface Challenge {
  statement: string;
  answer: string;
  feedback: string;
  heritage?: string;
  image?: string;
  imageAlt?: string;
  observation?: string;
  credit?: string;
  creditHref?: string;
}

function ChallengeImageViewer({ challenge }: { challenge: Challenge }) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (!challenge.image || !challenge.heritage) return null;

  function openViewer() {
    setZoom(1);
    setOpen(true);
  }

  return (
    <div className="choice-tool__image">
      <button
        aria-haspopup="dialog"
        aria-label={`${challenge.heritage} 사진 크게 보기`}
        className="question-workshop__image-preview"
        onClick={openViewer}
        type="button"
      >
        <img alt={challenge.imageAlt ?? challenge.heritage} src={challenge.image} />
        <span><Icon name="eye" size={17} />사진 크게 보기</span>
      </button>
      <div className="choice-tool__image-caption">
        <p><strong>사진 관찰</strong>{challenge.observation}</p>
        {challenge.creditHref && challenge.credit ? <a href={challenge.creditHref} rel="noreferrer" target="_blank">사진: {challenge.credit} ↗</a> : null}
      </div>

      {open ? (
        <div
          aria-label={`${challenge.heritage} 사진 확대 보기`}
          aria-modal="true"
          className="heritage-image-viewer"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
          role="dialog"
        >
          <div className="heritage-image-viewer__panel">
            <header>
              <div><span>사진 자세히 관찰하기</span><strong>{challenge.heritage}</strong></div>
              <div className="heritage-image-viewer__controls" role="group" aria-label="사진 확대 조절">
                <button aria-label="사진 축소" disabled={zoom <= 1} onClick={() => setZoom((current) => Math.max(1, current - 0.25))} type="button">−</button>
                <output aria-live="polite">{Math.round(zoom * 100)}%</output>
                <button aria-label="사진 확대" disabled={zoom >= 3} onClick={() => setZoom((current) => Math.min(3, current + 0.25))} type="button">＋</button>
                <button onClick={() => setZoom(1)} type="button">원래 크기</button>
                <button className="heritage-image-viewer__close" onClick={() => setOpen(false)} type="button">닫기 ×</button>
              </div>
            </header>
            <div className="heritage-image-viewer__canvas">
              <div className="heritage-image-viewer__stage" style={{ height: `${zoom * 100}%`, width: `${zoom * 100}%` }}>
                <img alt={`${challenge.heritage} 확대 사진`} draggable="false" src={challenge.image} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface SavedStudentResponse {
  statement: string;
  choice: string;
}

function readSavedResponses(storageKey: string, challenges: readonly Challenge[]) {
  if (typeof window === "undefined") return [];

  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}") as { version?: number; responses?: SavedStudentResponse[] };
    if (saved.version !== 1) return [];
    return challenges.map((challenge) => saved.responses?.find((response) => response.statement === challenge.statement)?.choice ?? "");
  } catch {
    return [];
  }
}

function StudentResponseTool({ challenges, choices, storageKey }: { challenges: readonly Challenge[]; choices: readonly string[]; storageKey: string }) {
  const [initialResponses] = useState(() => readSavedResponses(storageKey, challenges));
  const [responses, setResponses] = useState<string[]>(initialResponses);
  const [index, setIndex] = useState(0);
  const [complete, setComplete] = useState(() => initialResponses.length === challenges.length && initialResponses.every(Boolean));
  const challenge = challenges[index];
  const choice = responses[index] ?? "";
  const savedCount = responses.filter(Boolean).length;

  function saveResponses(nextResponses: string[]) {
    setResponses(nextResponses);
    window.localStorage.setItem(storageKey, JSON.stringify({
      version: 1,
      savedAt: new Date().toISOString(),
      responses: challenges.flatMap<SavedStudentResponse>((item, responseIndex) => (
        nextResponses[responseIndex] ? [{ statement: item.statement, choice: nextResponses[responseIndex] }] : []
      )),
    }));
  }

  function choose(item: string) {
    const nextResponses = [...responses];
    nextResponses[index] = item;
    saveResponses(nextResponses);
  }

  function moveNext() {
    if (!choice) return;
    if (index === challenges.length - 1) {
      setComplete(true);
      return;
    }
    setIndex((current) => current + 1);
  }

  function resetResponses() {
    window.localStorage.removeItem(storageKey);
    setResponses([]);
    setIndex(0);
    setComplete(false);
  }

  if (complete) {
    return (
      <div className="web-tool student-response-summary">
        <header>
          <span aria-hidden="true"><Icon name="check" size={24} /></span>
          <div><p>개인 판단 저장 완료</p><h3>{challenges.length}개 문장의 선택을 모두 저장했습니다</h3></div>
        </header>
        <aside><strong>학생 화면에는 정답이 나오지 않습니다.</strong><p>선생님이 수업 화면에서 답을 공개하면 아래의 내 선택과 한 문장씩 비교하세요.</p></aside>
        <ol>
          {challenges.map((item, responseIndex) => (
            <li key={item.statement}>
              <span>{responseIndex + 1}</span>
              <p>{item.statement}</p>
              <strong>내 선택 · {responses[responseIndex]}</strong>
            </li>
          ))}
        </ol>
        <div className="student-response-summary__actions">
          <button className="button button--primary" onClick={() => { setIndex(0); setComplete(false); }} type="button">내 선택 수정하기</button>
          <button className="button button--outline" onClick={resetResponses} type="button">응답 지우고 다시 하기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="web-tool web-tool--choice web-tool--student-response">
      <div className="student-response-progress"><strong>개인 판단</strong><span>{savedCount} / {challenges.length} 저장됨</span></div>
      <div className={challenge.image ? "choice-tool__stage has-image" : "choice-tool__stage"}>
        <ChallengeImageViewer challenge={challenge} key={challenge.statement} />
        <div className="choice-tool__question">
          <div className="choice-tool__counter">문장 {index + 1} / {challenges.length}</div>
          {challenge.heritage ? <span className="choice-tool__heritage">{challenge.heritage}</span> : null}
          <blockquote>“{challenge.statement}”</blockquote>
        </div>
      </div>
      <div className="choice-tool__buttons" role="group" aria-label={`${index + 1}번 문장 판단`}>
        {choices.map((item) => <button aria-pressed={choice === item} className={choice === item ? "is-selected" : ""} key={item} onClick={() => choose(item)} type="button">{item}</button>)}
      </div>
      <div className="student-response-save">
        <p><Icon name="lock" size={16} />정답·점수 없이 내 선택만 이 기기에 저장됩니다.</p>
        <button className="button button--primary" disabled={!choice} onClick={moveNext} type="button">{index === challenges.length - 1 ? "선택 저장 완료" : "선택 저장하고 다음 문장 →"}</button>
      </div>
    </div>
  );
}

function QuickChoiceTool({ challenges, choices }: { challenges: readonly Challenge[]; choices: readonly string[] }) {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState("");
  const challenge = challenges[index];

  function moveNext() {
    setIndex((current) => (current + 1) % challenges.length);
    setChoice("");
  }

  return (
    <div className="web-tool web-tool--choice">
      <div className={challenge.image ? "choice-tool__stage has-image" : "choice-tool__stage"}>
        <ChallengeImageViewer challenge={challenge} key={challenge.statement} />
        <div className="choice-tool__question">
          <div className="choice-tool__counter">문장 {index + 1} / {challenges.length}</div>
          {challenge.heritage ? <span className="choice-tool__heritage">{challenge.heritage}</span> : null}
          <blockquote>“{challenge.statement}”</blockquote>
        </div>
      </div>
      <div className="choice-tool__buttons">
        {choices.map((item) => <button key={item} onClick={() => setChoice(item)} type="button">{item}</button>)}
      </div>
      {choice ? (
        <div className={choice === challenge.answer ? "choice-tool__feedback is-correct" : "choice-tool__feedback"} role="status">
          <strong>{choice === challenge.answer ? "맞았습니다" : `정답: ${challenge.answer}`}</strong>
          <p>{challenge.feedback}</p>
          <button onClick={moveNext} type="button">다음 문장 →</button>
        </div>
      ) : null}
    </div>
  );
}

function SourceVerificationTool({ era }: { era: Era }) {
  const sources = verificationSourceExamples[era.id];
  const [sourceIndex, setSourceIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [revealedSteps, setRevealedSteps] = useState<number[]>([]);
  const [showVerdict, setShowVerdict] = useState(false);
  const source = sources[sourceIndex];
  const steps = era.verificationSteps;

  function selectSource(nextIndex: number) {
    setSourceIndex(nextIndex);
    setStepIndex(0);
    setRevealedSteps([]);
    setShowVerdict(false);
  }

  function revealStep(nextIndex: number) {
    setStepIndex(nextIndex);
    setRevealedSteps((current) => current.includes(nextIndex) ? current : [...current, nextIndex]);
    setShowVerdict(false);
  }

  return (
    <div className="web-tool verification-lab">
      <div className="verification-lab__source-tabs" role="tablist" aria-label="비교할 자료 선택">
        {sources.map((item, index) => (
          <button aria-selected={sourceIndex === index} className={sourceIndex === index ? "is-selected" : ""} key={item.id} onClick={() => selectSource(index)} role="tab" type="button">
            <span>{item.label}</span><strong>{item.title}</strong>
          </button>
        ))}
      </div>

      <div className="verification-lab__workspace">
        <figure>
          <img alt={`${era.groups[source.heritageId - 1].heritage} 검증 자료 이미지`} src={heritageImage(era, source.heritageId)} />
          <figcaption>{era.groups[source.heritageId - 1].heritage}</figcaption>
        </figure>
        <div className="verification-lab__document">
          <span>{source.label}</span>
          <h3>{source.title}</h3>
          <blockquote>“{source.excerpt}”</blockquote>
        </div>
      </div>

      <div className="verification-lab__steps" role="tablist" aria-label={era.verificationLabel}>
        {steps.map((step, index) => (
          <button aria-selected={stepIndex === index} className={stepIndex === index ? "is-active" : ""} key={step} onClick={() => revealStep(index)} role="tab" type="button">
            <span>{revealedSteps.includes(index) ? <Icon name="check" size={14} /> : index + 1}</span><strong>{step}</strong>
          </button>
        ))}
      </div>

      <section className="verification-lab__finding" aria-live="polite">
        <div><span>{stepIndex + 1}단계</span><h3>{steps[stepIndex]} 확인</h3></div>
        {revealedSteps.includes(stepIndex)
          ? <p>{source.findings[stepIndex]}</p>
          : <button onClick={() => revealStep(stepIndex)} type="button">학급의 생각을 들은 뒤 확인하기</button>}
      </section>

      <div className="verification-lab__decision">
        <button className="button button--primary" disabled={revealedSteps.length < steps.length} onClick={() => setShowVerdict(true)} type="button">최종 판단 확인</button>
        <span>{revealedSteps.length} / {steps.length}단계 확인</span>
      </div>
      {showVerdict ? <div className="verification-lab__verdict" role="status"><span>최종 판단</span><strong>{source.verdict}</strong><p>{source.verdictDetail}</p></div> : null}
    </div>
  );
}

function SourcePortal({ era }: { era: Era }) {
  return (
    <div className="web-tool web-tool--portal">
      <p>검색 광고나 요약문을 거치지 않고 공식 자료로 바로 이동합니다.</p>
      <div className="source-portal-grid">
        {sourceLinks[era.id].map((source) => (
          <a href={source.href} key={source.label} rel="noreferrer" target="_blank">
            <span>공식 자료</span><h3>{source.label}</h3><p>{source.description}</p><strong>새 창에서 열기 ↗</strong>
          </a>
        ))}
      </div>
    </div>
  );
}

function ArPreviewTool({ era }: { era: Era }) {
  const [mode, setMode] = useState("핵심 위치");
  const selected = era.groups[0];
  return (
    <div className="web-tool web-tool--ar">
      <div className="ar-preview">
        <img alt={`${selected.heritage} AR 미리보기`} src={heritageImage(era, selected.id)} />
        <div className={`ar-preview__overlay ar-preview__overlay--${mode.replace(" ", "-")}`}>
          <span>AR 미리보기</span><strong>{mode}</strong><p>{selected.heritage}</p>
        </div>
      </div>
      <div className="ar-preview__modes" role="group" aria-label="AR 표현 선택">
        {["핵심 위치", "사진 확대", "30초 해설"].map((item) => <button aria-pressed={mode === item} key={item} onClick={() => setMode(item)} type="button">{item}</button>)}
      </div>
      <p className="web-tool__note">표현 방법을 눌러 보며 교실 화면에서 가장 잘 보이는 방식을 비교합니다.</p>
    </div>
  );
}

function CardCameraPreview({ era }: { era: Era }) {
  const [image, setImage] = useState("");
  const [zoom, setZoom] = useState(100);

  function loadImage(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => setImage(typeof reader.result === "string" ? reader.result : ""), { once: true });
    reader.readAsDataURL(file);
  }

  return (
    <div className="web-tool web-tool--camera">
      <label className="camera-upload">
        <span>카드 사진 불러오기</span>
        <input accept="image/*" capture="environment" onChange={(event) => loadImage(event.target.files?.[0])} type="file" />
      </label>
      <div className="camera-stage">
        <img alt="카메라 인식 영역 미리보기" src={image || heritageImage(era, 1)} style={{ transform: `scale(${zoom / 100})` }} />
        <div className="camera-stage__frame"><span>카드를 사각형 안에 맞추세요</span></div>
      </div>
      <label className="camera-zoom">거리 바꾸기 <input max="140" min="70" onChange={(event) => setZoom(Number(event.target.value))} type="range" value={zoom} /></label>
      <p className="web-tool__note">사진은 서버로 전송되지 않고 현재 기기 화면에서만 확인합니다.</p>
    </div>
  );
}

function SpeakingTimer() {
  const [seconds, setSeconds] = useState(30);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || seconds === 0) return undefined;
    const timer = window.setTimeout(() => {
      const nextSeconds = seconds - 1;
      setSeconds(nextSeconds);
      if (nextSeconds === 0) setRunning(false);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [running, seconds]);

  function reset() {
    setRunning(false);
    setSeconds(30);
  }

  return (
    <div className="web-tool web-tool--timer">
      <div className={seconds === 0 ? "speaking-timer is-finished" : "speaking-timer"}><strong>{seconds}</strong><span>초</span></div>
      <p>{seconds === 0 ? "30초가 끝났습니다. 친구에게 기억난 사실을 물어보세요." : "자료를 읽지 말고 관람객에게 설명하듯 말해 보세요."}</p>
      <div><button className="button button--primary" disabled={running || seconds === 0} onClick={() => setRunning(true)} type="button">시작</button><button className="button button--outline" onClick={reset} type="button">다시 30초</button></div>
    </div>
  );
}

function RandomPromptTool({ lessonId }: { lessonId: number }) {
  const prompts = lessonId === 9
    ? ["창가의 밝은 자리", "교실 뒤 어두운 자리", "카드에서 30cm", "카드에서 1m", "카드를 살짝 기울인 상태", "소리가 있는 복도 앞"]
    : ["이 유산이 만들어진 까닭은 무엇인가요?", "그 사실을 어떻게 확인했나요?", "AI 설명에서 고친 부분이 있나요?", "아직 정확히 모르는 점은 무엇인가요?", "옛사람의 생활을 무엇으로 알 수 있나요?", "가장 기억해야 할 특징은 무엇인가요?"];
  const [prompt, setPrompt] = useState(prompts[0]);
  return (
    <div className="web-tool web-tool--prompt">
      <span>{lessonId === 9 ? "실전 테스트 장소" : "관람객 질문"}</span>
      <blockquote>“{prompt}”</blockquote>
      <button className="button button--primary" onClick={() => setPrompt(shuffled(prompts)[0])} type="button">다시 뽑기</button>
    </div>
  );
}

function LessonTool({ era, lesson }: { era: Era; lesson: Lesson }) {
  if (lesson.id === 1) return <ArtifactExplorer era={era} />;
  if (lesson.id === 2) return <StudentResponseTool challenges={lessonTwoChallenges[era.id]} choices={["확인 필요", "자료와 맞음"]} storageKey={`ai-history-${era.id}-lesson-02-responses`} />;
  if (lesson.id === 3) return <SourceVerificationTool era={era} />;
  if (lesson.id === 4) return <SourcePortal era={era} />;
  if (lesson.id === 5) return <ArPreviewTool era={era} />;
  if (lesson.id === 6) return <QuickChoiceTool challenges={lessonSixChallenges[era.id]} choices={["진짜", "가짜", "판단 보류"]} />;
  if (lesson.id === 7) return <CardCameraPreview era={era} />;
  if (lesson.id === 8) return <SpeakingTimer />;
  return <RandomPromptTool lessonId={lesson.id} />;
}

function WorksheetLessonView({ era, lesson }: { era: Era; lesson: Lesson }) {
  return (
    <section className="worksheet-classroom" aria-labelledby="worksheet-classroom-title">
      <header>
        <span>학생 개인기기 사용 없음</span>
        <h2 id="worksheet-classroom-title">활동지에 조사 과정과 근거를 남깁니다</h2>
        <p>{lesson.objective}</p>
      </header>
      <div className="worksheet-classroom__grid">
        <div>
          <strong>활동 순서</strong>
          <ol>
            {lesson.activities.flatMap((activity) => activity.details).map((detail) => <li key={detail}>{detail}</li>)}
          </ol>
        </div>
        <div>
          <strong>오늘 남길 결과</strong>
          <ul>{lesson.outputs.map((output) => <li key={output}>{output}</li>)}</ul>
        </div>
      </div>
      <div className="worksheet-classroom__actions">
        <a className="button button--primary" download href={lessonDownloadPath(era.id, lesson.id, "student")}><Icon name="download" size={18} />학생 활동지 PDF</a>
        <p>교사는 수업 PPT와 인쇄 자료를 안내하고, 학생은 웹에 다시 입력하지 않습니다.</p>
      </div>
    </section>
  );
}

const toolNames = [
  "유물 사진 탐색기",
  "AI 문장 개인 판단",
  "검증 단계 공동 연습",
  "공식 역사 자료 찾기",
  "AR 장면 미리보기",
  "진짜·가짜·보류 판정",
  "카드 카메라 점검",
  "30초 해설 타이머",
  "교실 실전 테스트",
  "관람객 질문 룰렛",
] as const;

export function LessonWebActivity({ era, lesson }: { era: Era; lesson: Lesson }) {
  if (lesson.classroomMode === "worksheet") return <WorksheetLessonView era={era} lesson={lesson} />;

  const toolName = lesson.id === 3 ? `${era.verificationLabel} 공동 연습` : toolNames[lesson.id - 1];
  const activityMode = classroomModeInfo[lesson.classroomMode];

  return (
    <section aria-labelledby="web-activity-title" className="web-activity-shell">
      <header>
        <div aria-hidden="true" className="web-activity-shell__icon"><Icon name="spark" size={24} /></div>
        <div><p>{activityMode.label} · {activityMode.description}</p><h2 id="web-activity-title">{toolName}</h2></div>
      </header>
      <LessonTool era={era} key={`${era.id}-${lesson.id}`} lesson={lesson} />
    </section>
  );
}
