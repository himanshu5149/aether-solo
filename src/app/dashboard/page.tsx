import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { getEntitlements } from "@/lib/entitlements";
import { Nav } from "@/components/Nav";
import { BillingPanel } from "@/components/BillingPanel";
import { AiTestPanel } from "@/components/AiTestPanel";
import { aiMode } from "@/lib/ai";
import { listRuns, listWorkflows } from "@/db/sqlite";
import { peekQuota } from "@/lib/quota";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const ent = getEntitlements(user.id, user.email);
  const workflows = listWorkflows(user.id);
  const runs = listRuns(user.id, 5);
  const quota = peekQuota(user.id, "workflow_runs", ent.limits.workflowRunsPerMonth);

  return (
    <>
      <Nav />
      <main className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-400">Signed in as {user.email}</p>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Workflows</div>
            <div className="mt-1 text-2xl font-semibold">{workflows.length}</div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Runs this month</div>
            <div className="mt-1 text-2xl font-semibold">
              {quota.used}
              <span className="text-sm text-neutral-500">
                {" "}/ {quota.limit === Infinity ? "∞" : quota.limit}
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Plan</div>
            <div className="mt-1 text-2xl font-semibold">{ent.planLabel}</div>
          </div>
        </section>

        <BillingPanel ent={ent} />

        <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-300">Recent workflow runs</h2>
            <Link href="/workflows" className="text-xs underline">Open workflows</Link>
          </div>
          {runs.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-400">
              No runs yet. Add a workflow from a template on the <Link className="underline" href="/workflows">workflows page</Link>.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-xs">
              {runs.map((r) => (
                <li key={r.id} className="flex justify-between rounded-lg border border-neutral-800 bg-neutral-950/60 p-2">
                  <span className={r.status === "succeeded" ? "text-emerald-300" : "text-red-300"}>{r.status}</span>
                  <span className="text-neutral-500">{new Date(r.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <AiTestPanel mode={aiMode()} />
      </main>
    </>
  );
}
