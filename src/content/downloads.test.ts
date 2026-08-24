import { describe, expect, it } from "vitest";
import { eraBundlePath, lessonDownloadPath } from "./downloads";

describe("printable download paths", () => {
  it("builds zero-padded lesson PDF and ZIP paths", () => {
    expect(lessonDownloadPath("three-kingdoms", 1, "student"))
      .toBe("/downloads/three-kingdoms/lesson-01-student.pdf");
    expect(lessonDownloadPath("joseon", 10, "teacher"))
      .toBe("/downloads/joseon/lesson-10-teacher.pdf");
    expect(lessonDownloadPath("joseon", 10, "answer"))
      .toBe("/downloads/joseon/lesson-10-answer.pdf");
    expect(lessonDownloadPath("joseon", 7, "bundle"))
      .toBe("/downloads/joseon/lesson-07-all.zip");
  });

  it("builds the era bundle path", () => {
    expect(eraBundlePath("joseon"))
      .toBe("/downloads/joseon/joseon-all-materials.zip");
  });
});
