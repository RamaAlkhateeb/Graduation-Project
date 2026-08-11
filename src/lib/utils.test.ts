import { afterEach, describe, expect, it } from "vitest";
import { uuid } from "./utils";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("uuid", () => {
  const originalRandomUUID = globalThis.crypto?.randomUUID;

  afterEach(() => {
    Object.defineProperty(globalThis.crypto, "randomUUID", {
      value: originalRandomUUID,
      configurable: true,
    });
  });

  it("returns unique UUID-shaped ids", () => {
    const first = uuid();
    const second = uuid();

    expect(first).toMatch(UUID_PATTERN);
    expect(second).toMatch(UUID_PATTERN);
    expect(first).not.toBe(second);
  });

  it("falls back when crypto.randomUUID is unavailable (plain HTTP)", () => {
    Object.defineProperty(globalThis.crypto, "randomUUID", {
      value: undefined,
      configurable: true,
    });

    const id = uuid();

    expect(id).toMatch(UUID_PATTERN);
    expect(uuid()).not.toBe(id);
  });
});
