export function rateLimit({
  windowMs = 900000,
  limit = 10,
  message = "Too many attempts. Try again later.",
} = {}) {
  const buckets = new Map();
  return (req, res, next) => {
    const key = `${req.ip || "unknown"}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    if (buckets.size > 5000) {
      for (const [storedKey, stored] of buckets)
        if (stored.resetAt <= now) buckets.delete(storedKey);
    }
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now)
      bucket = { count: 0, resetAt: now + windowMs };
    bucket.count += 1;
    buckets.set(key, bucket);
    res.setHeader("RateLimit-Limit", String(limit));
    res.setHeader(
      "RateLimit-Remaining",
      String(Math.max(limit - bucket.count, 0)),
    );
    if (bucket.count > limit) return res.status(429).json({ message });
    return next();
  };
}
