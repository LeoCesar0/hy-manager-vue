import { describe, it, expect, afterEach, vi } from "vitest";
import { getDefaultSearchWindow } from "~/helpers/get-default-search-window";

describe("getDefaultSearchWindow", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("spans the last 6 months ending at the end of the current day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15, 10, 30, 0)); // 2026-06-15 10:30

    const { startDate, endDate } = getDefaultSearchWindow();

    const start = startDate.toDate();
    const end = endDate.toDate();

    // 6 months back, start of day
    expect(start.getFullYear()).toBe(2025);
    expect(start.getMonth()).toBe(11); // December
    expect(start.getDate()).toBe(15);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);

    // today, end of day
    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(5); // June
    expect(end.getDate()).toBe(15);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
  });

  it("returns start strictly before end", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 0, 0, 0));

    const { startDate, endDate } = getDefaultSearchWindow();
    expect(startDate.toMillis()).toBeLessThan(endDate.toMillis());
  });
});
