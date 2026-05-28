import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 5 generations per 60-second sliding window per user
export const generateRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
  prefix: "pentagram:generate",
});
