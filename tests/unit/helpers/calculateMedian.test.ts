import { describe, it, expect } from "vitest";
import { calculateMedian } from "~/helpers/calculateMedian";

describe("calculateMedian", () => {
  it("returns 0 for an empty series", () => {
    expect(calculateMedian({ values: [] })).toBe(0);
  });

  it("returns the single value for a one-element series", () => {
    expect(calculateMedian({ values: [42] })).toBe(42);
  });

  it("returns the middle value for an odd-length series", () => {
    expect(calculateMedian({ values: [3, 1, 2] })).toBe(2);
  });

  it("averages the two middle values for an even-length series", () => {
    expect(calculateMedian({ values: [1, 2, 3, 4] })).toBe(2.5);
  });

  it("does not require pre-sorted input", () => {
    expect(calculateMedian({ values: [10, 2, 8, 4, 6] })).toBe(6);
  });

  it("counts zeros as real values (fixed-window semantics)", () => {
    // 12 values, only 3 non-zero → median lands in the zero region.
    const values = [0, 0, 0, 0, 300, 320, 310, 0, 0, 0, 0, 0];
    expect(calculateMedian({ values })).toBe(0);
  });

  it("does not mutate the input array", () => {
    const values = [3, 1, 2];
    calculateMedian({ values });
    expect(values).toEqual([3, 1, 2]);
  });

  it("rounds the averaged median to cents", () => {
    expect(calculateMedian({ values: [1.005, 2.02] })).toBe(1.51);
  });
});
