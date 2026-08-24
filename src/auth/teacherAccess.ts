export const TEACHER_PIN = "3035";

const STORAGE_KEY = "moa-history-ar:teacher-access:v1";
const ACCESS_VALUE = "granted";

type TeacherAccessStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function isValidTeacherPin(pin: string) {
  return pin.trim() === TEACHER_PIN;
}

export function readTeacherAccess(storage: TeacherAccessStorage) {
  try {
    return storage.getItem(STORAGE_KEY) === ACCESS_VALUE;
  } catch {
    return false;
  }
}

export function grantTeacherAccess(storage: TeacherAccessStorage) {
  try {
    storage.setItem(STORAGE_KEY, ACCESS_VALUE);
  } catch {
    // 저장소가 차단된 브라우저에서도 현재 화면은 계속 이용할 수 있습니다.
  }
}

export function clearTeacherAccess(storage: TeacherAccessStorage) {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // 저장소가 차단된 경우에는 현재 메모리 상태만 잠급니다.
  }
}
