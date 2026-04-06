type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSec: number;
  resetAtUnixSec: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitBucket>;

declare global {
  // eslint-disable-next-line no-var
  var __subsaveRateLimitStore__: RateLimitStore | undefined;
}

function getStore(): RateLimitStore {
  if (!globalThis.__subsaveRateLimitStore__) {
    globalThis.__subsaveRateLimitStore__ = new Map<string, RateLimitBucket>();
  }
  return globalThis.__subsaveRateLimitStore__;
}

export function checkRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const { key, limit, windowMs } = params;
  const now = Date.now();
  const store = getStore();

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit,
      remaining: Math.max(limit - 1, 0),
      retryAfterSec: 0,
      resetAtUnixSec: Math.ceil(resetAt / 1000),
    };
  }

  if (existing.count >= limit) {
    const retryAfterSec = Math.max(Math.ceil((existing.resetAt - now) / 1000), 1);
    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterSec,
      resetAtUnixSec: Math.ceil(existing.resetAt / 1000),
    };
  }

  existing.count += 1;
  store.set(key, existing);

  return {
    allowed: true,
    limit,
    remaining: Math.max(limit - existing.count, 0),
    retryAfterSec: 0,
    resetAtUnixSec: Math.ceil(existing.resetAt / 1000),
  };
}

export function attachRateLimitHeaders(
  response: Response,
  result: RateLimitResult,
): void {
  response.headers.set("x-ratelimit-limit", String(result.limit));
  response.headers.set("x-ratelimit-remaining", String(result.remaining));
  response.headers.set("x-ratelimit-reset", String(result.resetAtUnixSec));

  if (!result.allowed) {
    response.headers.set("retry-after", String(result.retryAfterSec));
  }
}
