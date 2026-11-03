import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MuseumCardStage } from './MuseumCardStage';
import { newCard } from './model';
import { goryeoCard } from '../goryeo/readyCards';

describe('museum AR presentation', () => {
 it('opens each era with the correct group, artifact and saved explanation controls', () => {
  for (const era of ['goryeo', 'joseon'] as const) {
   const card = era==='goryeo' ? goryeoCard(2,3) : newCard(2,1);
   card.points = [{id:'p1',title:'우리 설명',text:'직접 조사했어요',position:[0,0,0]}];
   const html=renderToStaticMarkup(<MuseumCardStage card={card} era={era} onClose={()=>{}}/>);
   expect(html).toContain('2모둠');
   expect(html).toContain(era==='goryeo'?'팔만대장경':'측우기');
   expect(html).toContain('aria-label="2모둠 AR 카드 발표"');
   expect(html).toContain('aria-pressed="false"');
   expect(html).toContain('발표 닫기');
  }
 });
});
