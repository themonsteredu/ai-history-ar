/** Original, quiet synthesized accompaniment; narration stays in its original audio element. */
export class ExhibitionSound {
  private context?: AudioContext;
  private bed?: GainNode;
  private loop?: AudioBufferSourceNode;
  private enabled = false;
  private speaking = false;
  private recording = false;
  private volume = .2;
  private effects = false;
  private effectNodes = new Set<OscillatorNode>();
  private async prepare() {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) throw new Error('이 기기에서는 배경음을 지원하지 않아요. 해설은 그대로 들을 수 있어요.');
      if (!this.context) {
        this.context = new Ctor(); this.bed = this.context.createGain(); this.bed.gain.setValueAtTime(0, this.context.currentTime); this.bed.connect(this.context.destination);
        const seconds = 16, rate = this.context.sampleRate;
        const buffer = this.context.createBuffer(1, seconds * rate, rate); const data = buffer.getChannelData(0);
        const notes = [196, 246.94, 293.66, 246.94, 220, 261.63, 329.63, 261.63];
        for (let i = 0; i < data.length; i++) {
          const t = i / rate, beat = Math.floor(t / 2), local = t % 2;
          const envelope = Math.sin(Math.PI * local / 2) ** 2;
          data[i] = .12 * envelope * (Math.sin(2 * Math.PI * notes[beat] * t) + .25 * Math.sin(2 * Math.PI * notes[beat] * 2 * t));
        }
        this.loop = this.context.createBufferSource(); this.loop.buffer = buffer; this.loop.loop = true; this.loop.connect(this.bed); this.loop.start();
      }
      await this.context.resume();
  }
  async enable(value: boolean) {
    if (value) await this.prepare();
    this.enabled = value;
    this.apply();
  }
  setVolume(value: number) { this.volume = Math.max(0, Math.min(.5, value)); this.apply(); }
  async setEffects(value: boolean) { if (value) await this.prepare(); this.effects = value; }
  narration(value: boolean) { this.speaking = value; this.apply(); }
  recordingActive(value: boolean) {
    this.recording = value;
    if (value) { this.effectNodes.forEach(node => { try { node.stop(); } catch { /* already ended */ } }); this.effectNodes.clear(); }
    this.apply();
  }
  private apply() {
    if (!this.context || !this.bed) return;
    const target = !this.enabled || this.recording ? 0 : this.volume * (this.speaking ? .12 : 1);
    this.bed.gain.cancelScheduledValues(this.context.currentTime);
    if (this.recording) this.bed.gain.setValueAtTime(0, this.context.currentTime);
    else this.bed.gain.setTargetAtTime(target, this.context.currentTime, .08);
  }
  effect(kind: 'found' | 'correct') {
    if (!this.effects || this.recording || this.speaking || !this.context) return;
    const ctx = this.context, node = ctx.createOscillator(), gain = ctx.createGain();
    node.frequency.value = kind === 'found' ? 660 : 880;
    gain.gain.setValueAtTime(.025, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .18);
    node.connect(gain); gain.connect(ctx.destination); node.start(); node.stop(ctx.currentTime + .2); this.effectNodes.add(node);
    node.onended = () => { this.effectNodes.delete(node); node.disconnect(); gain.disconnect(); };
  }
  dispose() { this.loop?.stop(); this.effectNodes.forEach(node => { try { node.stop(); } catch { /* ended */ } }); this.effectNodes.clear(); void this.context?.close(); this.context = undefined; this.loop = undefined; this.bed = undefined; this.enabled = false; }
}
