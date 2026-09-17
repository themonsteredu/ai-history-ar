import { expect, it } from 'vitest';
import { addTeacherClass, classNameFor, isClassCode, readTeacherClasses, removeTeacherClass, writeTeacherClasses } from './teacherClasses';

const memory = () => { const store = new Map<string, string>(); return { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => { store.set(key, value); } }; };

it('lets a teacher register classes under their own names and codes', () => {
  let list = addTeacherClass([], '5학년 2반', ' 5252 ');
  list = addTeacherClass(list, '5학년 3반', '5353');
  expect(list).toEqual([{ name: '5학년 2반', code: '5252' }, { name: '5학년 3반', code: '5353' }]);
  expect(classNameFor(list, '5353')).toBe('5학년 3반');
  expect(classNameFor(list, '9999')).toBeUndefined();
  // Same code again renames the class instead of listing it twice.
  expect(addTeacherClass(list, '5-2 (오전)', '5252')).toEqual([{ name: '5학년 3반', code: '5353' }, { name: '5-2 (오전)', code: '5252' }]);
  expect(removeTeacherClass(list, '5252')).toEqual([{ name: '5학년 3반', code: '5353' }]);
});

it('ignores an empty name or a code the class server would refuse', () => {
  expect(addTeacherClass([], '   ', '5252')).toEqual([]);
  expect(addTeacherClass([], '5학년 2반', '52')).toEqual([]);
  expect(addTeacherClass([], '5학년 2반', '우리반')).toEqual([]);
  expect(isClassCode('5252')).toBe(true); expect(isClassCode('abc')).toBe(false);
});

it('survives a round trip through storage and drops broken entries', () => {
  const storage = memory();
  writeTeacherClasses(addTeacherClass([], '5학년 2반', '5252'), storage);
  expect(readTeacherClasses(storage)).toEqual([{ name: '5학년 2반', code: '5252' }]);
  storage.setItem('history-ar-teacher-classes', JSON.stringify([{ name: '좋음', code: '5353' }, { name: 1, code: '5454' }, { code: 'x' }, 'junk']));
  expect(readTeacherClasses(storage)).toEqual([{ name: '좋음', code: '5353' }]);
  storage.setItem('history-ar-teacher-classes', '{not json');
  expect(readTeacherClasses(storage)).toEqual([]);
  expect(readTeacherClasses(undefined)).toEqual([]);
});
