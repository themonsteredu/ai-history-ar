import { useState, type FormEvent } from "react";
import { threeKingdomsGroups } from "../content/three-kingdoms/groups";
import { Icon } from "./Icon";

const storageVersion = 1;
const storageKey = "moa-history-ar:three-kingdoms:lesson-1:v1";
const imageRoot = `${import.meta.env.BASE_URL}images/heritage/three-kingdoms`;

const heritageImages = [
  {
    id: 1,
    src: `${imageRoot}/muryeong-tomb.jpg`,
    alt: "공주 무령왕릉 내부 재현 공간",
    credit: "Bernard Gagnon · CC0",
    href: "https://commons.wikimedia.org/wiki/File:King_Muryeong_Tomb_01.jpg",
  },
  {
    id: 2,
    src: `${imageRoot}/baekje-incense-burner.jpg`,
    alt: "백제 금동대향로",
    credit: "Gary Todd · CC0",
    href: "https://commons.wikimedia.org/wiki/File:Baekje_Gilt_Bronze_Incense_Burner,_6th-7th_Cent._(30165906226).jpg",
  },
  {
    id: 3,
    src: `${imageRoot}/cheomseongdae.jpg`,
    alt: "경주 첨성대",
    credit: "Matt & Nayoung Wilson · CC BY 2.0",
    href: "https://commons.wikimedia.org/wiki/File:Korea-Gyeongju-Cheomseongdae-02.jpg",
  },
  {
    id: 4,
    src: `${imageRoot}/silla-crown.jpg`,
    alt: "국립중앙박물관의 신라 금관",
    credit: "Ismoon · CC BY-SA 4.0",
    href: "https://commons.wikimedia.org/wiki/File:Royal_Crown_of_Silla._National_Museum_of_Korea.jpg",
  },
  {
    id: 5,
    src: `${imageRoot}/goguryeo-mural.jpg`,
    alt: "고구려 무용총 수렵도 벽화",
    credit: "작자 미상 · Public domain",
    href: "https://commons.wikimedia.org/wiki/File:Goguryeo_tomb_mural.jpg",
  },
  {
    id: 6,
    src: `${imageRoot}/gaya-tombs.jpg`,
    alt: "창녕 비화가야 고분군",
    credit: "Visviva · Public domain",
    href: "https://commons.wikimedia.org/wiki/File:Changnyeong_tombs_below.jpg",
  },
] as const;

const heritageImageById = new Map<number, (typeof heritageImages)[number]>(heritageImages.map((image) => [image.id, image]));
const heritageGroupById = new Map<number, (typeof threeKingdomsGroups)[number]>(threeKingdomsGroups.map((group) => [group.id, group]));
const studentRoles = ["자료 찾기", "기록하기", "기기 다루기", "발표하기"] as const;

interface LessonOneDraft {
  version: number;
  school: string;
  className: string;
  studentName: string;
  groupNumber: string;
  heritageId: number | null;
  role: string;
  observation: string;
  question: string;
  savedAt?: string;
}

const emptyDraft: LessonOneDraft = {
  version: storageVersion,
  school: "",
  className: "",
  studentName: "",
  groupNumber: "",
  heritageId: null,
  role: "",
  observation: "",
  question: "",
};

function loadDraft(): LessonOneDraft {
  if (typeof window === "undefined") return emptyDraft;

  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return emptyDraft;
    const parsed = JSON.parse(saved) as Partial<LessonOneDraft>;
    if (parsed.version !== storageVersion) return emptyDraft;
    return {
      ...emptyDraft,
      school: typeof parsed.school === "string" ? parsed.school : "",
      className: typeof parsed.className === "string" ? parsed.className : "",
      studentName: typeof parsed.studentName === "string" ? parsed.studentName : "",
      groupNumber: typeof parsed.groupNumber === "string" ? parsed.groupNumber : "",
      heritageId: typeof parsed.heritageId === "number" && heritageImageById.has(parsed.heritageId) ? parsed.heritageId : null,
      role: typeof parsed.role === "string" && studentRoles.includes(parsed.role as (typeof studentRoles)[number]) ? parsed.role : "",
      observation: typeof parsed.observation === "string" ? parsed.observation : "",
      question: typeof parsed.question === "string" ? parsed.question : "",
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : undefined,
    };
  } catch {
    return emptyDraft;
  }
}

