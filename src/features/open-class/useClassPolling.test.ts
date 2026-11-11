import { afterEach, expect, it, vi } from 'vitest';
import { CLASS_POLL_INTERVAL, startClassPolling } from './useClassPolling';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
it('refreshes every two seconds and immediately on return or reconnect, then cleans up', async () => {
  vi.useFakeTimers();
  const win = Object.assign(new EventTarget(), { setInterval, clearInterval });
  const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  vi.stubGlobal('window', win); vi.stubGlobal('document', doc);
  const refresh = vi.fn(async () => undefined);
  const stop = startClassPolling(refresh);
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(CLASS_POLL_INTERVAL).toBe(2000);
  await vi.advanceTimersByTimeAsync(2000);
  expect(refresh).toHaveBeenCalledTimes(2);
  doc.visibilityState = 'hidden';
  await vi.advanceTimersByTimeAsync(4000);
  expect(refresh).toHaveBeenCalledTimes(2);
  doc.visibilityState = 'visible'; doc.dispatchEvent(new Event('visibilitychange'));
  win.dispatchEvent(new Event('focus')); win.dispatchEvent(new Event('online'));
  expect(refresh).toHaveBeenCalledTimes(5);
  stop(); await vi.advanceTimersByTimeAsync(4000);
  win.dispatchEvent(new Event('focus')); doc.dispatchEvent(new Event('visibilitychange'));
  expect(refresh).toHaveBeenCalledTimes(5);
});
