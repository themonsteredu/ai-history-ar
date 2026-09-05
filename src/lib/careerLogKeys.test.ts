import { describe, expect, it } from "vitest";
import { lessonTwoStorageKey } from "./careerLogKeys";

describe("lessonTwoStorageKey", () => {
  it("scopes Hub drafts by board and random student UUID", () => {
    const first = lessonTwoStorageKey("ABCD12", "11111111-1111-4111-8111-111111111111");
    const second = lessonTwoStorageKey("abcd12", "22222222-2222-4222-8222-222222222222");
    expect(first).toContain(":abcd12:11111111-1111-4111-8111-111111111111");
    expect(second).not.toBe(first);
  });
});
