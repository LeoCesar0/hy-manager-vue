import { describe, it, expect, afterEach, vi } from "vitest";
import { getDefaultMonths } from "~/helpers/get-default-months";

describe("getDefaultMonths", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the last N month keys in ascending order, ending at the current month", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15)); // 2026-06-15

    expect(getDefaultMonths({ count: 6 })).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
    ]);
  });

  it("crosses the year boundary correctly", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 10)); // 2026-02-10

    expect(getDefaultMonths({ count: 3 })).toEqual([
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });

  it("returns a single month when count is 1", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15)); // 2026-06-15

    expect(getDefaultMonths({ count: 1 })).toEqual(["2026-06"]);
  });
});
