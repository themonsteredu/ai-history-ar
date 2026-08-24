import { useEffect, useState } from "react";
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

const lessonTwoChallenges = {
  "three-kingdoms": [
    { statement: "무령왕릉은 누구의 무덤인지 아직 모른다.", answer: "확인 필요", feedback: "무덤에서 나온 지석으로 무령왕과 왕비의 무덤임을 확인했습니다." },
    { statement: "첨성대에서는 망원경으로 별을 관찰했다.", answer: "확인 필요", feedback: "당시 망원경을 사용했다는 근거가 없습니다." },
    { statement: "무령왕릉에서는 무덤 주인을 알려 주는 지석이 발견되었다.", answer: "자료와 맞음", feedback: "지석은 무덤 주인을 확인하게 해 준 중요한 기록입니다." },
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
      <div className="choice-tool__counter">문장 {index + 1} / {challenges.length}</div>
      <blockquote>“{challenge.statement}”</blockquote>
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

function SourceRankingTool() {
  const [revealed, setRevealed] = useState(false);
  const sources = [
    { rank: "1", name: "국가기관 원문·소장품 기록", description: "유물과 기록을 직접 관리하는 기관의 자료" },
    { rank: "2", name: "역사 연구서·교육 자료", description: "원문과 유물을 바탕으로 해석한 자료" },
    { rank: "3", name: "출처가 없는 영상·게시물", description: "누가 어떤 근거로 만들었는지 먼저 확인할 자료" },
  ];
  return (
    <div className="web-tool web-tool--sources">
      <p>세 카드를 먼저 읽고 가장 믿을 만한 순서를 모둠에서 정한 뒤 답을 공개하세요.</p>
      <div className="source-rank-grid">
        {sources.map((source) => (
          <article key={source.name}>
            <span>{revealed ? `${source.rank}순위` : "?"}</span>
            <h3>{source.name}</h3><p>{source.description}</p>
          </article>
        ))}
      </div>
      <button className="button button--primary" onClick={() => setRevealed((value) => !value)} type="button">{revealed ? "순위 가리기" : "추천 순위 공개"}</button>
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
  if (lesson.id === 2) return <QuickChoiceTool challenges={lessonTwoChallenges[era.id]} choices={["확인 필요", "자료와 맞음"]} />;
  if (lesson.id === 3) return <SourceRankingTool />;
  if (lesson.id === 4) return <SourcePortal era={era} />;
  if (lesson.id === 5) return <ArPreviewTool era={era} />;
  if (lesson.id === 6) return <QuickChoiceTool challenges={lessonSixChallenges[era.id]} choices={["진짜", "가짜", "판단 보류"]} />;
  if (lesson.id === 7) return <CardCameraPreview era={era} />;
  if (lesson.id === 8) return <SpeakingTimer />;
  return <RandomPromptTool lessonId={lesson.id} />;
}

const toolNames = [
  "유물 사진 탐색기",
  "AI 문장 의심 버튼",
  "출처 신뢰도 비교",
  "공식 역사 자료 찾기",
  "AR 장면 미리보기",
  "진짜·가짜·보류 판정",
  "카드 카메라 점검",
  "30초 해설 타이머",
  "교실 실전 테스트",
  "관람객 질문 룰렛",
] as const;

export function LessonWebActivity({ era, lesson }: { era: Era; lesson: Lesson }) {
  return (
    <section aria-labelledby="web-activity-title" className="web-activity-shell">
      <header>
        <div aria-hidden="true" className="web-activity-shell__icon"><Icon name="spark" size={24} /></div>
        <div><p>교실에서 바로 실행하는 디지털 도구</p><h2 id="web-activity-title">{toolNames[lesson.id - 1]}</h2></div>
      </header>
      <LessonTool era={era} key={`${era.id}-${lesson.id}`} lesson={lesson} />
    </section>
  );
}
