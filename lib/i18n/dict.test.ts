import { describe, expect, it } from "vitest";
import { dict } from "./dict";

// Recursively collect all leaf key paths from a nested string dictionary.
function leafPaths(obj: unknown, prefix = ""): string[] {
  if (typeof obj === "string") return [prefix];
  if (obj && typeof obj === "object") {
    const out: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      out.push(...leafPaths(v, prefix ? `${prefix}.${k}` : k));
    }
    return out;
  }
  return [];
}

describe("dict structure", () => {
  it("ta has the same key paths as en (no missing translations)", () => {
    const enKeys = leafPaths(dict.en).sort();
    const taKeys = leafPaths(dict.ta).sort();
    const missingInTa = enKeys.filter((k) => !taKeys.includes(k));
    const extraInTa = taKeys.filter((k) => !enKeys.includes(k));
    expect({ missingInTa, extraInTa }).toEqual({ missingInTa: [], extraInTa: [] });
  });

  it("every value is a non-empty string", () => {
    for (const locale of ["en", "ta"] as const) {
      const paths = leafPaths(dict[locale]);
      for (const p of paths) {
        const value = p.split(".").reduce<unknown>(
          (acc, key) => (acc as Record<string, unknown>)?.[key],
          dict[locale]
        );
        expect(typeof value, `${locale}.${p}`).toBe("string");
        expect((value as string).length, `${locale}.${p} is empty`).toBeGreaterThan(0);
      }
    }
  });

  it("placeholder vars in en are also present in ta", () => {
    const placeholders = (s: string) =>
      Array.from(s.matchAll(/\{(\w+)\}/g))
        .map((m) => m[1])
        .sort();
    const paths = leafPaths(dict.en);
    for (const p of paths) {
      const en = p
        .split(".")
        .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], dict.en) as string;
      const ta = p
        .split(".")
        .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], dict.ta) as string;
      expect(placeholders(en), `vars mismatch on ${p}`).toEqual(placeholders(ta));
    }
  });
});
