import { afterEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { researchForEra } from '../../content/heritageCatalog';
import { isStudioProject, submissionProblems } from './project';
import { newSampleProject, samplePath } from './sample';
import { SampleSpeech } from '../../lib/ar/sampleSpeech';

afterEach(() => vi.unstubAllGlobals());

it('opens a valid independent sample with a matching printable target and existing research facts', () => {
  const first = newSampleProject(), second = newSampleProject();
  expect(isStudioProject(first)).toBe(true);
  expect(first.heritageId).toBe(3); expect(first.ar.points).toHaveLength(3); expect(first.questions).toHaveLength(2);
  const source = JSON.stringify(researchForEra('three-kingdoms').find(item => item.id === 3));
  first.ar.points.forEach(point => expect(source).toContain(point.text));
  expect(readFileSync('public/downloads/three-kingdoms/ar/ar-card-03.pdf').subarray(0, 4).toString()).toBe('%PDF');
  expect(first.questions.every(question => first.ar.points.some(point => point.id === question.pointId))).toBe(true);
  expect(first.ar.model).toMatchObject({ asset: 'cheomseongdae-nsm-2015', format: 'obj', data: '', rotation: [-90, 0, 0] });
  expect(first.ar.model!.parts).toBeUndefined();
  first.ar.model!.rotation[0] = 0; first.ar.points[0].text = '내 연습';
  expect(second.ar.model!.rotation[0]).toBe(-90); expect(second.ar.points[0].text).not.toBe('내 연습');
  // Device read-aloud is not falsely presented as a recorded, submittable group work.
  expect(submissionProblems(second)).toHaveLength(3);
  expect(samplePath('?hub_code=class1&student_id=abc&step=gallery&lesson=6&view=ppt')).toBe('/three-kingdoms/ar-sample?hub_code=class1&student_id=abc');
});

it('keeps the official sample portable, without accepting unrelated or arbitrary OBJ models', () => {
  const sample = JSON.parse(JSON.stringify(newSampleProject()));
  expect(isStudioProject(sample)).toBe(true);
  sample.heritageId = 2;
  expect(isStudioProject(sample)).toBe(false);
  sample.heritageId = 3; sample.ar.model.asset = 'unregistered-model';
  expect(isStudioProject(sample)).toBe(false);
  delete sample.ar.model.asset;
  expect(isStudioProject(sample)).toBe(false);
});

it('cancels earlier read-aloud callbacks and releases narration ducking when leaving', () => {
  const activity = vi.fn(), error = vi.fn(), spoken: any[] = [];
  const korean = { lang: 'ko-KR' };
  const synth = { cancel: vi.fn(), getVoices: () => [{ lang: 'en-US' }, korean], speak: (item: unknown) => spoken.push(item), paused: false, resume: vi.fn() };
  vi.stubGlobal('window', { speechSynthesis: synth });
  vi.stubGlobal('SpeechSynthesisUtterance', class { constructor(public text: string) {} });
  const reader = new SampleSpeech(activity, error);
  reader.speak('첫 번째'); const first = spoken[0]; first.onstart(); expect(activity).toHaveBeenLastCalledWith(true);
  expect(first.lang).toBe('ko-KR'); expect(first.voice).toBe(korean);
  reader.speak('두 번째'); const second = spoken[1]; second.onstart();
  activity.mockClear(); first.onend(); first.onerror(); expect(activity).not.toHaveBeenCalled(); expect(error).not.toHaveBeenCalled();
  reader.stop(); expect(activity).toHaveBeenLastCalledWith(false);
  activity.mockClear(); second.onstart(); second.onend(); expect(activity).not.toHaveBeenCalled();
  vi.stubGlobal('window', {}); reader.speak('지원되지 않는 기기'); expect(error).toHaveBeenCalled();
});
