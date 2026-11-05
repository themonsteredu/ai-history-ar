import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { GoryeoBackPhoto } from './GoryeoBackPhoto';

describe('real reverse photograph', () => {
  it('identifies the museum object and labels the model as a reconstruction', () => {
    const html = renderToStaticMarkup(<GoryeoBackPhoto era="goryeo" artifactId={2} />);
    for (const text of ['실제 뒷면 사진', '덕수 4462', '국립중앙박물관', '사진을 참고한 재현', 'type-back.jpg']) expect(html).toContain(text);
  });
  it('does not show a different object photo for the other artifacts', () => {
    expect(renderToStaticMarkup(<GoryeoBackPhoto era="goryeo" artifactId={3} />)).toBe('');
    expect(renderToStaticMarkup(<GoryeoBackPhoto era="joseon" artifactId={2} />)).toBe('');
  });
});
