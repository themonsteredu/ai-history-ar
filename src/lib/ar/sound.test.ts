import { afterEach, expect, it, vi } from 'vitest';
import { ExhibitionSound } from './sound';

afterEach(() => vi.unstubAllGlobals());
it('ducks narration, silences recording immediately and enables effects independently of music', async () => {
  const gains: any[] = [], oscillators: any[] = [];
  const loop = { connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
  class FakeContext {
    sampleRate = 80; currentTime = 2; destination = {};
    createGain() { const node = { connect: vi.fn(), disconnect: vi.fn(), gain: { cancelScheduledValues: vi.fn(), setValueAtTime: vi.fn(), setTargetAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } }; gains.push(node); return node; }
    createBuffer(_channels: number, length: number) { return { getChannelData: () => new Float32Array(length) }; }
    createBufferSource() { return loop; }
    createOscillator() { const node = { frequency: { value: 0 }, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn() }; oscillators.push(node); return node; }
    async resume() {} async close() {}
  }
  vi.stubGlobal('window', { AudioContext: FakeContext });
  const sound = new ExhibitionSound();
  await sound.enable(true); sound.setVolume(.3);
  const bed = gains[0].gain;
  expect(bed.setTargetAtTime).toHaveBeenLastCalledWith(.3, 2, .08);
  sound.narration(true);
  expect(bed.setTargetAtTime).toHaveBeenLastCalledWith(.036, 2, .08);
  await sound.setEffects(true); sound.effect('found'); expect(oscillators).toHaveLength(0);
  sound.narration(false); sound.effect('found'); expect(oscillators).toHaveLength(1);
  sound.recordingActive(true);
  expect(bed.setValueAtTime).toHaveBeenLastCalledWith(0, 2); expect(oscillators[0].stop).toHaveBeenLastCalledWith();
  sound.setVolume(.5); sound.effect('correct'); expect(oscillators).toHaveLength(1);
  expect(bed.setValueAtTime).toHaveBeenLastCalledWith(0, 2);
  sound.recordingActive(false); expect(bed.setTargetAtTime).toHaveBeenLastCalledWith(.5, 2, .08);
  await sound.enable(false); sound.effect('correct'); expect(oscillators).toHaveLength(2);
  await sound.setEffects(false); sound.effect('correct'); expect(oscillators).toHaveLength(2);
  sound.dispose(); expect(loop.stop).toHaveBeenCalled();
});
