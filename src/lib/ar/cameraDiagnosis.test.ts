import { expect, it } from 'vitest';
import { CAMERA_HELP, cameraFailureMessage, diagnoseCamera } from './cameraDiagnosis';

const stream = { getTracks: () => [{ stop: () => { stopped++; } }] };
let stopped = 0;
const probe = (result: unknown) => ({ mediaDevices: { getUserMedia: () => result instanceof Error ? Promise.reject(result) : Promise.resolve(stream) } });
const named = (name: string) => Object.assign(new Error(name), { name });

it('names the real reason a tablet camera refuses to open', async () => {
  await expect(diagnoseCamera(probe(named('NotAllowedError')), true)).resolves.toBe(CAMERA_HELP.blocked);
  await expect(diagnoseCamera(probe(named('NotReadableError')), true)).resolves.toBe(CAMERA_HELP.busy);
  await expect(diagnoseCamera(probe(named('NotFoundError')), true)).resolves.toBe(CAMERA_HELP.missing);
  await expect(diagnoseCamera(probe(named('WeirdError')), true)).resolves.toBe(CAMERA_HELP.unknown);
  await expect(diagnoseCamera({}, true)).resolves.toBe(CAMERA_HELP.unsupported);
  await expect(diagnoseCamera(undefined, true)).resolves.toBe(CAMERA_HELP.unsupported);
  await expect(diagnoseCamera(probe(null), false)).resolves.toBe(CAMERA_HELP.insecure);
});

it('releases the camera it opened while checking, so the retry can take it', async () => {
  stopped = 0;
  await expect(diagnoseCamera(probe(null), true)).resolves.toBe(CAMERA_HELP.retry);
  expect(stopped).toBe(1);
});

it('keeps a real failure message and only guesses when the library reports nothing', async () => {
  await expect(cameraFailureMessage(new Error('모형의 크기를 확인하지 못했어요.'), probe(null), true)).resolves.toBe('모형의 크기를 확인하지 못했어요.');
  await expect(cameraFailureMessage(new Error('WebGL not supported'), probe(null), true)).resolves.toContain('입체 카메라');
  // MindAR rejects with no reason at all; that is the case worth diagnosing.
  await expect(cameraFailureMessage(undefined, probe(named('NotReadableError')), true)).resolves.toBe(CAMERA_HELP.busy);
  await expect(cameraFailureMessage(new Error(''), probe(named('NotAllowedError')), true)).resolves.toBe(CAMERA_HELP.blocked);
});
