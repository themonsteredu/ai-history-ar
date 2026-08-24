export type LessonDownloadKind = "student" | "teacher" | "answer" | "bundle";

const publicBasePath = import.meta.env.BASE_URL.replace(/\/$/, "");

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
  return `${publicBasePath}/downloads/${eraId}/lesson-${lessonNumber(lessonId)}-${fileLabel}.${extension}`;
}

export function eraBundlePath(eraId: string) {
  return `${publicBasePath}/downloads/${eraId}/${eraId}-all-materials.zip`;
}
