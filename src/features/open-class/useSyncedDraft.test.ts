import { expect, it } from 'vitest';
import { RETRY_CAP, retryDelay, saveLabel } from './useSyncedDraft';

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
