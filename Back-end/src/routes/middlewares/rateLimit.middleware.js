// Simple in-memory rate limiter (per-process).
// Production note: For multi-instance deployments, replace with Redis-based limiter.

function createRateLimiter({ windowMs, max, keyFn }) {
  const hits = new Map(); // key -> { count, resetAt }

  function cleanup(now) {
    // best-effort cleanup to avoid unbounded growth
    for (const [k, v] of hits.entries()) {
      if (!v || v.resetAt <= now) hits.delete(k);
    }
  }

  return function rateLimit(req, res, next) {
    const now = Date.now();
    if (hits.size > 5000) cleanup(now);

    const key = (keyFn ? keyFn(req) : null) || req.ip || 'unknown';
    const existing = hits.get(key);
    if (!existing || existing.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    existing.count += 1;
    if (existing.count > max) {
      const retryAfterSec = Math.ceil((existing.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
      });
    }

    return next();
  };
}

function userOrIpKey(req) {
  const userId = req.user?.id;
  if (userId) return `u:${userId}`;
  return `ip:${req.ip}`;
}

module.exports = {
  createRateLimiter,
  userOrIpKey,
};

