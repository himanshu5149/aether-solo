import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { aiMode, resolveProvider } from "@/lib/ai";
import { getEntitlements } from "@/lib/entitlements";
import { consumeQuota } from "@/lib/quota";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const ent = getEntitlements(user.id, user.email);
  const q = consumeQuota(user.id, "api_calls", ent.limits.apiCallsPerDay);
  if (!q.allowed) {
    return NextResponse.json({ error: "quota_exceeded", metric: q.metric, used: q.used, limit: q.limit }, { status: 402 });
  }
  const body = (await req.json().catch(() => ({}))) as { input?: string };
  try {
    const output = await resolveProvider()({
      prompt: "Reply with a short, useful response to the input. Do not invent facts that are not present.",
      input: body.input ?? "",
      model: "gpt-4o-mini",
    });
    return NextResponse.json({ mode: aiMode(), output });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
