import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  clearClassArBundle,
  compileClassCards,
  fileToCardImageDataUrl,
  loadClassArBundle,
  MAX_CLASS_CARDS,
  parseClassArBundle,
  saveClassArBundle,
  serializeClassArBundle,
  bytesToBase64,
  type ClassArBundle,
  type ClassArCard,
} from "../ar/classCards";

interface CardDraft {
  id: string;
  name: string;
  caption: string;
  unknownNote: string;
  imageDataUrl: string;
}

function newCardDraft(): CardDraft {
  return { id: `card-${Date.now()}-${Math.floor(Math.random() * 10000)}`, name: "", caption: "", unknownNote: "", imageDataUrl: "" };
}

function draftsFromBundle(bundle: ClassArBundle): CardDraft[] {
  return bundle.cards.map((card) => ({ ...card }));
}

export function ClassArCardStudio() {
  const [drafts, setDrafts] = useState<CardDraft[]>([newCardDraft()]);
  const [bundle, setBundle] = useState<ClassArBundle | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadClassArBundle().then((stored) => {
      if (cancelled || !stored) return;
      setBundle(stored);
      setDrafts(draftsFromBundle(stored));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const readyCards = drafts.filter((draft) => draft.imageDataUrl && draft.name.trim().length > 0);
  const compiling = progress !== null;

  function updateDraft(cardId: string, patch: Partial<CardDraft>) {
    setDrafts((current) => current.map((draft) => (draft.id === cardId ? { ...draft, ...patch } : draft)));
  }

  function addCard() {
    setDrafts((current) => (current.length >= MAX_CLASS_CARDS ? current : [...current, newCardDraft()]));
  }

  function removeCard(cardId: string) {
    setDrafts((current) => (current.length <= 1 ? current : current.filter((draft) => draft.id !== cardId)));
  }

  async function attachImage(cardId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await fileToCardImageDataUrl(file);
      updateDraft(cardId, { imageDataUrl: dataUrl });
      setMessage("");
    } catch {
      setMessage("사진을 읽지 못했습니다. 다른 사진으로 다시 시도해 주세요.");
    }
  }

  async function compileAndSave() {
    if (readyCards.length === 0 || compiling) return;
    setMessage("");
    setProgress(0);
    try {
      const mindBytes = await compileClassCards(readyCards.map((card) => card.imageDataUrl), setProgress);
      const nextBundle: ClassArBundle = {
        version: 1,
        compiledAt: Date.now(),
        cards: readyCards.map((card): ClassArCard => ({
          id: card.id,
          name: card.name.trim(),
          caption: card.caption.trim(),
          unknownNote: card.unknownNote.trim(),
          imageDataUrl: card.imageDataUrl,
        })),
        mindBase64: bytesToBase64(mindBytes),
      };
      await saveClassArBundle(nextBundle);
      setBundle(nextBundle);
      setMessage(`우리 반 카드 ${nextBundle.cards.length}장을 AR 표적으로 저장했습니다. 위 카메라 AR에서 ‘우리 반 카드’를 선택하세요.`);
    } catch {
      setMessage("카드 변환에 실패했습니다. 사진이 너무 흐리지 않은지 확인하고 다시 시도해 주세요.");
    } finally {
      setProgress(null);
    }
  }

  function exportBundle() {
    if (!bundle) return;
    const blob = new Blob([serializeClassArBundle(bundle)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "our-class-ar-cards.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importBundle(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const parsed = parseClassArBundle(await file.text());
    if (!parsed) {
      setMessage("묶음 파일을 읽지 못했습니다. 이 앱에서 내려받은 파일인지 확인해 주세요.");
      return;
    }
    await saveClassArBundle(parsed);
    setBundle(parsed);
    setDrafts(draftsFromBundle(parsed));
    setMessage(`묶음 파일에서 카드 ${parsed.cards.length}장을 불러왔습니다.`);
  }

  async function removeBundle() {
    await clearClassArBundle();
    setBundle(null);
    setMessage("이 기기에서 우리 반 카드를 지웠습니다.");
  }

  return (
    <section className="class-card-studio" data-testid="class-ar-card-studio">
      <div className="core-mission" aria-label="활동 방법">
        <span>우리 반 AR 카드 만들기</span>
        <strong>학생이 그린 카드를 사진으로 등록하면, 그 카드가 진짜 AR 표적이 됩니다.</strong>
        <p>카드를 밝은 곳에서 정면으로 찍어 올리고 ‘AR 표적으로 변환’을 누르세요. 변환한 카드는 이 기기의 카메라 AR에서 바로 인식됩니다.</p>
      </div>

      <div className="class-card-studio__tips">
        <strong>잘 인식되는 카드 그림</strong>
        <ul>
          <li>선과 무늬가 많고 진하게 그린 그림</li>
          <li>카드를 사진에 가득 차게, 그림자 없이 촬영</li>
          <li>글자만 있는 카드보다 그림이 큰 카드</li>
        </ul>
      </div>

      <div className="class-card-studio__slots">
        {drafts.map((draft, index) => (
          <article data-testid={`class-card-slot-${index}`} key={draft.id}>
            <header>
              <span>카드 {index + 1}</span>
              {drafts.length > 1 ? <button aria-label={`카드 ${index + 1} 삭제`} onClick={() => removeCard(draft.id)} type="button">지우기</button> : null}
            </header>
            <label className={draft.imageDataUrl ? "class-card-studio__photo has-image" : "class-card-studio__photo"}>
              {draft.imageDataUrl ? <img alt={`${draft.name || `카드 ${index + 1}`} 등록 사진`} src={draft.imageDataUrl} /> : <span>카드 사진 올리기</span>}
              <input accept="image/*" onChange={(event) => attachImage(draft.id, event)} type="file" />
            </label>
            <label>
              <span>카드 이름 (유산 이름)</span>
              <input maxLength={20} onChange={(event) => updateDraft(draft.id, { name: event.target.value })} placeholder="예: 무령왕릉" type="text" value={draft.name} />
            </label>
            <label>
              <span>한 문장 해설 (자료로 확인한 것)</span>
              <input maxLength={60} onChange={(event) => updateDraft(draft.id, { caption: event.target.value })} placeholder="예: 지석 덕분에 무덤 주인을 알 수 있었다" type="text" value={draft.caption} />
            </label>
            <label>
              <span>아직 모름 한 가지</span>
              <input maxLength={60} onChange={(event) => updateDraft(draft.id, { unknownNote: event.target.value })} placeholder="예: 제사의 정확한 절차는 아직 모른다" type="text" value={draft.unknownNote} />
            </label>
          </article>
        ))}
      </div>

      <div className="class-card-studio__actions">
        <button className="button button--outline" disabled={drafts.length >= MAX_CLASS_CARDS || compiling} onClick={addCard} type="button">카드 추가 ({drafts.length}/{MAX_CLASS_CARDS})</button>
        <button className="button button--primary" data-testid="compile-class-cards" disabled={readyCards.length === 0 || compiling} onClick={compileAndSave} type="button">
          {compiling ? `변환 중 ${progress}%` : `카드 ${readyCards.length}장 AR 표적으로 변환`}
        </button>
      </div>

      {compiling ? (
        <div aria-label="변환 진행률" className="class-card-studio__progress" role="progressbar" aria-valuemax={100} aria-valuemin={0} aria-valuenow={progress ?? 0}>
          <i style={{ width: `${progress}%` }} />
        </div>
      ) : null}

      {message ? <p className="class-card-studio__message" role="status">{message}</p> : null}

      <div className="class-card-studio__bundle">
        <div>
          <span>부스 태블릿 준비</span>
          <strong>{bundle ? `우리 반 카드 ${bundle.cards.length}장 사용 중` : "아직 변환한 카드가 없습니다"}</strong>
          <small>변환은 기기마다 저장됩니다. 묶음 파일을 내려받아 부스 태블릿에서 불러오면 다시 변환하지 않아도 됩니다.</small>
        </div>
        <div className="class-card-studio__bundle-actions">
          <button className="button button--outline" disabled={!bundle} onClick={exportBundle} type="button">묶음 파일 내려받기</button>
          <button className="button button--outline" onClick={() => importInputRef.current?.click()} type="button">묶음 파일 불러오기</button>
          <button className="button button--outline" disabled={!bundle} onClick={removeBundle} type="button">이 기기에서 지우기</button>
          <input accept="application/json" hidden onChange={importBundle} ref={importInputRef} type="file" />
        </div>
      </div>
    </section>
  );
}
