import { getSubscription } from "@/db/sqlite";
import { isOwnerEmail } from "./owner";
import { limitsFor, resolvePlan } from "./plan-resolution";
import { PLAN_LABELS, type Limits, type Plan } from "./plans";

export type Entitlements = {
  plan: Plan;
  planLabel: string;
  limits: Limits;
  billable: boolean;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  demo: boolean;
};

export function getEntitlements(userId: string, email?: string | null): Entitlements {
  const sub = getSubscription(userId);
  const plan = resolvePlan(email, sub);
  return {
    plan,
    planLabel: PLAN_LABELS[plan],
    limits: limitsFor(plan),
    billable: plan !== "owner" && !isOwnerEmail(email),
    status: sub?.status ?? "none",
    currentPeriodEnd: sub?.current_period_end ?? null,
    cancelAtPeriodEnd: Boolean(sub?.cancel_at_period_end),
    demo: Boolean(sub?.demo),
  };
}
