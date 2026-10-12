import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getSessionUser } from "@/lib/session";
import { getEntitlements } from "@/lib/entitlements";
import { insertWorkflow, listWorkflows, now, type WorkflowRow } from "@/db/sqlite";
import { TEMPLATES, templateById } from "@/lib/workflows/templates";
import { validateDefinition } from "@/lib/workflows/validate";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  return NextResponse.json({
    templates: TEMPLATES.map((t) => ({ id: t.id, name: t.name, category: t.category, summary: t.summary })),
    workflows: listWorkflows(user.id),
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const ent = getEntitlements(user.id, user.email);
  const existing = listWorkflows(user.id);
  if (ent.limits.projects !== Infinity && existing.length >= ent.limits.projects) {
    return NextResponse.json(
      { error: "project_limit_reached", used: existing.length, limit: ent.limits.projects, plan: ent.plan },
      { status: 402 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { templateId?: string; definition?: unknown };
  const definition = body.templateId ? templateById(body.templateId)?.definition : body.definition;
  if (!definition) return NextResponse.json({ error: "provide templateId or definition" }, { status: 400 });

  const check = validateDefinition(definition);
  if (!check.ok) return NextResponse.json({ error: "invalid_definition", details: check.errors }, { status: 400 });

  const row: WorkflowRow = {
    id: randomBytes(12).toString("hex"),
    user_id: user.id,
    name: check.value.name,
    template_id: body.templateId ?? null,
    category: check.value.category,
    definition: JSON.stringify(check.value),
    enabled: 1,
    created_at: now(),
    updated_at: now(),
  };
  insertWorkflow(row);
  return NextResponse.json({ workflow: row }, { status: 201 });
}
