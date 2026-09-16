import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { expect, it } from 'vitest';
import VisitPage from './VisitPage';

const render = (path: string) => renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><VisitPage /></MemoryRouter>);

it('asks only for the class code, name and group before a student is in the class', () => {
  const html = render('/three-kingdoms/ar-visit?hub_code=250915');
  expect(html).toContain('수업코드');
  expect(html).toContain('내 모둠');
  expect(html).toContain('value="250915"');
  // The visiting screen never shows making tools, so a visitor cannot overwrite a group's work.
  ['점 찍기', '녹음', '모둠에 공유', '작업 파일'].forEach(tool => expect(html).not.toContain(tool));
});

it('keeps the visiting screen to the two things a student does today', () => {
  const html = render('/three-kingdoms/ar-visit');
  expect(html).not.toContain('AR로 관람하기');
  expect(html).toContain('들어가기');
});
