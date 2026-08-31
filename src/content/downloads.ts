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

export function lessonPptDownloadPath(eraId: string, lessonId: number) {
  return `${publicBasePath}/downloads/${eraId}/lesson-${lessonNumber(lessonId)}-teaching.pptx`;
}

export function lessonGroupDownloadPath(
  eraId: string,
  lessonId: number,
  groupId: number,
  fileSlug: string,
) {
  return `${publicBasePath}/downloads/${eraId}/lesson-${lessonNumber(lessonId)}-group-${String(groupId).padStart(2, "0")}-${fileSlug}.pdf`;
}

export function eraBundlePath(eraId: string) {
  return `${publicBasePath}/downloads/${eraId}/${eraId}-all-materials.zip`;
}
