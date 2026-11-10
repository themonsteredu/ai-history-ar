import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyTextConfirmed } from './clipboard';

afterEach(() => vi.unstubAllGlobals());

function clipboard(synchronous: boolean, writeText: (value: string) => Promise<void>) {
  const area = { value: '', style: {}, setAttribute: vi.fn(), select: vi.fn(), setSelectionRange: vi.fn(), remove: vi.fn() };
  vi.stubGlobal('document', { createElement: () => area, body: { appendChild: vi.fn() }, execCommand: () => synchronous });
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  return area;
}

describe('confirmed quiz prompt copy', () => {
  it('copies the complete request in the tap when supported', async () => {
    const writeText = vi.fn();
    const area = clipboard(true, writeText);
    const prompt = '학생 질문\n참고 자료\n교사 수업 설정';
    expect(await copyTextConfirmed(prompt)).toBe(true);
    expect(area.value).toBe(prompt);
    expect(area.remove).toHaveBeenCalled();
    expect(writeText).not.toHaveBeenCalled();
  });
  it('waits for clipboard acceptance before reporting success', async () => {
    let finish!: () => void;
    const writeText = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    clipboard(false, writeText);
    const request = '교사 수업 설정까지 포함된 전체 질문';
    let settled = false;
    const copying = copyTextConfirmed(request).then(result => { settled = true; return result; });
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(writeText).toHaveBeenCalledWith(request);
    finish();
    expect(await copying).toBe(true);
  });
  it('reports failure when copying is rejected instead of leaving a false success message', async () => {
    clipboard(false, vi.fn().mockRejectedValue(new Error('Permission denied')));
    expect(await copyTextConfirmed('새 질문')).toBe(false);
  });
});
