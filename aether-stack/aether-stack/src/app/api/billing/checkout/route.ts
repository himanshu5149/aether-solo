import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getEntitlements } from "@/lib/entitlements";
import { rateLimit } from "@/lib/rate-limit";
import { createCheckoutUrl, paddleConfigured, PRICE_IDS } from "@/lib/paddle";
import { now, upsertSubscription } from "@/db/sqlite";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const ent = getEntitlements(user.id, user.email);
  if (!ent.billable) return NextResponse.json({ error: "owner_not_billable" }, { status: 403 });

  const rl = rateLimit(`checkout:${user.id}`, 10, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "too many requests" }, { status: 429 });

  if (!paddleConfigured()) {
    // Demo mode: no Paddle keys configured. Activate a clearly-labelled demo
    // subscription so the whole billing surface stays exercisable.
    const periodEnd = new Date(Date.now() + 30 * 86_400_000).toISOString();
    upsertSubscription({ userId: user.id, plan: "pro", status: "active", periodEnd, demo: 1 });
    return NextResponse.json({
      mode: "demo",
      message: `Demo mode: no Paddle keys set, so Pro was activated locally until ${periodEnd.slice(0, 10)}. Add PADDLE_API_KEY and PADDLE_PRICE_PRO_MONTHLY for real checkout.`,
    });
  }

  try {
    const url = await createCheckoutUrl({ userId: user.id, priceId: PRICE_IDS.pro_monthly });
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
