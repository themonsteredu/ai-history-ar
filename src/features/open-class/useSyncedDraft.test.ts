import { expect, it } from 'vitest';
import { newCard } from './model';
import { ownNewerVersion, reconcileDraft, sameContent, saveLabel } from './useSyncedDraft';

it('tells students that publishing and retrying require a save click', () => {
  expect(saveLabel('error', true, '')).toBe('저장하지 못했어요 · 저장 버튼을 다시 눌러 주세요');
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
  expect(ownNewerVersion({ key: 'k', data: sent, base: 1, dirty: true }, server(sent), [])).toEqual({ key: 'k', data: sent, base: 2, baseData: server(sent).data, dirty: false });
  // Typed while the save was out: keep the new typing and save it on top of that version.
  expect(ownNewerVersion({ key: 'k', data: typed, base: 1, dirty: true }, server(sent), [{ key: 'k', data: sent }])).toEqual({ key: 'k', data: typed, base: 2, baseData: server(sent).data, dirty: true });
  // Another tablet saved something else, or the sent copy was another item's: still a real conflict.
  expect(ownNewerVersion({ key: 'k', data: typed, base: 1, dirty: true }, server({ ...sent, members: '다른 태블릿' }), [{ key: 'k', data: sent }])).toBeUndefined();
  expect(ownNewerVersion({ key: 'k', data: typed, base: 1, dirty: true }, server(sent), [{ key: 'other', data: sent }])).toBeUndefined();
});


it('merges different fields from two tablets and restores the same shared result after reload', () => {
  const base = { first: 'old A', second: 'old B' };
  const local = { ...base, first: 'new A' };
  const remote = { ...base, second: 'new B' };
  const current = { key: 'room:1', data: local, base: 1, baseData: base, dirty: true };
  const merged = reconcileDraft(current, { key: '1', data: remote, version: 2, updatedAt: '' })!;
  expect(merged).toMatchObject({ data: { first: 'new A', second: 'new B' }, base: 2, baseData: remote, dirty: true });
  // The browser closes before learning that its save succeeded; reload recognizes the shared copy.
  const kept = JSON.parse(JSON.stringify(merged));
  const saved = { key: '1', data: merged.data, version: 3, updatedAt: '' };
  expect(reconcileDraft(kept, saved)).toMatchObject({ data: merged.data, base: 3, dirty: false });
  expect(reconcileDraft({ key: 'room:1', data: base, base: 1, dirty: false }, saved)?.data).toEqual(merged.data);
});

it('preserves a real conflict and legacy unsaved work instead of overwriting another tablet', () => {
  const base = { text: 'start' };
  const local = { key: 'k', data: { text: 'ours' }, base: 1, baseData: base, dirty: true };
  const server = { key: '1', data: { text: 'theirs' }, version: 2, updatedAt: '' };
  expect(reconcileDraft(local, server)).toBeUndefined();
  expect(reconcileDraft({ ...local, baseData: undefined }, server)).toBeUndefined();
  expect(local.data.text).toBe('ours');
  expect(reconcileDraft(local, { ...server, version: 0 })).toBe(local);
});
