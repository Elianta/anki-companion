import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export function createRateLimiter() {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    console.warn(
      "Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN, skipping rate limiting."
    );
    return null;
  }

  try {
    const redis = Redis.fromEnv();
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      analytics: true,
      prefix: "ratelimit:anki-companion",
    });
  } catch (error) {
    console.warn("Failed to initialize Upstash rate limiter", error);
    return null;
  }
}
