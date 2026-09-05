import { afterEach, describe, expect, it, vi } from "vitest";
import { readResilientStorage, removeResilientStorage, writeResilientStorage } from "./resilientStorage";

afterEach(() => vi.unstubAllGlobals());

describe("resilientStorage", () => {
  it("returns the fresh fallback when localStorage is readable but cannot be updated", () => {
    const key = "career-log-storage-test";
    const local = {
      getItem: () => "stale",
      setItem: () => { throw new Error("quota"); },
      removeItem: () => {},
    };
    let sessionValue: string | null = null;
    const session = {
      getItem: () => null,
      setItem: (_key: string, value: string) => { sessionValue = value; },
      removeItem: () => {},
    };
    vi.stubGlobal("window", { localStorage: local, sessionStorage: session });

    writeResilientStorage(key, "fresh");
    expect(readResilientStorage(key)).toBe("fresh");
    expect(sessionValue).toBe("fresh");
    removeResilientStorage(key);
  });
});
