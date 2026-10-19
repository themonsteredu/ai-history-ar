import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import type { ExhibitPoint } from '../lib/ar/exhibit';
import HeritageModelView from './HeritageModelView';

const points: ExhibitPoint[] = [
  { id: 'a', title: '빗물 받는 그릇', text: '쇠로 만든 둥근 통에 빗물을 받았어요.', position: [0, .5, .2], photoPosition: [.5, .5] },
  { id: 'b', title: '', text: '', position: [0, .2, .2], photoPosition: [.5, .5] },
];
const view = (props: Partial<Parameters<typeof HeritageModelView>[0]>) => renderToStaticMarkup(<HeritageModelView image="" points={points} selectedId="" onSelect={() => undefined} targetIndex={0} {...props} />);

it('shows the selected point in a speech bubble inside its pin, described by it', () => {
  const html = view({ bubbles: true, selectedId: 'a' });
  const id = html.match(/aria-describedby="([^"]+)"/)?.[1];
  expect(id).toBeTruthy();
  expect(html).toContain(`<span class="ar-pin-bubble" id="${id}"><b>빗물 받는 그릇</b><span>쇠로 만든 둥근 통에 빗물을 받았어요.</span></span></button>`);
  expect(html.match(/aria-expanded="true"/g)).toHaveLength(1);
  expect(html.match(/aria-expanded="false"/g)).toHaveLength(1);
  expect(html).toContain('같은 번호를 또 누르면 설명이 닫혀요.');
});

it('says so plainly when a point has no title or text yet', () => {
  expect(view({ bubbles: true, selectedId: 'b' })).toContain('<b>제목 없음</b><span class="is-empty">아직 설명이 없어요.</span>');
  expect(view({ bubbles: true })).toContain('번호를 누르면 번호 옆에 설명이 나와요.');
});

it('hides the bubble while a point is being placed, so it never covers the spot to tap', () => {
  const html = view({ bubbles: true, selectedId: 'a', onPlace: () => undefined });
  expect(html).not.toContain('ar-pin-bubble'); expect(html).not.toContain('aria-expanded="true"');
});

it('keeps the pins of screens without bubbles exactly as they were', () => {
  const html = view({ selectedId: 'a' });
  expect(html).not.toContain('ar-pin-bubble'); expect(html).not.toContain('aria-expanded'); expect(html).not.toContain('aria-describedby');
  expect(html).toContain('<button hidden="" type="button" class="ar-hotspot" aria-label="1번 빗물 받는 그릇 열기" aria-pressed="true">1</button>');
  expect(html).toContain('끌어서 돌려 보고, 표시점을 눌러요.');
});
