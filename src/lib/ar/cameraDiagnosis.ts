/** The AR library rejects camera failures with no reason, so ask the camera itself what went wrong. */
export interface CameraProbe {
  mediaDevices?: { getUserMedia?: (constraints: any) => Promise<{ getTracks: () => { stop: () => void }[] }> };
}

export const CAMERA_HELP = {
  insecure: '주소가 https로 시작하는 수업 사이트에서 열어 주세요.',
  unsupported: '이 브라우저에서는 AR 카메라를 쓸 수 없어요. 크롬이나 사파리로 열어 주세요.',
  blocked: '카메라 사용이 차단돼 있어요. 주소창의 자물쇠(또는 카메라 아이콘)를 눌러 카메라를 ‘허용’으로 바꾼 뒤 다시 열어 주세요.',
  busy: '다른 앱이나 다른 탭이 카메라를 쓰고 있어요. 카메라 앱과 다른 수업 탭을 모두 닫은 뒤 다시 열어 주세요.',
  missing: '뒤쪽 카메라를 찾지 못했어요. 카메라가 가려져 있거나 꺼져 있는지 확인해 주세요.',
  retry: '카메라를 다시 열어 주세요. 다른 탭이나 앱에서 카메라를 쓰고 있으면 먼저 닫아 주세요.',
  unknown: '카메라를 열지 못했어요. 브라우저를 완전히 닫았다가 다시 열어 주세요.',
} as const;

export async function diagnoseCamera(probe: CameraProbe | undefined, secure: boolean): Promise<string> {
  if (!secure) return CAMERA_HELP.insecure;
  const getUserMedia = probe?.mediaDevices?.getUserMedia;
  if (!getUserMedia) return CAMERA_HELP.unsupported;
  try {
    const stream = await getUserMedia.call(probe!.mediaDevices, { audio: false, video: { facingMode: 'environment' } });
    // The camera itself is fine; release it immediately so the next attempt can take it.
    stream.getTracks().forEach(track => track.stop());
    return CAMERA_HELP.retry;
  } catch (error) {
    const name = (error as { name?: string })?.name || '';
    if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') return CAMERA_HELP.blocked;
    if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') return CAMERA_HELP.busy;
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') return CAMERA_HELP.missing;
    return CAMERA_HELP.unknown;
  }
}

/** Keep a real explanation (a missing model, a broken file); only guess when the reason is empty. */
export async function cameraFailureMessage(reason: unknown, probe: CameraProbe | undefined, secure: boolean): Promise<string> {
  if (reason instanceof DOMException && reason.name === 'NotAllowedError') return CAMERA_HELP.blocked;
  if (reason instanceof Error && reason.message.trim() && !/webgl/i.test(reason.message)) return reason.message;
  if (reason instanceof Error && /webgl/i.test(reason.message)) return '이 기기에서는 입체 카메라를 열 수 없어요. 다른 태블릿에서 열어 주세요.';
  return diagnoseCamera(probe, secure);
}
