import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StudentGroupViews } from './StudentGroupViews';
import { CardGallery } from './CardGallery';
import { newCard } from './model';

it.each(['joseon', 'goryeo'] as const)('keeps the %s editing identity separate from the observation menu', era => {
  const html = renderToStaticMarkup(<StudentGroupViews group={1} era={era} cards={[]}><textarea defaultValue="저장 전 작성 내용" /></StudentGroupViews>);
  expect(html).toContain('우리 모둠 활동 · 1모둠');
  expect(html).toContain('전체 모둠 AR 카드 보기');
  expect(html).toContain('저장 전 작성 내용');
});
it.each(['joseon', 'goryeo'] as const)('shows all six groups in the %s read-only gallery', era => {
  const cards = [1, 4].map(group => ({ key: String(group), data: newCard(group, 1), version: 1, updatedAt: '' }));
  const html = renderToStaticMarkup(<CardGallery era={era} cards={cards} myGroup={1} showAllGroups />);
  for (const group of [1, 2, 3, 4, 5, 6]) expect(html).toContain(`${group}모둠`);
  expect(html).toContain('1모둠 (우리)');
  expect(html).toContain('저장된 카드 없음');
  expect(html).not.toContain('<input');
  expect(html).not.toContain('<textarea');
  expect(html).not.toContain('지금 우리 반에 저장');
  expect(html).not.toContain('검증하러 가기');
});
