import { describe, expect, it } from "vitest";
import { calcServiceTotalPaise, hoursToX2, x2ToHours } from "./pricing";

describe("calcServiceTotalPaise", () => {
  it("computes 2.5 hours at ₹150/hr → ₹375", () => {
    expect(calcServiceTotalPaise(15000, 2.5)).toBe(37500);
  });

  it("computes 1 hour at ₹800/hr → ₹800", () => {
    expect(calcServiceTotalPaise(80000, 1)).toBe(80000);
  });

  it("rejects zero hours", () => {
    expect(() => calcServiceTotalPaise(15000, 0)).toThrow();
  });

  it("rejects negative hours", () => {
    expect(() => calcServiceTotalPaise(15000, -1)).toThrow();
  });

  it("rejects non-0.5 increments", () => {
    expect(() => calcServiceTotalPaise(15000, 1.3)).toThrow();
    expect(() => calcServiceTotalPaise(15000, 0.25)).toThrow();
  });

  it("rejects non-positive rate", () => {
    expect(() => calcServiceTotalPaise(0, 1)).toThrow();
    expect(() => calcServiceTotalPaise(-100, 1)).toThrow();
  });
});

describe("hoursToX2 / x2ToHours", () => {
  it("round-trips 0.5 increments", () => {
    for (const h of [0.5, 1, 1.5, 2, 7.5, 12]) {
      expect(x2ToHours(hoursToX2(h))).toBe(h);
    }
  });

  it("rejects non-0.5 fractions", () => {
    expect(() => hoursToX2(1.25)).toThrow();
  });
});
