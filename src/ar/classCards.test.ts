import { describe, expect, it } from "vitest";
import {
  base64ToBytes,
  bytesToBase64,
  MAX_CLASS_CARDS,
  parseClassArBundle,
  serializeClassArBundle,
  type ClassArBundle,
} from "./classCards";

const validBundle: ClassArBundle = {
  version: 1,
  compiledAt: 1756200000000,
  cards: [
    { id: "card-1", name: "무령왕릉", caption: "지석으로 무덤 주인을 확인했다", unknownNote: "제사 절차는 아직 모른다", imageDataUrl: "data:image/jpeg;base64,QUJD" },
    { id: "card-2", name: "첨성대", caption: "", unknownNote: "", imageDataUrl: "data:image/png;base64,REVG" },
  ],
  mindBase64: bytesToBase64(new Uint8Array([1, 2, 3, 250, 251, 252])),
};

describe("class AR card bundle", () => {
  it("round-trips bytes through base64", () => {
    const bytes = new Uint8Array([0, 1, 127, 128, 255, 42]);
    expect([...base64ToBytes(bytesToBase64(bytes))]).toEqual([...bytes]);
  });

  it("round-trips a bundle through serialize and parse", () => {
    const parsed = parseClassArBundle(serializeClassArBundle(validBundle));
    expect(parsed).toEqual(validBundle);
  });

  it("rejects malformed bundles", () => {
    expect(parseClassArBundle("not json")).toBeNull();
    expect(parseClassArBundle(JSON.stringify({ ...validBundle, version: 2 }))).toBeNull();
    expect(parseClassArBundle(JSON.stringify({ ...validBundle, mindBase64: "" }))).toBeNull();
    expect(parseClassArBundle(JSON.stringify({ ...validBundle, cards: [] }))).toBeNull();
    expect(parseClassArBundle(JSON.stringify({
      ...validBundle,
      cards: [{ ...validBundle.cards[0], imageDataUrl: "https://example.com/외부주소.jpg" }],
    }))).toBeNull();
    expect(parseClassArBundle(JSON.stringify({
      ...validBundle,
      cards: Array.from({ length: MAX_CLASS_CARDS + 1 }, (_, index) => ({ ...validBundle.cards[0], id: `card-${index}` })),
    }))).toBeNull();
  });
});
