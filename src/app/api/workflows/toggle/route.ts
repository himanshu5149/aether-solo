import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getWorkflow, setWorkflowEnabled } from "@/db/sqlite";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { id?: string; enabled?: boolean };
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const wf = getWorkflow(body.id, user.id);
  if (!wf) return NextResponse.json({ error: "workflow not found" }, { status: 404 });
  setWorkflowEnabled(body.id, user.id, body.enabled !== false);
  return NextResponse.json({ ok: true, enabled: body.enabled !== false });
}
