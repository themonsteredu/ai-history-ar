import { MAX_AUDIO_BYTES, MAX_RECORDING_SECONDS, readDataUrl, type Narration } from './exhibit';

export class NarrationRecorder {
  private stream?: MediaStream;
  private recorder?: MediaRecorder;
  private timer?: ReturnType<typeof setInterval>;
  private cancelled = false;
  private startedAt = 0;
  private chunks: Blob[] = [];
  private bytes = 0;
  private finished = false;
  constructor(private callbacks: { onState: (state: 'requesting' | 'recording' | 'saving' | 'idle', seconds: number) => void; onSave: (audio: Narration) => void; onError: (message: string) => void }) {}

  async start() {
    this.callbacks.onState('requesting', 0);
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('이 브라우저에서는 녹음을 시작할 수 없어요. 최신 Safari 또는 Chrome에서 열어 주세요.');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (this.cancelled) { stream.getTracks().forEach(track => track.stop()); return; }
      this.stream = stream;
      const mimeType = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
      if (!mimeType) throw new Error('이 기기에서 사용할 녹음 형식을 찾지 못했어요.');
      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64_000 });
      this.recorder = recorder;
      recorder.ondataavailable = event => {
        if (event.data.size && !this.cancelled) { this.chunks.push(event.data); this.bytes += event.data.size; }
        if (this.bytes > MAX_AUDIO_BYTES && recorder.state === 'recording') this.stop();
      };
      recorder.onerror = () => { this.callbacks.onError('녹음이 중단되었어요. 이전 녹음은 유지됩니다.'); this.dispose(); this.callbacks.onState('idle', 0); };
      recorder.onstop = () => { void this.finish(); };
      this.startedAt = Date.now();
      recorder.start(250);
      this.callbacks.onState('recording', 0);
      this.timer = setInterval(() => {
        const seconds = (Date.now() - this.startedAt) / 1000;
        this.callbacks.onState('recording', Math.floor(seconds));
        if (seconds >= MAX_RECORDING_SECONDS) this.stop();
      }, 200);
    } catch (error) {
      this.release();
      if (this.cancelled) return;
      this.callbacks.onState('idle', 0);
      this.callbacks.onError(error instanceof DOMException && error.name === 'NotAllowedError' ? '마이크 사용을 허용한 뒤 다시 눌러 주세요.' : error instanceof Error ? error.message : '녹음을 시작하지 못했어요.');
    }
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    if (this.recorder?.state === 'recording') {
      this.callbacks.onState('saving', 0);
      this.recorder.stop();
      this.stream?.getTracks().forEach(track => track.stop());
    }
  }
  private release() {
    if (this.timer) clearInterval(this.timer);
    this.stream?.getTracks().forEach(track => track.stop());
  }
  private async finish() {
    if (this.finished) return;
    this.finished = true;
    const seconds = Math.min(MAX_RECORDING_SECONDS, (Date.now() - this.startedAt) / 1000);
    this.release();
    if (this.cancelled) return;
    try {
      if (!this.bytes || seconds < .25) throw new Error('목소리를 조금 더 길게 녹음해 주세요.');
      if (this.bytes > MAX_AUDIO_BYTES) throw new Error('녹음 파일이 커졌어요. 조금 더 짧게 녹음해 주세요.');
      const blob = new Blob(this.chunks, { type: this.recorder!.mimeType.split(';')[0] });
      const data = await readDataUrl(blob);
      if (!this.cancelled) this.callbacks.onSave({ data, seconds: Math.round(seconds * 10) / 10 });
    } catch (error) {
      if (!this.cancelled) this.callbacks.onError(error instanceof Error ? error.message : '녹음을 저장하지 못했어요.');
    } finally {
      if (!this.cancelled) this.callbacks.onState('idle', 0);
      this.chunks = [];
    }
  }
  dispose() {
    this.cancelled = true;
    this.release();
    if (this.recorder && this.recorder.state !== 'inactive') this.recorder.stop();
    this.chunks = [];
  }
}
