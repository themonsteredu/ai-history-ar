import { useEffect, useState, type FormEvent } from "react";
import type { Lesson } from "../types/curriculum";
import {
  EXTERNAL_TOOL_STORAGE_KEY,
  EXTERNAL_TOOL_UPDATE_EVENT,
  getResolvedExternalTool,
  readExternalToolSettings,
} from "../settings/externalToolSettings";
import { Icon } from "./Icon";
import { ExternalToolFrame } from "./ExternalToolFrame";
import { LessonFiveCleaningLab } from "./LessonFiveCleaningLab";

const COMPLETION_STORAGE_KEY = "moa-history-ar:external-tool-completion:v1";

const heritageCards = [
  { id: 1, kingdom: "백제", name: "무령왕릉", file: "muryeong-tomb.jpg", clues: ["아치 모양의 벽돌 입구", "반복되는 벽돌무늬", "무덤 주인을 알려 준 지석"] },
  { id: 2, kingdom: "백제", name: "백제 금동대향로", file: "baekje-incense-burner.jpg", clues: ["받침 부분의 용", "산봉우리와 여러 동물", "꼭대기의 봉황"] },
  { id: 3, kingdom: "신라", name: "첨성대", file: "cheomseongdae.jpg", clues: ["돌을 층층이 쌓은 몸통", "가운데 난 네모난 창", "위로 갈수록 달라지는 모양"] },
  { id: 4, kingdom: "신라", name: "신라 금관", file: "silla-crown.jpg", clues: ["나뭇가지 모양 장식", "굽은옥과 둥근 달개", "얇은 금판의 구조"] },
  { id: 5, kingdom: "고구려", name: "고구려 고분벽화", file: "goguryeo-mural.jpg", clues: ["말을 달리는 사람", "활과 사냥 장면", "힘차게 이어지는 선"] },
  { id: 6, kingdom: "가야", name: "가야 고분군", file: "gaya-tombs.jpg", clues: ["능선을 따라 이어진 봉분", "무덤마다 다른 크기", "여러 지역에 나뉜 위치"] },
] as const;

const questionDataFields = ["시기", "지역", "재료", "모양", "발견 장소", "출처"] as const;
const LESSON_ONE_QUESTION_KEY = "ai-history:three-kingdoms:lesson-1-question:v1";
type HeritageCard = (typeof heritageCards)[number];

const schemaFieldOptions = [
  { id: "heritage_name", label: "유산 이름", purpose: "한 행의 조사 대상", required: true },
  { id: "kingdom", label: "나라", purpose: "백제·신라·고구려·가야", required: true },
  { id: "era_range", label: "시대 범위", purpose: "6세기처럼 넓게 비교", required: true },
  { id: "exact_year", label: "정확한 연도", purpose: "525년처럼 확인된 시점", required: true },
  { id: "discovery_region", label: "발견 지역", purpose: "어디에서 발견되었는지", required: true },
  { id: "source_type", label: "자료 종류", purpose: "무덤·건축·벽화·공예품", required: true },
  { id: "verified_fact", label: "확인된 사실", purpose: "출처로 확인한 설명", required: true },
  { id: "source", label: "출처", purpose: "기관 이름과 원문 주소", required: true },
  { id: "material", label: "재료", purpose: "돌·벽돌·금동·안료", required: false },
  { id: "interpretation", label: "해석", purpose: "사실과 분리한 의미 설명", required: false },
] as const;

const normalizationChallenges = [
  { id: "region", label: "발견 지역", values: ["경주", "경주시", "경상북도 경주"], answer: "경상북도 경주" },
  { id: "era", label: "시대 범위", values: ["서기 500년대", "6세기", "500s"], answer: "6세기" },
  { id: "kingdom", label: "나라", values: ["신라국", "신라", "Silla"], answer: "신라" },
] as const;

const LESSON_TWO_SCHEMA_KEY = "ai-history:three-kingdoms:lesson-2-schema:v1";

export interface LessonOneQuestionDraft {
  group: number;
  heritageId: number;
  clues: string[];
  dataFields: string[];
  observation: string;
  question: string;
  savedAt: number;
}

export interface LessonTwoSchemaDraft {
  group: number;
  fields: string[];
  normalizations: Record<string, string>;
  relationFields: string[];
  savedAt: number;
}

