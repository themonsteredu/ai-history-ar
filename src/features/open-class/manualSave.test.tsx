import { afterEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { useSyncedDraft } from './useSyncedDraft';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
it('does not publish restored or edited local work without an explicit save, including edits after saving', async () => {
  vi.useFakeTimers();
  const memory = new Map<string, string>();
  const localStorage = { getItem: (key: string) => memory.get(key) || null, setItem: (key: string, value: string) => memory.set(key, value), length: 0 };
  vi.stubGlobal('localStorage', localStorage);
  vi.stubGlobal('window', Object.assign(new EventTarget(), { localStorage, setTimeout, clearTimeout }));
  const save = vi.fn(async () => ({ version: 2 }));
  let draft!: ReturnType<typeof useSyncedDraft<{ text: string }>>;
  const key = 'room:card:1';
  memory.set(`history-ar-open-draft:${key}`, JSON.stringify({ data: { text: '실수로 바꾼 내용' }, base: 1, baseData: { text: '기존 1모둠 내용' }, dirty: true }));
  let sharedText = '기존 1모둠 내용';
  function Probe() {
    draft = useSyncedDraft({ draftKey: key, server: { key: '1', version: 1, data: { text: sharedText }, updatedAt: '' }, blank: () => ({ text: '' }), check: (v): v is { text: string } => !!v && typeof (v as {text: string}).text === 'string', save });
    return null;
  }
  renderToStaticMarkup(<Probe />);
  await draft.saveNow();
  await vi.advanceTimersByTimeAsync(60000);
  window.dispatchEvent(new Event('online'));
  expect(save).not.toHaveBeenCalled();
  draft.update(() => ({ text: '저장 버튼으로 확정할 내용' }));
  await draft.saveNow(true);
  expect(save).toHaveBeenCalledExactlyOnceWith({ text: '저장 버튼으로 확정할 내용' }, 1);
  draft.update(() => ({ text: '아직 확정하지 않은 다음 수정' }));
  await draft.saveNow();
  await vi.advanceTimersByTimeAsync(60000);
  expect(save).toHaveBeenCalledTimes(1);
  draft.prepareReentry();
  expect(memory.get(`history-ar-open-draft:${key}`)).toBe('null');
  expect(memory.get(`history-ar-open-draft:${key}:unsaved-backup`)).toContain('아직 확정하지 않은 다음 수정');
  sharedText = '다른 기기가 저장한 최신 1모둠 내용';
  renderToStaticMarkup(<Probe />);
  expect(draft.data.text).toBe(sharedText);
  expect(draft.dirty).toBe(false);
  expect(save).toHaveBeenCalledTimes(1);
});
