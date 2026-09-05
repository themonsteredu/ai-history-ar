import { threeKingdomsExternalTools } from "../content/three-kingdoms/externalTools";
import type {
  ExternalToolLessonSettings,
  ExternalToolSettings,
  LessonExternalToolDefinition,
  ResolvedLessonExternalTool,
  ToolLaunchMode,
} from "../types/externalTools";

export const EXTERNAL_TOOL_STORAGE_KEY = "moa-history-ar:external-tools:v1";
export const EXTERNAL_TOOL_UPDATE_EVENT = "moa-history-ar:external-tools-updated";
export const STUDENT_TOOL_QUERY = 'classTools';

export function encodeStudentToolSettings(settings: ExternalToolSettings) {
  const safe = normalizeExternalToolSettings(settings);
  const payload = { version: 1, lessons: safe.lessons.map(({ teacherSourceUrl: _teacher, ...lesson }) => lesson) };
  return btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(payload))));
}

export function decodeStudentToolSettings(encoded: string): ExternalToolSettings {
  if (encoded.length > 24000) throw new Error('수업 링크가 너무 깁니다.');
  const value = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded), character => character.charCodeAt(0))));
  if (value?.version !== 1 || !Array.isArray(value.lessons)) throw new Error('올바른 수업 링크가 아닙니다.');
  const safe = normalizeExternalToolSettings(value);
  return { ...safe, lessons: safe.lessons.map(lesson => ({ ...lesson, teacherSourceUrl: '' })) };
}

export function studentToolShareUrl(origin: string, base: string, settings: ExternalToolSettings) {
  const url = new URL(base, origin);
  url.searchParams.set(STUDENT_TOOL_QUERY, encodeStudentToolSettings(settings));
  if (base === '/') url.pathname = '/three-kingdoms/lesson/4';
  else url.hash = '/three-kingdoms/lesson/4';
  return url.toString();
}

type SettingsStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const launchModes = new Set<ToolLaunchMode>(["embed", "new-tab", "internal"]);

function definitionToSettings(definition: LessonExternalToolDefinition): ExternalToolLessonSettings {
  return {
    lessonId: definition.lessonId,
    enabled: true,
    launchMode: definition.launchMode,
    studentUrl: definition.studentUrl,
    embedUrl: definition.embedUrl,
    teacherSourceUrl: definition.teacherSourceUrl,
    submissionUrl: definition.submissionUrl,
    resultBoardUrl: definition.resultBoardUrl,
  };
}

export function createDefaultExternalToolSettings(): ExternalToolSettings {
  return {
    version: 1,
    lessons: threeKingdomsExternalTools.map(definitionToSettings),
  };
}

export function isAllowedExternalUrl(value: string, allowedDomains: readonly string[]) {
  if (!value.trim()) return true;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    return allowedDomains.some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function safeUrl(value: unknown, definition: LessonExternalToolDefinition) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return isAllowedExternalUrl(trimmed, definition.allowedDomains) ? trimmed : "";
}

function normalizeLessonSetting(value: unknown, definition: LessonExternalToolDefinition): ExternalToolLessonSettings {
  const fallback = definitionToSettings(definition);
  if (!value || typeof value !== "object") return fallback;

  const candidate = value as Partial<ExternalToolLessonSettings>;
  const launchMode = launchModes.has(candidate.launchMode as ToolLaunchMode)
    ? candidate.launchMode as ToolLaunchMode
    : fallback.launchMode;

  return {
    lessonId: definition.lessonId,
    enabled: typeof candidate.enabled === "boolean" ? candidate.enabled : fallback.enabled,
    launchMode: definition.launchMode === "internal" ? "internal" : launchMode,
    studentUrl: safeUrl(candidate.studentUrl, definition),
    embedUrl: safeUrl(candidate.embedUrl, definition),
    teacherSourceUrl: safeUrl(candidate.teacherSourceUrl, definition),
    submissionUrl: safeUrl(candidate.submissionUrl, definition),
    resultBoardUrl: safeUrl(candidate.resultBoardUrl, definition),
  };
}

export function normalizeExternalToolSettings(value: unknown): ExternalToolSettings {
  const lessons = value && typeof value === "object" && Array.isArray((value as Partial<ExternalToolSettings>).lessons)
    ? (value as Partial<ExternalToolSettings>).lessons ?? []
    : [];

  return {
    version: 1,
    lessons: threeKingdomsExternalTools.map((definition) => {
      const candidate = lessons.find((lesson) => lesson && typeof lesson === "object" && "lessonId" in lesson && lesson.lessonId === definition.lessonId);
      return normalizeLessonSetting(candidate, definition);
    }),
  };
}

export function readExternalToolSettings(storage: Pick<SettingsStorage, "getItem">): ExternalToolSettings {
  try {
    const saved = storage.getItem(EXTERNAL_TOOL_STORAGE_KEY);
    return saved ? normalizeExternalToolSettings(JSON.parse(saved)) : createDefaultExternalToolSettings();
  } catch {
    return createDefaultExternalToolSettings();
  }
}

export function writeExternalToolSettings(storage: SettingsStorage, settings: ExternalToolSettings) {
  const normalized = normalizeExternalToolSettings(settings);
  storage.setItem(EXTERNAL_TOOL_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function clearExternalToolSettings(storage: SettingsStorage) {
  storage.removeItem(EXTERNAL_TOOL_STORAGE_KEY);
}

export function resolveExternalTools(settings: ExternalToolSettings): readonly ResolvedLessonExternalTool[] {
  const normalized = normalizeExternalToolSettings(settings);
  const settingByLesson = new Map(normalized.lessons.map((lesson) => [lesson.lessonId, lesson]));

  return threeKingdomsExternalTools.map((definition) => {
    const lesson = settingByLesson.get(definition.lessonId) ?? definitionToSettings(definition);
    return {
      ...definition,
      ...lesson,
    };
  });
}

export function getResolvedExternalTool(lessonId: number, settings: ExternalToolSettings) {
  return resolveExternalTools(settings).find((tool) => tool.lessonId === lessonId) ?? resolveExternalTools(settings)[0];
}

export function validateExternalToolSetting(setting: ExternalToolLessonSettings) {
  const definition = threeKingdomsExternalTools.find((tool) => tool.lessonId === setting.lessonId);
  if (!definition) return ["알 수 없는 차시입니다."];

  const errors: string[] = [];
  const urls = [
    ["학생 실행 URL", setting.studentUrl],
    ["임베드 URL", setting.embedUrl],
    ["교사용 원본 URL", setting.teacherSourceUrl],
    ["결과 제출 URL", setting.submissionUrl],
    ["결과 모아보기 URL", setting.resultBoardUrl],
  ] as const;

  for (const [label, value] of urls) {
    if (!isAllowedExternalUrl(value, definition.allowedDomains)) errors.push(`${label}의 주소를 확인하세요.`);
  }

  if (setting.enabled && definition.setupRequired && !setting.studentUrl) errors.push("학생 실행 URL이 필요합니다.");
  if (setting.launchMode === "embed" && setting.enabled && !setting.embedUrl) errors.push("임베드 URL을 입력하거나 새 탭 방식으로 바꾸세요.");
  return errors;
}
