import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildAppFromEnv } from "../src/app.js";
import { createRateLimiter } from "../src/rate-limit.js";

const app = buildAppFromEnv();

const ratelimiter = createRateLimiter();

function headerToString(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] : value;
}

function getClientIdentifier(req: VercelRequest): string {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (ratelimiter) {
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
  }

  return (app as any)(req, res);
}