export function StudentLessonOneActivity() {
  const [draft, setDraft] = useState<LessonOneDraft>(loadDraft);
  const [errors, setErrors] = useState<string[]>([]);
  const [saveMessage, setSaveMessage] = useState(draft.savedAt ? "이 기기에 저장된 내용을 불러왔어요." : "");

  const updateDraft = <Key extends keyof LessonOneDraft>(key: Key, value: LessonOneDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value, savedAt: undefined }));
    setSaveMessage("");
    setErrors([]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const missing: string[] = [];
    if (!draft.className.trim()) missing.push("반");
    if (!draft.studentName.trim()) missing.push("이름");
    if (!draft.groupNumber) missing.push("모둠");
    if (!draft.heritageId) missing.push("탐구할 문화유산");
    if (!draft.role) missing.push("내 역할");
    if (!draft.observation.trim()) missing.push("사진에서 발견한 것");
    if (!draft.question.trim()) missing.push("궁금한 점");

    if (missing.length > 0) {
      setErrors(missing);
      setSaveMessage("");
      return;
    }

    const savedDraft = { ...draft, savedAt: new Date().toISOString() };
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(savedDraft));
      setDraft(savedDraft);
      setErrors([]);
      setSaveMessage("1차시 활동을 이 기기에 저장했어요.");
    } catch {
      setSaveMessage("저장하지 못했어요. 선생님께 알려 주세요.");
    }
  };

  return (
    <form className="student-task" onSubmit={handleSubmit} noValidate>
      <header className="student-task__intro">
        <div>
          <p>오늘 할 일</p>
          <h2>사진을 보고 우리 모둠의 문화유산을 골라요</h2>
          <span>다른 모둠과 같은 유물을 골라도 괜찮아요.</span>
        </div>
        <div className="student-task__step" aria-label="오늘 활동 세 단계">
          <span>1</span><b>정보</b><i aria-hidden="true" />
          <span>2</span><b>유물</b><i aria-hidden="true" />
          <span>3</span><b>생각</b>
        </div>
      </header>

      <section className="student-task__section" aria-labelledby="student-info-title">
        <div className="student-task__section-title">
          <span>1</span>
          <div><p>먼저 적어요</p><h3 id="student-info-title">나는 누구인가요?</h3></div>
        </div>
        <div className="student-info-grid">
          <label>
            <span>학교 <small>선택</small></span>
            <input value={draft.school} onChange={(event) => updateDraft("school", event.target.value)} placeholder="○○초" autoComplete="organization" />
          </label>
          <label>
            <span>학년</span>
            <input value="5학년" readOnly aria-readonly="true" />
          </label>
          <label>
            <span>반</span>
            <input value={draft.className} onChange={(event) => updateDraft("className", event.target.value)} placeholder="예: 2" inputMode="numeric" />
          </label>
          <label>
            <span>이름</span>
            <input value={draft.studentName} onChange={(event) => updateDraft("studentName", event.target.value)} placeholder="내 이름" autoComplete="name" />
          </label>
          <label>
            <span>모둠</span>
            <select value={draft.groupNumber} onChange={(event) => updateDraft("groupNumber", event.target.value)}>
              <option value="">선택</option>
              {[1, 2, 3, 4, 5, 6].map((number) => <option value={number} key={number}>{number}모둠</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="student-task__section" aria-labelledby="heritage-choice-title">
        <div className="student-task__section-title">
          <span>2</span>
          <div><p>사진을 눌러요</p><h3 id="heritage-choice-title">가장 궁금한 문화유산은 무엇인가요?</h3></div>
        </div>
        <div className="student-heritage-grid">
          {threeKingdomsGroups.map((group) => {
            const image = heritageImageById.get(group.id)!;
            const selected = draft.heritageId === group.id;
            return (
              <button
                className={`student-heritage-card${selected ? " is-selected" : ""}`}
                type="button"
                aria-pressed={selected}
                onClick={() => updateDraft("heritageId", group.id)}
                key={group.id}
              >
                <span className="student-heritage-card__photo">
                  <img src={image.src} alt={image.alt} />
                  {selected ? <span className="student-heritage-card__check"><Icon name="check" size={18} />선택</span> : null}
                </span>
                <span className="student-heritage-card__copy">
                  <small>{group.category}</small>
                  <strong>{group.heritage}</strong>
                  <span>{group.inquiryQuestion}</span>
                </span>
              </button>
            );
          })}
        </div>
        <details className="student-task__credits">
          <summary>사진 출처 보기</summary>
          <ul>{heritageImages.map((image) => <li key={image.id}><a href={image.href} target="_blank" rel="noreferrer">{heritageGroupById.get(image.id)?.heritage} · {image.credit}</a></li>)}</ul>
        </details>
      </section>

      <section className="student-task__section" aria-labelledby="first-thought-title">
        <div className="student-task__section-title">
          <span>3</span>
          <div><p>내 생각을 남겨요</p><h3 id="first-thought-title">처음 본 그대로 기록해요</h3></div>
        </div>
        <div className="student-thought-grid">
          <label>
            <span>사진에서 발견한 것</span>
            <textarea value={draft.observation} onChange={(event) => updateDraft("observation", event.target.value)} maxLength={160} placeholder="모양, 색, 사람, 동물처럼 사진에서 보이는 것을 적어요." rows={4} />
            <small>{draft.observation.length} / 160자</small>
          </label>
          <label>
            <span>가장 궁금한 점</span>
            <textarea value={draft.question} onChange={(event) => updateDraft("question", event.target.value)} maxLength={160} placeholder="왜 만들었을까? 누가 사용했을까?처럼 질문으로 적어요." rows={4} />
            <small>{draft.question.length} / 160자</small>
          </label>
        </div>

        <fieldset className="student-role-picker">
          <legend>오늘 내가 맡을 역할</legend>
          <div>
            {studentRoles.map((role) => (
              <label className={draft.role === role ? "is-selected" : ""} key={role}>
                <input type="radio" name="student-role" value={role} checked={draft.role === role} onChange={() => updateDraft("role", role)} />
                <span>{role}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <footer className="student-task__save">
        <div aria-live="polite">
          {errors.length > 0 ? <p className="student-task__error"><strong>아직 적지 않은 곳:</strong> {errors.join(", ")}</p> : null}
          {saveMessage ? <p className="student-task__message"><Icon name="check" size={18} />{saveMessage}</p> : <p>다 적은 뒤 저장해요. 다음에 다시 열어도 이어서 볼 수 있어요.</p>}
        </div>
        <button type="submit"><Icon name="check" size={20} />1차시 활동 저장하기</button>
      </footer>
    </form>
  );
}
