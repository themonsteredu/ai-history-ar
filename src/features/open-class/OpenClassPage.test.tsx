import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { expect, it } from 'vitest';
import OpenClassPage from './OpenClassPage';
import OpenClassTeacher from './OpenClassTeacher';

it('asks a student only for the class code, name and group', () => {
  const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/joseon/open-class?code=5252']}><OpenClassPage /></MemoryRouter>);
  expect(html).toContain('세종 때 과학 유물 AR 카드');
  expect(html).toContain('수업코드'); expect(html).toContain('내 모둠');
  expect(html).toContain('value="5252"');
});

it('starts the teacher screen from the class list', () => {
  const html = renderToStaticMarkup(<MemoryRouter><OpenClassTeacher /></MemoryRouter>);
  expect(html).toContain('내 반'); expect(html).toContain('첫 반 등록');
});
