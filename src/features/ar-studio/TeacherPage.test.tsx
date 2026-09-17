import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { expect, it } from 'vitest';
import TeacherPage from './TeacherPage';

const render = (path: string) => renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><TeacherPage /></MemoryRouter>);

it('starts from the teacher own class list and asks for nothing else', () => {
  const html = render('/three-kingdoms/ar-teacher');
  expect(html).toContain('내 반'); expect(html).toContain('첫 반 등록');
  expect(html).not.toContain('비밀번호'); expect(html).not.toContain('내 모둠');
});

it('opens a class straight from its code with the print, visit and maker links', () => {
  const html = render('/three-kingdoms/ar-teacher?hub_code=5252');
  expect(html).toContain('수업코드 5252');
  expect(html).toContain('ar-quiz-print?hub_code=5252');
  expect(html).toContain('ar-visit?hub_code=5252');
  expect(html).toContain('ar-maker?hub_code=5252');
  expect(html).toContain('모둠 현황');
});
