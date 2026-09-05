import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NarrationRecorder } from './recorder';

class Recorder {
  static instances: Recorder[] = [];
  static isTypeSupported(type: string) { return type === 'audio/mp4'; }
  state = 'inactive'; mimeType = 'audio/mp4';
  ondataavailable?: (event: {data: Blob}) => void;
  onstop?: () => void;
  onerror?: () => void;
  constructor() { Recorder.instances.push(this); }
  start() { this.state = 'recording'; }
  stop() { this.state = 'inactive'; this.ondataavailable?.({data:new Blob(['voice'])}); this.onstop?.(); }
}
class Reader {
  result = 'data:audio/mp4;base64,dm9pY2U='; onload?: () => void;
  readAsDataURL() { this.onload?.(); }
}
const track = { stop: vi.fn() };
const stream = {getTracks: () => [track]};
function callbacks() { return {onState:vi.fn(),onSave:vi.fn(),onError:vi.fn()}; }
beforeEach(() => {
  vi.useFakeTimers(); Recorder.instances = []; track.stop.mockClear();
  vi.stubGlobal('navigator',{mediaDevices:{getUserMedia:vi.fn().mockResolvedValue(stream)}});
  vi.stubGlobal('MediaRecorder',Recorder); vi.stubGlobal('FileReader',Reader);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe('student microphone lifecycle', () => {
  it('saves the completed voice and releases the microphone after stopping', async () => {
    const cb=callbacks(); const recorder=new NarrationRecorder(cb); await recorder.start();
    await vi.advanceTimersByTimeAsync(1300); recorder.stop(); await Promise.resolve();
    expect(cb.onSave).toHaveBeenCalledWith({data:'data:audio/mp4;base64,dm9pY2U=',seconds:1.3});
    expect(track.stop).toHaveBeenCalled(); expect(cb.onState).toHaveBeenLastCalledWith('idle',0);
  });
  it('ends recording automatically at 30 seconds', async () => {
    const cb=callbacks(); const recorder=new NarrationRecorder(cb); await recorder.start();
    await vi.advanceTimersByTimeAsync(31_000);
    expect(cb.onSave).toHaveBeenCalledTimes(1); expect(cb.onSave.mock.calls[0][0].seconds).toBe(30);
    expect(Recorder.instances[0].state).toBe('inactive');
  });
  it('closes a late permission grant without recording after the student leaves', async () => {
    let resolve!: (value: MediaStream | PromiseLike<MediaStream>) => void;
    vi.mocked(navigator.mediaDevices.getUserMedia).mockImplementation(() => new Promise(done => {resolve=done;}) as Promise<MediaStream>);
    const cb=callbacks(); const recorder=new NarrationRecorder(cb); const starting=recorder.start(); recorder.dispose(); resolve(stream as unknown as MediaStream); await starting;
    expect(track.stop).toHaveBeenCalled(); expect(Recorder.instances).toHaveLength(0); expect(cb.onSave).not.toHaveBeenCalled();
  });
  it('does not overwrite a saved voice if permission is denied or recording is abandoned', async () => {
    const cb=callbacks(); vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(new DOMException('denied','NotAllowedError'));
    await new NarrationRecorder(cb).start(); expect(cb.onError).toHaveBeenCalledWith(expect.stringContaining('허용'));
    const recorder=new NarrationRecorder(cb); await recorder.start(); await vi.advanceTimersByTimeAsync(1000); recorder.dispose(); await Promise.resolve();
    expect(cb.onSave).not.toHaveBeenCalled(); expect(track.stop).toHaveBeenCalled();
  });
});
