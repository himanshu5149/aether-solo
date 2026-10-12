import { PLAN_LIMITS, type Limits, type Plan } from "./plans";
import { isOwnerEmail } from "./owner";

export type SubscriptionLike = {
  plan: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: number;
  demo: number;
} | null | undefined;

const ACTIVE = new Set(["active", "trialing", "past_due"]);

/** The single place plan decisions are made. Owner check always runs first. */
export function resolvePlan(email: string | null | undefined, sub: SubscriptionLike): Plan {
  if (isOwnerEmail(email)) return "owner";
  if (!sub) return "free";
  if (!ACTIVE.has(sub.status)) return "free";
  if (sub.current_period_end && new Date(sub.current_period_end).getTime() < Date.now()) return "free";
  return sub.plan === "pro" ? "pro" : "free";
}

export function limitsFor(plan: Plan): Limits {
  return PLAN_LIMITS[plan];
}

export function withinLimit(used: number, limit: number): boolean {
  return limit === Infinity || used < limit;
}
