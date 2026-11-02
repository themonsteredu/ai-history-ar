import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { HeritageReading, readingFor, readingUrl } from './HeritageReading';

describe('artifact newspaper',()=>{
 it('has one source-backed reading for every artifact in both eras',()=>{
  for(const era of ['goryeo','joseon'] as const) for(let id=1;id<=6;id++){
   const item=readingFor(era,id);expect(item).toBeDefined();expect(item!.paragraphs.length).toBeGreaterThanOrEqual(5);expect(item!.sources.length).toBeGreaterThan(0);
   expect(item!.sources.every(source=>source.url.startsWith('https://'))).toBe(true);expect(readingUrl(era,id)).toContain(`/downloads/${era}/open-class/readings/`);
  }
  expect(readingFor('goryeo',0)).toBeUndefined();
 });
 it('renders the correct artifact photograph, credit, reading and printable link',()=>{
  const html=renderToStaticMarkup(<HeritageReading era="goryeo" id={3}/>);
  expect(html).toContain('팔만대장경');expect(html).toContain('goryeo-photos/tripitaka.jpg');expect(html).toContain('CC BY 2.0');expect(html).toContain('3-tripitaka.pdf');expect(html).toContain('자료 출처');
  const joseon=renderToStaticMarkup(<HeritageReading era="joseon" id={1}/>);
  expect(joseon).toContain('측우기');expect(joseon).toContain('joseon-science/cheugugi.jpg');expect(joseon).toContain('1-cheugugi.pdf');
 });
});
