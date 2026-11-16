import { afterEach, expect, it, vi } from 'vitest';
import { confirmLeave, LEAVE_UNSAVED } from './useSyncedDraft';

afterEach(() => { vi.unstubAllGlobals(); });

it('lets a group leave at once when everything reached the class', () => {
  const confirm = vi.fn(() => false);
  vi.stubGlobal('window', { confirm });
  expect(confirmLeave({ dirty: false }, { dirty: false })).toBe(true);
  expect(confirm).not.toHaveBeenCalled();
});

it('asks before 다시 입장 sets aside work that was never saved, as when the Wi-Fi is down', () => {
  const confirm = vi.fn(() => false);
  vi.stubGlobal('window', { confirm });
  expect(confirmLeave({ dirty: false }, { dirty: true })).toBe(false);
  expect(confirm).toHaveBeenCalledExactlyOnceWith(LEAVE_UNSAVED);
  expect(LEAVE_UNSAVED).toContain('저장하지 않은 내용');
  expect(LEAVE_UNSAVED).toContain('인터넷');
  confirm.mockReturnValue(true);
  expect(confirmLeave({ dirty: true })).toBe(true);
});
