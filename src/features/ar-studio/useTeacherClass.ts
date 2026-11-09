import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { readTeacherClass, rememberTeacherClass, teacherCodeParam, validTeacherCode, type TeacherCourse } from './teacherClassNavigation';

/** Keep each era's selected class through navigation and refresh, without storing credentials. */
export function useTeacherClass(course: TeacherCourse) {
  const [params, setParams] = useSearchParams();
  const key = teacherCodeParam(course);
  const explicit = params.has(key);
  const code = explicit ? validTeacherCode(course, params.get(key) || '') : readTeacherClass(course);

  useEffect(() => {
    rememberTeacherClass(course, code);
    if (!explicit && code) {
      const next = new URLSearchParams(params);
      next.set(key, code);
      setParams(next, { replace: true });
    }
  }, [course, code, explicit, key, params, setParams]);

  function selectCode(value: string) {
    const code = validTeacherCode(course, value);
    rememberTeacherClass(course, code);
    const next = new URLSearchParams(params);
    // An explicit empty value opens the class picker without restoring an old class.
    next.set(key, code);
    setParams(next);
  }
  return [code, selectCode] as const;
}
