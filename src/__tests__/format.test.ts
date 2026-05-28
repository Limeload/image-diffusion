import { describe, it, expect, vi, beforeEach } from "vitest";
import { formatCount, formatDate, formatRelativeTime } from "@/lib/format";

describe("formatCount", () => {
  it("returns plain number below 1000", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(999)).toBe("999");
  });

  it("formats thousands with K suffix", () => {
    expect(formatCount(1000)).toBe("1.0K");
    expect(formatCount(1500)).toBe("1.5K");
    expect(formatCount(999_999)).toBe("1000.0K");
  });

  it("formats millions with M suffix", () => {
    expect(formatCount(1_000_000)).toBe("1.0M");
    expect(formatCount(2_500_000)).toBe("2.5M");
  });
});

describe("formatDate", () => {
  it("formats an ISO string to readable date", () => {
    const result = formatDate("2024-07-04T12:00:00.000Z");
    expect(result).toMatch(/Jul/);
    expect(result).toMatch(/4/);
    expect(result).toMatch(/2024/);
  });
});

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-01T12:00:00.000Z"));
  });

  it("returns 'just now' for seconds ago", () => {
    expect(formatRelativeTime("2024-06-01T11:59:50.000Z")).toBe("just now");
  });

  it("returns minutes ago", () => {
    expect(formatRelativeTime("2024-06-01T11:55:00.000Z")).toBe("5m ago");
  });

  it("returns hours ago", () => {
    expect(formatRelativeTime("2024-06-01T10:00:00.000Z")).toBe("2h ago");
  });

  it("returns days ago", () => {
    expect(formatRelativeTime("2024-05-29T12:00:00.000Z")).toBe("3d ago");
  });

  it("returns weeks ago", () => {
    expect(formatRelativeTime("2024-05-11T12:00:00.000Z")).toBe("3w ago");
  });

  it("returns months ago", () => {
    expect(formatRelativeTime("2024-03-01T12:00:00.000Z")).toBe("3mo ago");
  });

  it("returns years ago", () => {
    expect(formatRelativeTime("2022-06-01T12:00:00.000Z")).toBe("2y ago");
  });
});
