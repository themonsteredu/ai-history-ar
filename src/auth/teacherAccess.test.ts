import { describe, expect, it } from "vitest";
import {
  clearTeacherAccess,
  grantTeacherAccess,
  isValidTeacherPin,
  readTeacherAccess,
} from "./teacherAccess";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe("teacher access", () => {
  it("accepts only the configured four-digit PIN", () => {
    expect(isValidTeacherPin("3035")).toBe(true);
    expect(isValidTeacherPin(" 3035 ")).toBe(true);
    expect(isValidTeacherPin("3034")).toBe(false);
    expect(isValidTeacherPin("03035")).toBe(false);
  });

  it("stores and clears access for the current session", () => {
    const storage = new MemoryStorage();

    expect(readTeacherAccess(storage)).toBe(false);
    grantTeacherAccess(storage);
    expect(readTeacherAccess(storage)).toBe(true);
    clearTeacherAccess(storage);
    expect(readTeacherAccess(storage)).toBe(false);
  });

  it("fails closed when browser storage is unavailable", () => {
    const blockedStorage = {
      getItem() { throw new Error("blocked"); },
      setItem() { throw new Error("blocked"); },
      removeItem() { throw new Error("blocked"); },
    };

    expect(readTeacherAccess(blockedStorage)).toBe(false);
    expect(() => grantTeacherAccess(blockedStorage)).not.toThrow();
    expect(() => clearTeacherAccess(blockedStorage)).not.toThrow();
  });
});
