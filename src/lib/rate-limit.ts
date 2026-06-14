import { query } from './neon';

const memoryCache = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): Promise<boolean> {
  try {
    const now = Date.now();
    const cached = memoryCache.get(key);

    if (cached && now <= cached.resetAt && cached.count >= maxRequests) {
      return false;
    }

    const windowSeconds = Math.ceil(windowMs / 1000);
    const result = await query(`
      INSERT INTO rate_limits AS r (key, count, reset_at)
      VALUES ($1, 1, NOW() + make_interval(secs => $3))
      ON CONFLICT (key) DO UPDATE
      SET count = CASE
        WHEN r.reset_at <= NOW() THEN 1
        ELSE r.count + 1
      END,
      reset_at = CASE
        WHEN r.reset_at <= NOW() THEN EXCLUDED.reset_at
        ELSE r.reset_at
      END
      RETURNING count
    `, [key, maxRequests, windowSeconds]);

    const currentCount = result.rows[0]?.count ?? 1;
    const resetAt = now + windowMs;

    memoryCache.set(key, { count: currentCount, resetAt });

    return currentCount <= maxRequests;
  } catch {
    const now = Date.now();
    const cached = memoryCache.get(key);
    if (!cached || now > cached.resetAt) {
      memoryCache.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (cached.count >= maxRequests) return false;
    cached.count++;
    return true;
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryCache) {
    if (now > entry.resetAt) {
      memoryCache.delete(key);
    }
  }
}, 60000);
