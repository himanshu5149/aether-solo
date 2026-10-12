import { incrementUsage, usageCount } from "@/db/sqlite";

export type QuotaResult = { allowed: boolean; used: number; limit: number; metric: string };

export function periodKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Consume one unit of a metered metric. Owner (Infinity) short-circuits before
 * any read or write, so owner usage is never recorded and never blocked.
 */
export function consumeQuota(userId: string, metric: string, limit: number): QuotaResult {
  if (limit === Infinity) return { allowed: true, used: 0, limit, metric };
  const period = periodKey();
  const used = usageCount(userId, metric, period);
  if (used >= limit) return { allowed: false, used, limit, metric };
  incrementUsage(userId, metric, period);
  return { allowed: true, used: used + 1, limit, metric };
}

export function peekQuota(userId: string, metric: string, limit: number): QuotaResult {
  if (limit === Infinity) return { allowed: true, used: 0, limit, metric };
  const used = usageCount(userId, metric, periodKey());
  return { allowed: used < limit, used, limit, metric };
}
