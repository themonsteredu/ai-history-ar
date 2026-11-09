import { isClassCode, normalizeClassCode } from './teacherClasses';

export type TeacherCourse = 'three-kingdoms' | 'goryeo' | 'joseon';
export const teacherClassKey = (course: TeacherCourse) => `history-ar-teacher-current:${course}`;
export const teacherCodeParam = (course: TeacherCourse) => course === 'three-kingdoms' ? 'hub_code' : 'code';
export const teacherRoomPath = (course: TeacherCourse) => `/teacher/${course}/${course === 'three-kingdoms' ? 'ar' : 'open-class'}`;

export function validTeacherCode(course: TeacherCourse, value: string) {
  const code = normalizeClassCode(value);
  return (course === 'goryeo' ? /^\d{4,10}$/.test(code) : isClassCode(code)) ? code : '';
}

export function readTeacherClass(course: TeacherCourse) {
  try { return validTeacherCode(course, window.sessionStorage.getItem(teacherClassKey(course)) || ''); }
  catch { return ''; }
}

export function rememberTeacherClass(course: TeacherCourse, code: string) {
  try {
    if (code) window.sessionStorage.setItem(teacherClassKey(course), validTeacherCode(course, code));
    else window.sessionStorage.removeItem(teacherClassKey(course));
  } catch { /* The URL still keeps the selected class when storage is unavailable. */ }
}

export function teacherRoomLink(course: TeacherCourse, code: string) {
  const valid = validTeacherCode(course, code);
  return `${teacherRoomPath(course)}${valid ? `?${teacherCodeParam(course)}=${encodeURIComponent(valid)}` : ''}`;
}