export function isLessonOneQuestionComplete(draft: LessonOneQuestionDraft) {
  return draft.group > 0 && draft.clues.length > 0 && draft.dataFields.length > 0 && draft.observation.trim().length >= 5 && draft.question.trim().length >= 10;
}

export function normalizeLessonOneQuestion(question: string) {
  return question.trim().replace(/\?*$/, "?");
}

function schemaFieldLabel(fieldId: string) {
  return schemaFieldOptions.find((field) => field.id === fieldId)?.label ?? fieldId;
}

function topicParticle(word: string) {
  const lastCharacter = word.at(-1);
  if (!lastCharacter) return "는";
  const code = lastCharacter.charCodeAt(0) - 0xac00;
  const hasFinalConsonant = code >= 0 && code <= 11171 && code % 28 !== 0;
  return hasFinalConsonant ? "은" : "는";
}

export function buildLessonTwoRelationQuestion(fieldIds: string[]) {
  if (fieldIds.length !== 2) return "비교할 항목 두 개를 선택하세요.";
  const secondField = schemaFieldLabel(fieldIds[1]);
  return `${schemaFieldLabel(fieldIds[0])}에 따라 ${secondField}${topicParticle(secondField)} 어떻게 다를까?`;
}

export function isLessonTwoSchemaComplete(draft: LessonTwoSchemaDraft) {
  const hasRequiredFields = schemaFieldOptions.filter((field) => field.required).every((field) => draft.fields.includes(field.id));
  const normalized = normalizationChallenges.every((challenge) => draft.normalizations[challenge.id] === challenge.answer);
  const hasRelation = draft.relationFields.length === 2 && draft.relationFields.every((fieldId) => draft.fields.includes(fieldId));
  return draft.group > 0 && hasRequiredFields && normalized && hasRelation;
}

const emptyQuestionDraft: LessonOneQuestionDraft = {
  group: 0,
  heritageId: 1,
  clues: [],
  dataFields: [],
  observation: "",
  question: "",
  savedAt: 0,
};

const emptySchemaDraft: LessonTwoSchemaDraft = {
  group: 0,
  fields: [],
  normalizations: {},
  relationFields: [],
  savedAt: 0,
};

function readLessonOneQuestion(): LessonOneQuestionDraft {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LESSON_ONE_QUESTION_KEY) ?? "{}") as Partial<LessonOneQuestionDraft>;
    return {
      group: typeof parsed.group === "number" && parsed.group >= 1 && parsed.group <= 6 ? parsed.group : 0,
      heritageId: typeof parsed.heritageId === "number" && heritageCards.some((item) => item.id === parsed.heritageId) ? parsed.heritageId : 1,
      clues: Array.isArray(parsed.clues) ? parsed.clues.filter((item): item is string => typeof item === "string") : [],
      dataFields: Array.isArray(parsed.dataFields) ? parsed.dataFields.filter((item): item is string => typeof item === "string") : [],
      observation: typeof parsed.observation === "string" ? parsed.observation : "",
      question: typeof parsed.question === "string" ? parsed.question : "",
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : 0,
    };
  } catch {
    return emptyQuestionDraft;
  }
}

function readLessonTwoSchema(): LessonTwoSchemaDraft {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LESSON_TWO_SCHEMA_KEY) ?? "{}") as Partial<LessonTwoSchemaDraft>;
    const validFieldIds = new Set(schemaFieldOptions.map((field) => field.id));
    const fields = Array.isArray(parsed.fields) ? parsed.fields.filter((fieldId): fieldId is string => typeof fieldId === "string" && validFieldIds.has(fieldId as (typeof schemaFieldOptions)[number]["id"])) : [];
    const normalizations = parsed.normalizations && typeof parsed.normalizations === "object"
      ? Object.fromEntries(Object.entries(parsed.normalizations).filter(([key, value]) => normalizationChallenges.some((challenge) => challenge.id === key) && typeof value === "string"))
      : {};
    const relationFields = Array.isArray(parsed.relationFields) ? parsed.relationFields.filter((fieldId): fieldId is string => typeof fieldId === "string" && fields.includes(fieldId)).slice(0, 2) : [];
    return {
      group: typeof parsed.group === "number" && parsed.group >= 1 && parsed.group <= 6 ? parsed.group : 0,
      fields,
      normalizations,
      relationFields,
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : 0,
    };
  } catch {
    return emptySchemaDraft;
  }
}

