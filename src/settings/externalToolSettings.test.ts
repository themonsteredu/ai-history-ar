import { describe, expect, it } from "vitest";
import { threeKingdomsExternalTools } from "../content/three-kingdoms/externalTools";
import {
  createDefaultExternalToolSettings,
  getResolvedExternalTool,
  isAllowedExternalUrl,
  normalizeExternalToolSettings,
  readExternalToolSettings,
  validateExternalToolSetting,
  writeExternalToolSettings,
} from "./externalToolSettings";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe("external tool settings", () => {
  it("defines one activity for every Three Kingdoms lesson", () => {
    expect(threeKingdomsExternalTools).toHaveLength(10);
    expect(threeKingdomsExternalTools.map((tool) => tool.lessonId)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(threeKingdomsExternalTools[0].launchMode).toBe("internal");
    expect(threeKingdomsExternalTools[9].launchMode).toBe("internal");
  });

  it("accepts only HTTPS links from each tool's allowed domains", () => {
    expect(isAllowedExternalUrl("https://docs.google.com/forms/d/example/viewform", ["docs.google.com"])).toBe(true);
    expect(isAllowedExternalUrl("http://docs.google.com/forms/d/example/viewform", ["docs.google.com"])).toBe(false);
    expect(isAllowedExternalUrl("https://example.com/fake-form", ["docs.google.com"])).toBe(false);
  });

  it("stores complete settings and restores missing lessons from defaults", () => {
    const storage = new MemoryStorage();
    const defaults = createDefaultExternalToolSettings();
    defaults.lessons[2].studentUrl = "https://docs.google.com/forms/d/example/viewform";
    writeExternalToolSettings(storage, defaults);

    const restored = readExternalToolSettings(storage);
    expect(restored.lessons).toHaveLength(10);
    expect(restored.lessons[2].studentUrl).toContain("docs.google.com");
    expect(getResolvedExternalTool(2, restored).toolName).toBe("학급 데이터 약속 만들기");
    expect(getResolvedExternalTool(2, restored).launchMode).toBe("internal");
  });

  it("drops unsafe imported URLs and reports required setup", () => {
    const normalized = normalizeExternalToolSettings({
      version: 1,
      lessons: [{ lessonId: 3, enabled: true, launchMode: "embed", studentUrl: "https://example.com", embedUrl: "", teacherSourceUrl: "", submissionUrl: "", resultBoardUrl: "" }],
    });
    expect(normalized.lessons[2].studentUrl).toBe("");
    expect(validateExternalToolSetting(normalized.lessons[2])).toContain("학생 실행 URL이 필요합니다.");
  });
});
