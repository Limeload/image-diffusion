import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkBlocklist, checkModerationAPI, checkPromptSafety } from "@/lib/safety";

describe("checkBlocklist", () => {
  it("allows a benign prompt", () => {
    expect(checkBlocklist("a sunset over the mountains")).toEqual({ blocked: false });
  });

  it("blocks exact blocked term", () => {
    const result = checkBlocklist("nude woman on beach");
    expect(result.blocked).toBe(true);
    expect(result.reason).toBeDefined();
  });

  it("blocks term case-insensitively", () => {
    expect(checkBlocklist("GORE and violence").blocked).toBe(true);
  });

  it("blocks partial-match term (prefix fragment)", () => {
    expect(checkBlocklist("decapitation scene").blocked).toBe(true);
  });

  it("blocks CSAM terms", () => {
    expect(checkBlocklist("child porn").blocked).toBe(true);
    expect(checkBlocklist("loli art").blocked).toBe(true);
  });

  it("allows prompt that merely contains a safe word", () => {
    expect(checkBlocklist("beautiful landscape with a lake").blocked).toBe(false);
  });
});

describe("checkModerationAPI", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns not-flagged when OPENAI_API_KEY is absent", async () => {
    delete process.env.OPENAI_API_KEY;
    const result = await checkModerationAPI("any prompt");
    expect(result.flagged).toBe(false);
  });

  it("returns not-flagged when fetch throws (fail-open)", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    const result = await checkModerationAPI("any prompt");
    expect(result.flagged).toBe(false);
  });

  it("returns not-flagged when API returns non-ok status (fail-open)", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const result = await checkModerationAPI("any prompt");
    expect(result.flagged).toBe(false);
  });

  it("returns flagged when API flags the prompt", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [{ flagged: true, categories: { violence: true, hate: false } }],
        }),
      })
    );
    const result = await checkModerationAPI("violent content");
    expect(result.flagged).toBe(true);
    expect(result.categories?.violence).toBe(true);
  });

  it("returns not-flagged when API returns unflagged result", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [{ flagged: false, categories: { violence: false, hate: false } }],
        }),
      })
    );
    const result = await checkModerationAPI("a dog running in a park");
    expect(result.flagged).toBe(false);
  });
});

describe("checkPromptSafety", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.OPENAI_API_KEY;
  });

  it("returns safe for a clean prompt (no API key)", async () => {
    const result = await checkPromptSafety("mountains at sunrise");
    expect(result.safe).toBe(true);
  });

  it("returns unsafe when blocklist hits (no API call needed)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await checkPromptSafety("nude portrait");
    expect(result.safe).toBe(false);
    expect(result.reason).toBeDefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns unsafe when moderation API flags prompt", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [{ flagged: true, categories: { "hate/threatening": true } }],
        }),
      })
    );
    const result = await checkPromptSafety("a totally harmless phrase");
    expect(result.safe).toBe(false);
    expect(result.reason).toMatch(/hate/i);
  });

  it("returns safe when API call fails (fail-open)", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    const result = await checkPromptSafety("a cat sitting on a windowsill");
    expect(result.safe).toBe(true);
  });
});
