import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const DEFAULT_HUB_INGEST = "https://hub.moakit.ai/api/career-log/ingest";
const STUDENT_KEY = "moakit-career-student-id-v1";
const EVENT_KEY_PREFIX = "moakit-career-history-ai-01-event:";

function getOrCreateStudentId() {
  const current = window.localStorage.getItem(STUDENT_KEY);
  if (current && /^[0-9a-f-]{36}$/i.test(current)) return current;
  const created = window.crypto.randomUUID();
  window.localStorage.setItem(STUDENT_KEY, created);
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
  const heritage = card?.querySelector("strong")?.textContent?.trim() || "문화유산";
  const question = document.querySelector(".artifact-explorer__spotlight p")?.textContent?.trim().replace(/^“|”$/g, "") || "문화유산을 비교하려면 어떤 정보를 모아야 할까?";
  return { heritage, question };
}

export function CareerLogLessonOneBridge() {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const boardCode = params.get("hub_code")?.trim() || "";
  const endpoint = safeEndpoint(params.get("hub_ingest"));
  const active = location.pathname === "/three-kingdoms/lesson/1" && /^\d{6}$/.test(boardCode);
  const [reflection, setReflection] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  if (!active) return null;

  async function save() {
    if (status === "saving") return;
    setStatus("saving"); setMessage("");
    const studentId = getOrCreateStudentId();
    const { heritage, question } = selectedHeritage();
    const eventKey = `${EVENT_KEY_PREFIX}${boardCode}`;
    let sourceEventId = window.localStorage.getItem(eventKey);
    if (!sourceEventId) {
      sourceEventId = `history-ai-01:${boardCode}:${window.crypto.randomUUID()}`;
      window.localStorage.setItem(eventKey, sourceEventId);
    }
    try {
      const response = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          board_code: boardCode, student_id: studentId,
          process: "삼국·가야 문화유산을 관찰하고 모둠에서 조사할 데이터 질문을 정함",
          artifact: `모둠 데이터 질문 · ${heritage}: ${question}`,
          reflection: reflection.trim() || null, source_event_id: sourceEventId,
          raw_data: { lesson: 1, era: "three-kingdoms", selected_heritage: heritage, data_question: question, activity: "heritage-question-card" },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || `HTTP ${response.status}`);
      setStatus("saved");
      setMessage(result?.duplicate ? "이미 저장된 질문 카드입니다." : "오늘의 질문 카드가 Career Log에 저장되었습니다.");
    } catch (error) {
      console.error("Career Log save failed", error);
      setStatus("error"); setMessage("기록 저장에 실패했습니다. 수업 코드를 확인하고 다시 시도하세요.");
    }
  }

  return (
    <aside aria-label="Career Log 기록" style={{ background: "#fff", border: "1px solid #d9e5e2", borderRadius: 16, margin: "24px auto", maxWidth: 920, padding: 20 }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>MOAKIT CAREER LOG · 1차시</p>
      <h2 style={{ margin: "6px 0 8px" }}>오늘 만든 질문 카드를 기록해요</h2>
      <p style={{ margin: "0 0 14px" }}>위에서 관찰한 문화유산과 데이터 질문이 자동으로 함께 저장됩니다.</p>
      <label style={{ display: "grid", gap: 6 }}><span style={{ fontWeight: 700 }}>오늘의 한 줄 생각 <small>(선택)</small></span><input maxLength={300} onChange={(event) => setReflection(event.target.value)} placeholder="예: 사진만 보고는 알 수 없는 정보도 있다는 걸 알았다." type="text" value={reflection} /></label>
      <button className="button button--primary" disabled={status === "saving" || status === "saved"} onClick={save} style={{ marginTop: 14 }} type="button">{status === "saving" ? "저장 중…" : status === "saved" ? "저장 완료" : "질문 카드 저장 완료"}</button>
      {message ? <p aria-live="polite" style={{ marginBottom: 0 }}>{message}</p> : null}
    </aside>
  );
}