function HeritageImageViewer({ heritage }: { heritage: HeritageCard }) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const imageSrc = `${import.meta.env.BASE_URL}images/heritage/three-kingdoms/${heritage.file}`;

  useEffect(() => {
    if (!open) return;

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

  function openViewer() {
    setZoom(1);
    setOpen(true);
  }

  return (
    <>
      <button
        aria-haspopup="dialog"
        aria-label={`${heritage.name} 사진 크게 보기`}
        className="question-workshop__image-preview"
        onClick={openViewer}
        type="button"
      >
        <img alt={`${heritage.name} 전체 모습`} src={imageSrc} />
        <span><Icon name="eye" size={17} />사진 크게 보기</span>
      </button>

      {open ? (
        <div
          aria-label={`${heritage.name} 사진 확대 보기`}
          aria-modal="true"
          className="heritage-image-viewer"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
          role="dialog"
        >
          <div className="heritage-image-viewer__panel">
            <header>
              <div><span>{heritage.kingdom} 문화유산</span><strong>{heritage.name}</strong></div>
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
                <img alt={`${heritage.name} 확대 사진`} draggable="false" src={imageSrc} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function LessonOneQuestionWorkshop({ onSaved }: { onSaved: () => void }) {
  const [draft, setDraft] = useState(readLessonOneQuestion);
  const [message, setMessage] = useState("");
  const selectedHeritage = heritageCards.find((item) => item.id === draft.heritageId) ?? heritageCards[0];
  const canSave = isLessonOneQuestionComplete(draft);

  function updateDraft(next: Partial<LessonOneQuestionDraft>) {
    setDraft((current) => ({ ...current, ...next, savedAt: 0 }));
    setMessage("");
  }

  function toggleItem(key: "clues" | "dataFields", item: string) {
    const items = draft[key];
    updateDraft({ [key]: items.includes(item) ? items.filter((value) => value !== item) : [...items, item] });
  }

  function selectHeritage(heritageId: number) {
    updateDraft({ heritageId, clues: [], observation: "", question: "" });
  }

  function saveQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) {
      setMessage("모둠·유산·관찰 단서·데이터 항목을 고르고, 관찰과 질문을 모두 작성해 주세요.");
      return;
    }
    const savedDraft = { ...draft, question: normalizeLessonOneQuestion(draft.question), observation: draft.observation.trim(), savedAt: Date.now() };
    setDraft(savedDraft);
    window.localStorage.setItem(LESSON_ONE_QUESTION_KEY, JSON.stringify(savedDraft));
    setMessage("우리 모둠 질문 카드가 이 기기에 저장되었습니다.");
    onSaved();
  }

  function resetQuestion() {
    setDraft(emptyQuestionDraft);
    setMessage("");
    window.localStorage.removeItem(LESSON_ONE_QUESTION_KEY);
  }

  return (
    <div className="question-workshop">
      <header className="question-workshop__mission">
        <div><span>12분 미션</span><h4>사진에서 단서를 찾고, 조사할 질문 한 문장을 완성하세요.</h4></div>
        <ol aria-label="활동 진행 단계">
          <li className={draft.group > 0 && draft.heritageId > 0 ? "is-done" : ""}><span>1</span>모둠·유산 선택</li>
          <li className={draft.clues.length > 0 && draft.dataFields.length > 0 ? "is-done" : ""}><span>2</span>관찰·데이터 선택</li>
          <li className={draft.savedAt > 0 ? "is-done" : ""}><span>3</span>질문 저장</li>
        </ol>
      </header>

      <section className="question-workshop__step" aria-labelledby="question-group-title">
        <div className="question-workshop__step-heading"><span>1</span><div><h5 id="question-group-title">우리 모둠과 문화유산을 선택하세요</h5><p>카드를 고른 뒤 아래 큰 사진을 누르면 확대해서 볼 수 있습니다.</p></div></div>
        <div className="question-workshop__groups" role="group" aria-label="모둠 선택">
          {[1, 2, 3, 4, 5, 6].map((group) => <button aria-pressed={draft.group === group} key={group} onClick={() => updateDraft({ group })} type="button">{group}모둠</button>)}
        </div>
        <div className="question-workshop__heritages" role="group" aria-label="문화유산 선택">
          {heritageCards.map((heritage) => (
            <button aria-pressed={draft.heritageId === heritage.id} key={heritage.id} onClick={() => selectHeritage(heritage.id)} type="button">
              <img alt="" src={`${import.meta.env.BASE_URL}images/heritage/three-kingdoms/${heritage.file}`} />
              <span>{heritage.kingdom}</span><strong>{heritage.name}</strong>
            </button>
          ))}
        </div>
      </section>

      <div className="question-workshop__workspace">
        <section className="question-workshop__observation" aria-labelledby="question-observation-title">
          <div className="question-workshop__step-heading"><span>2</span><div><h5 id="question-observation-title">사진에서 실제로 보이는 단서를 고르세요</h5><p>사진을 누르면 크게 열립니다. 추측이 아니라 눈으로 확인한 것부터 기록합니다.</p></div></div>
          <HeritageImageViewer heritage={selectedHeritage} />
          <div className="question-workshop__clues" role="group" aria-label="관찰 단서 선택">
            {selectedHeritage.clues.map((clue) => <button aria-pressed={draft.clues.includes(clue)} key={clue} onClick={() => toggleItem("clues", clue)} type="button"><span aria-hidden="true">✓</span>{clue}</button>)}
          </div>
        </section>

        <form className="question-workshop__form" onSubmit={saveQuestion}>
          <div className="question-workshop__step-heading"><span>3</span><div><h5>모을 데이터와 질문을 작성하세요</h5><p>다른 유산과 비교할 수 있는 항목을 선택합니다.</p></div></div>
          <fieldset>
            <legend>어떤 데이터를 모을까요?</legend>
            <div className="question-workshop__data-fields">
              {questionDataFields.map((field) => <button aria-pressed={draft.dataFields.includes(field)} key={field} onClick={() => toggleItem("dataFields", field)} type="button">{field}</button>)}
            </div>
          </fieldset>
          <label><span>사진에서 관찰한 사실</span><textarea maxLength={100} onChange={(event) => updateDraft({ observation: event.target.value })} placeholder="예: 둥근 봉분이 능선을 따라 여러 개 이어져 있다." rows={3} value={draft.observation} /><small>{draft.observation.length}/100</small></label>
          <label><span>우리 모둠의 역사 데이터 질문</span><textarea maxLength={140} onChange={(event) => updateDraft({ question: event.target.value })} placeholder="예: 유산의 재료와 발견 지역은 서로 어떤 관계가 있을까?" rows={4} value={draft.question} /><small>{draft.question.length}/140</small></label>
          {message ? <p className={draft.savedAt > 0 ? "question-workshop__message is-saved" : "question-workshop__message"} role="status">{message}</p> : null}
          <div className="question-workshop__actions"><button className="button button--primary" type="submit">질문 카드 저장</button><button className="button button--outline" onClick={resetQuestion} type="button">처음부터 다시</button></div>
        </form>
      </div>

      <section className={draft.savedAt > 0 ? "question-workshop__result is-saved" : "question-workshop__result"} aria-live="polite">
        <div><span>오늘 남길 결과</span><h5>우리 모둠 질문 카드</h5></div>
        {draft.savedAt > 0 ? (
          <div className="question-workshop__result-card"><span>{draft.group}모둠 · {selectedHeritage.kingdom} · {selectedHeritage.name}</span><strong>“{draft.question}”</strong><p><b>관찰:</b> {draft.observation}</p><p><b>모을 데이터:</b> {draft.dataFields.join(" · ")}</p></div>
        ) : <p>세 단계를 마치고 저장하면 발표할 질문 카드가 여기에 완성됩니다.</p>}
      </section>
    </div>
  );
}

function LessonTwoSchemaWorkshop({ onSaved }: { onSaved: () => void }) {
  const [draft, setDraft] = useState(readLessonTwoSchema);
  const [message, setMessage] = useState("");
  const requiredFields = schemaFieldOptions.filter((field) => field.required);
  const selectedFields = schemaFieldOptions.filter((field) => draft.fields.includes(field.id));
  const requiredCount = requiredFields.filter((field) => draft.fields.includes(field.id)).length;
  const normalizedCount = normalizationChallenges.filter((challenge) => draft.normalizations[challenge.id] === challenge.answer).length;
  const relationQuestion = buildLessonTwoRelationQuestion(draft.relationFields);
  const canSave = isLessonTwoSchemaComplete(draft);

  function updateDraft(next: Partial<LessonTwoSchemaDraft>) {
    setDraft((current) => ({ ...current, ...next, savedAt: 0 }));
    setMessage("");
  }

  function toggleField(fieldId: string) {
    const fields = draft.fields.includes(fieldId) ? draft.fields.filter((id) => id !== fieldId) : [...draft.fields, fieldId];
    updateDraft({ fields, relationFields: draft.relationFields.filter((id) => fields.includes(id)) });
  }

  function chooseNormalization(challengeId: string, value: string) {
    updateDraft({ normalizations: { ...draft.normalizations, [challengeId]: value } });
  }

  function toggleRelationField(fieldId: string) {
    if (draft.relationFields.includes(fieldId)) {
      updateDraft({ relationFields: draft.relationFields.filter((id) => id !== fieldId) });
      return;
    }
    updateDraft({ relationFields: draft.relationFields.length < 2 ? [...draft.relationFields, fieldId] : [draft.relationFields[1], fieldId] });
  }

  function saveSchema() {
    if (!canSave) {
      setMessage("모둠을 고르고 필수 공통 항목 8개, 표기 통일 3문제, 관계 항목 2개를 모두 완성해 주세요.");
      return;
    }
    const savedDraft = { ...draft, savedAt: Date.now() };
    setDraft(savedDraft);
    window.localStorage.setItem(LESSON_TWO_SCHEMA_KEY, JSON.stringify(savedDraft));
    setMessage("우리 모둠의 학급 데이터 약속이 이 기기에 저장되었습니다.");
    onSaved();
  }

  function resetSchema() {
    setDraft(emptySchemaDraft);
    setMessage("");
    window.localStorage.removeItem(LESSON_TWO_SCHEMA_KEY);
  }

  return (
    <div className="schema-workshop">
      <header className="question-workshop__mission schema-workshop__mission">
        <div><span>20분 설계 미션</span><h4>여섯 모둠의 자료를 합칠 수 있는 ‘학급 데이터 약속’을 완성하세요.</h4></div>
        <ol aria-label="활동 진행 단계">
          <li className={draft.group > 0 ? "is-done" : ""}><span>1</span>표 비교</li>
          <li className={requiredCount === requiredFields.length ? "is-done" : ""}><span>2</span>공통 항목</li>
          <li className={normalizedCount === normalizationChallenges.length ? "is-done" : ""}><span>3</span>표기 통일</li>
          <li className={draft.savedAt > 0 ? "is-done" : ""}><span>4</span>관계·저장</li>
        </ol>
      </header>

      <section className="question-workshop__step schema-workshop__comparison" aria-labelledby="schema-compare-title">
        <div className="question-workshop__step-heading"><span>1</span><div><h5 id="schema-compare-title">서로 다른 두 표가 왜 바로 합쳐지지 않는지 찾아보세요</h5><p>같은 뜻도 열 이름과 값 표기가 다르면 컴퓨터는 다른 데이터로 읽습니다.</p></div></div>
        <div className="question-workshop__groups" role="group" aria-label="모둠 선택">
          {[1, 2, 3, 4, 5, 6].map((group) => <button aria-pressed={draft.group === group} key={group} onClick={() => updateDraft({ group })} type="button">{group}모둠</button>)}
        </div>
        <div className="schema-workshop__tables">
          <article><span>1모둠 표</span><div><table><thead><tr><th>유물</th><th>나라</th><th>만든 때</th><th>나온 곳</th><th>링크</th></tr></thead><tbody><tr><td>금관</td><td>신라국</td><td>서기 500년대</td><td>경주</td><td>박물관</td></tr></tbody></table></div></article>
          <article><span>2모둠 표</span><div><table><thead><tr><th>유산 이름</th><th>국가</th><th>시대</th><th>출토지</th><th>출처</th></tr></thead><tbody><tr><td>신라 금관</td><td>Silla</td><td>6세기</td><td>경상북도 경주</td><td>원문 주소</td></tr></tbody></table></div></article>
        </div>
        <p className="schema-workshop__compare-note"><strong>발견할 점</strong> 유물↔유산 이름, 나라↔국가, 만든 때↔시대, 나온 곳↔출토지, 링크↔출처는 뜻이 비슷하지만 표기가 다릅니다.</p>
      </section>

      <section className="question-workshop__step" aria-labelledby="schema-fields-title">
        <div className="question-workshop__step-heading"><span>2</span><div><h5 id="schema-fields-title">모든 모둠이 함께 쓸 공통 항목을 고르세요</h5><p>필수 8개는 모두 선택하고, 우리 질문에 필요한 선택 항목을 더할 수 있습니다.</p></div></div>
        <div className="schema-workshop__field-status"><span>필수 공통 항목</span><strong>{requiredCount} / {requiredFields.length}</strong></div>
        <div className="schema-workshop__fields" role="group" aria-label="학급 공통 데이터 항목">
          {schemaFieldOptions.map((field) => (
            <button aria-pressed={draft.fields.includes(field.id)} key={field.id} onClick={() => toggleField(field.id)} type="button">
              <span>{field.required ? "필수" : "선택"}</span><strong>{field.label}</strong><small>{field.purpose}</small>
            </button>
          ))}
        </div>
        <div className="schema-workshop__preview"><span>우리 표의 열 이름 미리보기</span><div>{selectedFields.length ? selectedFields.map((field) => <strong key={field.id}>{field.label}</strong>) : <p>항목을 누르면 여기에 학급 표의 머리글이 만들어집니다.</p>}</div></div>
      </section>

      <section className="question-workshop__step" aria-labelledby="schema-normalize-title">
        <div className="question-workshop__step-heading"><span>3</span><div><h5 id="schema-normalize-title">같은 뜻의 값을 하나의 표기로 통일하세요</h5><p>가장 분명하고 다른 모둠도 그대로 따라 쓸 수 있는 값을 고릅니다.</p></div></div>
        <div className="schema-workshop__normalizations">
          {normalizationChallenges.map((challenge) => {
            const selected = draft.normalizations[challenge.id];
            const correct = selected === challenge.answer;
            return (
              <article data-state={selected ? (correct ? "correct" : "wrong") : "idle"} key={challenge.id}>
                <div><span>{challenge.label}</span><strong>{correct ? "표기 통일 완료" : selected ? "조금 더 정확한 값을 골라 보세요" : "대표값을 고르세요"}</strong></div>
                <div role="group" aria-label={`${challenge.label} 표준값 선택`}>
                  {challenge.values.map((value) => <button aria-pressed={selected === value} key={value} onClick={() => chooseNormalization(challenge.id, value)} type="button">{value}</button>)}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="question-workshop__step schema-workshop__relation" aria-labelledby="schema-relation-title">
        <div className="question-workshop__step-heading"><span>4</span><div><h5 id="schema-relation-title">항목 두 개를 연결해 비교 질문을 만드세요</h5><p>원인을 단정하지 말고, 함께 비교할 두 항목의 관계를 질문합니다.</p></div></div>
        <div className="schema-workshop__relation-fields" role="group" aria-label="관계를 살펴볼 항목 두 개">
          {selectedFields.length ? selectedFields.map((field) => <button aria-pressed={draft.relationFields.includes(field.id)} key={field.id} onClick={() => toggleRelationField(field.id)} type="button">{field.label}</button>) : <p>먼저 2단계에서 공통 항목을 선택하세요.</p>}
        </div>
        <div className={draft.relationFields.length === 2 ? "schema-workshop__relation-map is-ready" : "schema-workshop__relation-map"}>
          <span>{draft.relationFields[0] ? schemaFieldLabel(draft.relationFields[0]) : "첫 번째 항목"}</span><b aria-hidden="true">↔</b><span>{draft.relationFields[1] ? schemaFieldLabel(draft.relationFields[1]) : "두 번째 항목"}</span>
        </div>
        <div className="schema-workshop__question-output"><span>우리 모둠의 비교 질문</span><strong>“{relationQuestion}”</strong></div>
        {message ? <p className={draft.savedAt > 0 ? "question-workshop__message is-saved" : "question-workshop__message"} role="status">{message}</p> : null}
        <div className="question-workshop__actions"><button className="button button--primary" onClick={saveSchema} type="button">학급 데이터 약속 저장</button><button className="button button--outline" onClick={resetSchema} type="button">처음부터 다시</button></div>
      </section>

      <section className={draft.savedAt > 0 ? "schema-workshop__result is-saved" : "schema-workshop__result"} aria-live="polite">
        <div><span>오늘 남길 결과</span><h5>우리 모둠 데이터 설계 카드</h5></div>
        {draft.savedAt > 0 ? (
          <div className="schema-workshop__result-card">
            <span>{draft.group}모둠 · 공통 항목 {selectedFields.length}개</span>
            <div>{selectedFields.map((field) => <b key={field.id}>{field.label}</b>)}</div>
            <strong>“{relationQuestion}”</strong>
            <p><b>표기 약속:</b> {normalizationChallenges.map((challenge) => `${challenge.label}=${challenge.answer}`).join(" · ")}</p>
          </div>
        ) : <p>네 단계를 마치고 저장하면 3차시부터 사용할 데이터 설계 카드가 완성됩니다.</p>}
      </section>
    </div>
  );
}

function readCompletion(lessonId: number) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(COMPLETION_STORAGE_KEY) ?? "{}") as Record<string, boolean>;
    return Boolean(saved[lessonId]);
  } catch {
    return false;
  }
}

function saveCompletion(lessonId: number, completed: boolean) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(COMPLETION_STORAGE_KEY) ?? "{}") as Record<string, boolean>;
    saved[lessonId] = completed;
    window.localStorage.setItem(COMPLETION_STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // 저장소가 막혀도 수업 활동은 계속할 수 있습니다.
  }
}

function InternalLessonPanel({ lessonId, onSaved, resultBoardUrl }: { lessonId: number; onSaved: () => void; resultBoardUrl: string }) {
  if (lessonId === 1) {
    return <div className="external-tool-internal"><LessonOneQuestionWorkshop onSaved={onSaved} /></div>;
  }

  if (lessonId === 2) {
    return <div className="external-tool-internal"><LessonTwoSchemaWorkshop onSaved={onSaved} /></div>;
  }

  return (
    <div className="external-tool-internal external-tool-internal--museum">
      <div className="museum-flow" aria-label="AR 데이터 박물관 설명 순서">
        {["수집", "정제", "그래프", "해석", "과거 유추", "AR 해설"].map((step, index) => (
          <div key={step}><span>{index + 1}</span><strong>{step}</strong></div>
        ))}
      </div>
      <div className="museum-launch-card">
        <div><span>10차시 운영</span><strong>근거를 먼저 보여 주는 AR 박물관</strong><p>그래프 PNG와 QR 대체 자료를 준비하면 AR이 멈춰도 해설을 계속할 수 있습니다.</p></div>
        {resultBoardUrl ? <a className="button button--primary" href={resultBoardUrl} rel="noreferrer" target="_blank">모둠 결과 모아보기 ↗</a> : <span className="external-tool-muted">결과 모아보기 주소는 교사 설정에서 연결합니다.</span>}
      </div>
    </div>
  );
}

export function ExternalToolActivity({ lesson }: { lesson: Lesson }) {
  const [settings, setSettings] = useState(() => readExternalToolSettings(window.localStorage));
  const [embedOpen, setEmbedOpen] = useState(false);
  const [completed, setCompleted] = useState(() => readCompletion(lesson.id));
  const tool = getResolvedExternalTool(lesson.id, settings);
  const usesCustomInternalActivity = lesson.id === 1 || lesson.id === 2;

  useEffect(() => {
    const syncSettings = () => setSettings(readExternalToolSettings(window.localStorage));
    const syncStorage = (event: StorageEvent) => {
      if (event.key === EXTERNAL_TOOL_STORAGE_KEY) syncSettings();
    };
    window.addEventListener(EXTERNAL_TOOL_UPDATE_EVENT, syncSettings);
    window.addEventListener("storage", syncStorage);
    return () => {
      window.removeEventListener(EXTERNAL_TOOL_UPDATE_EVENT, syncSettings);
      window.removeEventListener("storage", syncStorage);
    };
  }, []);

  const executableUrl = tool.launchMode === "embed" ? tool.embedUrl : tool.studentUrl;
  const isReady = tool.enabled && (tool.launchMode === "internal" || Boolean(executableUrl));
  const fallbackUrl = tool.fallbackPath ? `${import.meta.env.BASE_URL}${tool.fallbackPath}` : "";

  function toggleCompleted() {
    const next = !completed;
    setCompleted(next);
    saveCompletion(lesson.id, next);
  }

  function markCompleted() {
    setCompleted(true);
    saveCompletion(lesson.id, true);
  }

  return (
    <div className="external-activity">
      <section className="external-activity__summary">
        <div className="external-activity__summary-copy">
          <div className="external-activity__badges">
            <span>{lesson.id}차시</span>
            <span>{tool.estimatedMinutes}분</span>
            <span>{tool.launchMode === "embed" ? "화면 안에서 실행" : tool.launchMode === "new-tab" ? "새 탭에서 실행" : "웹앱 내부 활동"}</span>
          </div>
          <h3>{tool.toolName}</h3>
          <p>{tool.purpose}</p>
        </div>
        <div className={isReady ? "external-activity__status is-ready" : "external-activity__status"}>
          <Icon name={isReady ? "check" : "clock"} size={19} />
          <span>{isReady ? "수업 준비 완료" : "교사 링크 준비 중"}</span>
        </div>
      </section>

      {!tool.enabled ? (
        <div className="external-activity__notice"><strong>이 차시의 외부 도구가 꺼져 있습니다.</strong><span>교사가 대체 활동을 안내할 때까지 기다리세요.</span></div>
      ) : null}

      {tool.launchMode === "internal" && tool.enabled ? <InternalLessonPanel lessonId={lesson.id} onSaved={markCompleted} resultBoardUrl={tool.resultBoardUrl} /> : null}

      {lesson.id === 5 && tool.enabled ? <div className="external-tool-internal"><LessonFiveCleaningLab onSaved={markCompleted} /></div> : null}

      {tool.launchMode !== "internal" && tool.enabled ? (
        <section className="external-launch-panel">
          <div>
            <span>활동 시작</span>
            <strong>{isReady ? "버튼을 눌러 외부 도구를 여세요" : "교사가 수업용 링크를 연결해야 합니다"}</strong>
            <p>{isReady ? "작업을 마친 뒤 이 화면으로 돌아와 결과 형식을 확인합니다." : "아래 예비 자료가 있으면 먼저 내려받아 내용을 살펴보세요."}</p>
          </div>
          <div className="external-launch-panel__actions">
            {tool.launchMode === "embed" && executableUrl ? (
              <button className="button button--primary" onClick={() => setEmbedOpen((current) => !current)} type="button">
                {embedOpen ? "도구 화면 닫기" : "화면 안에서 시작"}
              </button>
            ) : null}
            {tool.launchMode === "new-tab" && executableUrl ? (
              <a className="button button--primary" href={executableUrl} rel="noreferrer" target="_blank">새 탭에서 시작 ↗</a>
            ) : null}
            {!isReady ? <button className="button button--primary" disabled type="button">수업용 링크 준비 중</button> : null}
            {fallbackUrl ? <a className="button button--outline" download href={fallbackUrl}>예비 데이터 받기</a> : null}
          </div>
        </section>
      ) : null}

      {embedOpen && executableUrl ? <ExternalToolFrame onClose={() => setEmbedOpen(false)} title={tool.toolName} url={executableUrl} /> : null}

      {!usesCustomInternalActivity ? <div className="external-activity__work-grid">
        <section className="external-step-card">
          <span>딱 세 단계</span>
          <ol>{tool.steps.map((step, index) => <li key={step}><strong>{index + 1}</strong><p>{step}</p></li>)}</ol>
        </section>
        <section className="external-result-card">
          <span>남길 결과</span>
          <strong>{tool.resultKind === "none" ? "활동지 또는 말로 확인" : tool.resultKind.toUpperCase()}</strong>
          <p>{tool.resultGuide}</p>
          {tool.submissionUrl ? <a href={tool.submissionUrl} rel="noreferrer" target="_blank">결과 제출하기 ↗</a> : <small>제출 주소가 없으면 교사에게 링크나 파일을 보여 주세요.</small>}
          {tool.resultBoardUrl ? <a href={tool.resultBoardUrl} rel="noreferrer" target="_blank">모둠 결과 모아보기 ↗</a> : null}
        </section>
      </div> : null}

      {!usesCustomInternalActivity ? <aside className="external-data-tip"><Icon name="spark" size={20} /><div><strong>역사 데이터 약속</strong><p>{tool.dataTip}</p></div></aside> : null}

      {tool.helperLinks?.length ? (
        <nav aria-label="선택 도구" className="external-helper-links">
          <span>더 해 보기</span>
          {tool.helperLinks.map((link) => <a href={link.href} key={link.href} rel="noreferrer" target="_blank">{link.label} ↗</a>)}
        </nav>
      ) : null}

      {!usesCustomInternalActivity ? <button aria-pressed={completed} className={completed ? "external-completion is-complete" : "external-completion"} onClick={toggleCompleted} type="button">
        <span><Icon name="check" size={20} /></span>
        <div><strong>{completed ? "우리 모둠 활동 완료" : "결과를 확인한 뒤 완료 표시"}</strong><small>이 표시는 현재 기기에만 저장됩니다.</small></div>
      </button> : null}
    </div>
  );
}
