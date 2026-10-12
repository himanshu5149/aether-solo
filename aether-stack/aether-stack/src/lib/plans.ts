export type Plan = "free" | "pro" | "owner";

export type Limits = {
  projects: number;
  apiCallsPerDay: number;
  seats: number;
  exportsPerMonth: number;
  workflowRunsPerMonth: number;
};

export const PLAN_LIMITS: Record<Plan, Limits> = {
  free: { projects: 1, apiCallsPerDay: 100, seats: 1, exportsPerMonth: 1, workflowRunsPerMonth: 20 },
  pro: { projects: 25, apiCallsPerDay: 10_000, seats: 5, exportsPerMonth: 100, workflowRunsPerMonth: 2_000 },
  owner: {
    projects: Infinity, apiCallsPerDay: Infinity, seats: Infinity,
    exportsPerMonth: Infinity, workflowRunsPerMonth: Infinity,
  },
};

export const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  pro: "Pro",
  owner: "Owner (comped)",
};

/** Display only. Real amounts live in the Paddle price configuration. */
export const PLAN_PRICE_USD: Record<Plan, number> = { free: 0, pro: 19, owner: 0 };
