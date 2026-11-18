import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { expect, it } from 'vitest';
import ArtifactObservationPage from './ArtifactObservationPage';

it.each([
  ['joseon', 4, '앙부일구', 'images/heritage/joseon/angbuilgu.jpg'],
  ['goryeo', 2, '고려 금속활자', 'goryeo-ar-cards.html?card=type'],
] as const)('opens a shared %s artifact with its own camera target and observation QR', (era, id, title, marker) => {
  const path = `/classes/${era}/observe?artifact=${id}`;
  const html = renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><ArtifactObservationPage era={era} /></MemoryRouter>);
  expect(html).toContain(`aria-label="${title} 3D 관찰"`);
  expect(html).toContain(`href="/${marker}"`);
  expect(html).toContain(`href="https://ai-history-ar.vercel.app${path}"`);
  expect(html.match(/<option /g)).toHaveLength(6);
  expect(html).toContain('AR 카메라 켜기');
  expect(html).not.toMatch(/수업코드|비밀번호|수업 들어가기|role="dialog"/);
});
