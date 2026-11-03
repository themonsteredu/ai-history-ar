import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { OpenLessonMaterials } from './OpenLessonMaterials';

describe('open lesson materials', () => {
 for (const era of ['goryeo','joseon'] as const) it(`links all ${era} printables before class starts`, () => {
  const html=renderToStaticMarkup(<OpenLessonMaterials era={era}/>);
  expect(html).toContain(`downloads/${era}/open-class/student-worksheet.pdf`);
  expect(html).toContain(`downloads/${era}/open-class/group-presentation-notes.pdf`);
  expect(html).toContain(`downloads/${era}/open-class/readings/all-readings.pdf`);
  for(let i=1;i<=6;i++)expect(html).toMatch(new RegExp(`downloads/${era}/open-class/readings/${i}-[^\"]+\\.pdf`));
 });
});
