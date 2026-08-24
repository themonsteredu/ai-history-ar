import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { threeKingdomsGroups } from "../content/three-kingdoms/groups";

const imageRoot = `${import.meta.env.BASE_URL}images/heritage/three-kingdoms`;
const heritageImages = [
  "muryeong-tomb.jpg",
  "baekje-incense-burner.jpg",
  "cheomseongdae.jpg",
  "silla-crown.jpg",
  "goguryeo-mural.jpg",
  "gaya-tombs.jpg",
] as const;

const observationGuides = [
  ["아치 모양의 벽돌 입구", "벽돌에 반복되는 무늬", "무덤 주인을 알려 준 지석"],
  ["받침 부분의 용", "산봉우리와 여러 동물", "꼭대기의 봉황"],
  ["돌을 층층이 쌓은 몸통", "가운데 난 네모난 창", "위로 갈수록 달라지는 모양"],
  ["나뭇가지 모양 세움 장식", "굽은옥과 둥근 달개", "얇은 금판의 구조"],
  ["말을 달리는 사람", "활과 사냥 장면", "힘차게 이어지는 선"],
  ["능선을 따라 이어진 봉분", "무덤마다 다른 크기", "철기와 여러 껴묻거리"],
] as const;

interface SelectionState {
  allowDuplicates: boolean;
  assignments: Record<string, number>;
}

const selectionStorageKey = "moa-history-ar:three-kingdoms:lesson-1:v1";
const emptySelectionState: SelectionState = { allowDuplicates: true, assignments: {} };

function readSelectionState(): SelectionState {
  try {
    const stored = window.localStorage.getItem(selectionStorageKey);
    if (!stored) return emptySelectionState;
    const parsed = JSON.parse(stored) as Partial<SelectionState>;
    return {
      allowDuplicates: parsed.allowDuplicates ?? true,
      assignments: parsed.assignments ?? {},
    };
  } catch {
    return emptySelectionState;
  }
}

function heritageImage(groupId: number) {
  return `${imageRoot}/${heritageImages[groupId - 1]}`;
}

