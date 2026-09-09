/** Device read-aloud for examples only. Student recordings remain unchanged. */
export class SampleSpeech {
  private current?: SpeechSynthesisUtterance;
  constructor(private activity: (active: boolean) => void, private error: (message: string) => void) {}
  speak(text: string) {
    this.stop();
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      this.error('이 기기에서는 예제 글 읽기를 지원하지 않아요. 설명 글을 보거나 직접 녹음해 주세요.'); return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR'; utterance.rate = .9;
    const voice = window.speechSynthesis.getVoices().find(item => /^ko(?:-|_)/i.test(item.lang));
    if (voice) utterance.voice = voice;
    this.current = utterance;
    utterance.onstart = () => { if (this.current === utterance) this.activity(true); };
    utterance.onend = () => { if (this.current === utterance) { this.current = undefined; this.activity(false); } };
    utterance.onerror = () => { if (this.current === utterance) { this.current = undefined; this.activity(false); this.error('예제 글을 읽지 못했어요. 직접 녹음으로 음성을 확인할 수 있어요.'); } };
    try { window.speechSynthesis.speak(utterance); if (window.speechSynthesis.paused) window.speechSynthesis.resume(); }
    catch { this.current = undefined; this.activity(false); this.error('예제 글을 읽지 못했어요. 직접 녹음해 주세요.'); }
  }
  stop() {
    this.current = undefined;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    this.activity(false);
  }
}
