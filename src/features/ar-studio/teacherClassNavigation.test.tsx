import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { readTeacherClass, rememberTeacherClass, teacherRoomLink } from './teacherClassNavigation';
import { useTeacherClass } from './useTeacherClass';
import { TeacherNavigation } from '../../components/TeacherNavigation';

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('window', { sessionStorage: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  } });
});
afterEach(() => vi.unstubAllGlobals());

function SelectedClass() { const [code] = useTeacherClass('goryeo'); return <output>{code || '선택 전'}</output>; }
const render = (path: string) => renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><TeacherNavigation /><SelectedClass /></MemoryRouter>);

it('restores the selected class after leaving the room and opens a return link with its code', () => {
  rememberTeacherClass('goryeo', '5252');
  expect(render('/teacher/goryeo/open-class')).toContain('<output>5252</output>');
  const home = render('/teacher?course=goryeo');
  expect(home).toContain('href="/teacher/goryeo/open-class?code=5252"');
  expect(home).toContain('수업 현황으로 돌아가기');
});

it('gives a shared URL priority and respects explicitly returning to the class picker', () => {
  rememberTeacherClass('goryeo', '5252');
  expect(render('/teacher/goryeo/open-class?code=6161')).toContain('<output>6161</output>');
  expect(render('/teacher/goryeo/open-class?code=')).toContain('<output>선택 전</output>');
});

it('keeps eras separate and clearing one class does not clear the other', () => {
  rememberTeacherClass('goryeo', '5252'); rememberTeacherClass('joseon', '6161');
  rememberTeacherClass('goryeo', '');
  expect(readTeacherClass('goryeo')).toBe('');
  expect(readTeacherClass('joseon')).toBe('6161');
  expect(teacherRoomLink('three-kingdoms', '7272')).toBe('/teacher/three-kingdoms/ar?hub_code=7272');
});

it('still opens URL codes when the browser blocks storage', () => {
  vi.stubGlobal('window', { get sessionStorage() { throw new Error('Storage blocked'); } });
  expect(() => rememberTeacherClass('goryeo', '5252')).not.toThrow();
  expect(readTeacherClass('goryeo')).toBe('');
  expect(render('/teacher/goryeo/open-class?code=5252')).toContain('<output>5252</output>');
});
