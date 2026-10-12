import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getEntitlements } from "@/lib/entitlements";
import { getSubscription, setCancelAtPeriodEnd, now } from "@/db/sqlite";
import { cancelPaddleSubscription, paddleConfigured } from "@/lib/paddle";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const ent = getEntitlements(user.id, user.email);
  if (!ent.billable) return NextResponse.json({ error: "owner_not_billable" }, { status: 403 });
  if (ent.plan !== "pro") return NextResponse.json({ error: "no_active_subscription" }, { status: 400 });

  const sub = getSubscription(user.id) as { paddle_subscription_id?: string | null } | undefined;
  if (paddleConfigured() && sub?.paddle_subscription_id) {
    try {
      await cancelPaddleSubscription(sub.paddle_subscription_id);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
    }
  }
  setCancelAtPeriodEnd(user.id, true);
  return NextResponse.json({
    message: `Subscription will end on ${ent.currentPeriodEnd ?? "the current period end"}. Access continues until then.`,
    at: now(),
  });
}
