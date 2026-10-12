import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { db, insertRun } from "@/db/sqlite";
import { executeWorkflow } from "@/lib/workflows/engine";
import { validateDefinition } from "@/lib/workflows/validate";
import { resolveProvider } from "@/lib/ai";
import type { WorkflowDefinition } from "@/lib/workflows/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.text();
  const wf = db().prepare(
    "SELECT id, user_id, definition FROM workflow WHERE template_id = ? AND enabled = 1 LIMIT 1"
  ).get("support-reply-draft") as { id: string; user_id: string; definition: string } | undefined;

  if (!wf) return NextResponse.json({ error: "no enabled support workflow" }, { status: 404 });

  const parsed = validateDefinition(JSON.parse(wf.definition));
  if (!parsed.ok) return NextResponse.json({ error: "invalid_definition", details: parsed.errors }, { status: 400 });

  const result = await executeWorkflow(parsed.value as WorkflowDefinition, {
    provider: resolveProvider(),
    input: body.slice(0, 20_000),
  });

  insertRun({
    id: randomBytes(12).toString("hex"), workflowId: wf.id, userId: wf.user_id,
    status: result.status, triggerType: "webhook", steps: JSON.stringify(result.steps),
    output: result.output, error: result.error, durationMs: result.durationMs,
  });

  return NextResponse.json({ status: result.status, output: result.output }, { status: result.status === "succeeded" ? 200 : 500 });
}