function ArtifactSelectionLab() {
  const [savedState, setSavedState] = useState<SelectionState>(readSelectionState);
  const [activeGroup, setActiveGroup] = useState(1);
  const [selectedId, setSelectedId] = useState(savedState.assignments["1"] ?? 1);
  const [zoom, setZoom] = useState(100);
  const [message, setMessage] = useState("");
  const selected = threeKingdomsGroups[selectedId - 1];
  const chosenByOtherGroup = Object.entries(savedState.assignments).some(
    ([groupNumber, heritageId]) => Number(groupNumber) !== activeGroup && heritageId === selectedId,
  );

  useEffect(() => {
    window.localStorage.setItem(selectionStorageKey, JSON.stringify(savedState));
  }, [savedState]);

  function chooseGroup(groupNumber: number) {
    setActiveGroup(groupNumber);
    setSelectedId(savedState.assignments[String(groupNumber)] ?? 1);
    setZoom(100);
    setMessage("");
  }

  function inspectHeritage(groupId: number) {
    setSelectedId(groupId);
    setZoom(100);
    setMessage("");
  }

  function confirmSelection() {
    if (!savedState.allowDuplicates && chosenByOtherGroup) {
      setMessage("다른 모둠이 이미 선택한 유산입니다. 다른 유산을 살펴보세요.");
      return;
    }
    setSavedState((current) => ({
      ...current,
      assignments: { ...current.assignments, [String(activeGroup)]: selectedId },
    }));
    setMessage(`${activeGroup}모둠이 ${selected.heritage}을(를) 선택했습니다.`);
  }

  return (
    <div className="web-tool core-activity core-activity--selection">
      <section className="core-mission" aria-label="활동 방법">
        <span>웹앱이 하는 일</span>
        <strong>사진을 확대해 관찰하고, 모둠의 선택을 한 화면에 모읍니다.</strong>
        <p>선택한 까닭과 첫 생각은 활동지에 씁니다.</p>
      </section>

      <fieldset className="group-picker">
        <legend>먼저 우리 모둠을 선택하세요</legend>
        <div>
          {[1, 2, 3, 4, 5, 6].map((groupNumber) => (
            <button
              aria-pressed={activeGroup === groupNumber}
              key={groupNumber}
              onClick={() => chooseGroup(groupNumber)}
              type="button"
            >
              {groupNumber}모둠
            </button>
          ))}
        </div>
      </fieldset>

      <div className="duplicate-setting">
        <div><strong>유물 선택 방법</strong><span>수업 상황에 맞게 중복 선택 여부를 정합니다.</span></div>
        <div role="group" aria-label="유물 중복 선택 설정">
          <button aria-pressed={savedState.allowDuplicates} onClick={() => setSavedState((current) => ({ ...current, allowDuplicates: true }))} type="button">같은 유물도 가능</button>
          <button aria-pressed={!savedState.allowDuplicates} onClick={() => setSavedState((current) => ({ ...current, allowDuplicates: false }))} type="button">한 유물당 한 모둠</button>
        </div>
      </div>

      <div className="heritage-choice-grid" aria-label="문화유산 선택">
        {threeKingdomsGroups.map((group) => {
          const assignedGroups = Object.entries(savedState.assignments)
            .filter(([, heritageId]) => heritageId === group.id)
            .map(([groupNumber]) => `${groupNumber}모둠`);
          return (
            <button
              aria-pressed={selectedId === group.id}
              className={selectedId === group.id ? "heritage-choice-card is-selected" : "heritage-choice-card"}
              data-testid={`heritage-choice-${group.id}`}
              key={group.id}
              onClick={() => inspectHeritage(group.id)}
              type="button"
            >
              <img alt={`${group.heritage} 관찰 사진`} src={heritageImage(group.id)} />
              <span>{group.category}</span>
              <strong>{group.heritage}</strong>
              <small>{assignedGroups.length > 0 ? `${assignedGroups.join(" · ")} 선택` : "아직 선택 없음"}</small>
            </button>
          );
        })}
      </div>

      <section className="heritage-observation" aria-labelledby="selected-heritage-title">
        <div className="heritage-observation__image">
          <img alt={`${selected.heritage} 확대 관찰`} src={heritageImage(selected.id)} style={{ transform: `scale(${zoom / 100})` }} />
          <div aria-label="사진 확대" className="heritage-observation__zoom" role="group">
            {[100, 130, 160].map((value) => <button aria-pressed={zoom === value} key={value} onClick={() => setZoom(value)} type="button">{value}%</button>)}
          </div>
        </div>
        <div className="heritage-observation__copy">
          <span>{activeGroup}모둠이 관찰 중 · {selected.category}</span>
          <h3 id="selected-heritage-title">{selected.heritage}</h3>
          <blockquote>“{selected.inquiryQuestion}”</blockquote>
          <div className="observation-clues">
            <strong>사진에서 먼저 찾아볼 세 가지</strong>
            <ol>{observationGuides[selected.id - 1].map((clue) => <li key={clue}>{clue}</li>)}</ol>
          </div>
          <button className="button button--primary" disabled={!savedState.allowDuplicates && chosenByOtherGroup} onClick={confirmSelection} type="button">
            {activeGroup}모둠 선택 확정
          </button>
          {message ? <p className="selection-message" role="status">{message}</p> : null}
        </div>
      </section>

      <section className="selection-board" aria-labelledby="selection-board-title">
        <header><div><span>교실 공유 화면</span><h3 id="selection-board-title">모둠 선택 현황</h3></div><button onClick={() => setSavedState((current) => ({ ...current, assignments: {} }))} type="button">전체 선택 지우기</button></header>
        <ol>
          {[1, 2, 3, 4, 5, 6].map((groupNumber) => {
            const heritageId = savedState.assignments[String(groupNumber)];
            const heritage = heritageId ? threeKingdomsGroups[heritageId - 1].heritage : "선택 전";
            return <li className={heritageId ? "is-complete" : ""} key={groupNumber}><span>{groupNumber}모둠</span><strong>{heritage}</strong></li>;
          })}
        </ol>
      </section>
    </div>
  );
}

