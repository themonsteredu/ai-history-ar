export interface TeacherClass { name: string; code: string }
export const teacherClassesKey = 'history-ar-teacher-classes';
const CODE = /^[a-z0-9]{4,12}$/;

/** The teacher's own list of classes and their codes, kept on the teacher's device. */
export function readTeacherClasses(storage?: Pick<Storage, 'getItem'>): TeacherClass[] {
  try {
    const value = JSON.parse(storage?.getItem(teacherClassesKey) || '[]');
    return Array.isArray(value)
      ? value.filter(item => item && typeof item.name === 'string' && typeof item.code === 'string' && CODE.test(item.code)).map(item => ({ name: item.name.trim(), code: item.code }))
      : [];
  } catch { return []; }
}

export function normalizeClassCode(code: string) { return code.trim().toLowerCase(); }
export function isClassCode(code: string) { return CODE.test(normalizeClassCode(code)); }

/** A code identifies one class; registering it again renames rather than duplicates. */
export function addTeacherClass(list: readonly TeacherClass[], name: string, code: string): TeacherClass[] {
  const normalized = normalizeClassCode(code), label = name.trim().slice(0, 30);
  if (!CODE.test(normalized) || !label) return [...list];
  return [...list.filter(item => item.code !== normalized), { name: label, code: normalized }];
}
export function removeTeacherClass(list: readonly TeacherClass[], code: string): TeacherClass[] {
  return list.filter(item => item.code !== normalizeClassCode(code));
}
export function writeTeacherClasses(list: readonly TeacherClass[], storage?: Pick<Storage, 'setItem'>) {
  try { storage?.setItem(teacherClassesKey, JSON.stringify(list)); } catch { /* the list still works for this visit */ }
}
export function classNameFor(list: readonly TeacherClass[], code: string) {
  return list.find(item => item.code === normalizeClassCode(code))?.name;
}
