export type ToolLaunchMode = "embed" | "new-tab" | "internal";

export type ToolResultKind = "link" | "csv" | "png" | "none";

export interface ExternalToolHelperLink {
  label: string;
  href: string;
}

export interface LessonExternalToolDefinition {
  lessonId: number;
  toolId: string;
  toolName: string;
  toolHomeUrl?: string;
  purpose: string;
  estimatedMinutes: number;
  launchMode: ToolLaunchMode;
  studentUrl: string;
  embedUrl: string;
  teacherSourceUrl: string;
  submissionUrl: string;
  resultBoardUrl: string;
  resultKind: ToolResultKind;
  resultGuide: string;
  steps: readonly string[];
  dataTip: string;
  fallbackPath?: string;
  allowedDomains: readonly string[];
  helperLinks?: readonly ExternalToolHelperLink[];
  setupRequired?: boolean;
}

export interface ExternalToolLessonSettings {
  lessonId: number;
  enabled: boolean;
  launchMode: ToolLaunchMode;
  studentUrl: string;
  embedUrl: string;
  teacherSourceUrl: string;
  submissionUrl: string;
  resultBoardUrl: string;
}

export interface ExternalToolSettings {
  version: 1;
  lessons: ExternalToolLessonSettings[];
}

export interface ResolvedLessonExternalTool extends LessonExternalToolDefinition {
  enabled: boolean;
}
