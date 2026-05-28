// ─── Blocklist ────────────────────────────────────────────────────────────────

const BLOCKED_TERMS: string[] = [
  // Explicit sexual content
  "nude", "naked", "nsfw", "pornograph", "explicit sex", "genitalia", "hentai",
  "erotic", "topless", "lingerie porn", "onlyfans",
  // Violence / gore
  "gore", "decapitat", "dismember", "torture", "mutilat", "snuff", "beheading",
  "severed head", "dead body", "corpse",
  // Self-harm
  "suicide", "self-harm", "cutting myself", "overdose",
  // Hate speech / slurs  (terms stored as fragments to match variations)
  "racial slur", "white supremac", "nazi propaganda", "kill all",
  // CSAM — absolute block
  "child porn", "loli", "shota", "underage sex", "minor sex",
];

export function checkBlocklist(prompt: string): { blocked: boolean; reason?: string } {
  const lower = prompt.toLowerCase();
  const hit = BLOCKED_TERMS.find(term => lower.includes(term));
  if (hit) return { blocked: true, reason: "Prompt contains disallowed content." };
  return { blocked: false };
}

// ─── OpenAI Moderation API ────────────────────────────────────────────────────

type ModerationResult = {
  flagged: boolean;
  categories?: Record<string, boolean>;
};

export async function checkModerationAPI(prompt: string): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  // Skip gracefully if key not configured
  if (!apiKey) return { flagged: false };

  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: prompt }),
    });

    if (!res.ok) {
      console.warn("OpenAI Moderation API error:", res.status);
      return { flagged: false }; // fail open — don't block generation on API outage
    }

    const data = await res.json();
    const result = data.results?.[0];
    return {
      flagged: result?.flagged ?? false,
      categories: result?.categories ?? {},
    };
  } catch (err) {
    console.warn("OpenAI Moderation API unreachable:", err);
    return { flagged: false };
  }
}

// ─── Combined check ───────────────────────────────────────────────────────────

export async function checkPromptSafety(
  prompt: string
): Promise<{ safe: boolean; reason?: string }> {
  // 1. Fast blocklist (no network)
  const blocklistResult = checkBlocklist(prompt);
  if (blocklistResult.blocked) {
    return { safe: false, reason: blocklistResult.reason };
  }

  // 2. LLM-based moderation (optional — skipped if OPENAI_API_KEY not set)
  const modResult = await checkModerationAPI(prompt);
  if (modResult.flagged) {
    const flaggedCategory = modResult.categories
      ? Object.entries(modResult.categories)
          .find(([, v]) => v)?.[0]
          ?.replace(/_/g, " ")
      : undefined;
    return {
      safe: false,
      reason: flaggedCategory
        ? `Prompt flagged for: ${flaggedCategory}.`
        : "Prompt was flagged by content moderation.",
    };
  }

  return { safe: true };
}
