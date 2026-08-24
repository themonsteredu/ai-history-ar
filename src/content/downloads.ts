export type LessonDownloadKind = "student" | "teacher" | "answer" | "bundle";

function lessonNumber(lessonId: number) {
  return String(lessonId).padStart(2, "0");
}

export function lessonDownloadPath(
  eraId: string,
  lessonId: number,
  kind: LessonDownloadKind,
) {
  const fileLabel = kind === "bundle" ? "all" : kind;
  const extension = kind === "bundle" ? "zip" : "pdf";
  return `/downloads/${eraId}/lesson-${lessonNumber(lessonId)}-${fileLabel}.${extension}`;
}

export function eraBundlePath(eraId: string) {
  return `/downloads/${eraId}/${eraId}-all-materials.zip`;
}
