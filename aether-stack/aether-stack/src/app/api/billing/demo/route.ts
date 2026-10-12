import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getEntitlements } from "@/lib/entitlements";
import { upsertSubscription } from "@/db/sqlite";

export const dynamic = "force-dynamic";

/** Demo-only billing control so the paid surface is testable with no Paddle keys. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const ent = getEntitlements(user.id, user.email);
  if (!ent.billable) return NextResponse.json({ error: "owner_not_billable" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { action?: string };
  if (body.action === "activate") {
    upsertSubscription({
      userId: user.id, plan: "pro", status: "active",
      periodEnd: new Date(Date.now() + 30 * 86_400_000).toISOString(), demo: 1,
    });
    return NextResponse.json({ message: "Demo Pro activated for 30 days." });
  }
  if (body.action === "deactivate") {
    upsertSubscription({ userId: user.id, plan: "free", status: "canceled", periodEnd: null, demo: 1 });
    return NextResponse.json({ message: "Subscription ended. Back on Free." });
  }
  return NextResponse.json({ error: "action must be activate or deactivate" }, { status: 400 });
}
