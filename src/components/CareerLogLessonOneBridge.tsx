import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { lessonTwoStatementSets } from "../content/three-kingdoms/webActivities";

const DEFAULT_HUB_INGEST = "https://hub.moakit.ai/api/career-log/ingest";
const STUDENT_KEY = "moakit-career-student-id-v1";
const EVENT_KEY_PREFIX = "moakit-career-history-ai-01-event:";
const LESSON_TWO_STORAGE_KEY = "moa-history-ar:three-kingdoms:lesson-2:judgement:v1";
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let memoryStudentId = "";

interface LessonTwoRecord {
  groupId: number;
  marks: Record<string, string>;
  sources: Record<string, string>;
}

function browserStorage(kind: "localStorage" | "sessionStorage") {
  try { return window[kind]; } catch { return null; }
}

function storageGet(storage: Storage | null, key: string) {
  try { return storage?.getItem(key) ?? null; } catch { return null; }
}

function storageSet(storage: Storage | null, key: string, value: string) {
  try { storage?.setItem(key, value); } catch {}
}

export function getOrCreateStudentId(candidate = "") {
  const localStorage = browserStorage("localStorage");
  const sessionStorage = browserStorage("sessionStorage");
  if (UUID_V4_RE.test(candidate)) {
    const hubStudentId = candidate.toLowerCase();
    memoryStudentId = hubStudentId;
    storageSet(localStorage, STUDENT_KEY, hubStudentId);
    storageSet(sessionStorage, STUDENT_KEY, hubStudentId);
    return hubStudentId;
  }
  const local = storageGet(localStorage, STUDENT_KEY);
  const session = storageGet(sessionStorage, STUDENT_KEY);
  const existing = [local, session, memoryStudentId].find((value) => UUID_V4_RE.test(value || ""));
  if (existing) return existing!.toLowerCase();
  const created = window.crypto.randomUUID().toLowerCase();
  memoryStudentId = created;
  storageSet(localStorage, STUDENT_KEY, created);
  storageSet(sessionStorage, STUDENT_KEY, created);
  return created;
}

function safeEndpoint(raw: string | null) {
  if (!raw) return DEFAULT_HUB_INGEST;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return DEFAULT_HUB_INGEST;
    if (url.hostname === "hub.moakit.ai" || url.hostname.endsWith("-themonsteredu.vercel.app")) return url.toString();
  } catch {}
  return DEFAULT_HUB_INGEST;
}

function selectedHeritage() {
  const card = document.querySelector(".artifact-explorer__card.is-selected");
  const heritage = card?.querySelector("strong")?.textContent?.trim() || "";
  const question = document.querySelector(".artifact-explorer__spotlight p")?.textContent?.trim().replace(/^“|”$/g, "") || "";
  if (!heritage || !question) return null;
  return { heritage, question };
}

export function readLessonTwoRecord(raw: string | null): LessonTwoRecord | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LessonTwoRecord;
    if (!Number.isInteger(parsed.groupId) || !parsed.marks || !parsed.sources) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isLessonTwoComplete(record: LessonTwoRecord | null) {
  if (!record) return false;
  const set = lessonTwoStatementSets.find((candidate) => candidate.groupId === record.groupId);
  if (!set) return false;
  return set.statements.every((statement) => Boolean(record.marks[statement.id]) && Boolean(record.sources[statement.id]?.trim()));
}

function lessonTwoDetails(record: LessonTwoRecord) {
  const set = lessonTwoStatementSets.find((candidate) => candidate.groupId === record.groupId);
  if (!set) throw new Error("2차시 모둠 기록을 찾을 수 없습니다.");
  return {
    process: `${set.heritage}에 관한 AI 문장 6개를 판단하고 문장별 확인 출처를 기록함`,
    artifact: `${record.groupId}모둠 ${set.heritage} · AI 문장 판단 6개와 확인 출처 6개`,
    rawData: {
      lesson: 2,
      era: "three-kingdoms",
      activity: "ai-statement-judgement",
      group_id: record.groupId,
      heritage: set.heritage,
      ai_question: set.aiQuestion,
      judgements: set.statements.map((statement) => ({
        statement_id: statement.id,
        statement: statement.text,
        mark: record.marks[statement.id],
        source: record.sources[statement.id].trim(),
      })),
    },
  };
}

