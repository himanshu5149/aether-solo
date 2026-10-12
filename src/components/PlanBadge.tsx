import { PLAN_LABELS, type Plan } from "@/lib/plans";

export function PlanBadge({ plan }: { plan: Plan }) {
  const tone =
    plan === "owner" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
    : plan === "pro" ? "border-sky-400/40 bg-sky-400/10 text-sky-300"
    : "border-neutral-600 bg-neutral-800 text-neutral-300";
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone}`}>
      {PLAN_LABELS[plan]}
    </span>
  );
}
