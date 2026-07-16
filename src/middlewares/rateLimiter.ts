import rateLimit, { Options } from "express-rate-limit";

export const createRateLimiter = (options: Partial<Options> = {}) =>
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // default cap per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, please try again later",
    ...options,
  });

export const writeLimiter = createRateLimiter({ limit: 20 });
export const authLimiter = createRateLimiter({ limit: 10 });
export const readLimiter = createRateLimiter({ limit: 5 });