export function CareerLogLessonOneBridge() {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const boardCode = params.get("hub_code")?.trim().toLowerCase() || "";
  const inboundStudentId = params.get("student_id")?.trim() || "";
  const endpoint = safeEndpoint(params.get("hub_ingest"));
  const lesson = location.pathname === "/three-kingdoms/lesson/1" ? 1 : location.pathname === "/three-kingdoms/lesson/2" ? 2 : null;
  const active = lesson !== null && params.get("view") === "activity" && /^[a-z0-9]{4,10}$/.test(boardCode) && UUID_V4_RE.test(inboundStudentId);
  const [reflection, setReflection] = useState("");
  const [lessonTwoRecord, setLessonTwoRecord] = useState<LessonTwoRecord | null>(() => readLessonTwoRecord(storageGet(browserStorage("localStorage"), LESSON_TWO_STORAGE_KEY)));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (lesson !== 2) return;
    const refresh = () => window.setTimeout(() => setLessonTwoRecord(readLessonTwoRecord(storageGet(browserStorage("localStorage"), LESSON_TWO_STORAGE_KEY))), 0);
    window.addEventListener("click", refresh);
    window.addEventListener("input", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("click", refresh);
      window.removeEventListener("input", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [lesson]);

  useEffect(() => {
    setStatus("idle");
    setMessage("");
  }, [boardCode, lesson]);

  if (!active || lesson === null) return null;
  const lessonTwoComplete = isLessonTwoComplete(lessonTwoRecord);

  async function save() {
    if (status === "saving" || (lesson === 2 && (!lessonTwoRecord || !lessonTwoComplete))) return;
    const lessonOne = selectedHeritage();
    const lessonTwo = lessonTwoRecord ? lessonTwoDetails(lessonTwoRecord) : null;
    if (lesson === 1 && !lessonOne) {
      setStatus("error");
      setMessage("먼저 문화유산을 선택하고 실제 질문 카드를 완성해 주세요.");
      return;
    }
    setStatus("saving");
    setMessage("");
    try {
      const studentId = getOrCreateStudentId(inboundStudentId);
      const eventKey = `${EVENT_KEY_PREFIX}${boardCode}:lesson-${lesson}`;
      const localStorage = browserStorage("localStorage");
      const sessionStorage = browserStorage("sessionStorage");
      let sourceEventId = storageGet(localStorage, eventKey) || storageGet(sessionStorage, eventKey);
      if (!sourceEventId) {
        sourceEventId = `history-ai-01:${boardCode}:lesson-${lesson}:${window.crypto.randomUUID()}`;
        storageSet(localStorage, eventKey, sourceEventId);
        storageSet(sessionStorage, eventKey, sourceEventId);
      }
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          board_code: boardCode,
          student_id: studentId,
          process: lesson === 1 ? "삼국·가야 문화유산을 관찰하고 모둠에서 조사할 데이터 질문을 정함" : lessonTwo?.process,
          artifact: lesson === 1 ? `모둠 데이터 질문 · ${lessonOne!.heritage}: ${lessonOne!.question}` : lessonTwo?.artifact,
          reflection: reflection.trim() || null,
          source_event_id: sourceEventId,
          raw_data: lesson === 1
            ? { lesson: 1, era: "three-kingdoms", selected_heritage: lessonOne!.heritage, data_question: lessonOne!.question, activity: "heritage-question-card" }
            : lessonTwo?.rawData,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || `HTTP ${response.status}`);
      setStatus("saved");
      setMessage(result?.duplicate ? "이미 저장된 활동 기록입니다." : `${lesson}차시 활동이 Career Log에 저장되었습니다.`);
    } catch (error) {
      console.error("Career Log save failed", error);
      setStatus("error");
      setMessage("기록 저장에 실패했습니다. 수업 코드를 확인하고 다시 시도하세요.");
    }
  }

  return (
    <aside aria-label="Career Log 기록" style={{ background: "#fff", border: "1px solid #d9e5e2", borderRadius: 16, margin: "24px auto", maxWidth: 920, padding: 20 }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>MOAKIT CAREER LOG · {lesson}차시</p>
      <h2 style={{ margin: "6px 0 8px" }}>{lesson === 1 ? "오늘 만든 질문 카드를 기록해요" : "오늘의 판단과 출처를 기록해요"}</h2>
      <p style={{ margin: "0 0 14px" }}>
        {lesson === 1
          ? "위에서 관찰한 문화유산과 데이터 질문이 자동으로 함께 저장됩니다."
          : lessonTwoComplete
            ? "6개 문장의 판단과 확인 출처가 모두 준비되었습니다."
            : "위 활동에서 6개 문장의 판단과 확인 출처를 모두 채우면 저장할 수 있습니다."}
      </p>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontWeight: 700 }}>오늘의 한 줄 생각 <small>(선택)</small></span>
        <input maxLength={300} onChange={(event) => setReflection(event.target.value)} placeholder={lesson === 1 ? "예: 사진만 보고는 알 수 없는 정보도 있다는 걸 알았다." : "예: AI가 자신 있게 말해도 출처 확인이 필요하다는 걸 알았다."} type="text" value={reflection} />
      </label>
      <button className="button button--primary" disabled={status === "saving" || status === "saved" || (lesson === 2 && !lessonTwoComplete)} onClick={save} style={{ marginTop: 14 }} type="button">
        {status === "saving" ? "저장 중…" : status === "saved" ? "저장 완료" : lesson === 1 ? "질문 카드 저장 완료" : "판단 활동 저장 완료"}
      </button>
      {message ? <p aria-live="polite" style={{ marginBottom: 0 }}>{message}</p> : null}
    </aside>
  );
}
