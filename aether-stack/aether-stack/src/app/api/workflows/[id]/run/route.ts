import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getSessionUser } from "@/lib/session";
import { getEntitlements } from "@/lib/entitlements";
import { consumeQuota } from "@/lib/quota";
import { getWorkflow, insertRun } from "@/db/sqlite";
import { executeWorkflow } from "@/lib/workflows/engine";
import { validateDefinition } from "@/lib/workflows/validate";
import { resolveProvider } from "@/lib/ai";
import type { WorkflowDefinition } from "@/lib/workflows/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { id } = await ctx.params;

  const wf = getWorkflow(id, user.id);
  if (!wf) return NextResponse.json({ error: "workflow not found" }, { status: 404 });

  const ent = getEntitlements(user.id, user.email);
  const q = consumeQuota(user.id, "workflow_runs", ent.limits.workflowRunsPerMonth);
  if (!q.allowed) {
    return NextResponse.json(
      { error: "quota_exceeded", metric: q.metric, used: q.used, limit: q.limit, plan: ent.plan },
      { status: 402 },
    );
  }

  // Re-validate stored definition before every run.
  const parsed = validateDefinition(JSON.parse(wf.definition));
  if (!parsed.ok) return NextResponse.json({ error: "invalid_definition", details: parsed.errors }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as { input?: string };
  const firstStep = parsed.value.steps[0];
  const runTriggerType = firstStep.kind === "trigger" ? firstStep.type : "manual";
  const result = await executeWorkflow(parsed.value as WorkflowDefinition, {
    provider: resolveProvider(),
    input: (body.input ?? "").slice(0, 20_000),
  });

  insertRun({
    id: randomBytes(12).toString("hex"),
    workflowId: wf.id,
    userId: user.id,
    status: result.status,
    triggerType: runTriggerType,
    steps: JSON.stringify(result.steps),
    output: result.output,
    error: result.error,
    durationMs: result.durationMs,
  });

  return NextResponse.json(result, { status: result.status === "succeeded" ? 200 : 500 });
}
