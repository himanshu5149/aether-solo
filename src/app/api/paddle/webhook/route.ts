import { NextResponse } from "next/server";
import { db, now, upsertSubscription } from "@/db/sqlite";
import { planFromPriceId, verifyPaddleSignature } from "@/lib/paddle";

export const dynamic = "force-dynamic";

type PaddleEvent = {
  event_id?: string;
  event_type?: string;
  occurred_at?: string;
  data?: {
    id?: string;
    status?: string;
    custom_data?: { user_id?: string };
    items?: { price?: { id?: string } }[];
    current_billing_period?: { ends_at?: string };
  };
};

export async function POST(req: Request) {
  const raw = await req.text();
  const secret = process.env.PADDLE_WEBHOOK_SECRET ?? "";

  if (!secret) return NextResponse.json({ error: "webhook_secret_not_configured" }, { status: 503 });
  if (!verifyPaddleSignature(raw, req.headers.get("paddle-signature"), secret)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let event: PaddleEvent;
  try {
    event = JSON.parse(raw) as PaddleEvent;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!event.event_id || !event.event_type) {
    return NextResponse.json({ error: "missing event_id or event_type" }, { status: 400 });
  }

  // Idempotency: insert the event id first; a duplicate short-circuits.
  try {
    db().prepare(
      "INSERT INTO webhook_event (event_id,event_type,occurred_at,payload,processed_at) VALUES (?,?,?,?,?)"
    ).run(event.event_id, event.event_type, event.occurred_at ?? now(), raw, now());
  } catch {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const userId = event.data?.custom_data?.user_id;
  const priceId = event.data?.items?.[0]?.price?.id ?? "";
  const periodEnd = event.data?.current_billing_period?.ends_at ?? null;
  const status = event.data?.status ?? "unknown";

  if (userId) {
    if (event.event_type === "subscription.activated" || event.event_type === "subscription.updated") {
      upsertSubscription({
        userId, plan: planFromPriceId(priceId), status,
        priceId, paddleId: event.data?.id ?? null, periodEnd, demo: 0,
      });
    } else if (event.event_type === "subscription.canceled") {
      upsertSubscription({ userId, plan: "free", status: "canceled", priceId, periodEnd, demo: 0 });
    }
  }

  return NextResponse.json({ ok: true });
}
