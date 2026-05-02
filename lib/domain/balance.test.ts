import { describe, expect, it } from "vitest";
import { balanceState, collectionRate, computeBalancePaise } from "./balance";

describe("computeBalancePaise + balanceState", () => {
  it("billed 1200, paid 1000 → owes 200", () => {
    const b = computeBalancePaise(120000, 100000);
    expect(b).toBe(20000);
    expect(balanceState(b)).toBe("owes");
  });

  it("billed 1000, paid 1200 → advance −200", () => {
    const b = computeBalancePaise(100000, 120000);
    expect(b).toBe(-20000);
    expect(balanceState(b)).toBe("advance");
  });

  it("billed = paid → settled", () => {
    expect(balanceState(computeBalancePaise(50000, 50000))).toBe("settled");
  });
});

describe("collectionRate", () => {
  it("returns 1 for zero billed", () => {
    expect(collectionRate(0, 0)).toBe(1);
  });
  it("computes 0.5 when half collected", () => {
    expect(collectionRate(100, 50)).toBe(0.5);
  });
  it("clamps over-payment to 1", () => {
    expect(collectionRate(100, 200)).toBe(1);
  });
});
