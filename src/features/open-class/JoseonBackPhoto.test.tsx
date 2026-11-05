import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { JoseonBackPhoto } from './JoseonBackPhoto';

describe('Joseon water-clock reference photograph', () => {
  it('shows the rear of the surviving water-clock display and identifies its limits and source', () => {
    const html = renderToStaticMarkup(<JoseonBackPhoto era="joseon" artifactId={2} />);
    for (const text of ['자격루 뒤쪽 사진 보기', 'jagyeongnu-back.jpg', 'KSH1015', 'CC BY-SA 3.0', '가려져', '추정']) expect(html).toContain(text);
  });
  it('never shows the water-clock photograph for a different artifact or era', () => {
    expect(renderToStaticMarkup(<JoseonBackPhoto era="joseon" artifactId={1} />)).toBe('');
    expect(renderToStaticMarkup(<JoseonBackPhoto era="goryeo" artifactId={2} />)).toBe('');
  });
});
