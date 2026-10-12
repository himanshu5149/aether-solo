import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getEntitlements } from "@/lib/entitlements";
import { Nav } from "@/components/Nav";
import { WorkflowConsole } from "@/components/WorkflowConsole";
import { TEMPLATES } from "@/lib/workflows/templates";
import { listRuns, listWorkflows } from "@/db/sqlite";
import { peekQuota } from "@/lib/quota";

export const dynamic = "force-dynamic";

export default async function WorkflowsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const ent = getEntitlements(user.id, user.email);
  const workflows = listWorkflows(user.id);
  const runs = listRuns(user.id, 10);
  const quota = peekQuota(user.id, "workflow_runs", ent.limits.workflowRunsPerMonth);

  return (
    <>
      <Nav />
      <main className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">AI workflows</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Trigger → AI step → action. Create from a template, then run it with your own input.
          </p>
        </header>
        <WorkflowConsole
          templates={TEMPLATES.map((t) => ({ id: t.id, name: t.name, category: t.category, summary: t.summary }))}
          workflows={workflows.map((w) => ({
            id: w.id, name: w.name, category: w.category, enabled: w.enabled, template_id: w.template_id,
          }))}
          runs={runs.map((r) => ({
            id: r.id, workflow_id: r.workflow_id, status: r.status,
            output: r.output, created_at: r.created_at, duration_ms: r.duration_ms,
          }))}
          runsUsed={quota.used}
          runsLimit={quota.limit === Infinity ? null : quota.limit}
        />
      </main>
    </>
  );
}
