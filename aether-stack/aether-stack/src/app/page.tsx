import Link from "next/link";
import { PLAN_LIMITS } from "@/lib/plans";
import { aiMode } from "@/lib/ai";
import { paddleConfigured } from "@/lib/paddle";

export default function Home() {
  const mode = aiMode();
  return (
    <main className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Aether</h1>
        <p className="max-w-2xl text-neutral-400">
          The operating console for a one-person software business: plans and quotas, billing through
          Paddle, and AI workflows that run on a schedule, a webhook, or a click.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">AI provider</div>
          <div className="mt-1 font-mono text-sm">{mode === "mock" ? "mock (no key set)" : mode}</div>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Billing</div>
          <div className="mt-1 font-mono text-sm">{paddleConfigured() ? "Paddle live config" : "demo mode"}</div>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Storage</div>
          <div className="mt-1 font-mono text-sm">local SQLite file</div>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <Link href="/sign-in" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900">Sign in</Link>
        <Link href="/sign-up" className="rounded-lg border border-neutral-700 px-4 py-2 text-sm">Create account</Link>
        <Link href="/pricing" className="rounded-lg border border-neutral-700 px-4 py-2 text-sm">Pricing</Link>
        <Link href="/dashboard" className="rounded-lg border border-neutral-700 px-4 py-2 text-sm">Dashboard</Link>
      </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
        <h2 className="text-sm font-medium text-neutral-300">Free plan includes</h2>
        <ul className="mt-2 grid gap-1 text-sm text-neutral-400 sm:grid-cols-2">
          <li>{PLAN_LIMITS.free.projects} project</li>
          <li>{PLAN_LIMITS.free.workflowRunsPerMonth} workflow runs / month</li>
          <li>{PLAN_LIMITS.free.apiCallsPerDay} API calls / day</li>
          <li>{PLAN_LIMITS.free.exportsPerMonth} data export / month</li>
        </ul>
      </section>
    </main>
  );
}
