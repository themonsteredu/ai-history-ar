import { expect, it } from 'vitest';
import { newCard } from './model';
import { ownNewerVersion, RETRY_CAP, retryDelay, sameContent, saveLabel } from './useSyncedDraft';

it('waits longer after each failed save, up to a cap, so tablets do not flood weak Wi-Fi', () => {
  expect([0, 1, 2, 3, 4, 5, 9, 60].map(failures => retryDelay(failures))).toEqual([2500, 2500, 5000, 10_000, 20_000, 20_000, 20_000, 20_000]);
  expect(retryDelay(8)).toBe(RETRY_CAP);
  expect(retryDelay(0, 800)).toBe(800);
  expect(retryDelay(3, 800)).toBe(3200);
  // A pause already longer than the cap is never shortened.
  expect(retryDelay(4, 30_000)).toBe(30_000);
});

it('tells students a failed save will be tried again on its own', () => {
  expect(saveLabel('error', true, '')).toBe('저장 못 함 · 저절로 다시 저장해요');
  expect(saveLabel('saving', true, '')).toBe('저장하는 중…');
  expect(saveLabel('idle', false, '10:05')).toBe('우리 반에 저장됨 · 10:05');
});

/** The class server keeps items as jsonb, so their keys come back in another order. */
const reordered = (value: unknown): unknown => Array.isArray(value) ? value.map(reordered)
  : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).reverse().map(([key, item]) => [key, reordered(item)])) : value;

it('treats a class copy with the same content as the same, whatever its key order', () => {
  const card = { ...newCard(1, 4), members: '하늘', points: [{ id: 'p1', position: [0.1, -0.25, 1] as [number, number, number], title: '영침', text: '그림자를 만들어요' }] };
  expect(sameContent(card, reordered(card))).toBe(true);
  expect(sameContent(card, { ...card, members: '바다' })).toBe(false);
  expect(sameContent([1, 2], [2, 1])).toBe(false);
});

it('carries on from its own save whose answer was lost instead of calling it a conflict', () => {
  const sent = { ...newCard(1, 4), members: '하늘' }, typed = { ...sent, members: '하늘, 바다' };
  const server = (data: unknown) => ({ key: '1', version: 2, data: reordered(data) as typeof sent, updatedAt: '' });
  // Nothing typed since the save: this tablet is simply up to date.
  expect(ownNewerVersion({ key: 'k', data: sent, base: 1, dirty: true }, server(sent), [])).toEqual({ key: 'k', data: sent, base: 2, dirty: false });
  // Typed while the save was out: keep the new typing and save it on top of that version.
  expect(ownNewerVersion({ key: 'k', data: typed, base: 1, dirty: true }, server(sent), [{ key: 'k', data: sent }])).toEqual({ key: 'k', data: typed, base: 2, dirty: true });
  // Another tablet saved something else, or the sent copy was another item's: still a real conflict.
  expect(ownNewerVersion({ key: 'k', data: typed, base: 1, dirty: true }, server({ ...sent, members: '다른 태블릿' }), [{ key: 'k', data: sent }])).toBeUndefined();
  expect(ownNewerVersion({ key: 'k', data: typed, base: 1, dirty: true }, server(sent), [{ key: 'other', data: sent }])).toBeUndefined();
});
