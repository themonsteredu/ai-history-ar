export const MAX_CLASS_CARDS = 6;
export const CLASS_CARDS_UPDATED_EVENT = "ai-history:class-ar-cards-updated";

export interface ClassArCard {
  id: string;
  name: string;
  caption: string;
  unknownNote: string;
  imageDataUrl: string;
}

export interface ClassArBundle {
  version: 1;
  compiledAt: number;
  cards: ClassArCard[];
  mindBase64: string;
}

export function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function isValidCard(value: unknown): value is ClassArCard {
  if (!value || typeof value !== "object") return false;
  const card = value as Record<string, unknown>;
  return (
    typeof card.id === "string" && card.id.length > 0 &&
    typeof card.name === "string" && card.name.trim().length > 0 &&
    typeof card.caption === "string" &&
    typeof card.unknownNote === "string" &&
    typeof card.imageDataUrl === "string" && card.imageDataUrl.startsWith("data:image/")
  );
}

export function parseClassArBundle(json: string): ClassArBundle | null {
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    if (parsed.version !== 1) return null;
    if (typeof parsed.mindBase64 !== "string" || parsed.mindBase64.length === 0) return null;
    if (!Array.isArray(parsed.cards) || parsed.cards.length === 0 || parsed.cards.length > MAX_CLASS_CARDS) return null;
    if (!parsed.cards.every(isValidCard)) return null;
    return {
      version: 1,
      compiledAt: typeof parsed.compiledAt === "number" ? parsed.compiledAt : 0,
      cards: parsed.cards,
      mindBase64: parsed.mindBase64,
    };
  } catch {
    return null;
  }
}

export function serializeClassArBundle(bundle: ClassArBundle) {
  return JSON.stringify(bundle);
}

const DB_NAME = "ai-history-ar";
const STORE_NAME = "ar";
const BUNDLE_KEY = "class-cards:v1";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadClassArBundle(): Promise<ClassArBundle | null> {
  try {
    const database = await openDatabase();
    return await new Promise((resolve) => {
      const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(BUNDLE_KEY);
      request.onsuccess = () => {
        const stored = request.result;
        resolve(typeof stored === "string" ? parseClassArBundle(stored) : null);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveClassArBundle(bundle: ClassArBundle) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(serializeClassArBundle(bundle), BUNDLE_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  window.dispatchEvent(new Event(CLASS_CARDS_UPDATED_EVENT));
}

export async function clearClassArBundle() {
  try {
    const database = await openDatabase();
    await new Promise<void>((resolve) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(BUNDLE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    });
  } finally {
    window.dispatchEvent(new Event(CLASS_CARDS_UPDATED_EVENT));
  }
}

const CARD_IMAGE_MAX_SIDE = 900;

export function fileToCardImageDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, CARD_IMAGE_MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("이미지를 처리할 수 없습니다."));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("이미지 파일을 읽지 못했습니다."));
    };
    image.src = objectUrl;
  });
}

function loadImageElement(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("카드 이미지를 불러오지 못했습니다."));
    image.src = source;
  });
}

export async function compileClassCards(
  imageDataUrls: string[],
  onProgress: (percent: number) => void,
): Promise<Uint8Array> {
  const images = await Promise.all(imageDataUrls.map(loadImageElement));
  const { Compiler } = await import("mind-ar/dist/mindar-image.prod.js");
  const compiler = new Compiler();
  await compiler.compileImageTargets(images, (progress: number) => onProgress(Math.min(100, Math.round(progress))));
  return new Uint8Array(compiler.exportData());
}

export function mindBytesToObjectUrl(bundle: ClassArBundle) {
  const bytes = base64ToBytes(bundle.mindBase64);
  return URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: "application/octet-stream" }));
}
