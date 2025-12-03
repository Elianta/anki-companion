import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextFunction, Request, Response } from "express";

function headerToString(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] : value;
}

function getClientIdentifier(req: Request): string {
  const forwardedFor = headerToString(req.headers["x-forwarded-for"]);
  if (forwardedFor) {
    return forwardedFor.split(",")[0]!.trim();
  }

  const realIp = headerToString(req.headers["x-real-ip"]);
  if (realIp) {
    return realIp;
  }

  return req.socket?.remoteAddress ?? "unknown";
}

function isRateLimitingEnabled() {
  if (process.env.NODE_ENV === "development") {
    return false;
  }

  const flag = process.env.RATE_LIMIT_ENABLED ?? "";
  return flag.toLowerCase() === "true" || flag === "1";
}

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

export function createRateLimitMiddleware() {
  if (!isRateLimitingEnabled()) {
    return null;
  }

  const ratelimiter = createRateLimiter();
  if (!ratelimiter) {
    return null;
  }

  return async function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const identifier = getClientIdentifier(req);
      const result = await ratelimiter.limit(identifier);

      res.setHeader("X-RateLimit-Limit", result.limit);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, result.remaining));
      res.setHeader("X-RateLimit-Reset", result.reset);

      if (!result.success) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((result.reset - Date.now()) / 1000)
        );
        res.setHeader("Retry-After", retryAfterSeconds);
        return res.status(429).json({
          error: "Too many requests. Please wait before trying again.",
          retryAfterSeconds,
        });
      }
    } catch (error) {
      console.warn("Rate limiter check failed, allowing request", error);
    }

    return next();
  };
}