interface AiSentence {
  text: string;
  issue?: string;
}

interface AiInvestigationCase {
  heritage: string;
  question: string;
  sentences: readonly AiSentence[];
}

const aiInvestigationCases: readonly AiInvestigationCase[] = [
  {
    heritage: "무령왕릉",
    question: "무령왕릉은 어떻게 발견되었고 누구의 무덤인가요?",
    sentences: [
      { text: "무령왕릉은 1971년 공주에서 배수로 공사를 하다가 발견되었습니다." },
      { text: "이미 도굴된 무덤이어서 주인이 누구인지는 지금도 알 수 없습니다.", issue: "도굴되지 않은 상태로 발견됐고, 지석의 기록으로 무령왕과 왕비의 무덤임을 확인했습니다." },
      { text: "무덤 안에서는 왕과 왕비의 기록이 적힌 지석이 나왔습니다." },
    ],
  },
  {
    heritage: "백제 금동대향로",
    question: "백제 금동대향로는 어디에서 발견되었나요?",
    sentences: [
      { text: "백제 금동대향로는 1993년에 발견되었습니다." },
      { text: "무령왕릉 안에서 왕의 장례품으로 발견되었습니다.", issue: "금동대향로는 무령왕릉이 아니라 부여 능산리 절터에서 발견됐습니다." },
      { text: "향로에는 용, 연꽃, 산봉우리, 동물과 봉황이 표현되어 있습니다." },
    ],
  },
  {
    heritage: "첨성대",
    question: "첨성대에서는 어떻게 별을 관찰했나요?",
    sentences: [
      { text: "첨성대는 신라의 천문 관측과 관련된 건축물로 봅니다." },
      { text: "신라 사람들은 꼭대기에 현대식 망원경을 놓고 별을 보았습니다.", issue: "현대식 망원경은 당시의 도구가 아니므로 시대가 맞지 않습니다." },
      { text: "사람이 어디에서 어떤 방법으로 관측했는지는 기록으로 완전히 밝혀졌습니다.", issue: "구체적인 사용 방법은 여러 의견이 있어 하나로 확정할 수 없습니다." },
    ],
  },
  {
    heritage: "신라 금관",
    question: "신라 금관은 언제 어떻게 사용했나요?",
    sentences: [
      { text: "신라 금관에는 나뭇가지와 사슴뿔을 닮은 장식이 있습니다." },
      { text: "신라 왕은 무거운 금관을 매일 쓰고 생활했습니다.", issue: "실제 착용 시기와 방식은 확정하기 어려우며 ‘매일’이라고 단정할 근거가 없습니다." },
      { text: "금관은 왕족의 권위와 장례 문화를 생각하게 하는 유물입니다." },
    ],
  },
  {
    heritage: "고구려 고분벽화",
    question: "고구려 고분벽화로 무엇을 알 수 있나요?",
    sentences: [
      { text: "벽화에는 사냥, 행렬, 춤, 집 안 생활 같은 여러 장면이 있습니다." },
      { text: "사냥 그림이 있으므로 고구려 사람은 모두 매일 말을 타고 사냥했습니다.", issue: "벽화 한 장의 장면을 모든 사람의 매일 생활로 넓혀 말할 수 없습니다." },
      { text: "벽화는 당시 사람들의 옷차림과 믿음을 살펴보는 자료입니다." },
    ],
  },
  {
    heritage: "가야 고분군",
    question: "가야 고분군은 가야 사회에 대해 무엇을 알려 주나요?",
    sentences: [
      { text: "가야 고분군은 여러 지역의 지배층 무덤이 모인 유산입니다." },
      { text: "가야는 한 명의 왕이 하나의 수도에서 모든 지역을 다스린 거대한 통일 왕국이었습니다.", issue: "가야는 여러 세력이 공통 문화를 나누면서도 각자의 힘을 유지한 연맹으로 이해합니다." },
      { text: "여러 지역의 무덤과 껴묻거리를 비교하면 가야 세력의 특징을 살필 수 있습니다." },
    ],
  },
] as const;

