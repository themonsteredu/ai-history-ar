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
  encodeStudentToolSettings,
  decodeStudentToolSettings,
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
  it('transfers lesson links to a different device without including teacher sources', () => {
    const settings = createDefaultExternalToolSettings();
    settings.lessons[4].studentUrl = 'https://docs.google.com/spreadsheets/d/class/edit';
    settings.lessons[4].teacherSourceUrl = 'https://docs.google.com/spreadsheets/d/teacher-only/edit';
    const encoded = encodeStudentToolSettings(settings);
    expect(atob(encoded)).not.toContain('teacher-only');
    const imported = decodeStudentToolSettings(encoded);
    expect(imported.lessons[4].studentUrl).toContain('/class/edit');
    expect(imported.lessons.every(lesson => lesson.teacherSourceUrl === '')).toBe(true);
  });
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
    defaults.lessons[5].teacherSourceUrl = "https://docs.google.com/document/d/example/edit";
    writeExternalToolSettings(storage, defaults);

    const restored = readExternalToolSettings(storage);
    expect(restored.lessons).toHaveLength(10);
    expect(restored.lessons[5].teacherSourceUrl).toContain("docs.google.com");
    expect(getResolvedExternalTool(6, restored).toolName).toBe("CODAP · 역사 데이터 시각화");
    expect(getResolvedExternalTool(6, restored).launchMode).toBe("embed");
  });

  it("drops unsafe imported URLs and reports required setup", () => {
    const normalized = normalizeExternalToolSettings({
      version: 1,
      lessons: [{ lessonId: 6, enabled: true, launchMode: "embed", studentUrl: "https://example.com", embedUrl: "https://example.com", teacherSourceUrl: "", submissionUrl: "", resultBoardUrl: "" }],
    });
    expect(normalized.lessons[5].studentUrl).toBe("");
    expect(normalized.lessons[5].embedUrl).toBe("");
    expect(validateExternalToolSetting(normalized.lessons[5])).toContain("임베드 URL을 입력하거나 새 탭 방식으로 바꾸세요.");
  });
});
