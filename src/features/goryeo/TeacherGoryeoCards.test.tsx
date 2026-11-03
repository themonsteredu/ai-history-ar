import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TeacherGoryeoCards } from './GoryeoOpenClass';
import { goryeoCard } from './readyCards';

describe('teacher group cards', () => {
  it('shows every configured group and identifies the artifact saved by a group', () => {
    const card = goryeoCard(2, 3);
    card.points = [{ id: 'p1', title: '경판', text: '목판', position: [0, 0, 0] }];
    const html = renderToStaticMarkup(<TeacherGoryeoCards cards={[card]} count={3} />);
    expect(html).toContain('1모둠');
    expect(html).toContain('2모둠');
    expect(html).toContain('3모둠');
    expect(html).toContain('팔만대장경');
    expect(html).toContain('1개 설명');
    expect(html).toContain('카드 작성 전');
  });
});