const suspicionReasons = ["출처가 보이지 않음", "시대가 맞지 않음", "너무 확실하게 단정함", "알고 있는 자료와 다름"] as const;

function AiSentenceDetective() {
  const [caseIndex, setCaseIndex] = useState(0);
  const [markedSentences, setMarkedSentences] = useState<Set<number>>(() => new Set());
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const activeCase = aiInvestigationCases[caseIndex];

  function changeCase(nextIndex: number) {
    setCaseIndex(nextIndex);
    setMarkedSentences(new Set());
    setReason("");
    setSubmitted(false);
    setRevealed(false);
  }

  function toggleSentence(sentenceIndex: number) {
    if (submitted) return;
    setMarkedSentences((current) => {
      const next = new Set(current);
      if (next.has(sentenceIndex)) next.delete(sentenceIndex);
      else next.add(sentenceIndex);
      return next;
    });
  }

  const issueIndexes = activeCase.sentences.flatMap((sentence, index) => sentence.issue ? [index] : []);
  const correctSelections = issueIndexes.filter((index) => markedSentences.has(index)).length;
  const extraSelections = [...markedSentences].filter((index) => !issueIndexes.includes(index)).length;

  return (
    <div className="web-tool core-activity core-activity--detective">
      <section className="core-mission" aria-label="활동 방법">
        <span>웹앱이 하는 일</span>
        <strong>같은 AI 답변을 읽고, 이상한 문장을 모든 모둠이 직접 표시합니다.</strong>
        <p>답은 판단을 제출한 뒤 교사가 공개할 때만 나타납니다.</p>
      </section>

      <div className="case-tabs" role="group" aria-label="문화유산 질문 선택">
        {aiInvestigationCases.map((item, index) => (
          <button aria-pressed={caseIndex === index} key={item.heritage} onClick={() => changeCase(index)} type="button">{item.heritage}</button>
        ))}
      </div>

      <section className="ai-answer-sheet" aria-labelledby="ai-question-title">
        <header><span>질문 카드</span><h3 id="ai-question-title">{activeCase.question}</h3></header>
        <div className="ai-answer-sheet__body">
          <p className="ai-answer-label">AI가 만든 설명</p>
          <div className="ai-sentence-list">
            {activeCase.sentences.map((sentence, index) => {
              const isMarked = markedSentences.has(index);
              const answerClass = revealed ? (sentence.issue ? "is-issue" : "is-supported") : "";
              return (
                <button
                  aria-pressed={isMarked}
                  className={`${isMarked ? "is-marked" : ""} ${answerClass}`.trim()}
                  data-testid={`ai-sentence-${index}`}
                  key={sentence.text}
                  onClick={() => toggleSentence(index)}
                  type="button"
                >
                  <span>{index + 1}</span><strong>{sentence.text}</strong>
                  {revealed ? <small>{sentence.issue ?? "현재 자료와 맞는 설명입니다."}</small> : null}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <fieldset className="reason-picker" disabled={submitted}>
        <legend>왜 의심했나요?</legend>
        <div>{suspicionReasons.map((item) => <button aria-pressed={reason === item} key={item} onClick={() => setReason(item)} type="button">{item}</button>)}</div>
      </fieldset>

      {!submitted ? (
        <div className="core-submit-row">
          <p>{markedSentences.size === 0 ? "이상하다고 생각한 문장을 먼저 누르세요." : `${markedSentences.size}개 문장을 표시했습니다.`}</p>
          <button className="button button--primary" disabled={markedSentences.size === 0 || !reason} onClick={() => setSubmitted(true)} type="button">우리 모둠 판단 제출</button>
        </div>
      ) : (
        <section className="teacher-reveal" aria-label="교사 답 공개">
          <div><span>학생 판단 완료</span><strong>{markedSentences.size}개 문장 · 이유: {reason}</strong><p>먼저 모둠의 판단 근거를 발표하세요.</p></div>
          {!revealed ? <button data-testid="reveal-ai-answer" onClick={() => setRevealed(true)} type="button">교사가 답과 근거 공개</button> : <button onClick={() => changeCase((caseIndex + 1) % aiInvestigationCases.length)} type="button">다음 유산 질문 →</button>}
        </section>
      )}

      {revealed ? (
        <div className="answer-summary" data-testid="ai-answer-summary" role="status">
          <strong>의심 문장 {correctSelections}개 발견</strong>
          <span>{extraSelections > 0 ? `맞는 문장도 ${extraSelections}개 선택했습니다. 왜 맞는지 자료로 다시 확인해 보세요.` : "맞는 설명과 확인이 필요한 설명을 잘 구분했습니다."}</span>
        </div>
      ) : null}
    </div>
  );
}

interface VerificationSource {
  id: string;
  type: string;
  title: string;
  creator: string;
  time: string;
  excerpt: string;
  isOriginal: boolean;
}

interface VerificationCase {
  heritage: string;
  claim: string;
  verdict: "확인" | "틀림" | "보류";
  explanation: string;
  sources: readonly VerificationSource[];
}

const verificationCases: readonly VerificationCase[] = [
  {
    heritage: "무령왕릉",
    claim: "무령왕릉은 주인이 누구인지 알 수 없는 무덤이다.",
    verdict: "틀림",
    explanation: "무덤에서 왕과 왕비의 기록이 적힌 지석이 발견되어 주인을 확인할 수 있습니다.",
    sources: [
      { id: "museum", type: "박물관 소장품 기록", title: "무령왕릉 출토 지석", creator: "국립공주박물관", time: "백제 웅진기 유물과 1971년 발굴 기록", excerpt: "지석에는 무령왕과 왕비의 죽음과 장례에 관한 기록이 남아 있습니다.", isOriginal: true },
      { id: "history", type: "역사 교육 자료", title: "무령왕릉은 누구의 무덤인가", creator: "우리역사넷", time: "삼국시대 자료를 설명한 현대 교육 자료", excerpt: "지석이 발견되면서 무덤 주인과 백제 왕실의 장례를 구체적으로 알게 됐습니다.", isOriginal: false },
      { id: "ai", type: "출처 없는 AI 요약", title: "왕릉에 관한 짧은 답변", creator: "만든 곳 알 수 없음", time: "어느 시기의 근거인지 표시 없음", excerpt: "대부분의 고대 무덤처럼 무령왕릉도 주인을 알 수 없다고 설명합니다.", isOriginal: false },
    ],
  },
  {
    heritage: "첨성대",
    claim: "첨성대에서는 사람이 꼭대기에 올라가 별을 관측했다.",
    verdict: "보류",
    explanation: "첨성대가 천문 관측과 관련된 시설이라는 점은 확인할 수 있지만, 정확한 관측 위치와 방법은 하나로 확정하기 어렵습니다.",
    sources: [
      { id: "heritage", type: "국가유산 설명", title: "경주 첨성대", creator: "국가유산청 국가유산포털", time: "신라 선덕여왕 때 세운 것으로 보는 건축", excerpt: "천문 관측과 관련된 건축물로 설명하지만 구체적인 관측 방법을 단정하지 않습니다.", isOriginal: true },
      { id: "study", type: "역사 연구 해설", title: "첨성대의 구조와 여러 해석", creator: "우리역사넷", time: "신라 기록과 건축 구조를 함께 살핀 자료", excerpt: "창과 꼭대기, 내부 구조를 두고 관측 방법에 여러 견해가 소개됩니다.", isOriginal: false },
      { id: "video", type: "출처 없는 짧은 영상", title: "신라 천문학 30초 요약", creator: "게시자 정보 없음", time: "참고한 기록과 제작 시기 표시 없음", excerpt: "신라 천문관이 매일 꼭대기에 올라가 망원경으로 별을 봤다고 말합니다.", isOriginal: false },
    ],
  },
  {
    heritage: "신라 금관",
    claim: "신라 왕은 금관을 매일 머리에 쓰고 생활했다.",
    verdict: "보류",
    explanation: "금관의 구조와 출토 상황은 확인할 수 있지만 생전에 언제, 어떻게 착용했는지는 여러 견해가 있어 매일 썼다고 단정할 수 없습니다.",
    sources: [
      { id: "relic", type: "박물관 소장품 기록", title: "금관총 출토 금관", creator: "국립중앙박물관", time: "신라 고분에서 나온 금관의 재료와 구조", excerpt: "얇은 금판, 세움 장식, 굽은옥과 달개의 모양과 출토 정보를 확인할 수 있습니다.", isOriginal: true },
      { id: "interpretation", type: "역사 연구 해설", title: "신라 금관은 어떻게 사용됐을까", creator: "우리역사넷", time: "고분 출토품과 연구 견해를 정리한 자료", excerpt: "실제 착용 여부와 의례·장례에서의 사용 방식을 두고 여러 해석이 있음을 설명합니다.", isOriginal: false },
      { id: "drama", type: "드라마 장면 설명", title: "왕의 일상 복식", creator: "자료 출처 표시 없음", time: "현대에 만든 장면", excerpt: "왕이 매일 회의와 식사 때에도 금관을 쓰는 모습이 등장합니다.", isOriginal: false },
    ],
  },
] as const;

function VerificationLab() {
  const [caseIndex, setCaseIndex] = useState(0);
  const [openSources, setOpenSources] = useState<Set<string>>(() => new Set());
  const [evidenceSources, setEvidenceSources] = useState<Set<string>>(() => new Set());
  const [verdict, setVerdict] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const activeCase = verificationCases[caseIndex];
  const selectedSources = activeCase.sources.filter((source) => evidenceSources.has(source.id));
  const checks = [
    { label: "출처", description: "만든 곳이 보이는 자료", done: selectedSources.length > 0 && selectedSources.every((source) => !source.creator.includes("없음") && !source.creator.includes("알 수 없음")) },
    { label: "시기", description: "유산의 시대와 자료 제작 시기 확인", done: selectedSources.length > 0 && selectedSources.every((source) => !source.time.includes("없음")) },
    { label: "교차", description: "서로 다른 자료 두 개 이상 비교", done: selectedSources.length >= 2 },
    { label: "원본", description: "유물·원문을 직접 다루는 자료 포함", done: selectedSources.some((source) => source.isOriginal) },
    { label: "보류", description: "모르면 보류할 선택지까지 검토", done: Boolean(verdict) },
  ];

  function changeCase(nextIndex: number) {
    setCaseIndex(nextIndex);
    setOpenSources(new Set());
    setEvidenceSources(new Set());
    setVerdict("");
    setSubmitted(false);
    setRevealed(false);
  }

  function toggleSetValue(setter: Dispatch<SetStateAction<Set<string>>>, value: string) {
    setter((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  const canSubmit = selectedSources.length >= 2 && Boolean(verdict);

  return (
    <div className="web-tool core-activity core-activity--verification">
      <section className="core-mission" aria-label="활동 방법">
        <span>웹앱이 하는 일</span>
        <strong>서로 다른 자료를 직접 열어 보고, 근거 바구니에 담은 뒤 판단합니다.</strong>
        <p>자료에서 찾은 핵심 문장과 판단 이유는 활동지에 씁니다.</p>
      </section>

      <div className="case-tabs" role="group" aria-label="검증할 주장 선택">
        {verificationCases.map((item, index) => <button aria-pressed={caseIndex === index} key={item.heritage} onClick={() => changeCase(index)} type="button">{item.heritage}</button>)}
      </div>

      <section className="claim-board" aria-labelledby="claim-title">
        <span>검증할 주장</span><h3 id="claim-title">“{activeCase.claim}”</h3>
      </section>

      <section className="verification-steps" aria-label="검증 5단계 진행 상황">
        {checks.map((check, index) => <div className={check.done ? "is-complete" : ""} key={check.label}><span>{index + 1}</span><strong>{check.label}</strong><small>{check.description}</small></div>)}
      </section>

      <div className="evidence-source-grid">
        {activeCase.sources.map((source, index) => {
          const isOpen = openSources.has(source.id);
          const isSelected = evidenceSources.has(source.id);
          return (
            <article className={isSelected ? "is-selected" : ""} data-testid={`evidence-source-${index}`} key={source.id}>
              <header><span>{source.type}</span><strong>{source.title}</strong></header>
              <dl><div><dt>만든 곳</dt><dd>{source.creator}</dd></div><div><dt>시기 단서</dt><dd>{source.time}</dd></div></dl>
              <button className="source-open-button" onClick={() => toggleSetValue(setOpenSources, source.id)} type="button">{isOpen ? "자료 내용 닫기" : "자료 내용 열기"}</button>
              {isOpen ? <div className="source-excerpt"><p>“{source.excerpt}”</p><span>{source.isOriginal ? "원본 유물·기록과 직접 연결됨" : "해설 또는 2차 자료"}</span></div> : null}
              <button aria-pressed={isSelected} className="evidence-basket-button" disabled={!isOpen || submitted} onClick={() => toggleSetValue(setEvidenceSources, source.id)} type="button">{isSelected ? "✓ 근거 바구니에 담음" : "근거로 담기"}</button>
            </article>
          );
        })}
      </div>

      <section className="verdict-panel" aria-labelledby="verdict-title">
        <div><span>근거 바구니 {selectedSources.length}개</span><h3 id="verdict-title">이 주장을 어떻게 판단할까요?</h3></div>
        <div role="group" aria-label="최종 판단">
          {["확인", "틀림", "보류"].map((item) => <button aria-pressed={verdict === item} disabled={submitted} key={item} onClick={() => setVerdict(item)} type="button">{item}</button>)}
        </div>
        {!submitted ? <button className="button button--primary" disabled={!canSubmit} onClick={() => setSubmitted(true)} type="button">우리 모둠 판단 제출</button> : null}
        {!canSubmit && !submitted ? <p>서로 다른 자료를 두 개 이상 담고 판단을 선택해야 제출할 수 있습니다.</p> : null}
      </section>

      {submitted ? (
        <section className="teacher-reveal" aria-label="교사 답 공개">
          <div><span>학생 판단 완료</span><strong>우리 모둠의 판단: {verdict}</strong><p>어떤 자료가 가장 강한 근거였는지 먼저 발표하세요.</p></div>
          {!revealed ? <button data-testid="reveal-verification-answer" onClick={() => setRevealed(true)} type="button">교사가 답과 근거 공개</button> : <button onClick={() => changeCase((caseIndex + 1) % verificationCases.length)} type="button">다음 주장 검증 →</button>}
        </section>
      ) : null}

      {revealed ? (
        <div className={verdict === activeCase.verdict ? "answer-summary is-correct" : "answer-summary"} data-testid="verification-answer-summary" role="status">
          <strong>자료에 따른 판단: {activeCase.verdict}</strong><span>{activeCase.explanation}</span>
        </div>
      ) : null}
    </div>
  );
}

export function ThreeKingdomsCoreActivity({ lessonId }: { lessonId: number }) {
  if (lessonId === 1) return <ArtifactSelectionLab />;
  if (lessonId === 2) return <AiSentenceDetective />;
  return <VerificationLab />;
}
