"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Entitlements } from "@/lib/entitlements";
import { PLAN_LIMITS, PLAN_PRICE_USD } from "@/lib/plans";

export function BillingPanel({ ent }: { ent: Entitlements }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function go(path: string, body?: unknown) {
    setBusy(true);
    setMsg("");
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(data.error ?? `request failed (${res.status})`);
    if (data.url) {
      window.location.href = data.url as string;
      return;
    }
    setMsg(data.message ?? "done");
    router.refresh();
  }

  const limits = PLAN_LIMITS[ent.plan];

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
      <h2 className="text-sm font-medium text-neutral-300">Plan &amp; billing</h2>
      <dl className="mt-3 grid gap-1 text-sm text-neutral-400">
        <div className="flex justify-between"><dt>Plan</dt><dd className="font-mono">{ent.planLabel}</dd></div>
        <div className="flex justify-between"><dt>Subscription status</dt><dd className="font-mono">{ent.status}{ent.demo ? " (demo)" : ""}</dd></div>
        <div className="flex justify-between"><dt>Workflow runs / month</dt><dd className="font-mono">{limits.workflowRunsPerMonth === Infinity ? "unlimited" : limits.workflowRunsPerMonth}</dd></div>
        <div className="flex justify-between"><dt>Renews / ends</dt><dd className="font-mono">{ent.currentPeriodEnd ?? "—"}</dd></div>
        <div className="flex justify-between"><dt>Cancel at period end</dt><dd className="font-mono">{ent.cancelAtPeriodEnd ? "yes" : "no"}</dd></div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        {ent.plan === "owner" && (
          <p className="text-sm text-emerald-300">
            Owner account: every limit is unlimited and this account is never billed.
          </p>
        )}
        {ent.plan === "free" && (
          <button disabled={busy} onClick={() => go("/api/billing/checkout")}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-50">
            Upgrade to Pro (${PLAN_PRICE_USD.pro}/mo)
          </button>
        )}
        {ent.plan === "pro" && !ent.cancelAtPeriodEnd && (
          <button disabled={busy} onClick={() => go("/api/billing/cancel")}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm disabled:opacity-50">
            Cancel at period end
          </button>
        )}
        {ent.plan === "pro" && (
          <button disabled={busy} onClick={() => go("/api/billing/demo", { action: "deactivate" })}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm disabled:opacity-50">
            End subscription (reset to Free)
          </button>
        )}
      </div>
      {msg && <p className="mt-3 text-sm text-amber-300">{msg}</p>}
    </section>
  );
}
