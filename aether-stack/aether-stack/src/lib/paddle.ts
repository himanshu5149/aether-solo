import { createHmac, timingSafeEqual } from "node:crypto";

const API_BASE =
  process.env.PADDLE_ENVIRONMENT === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";

export function paddleConfigured(): boolean {
  return Boolean(process.env.PADDLE_API_KEY && process.env.PADDLE_PRICE_PRO_MONTHLY);
}

export const PRICE_IDS = {
  pro_monthly: process.env.PADDLE_PRICE_PRO_MONTHLY ?? "",
} as const;

/** Verify a Paddle webhook signature: `Paddle-Signature: ts=...;h1=...` */
export function verifyPaddleSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  toleranceSeconds = 300,
): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(";").map((p) => p.split("=") as [string, string]));
  const { ts, h1 } = parts;
  if (!ts || !h1) return false;
  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(age) || age > toleranceSeconds) return false;
  const expected = createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(h1, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function planFromPriceId(priceId: string): "free" | "pro" {
  return Object.values(PRICE_IDS).includes(priceId) ? "pro" : "free";
}

/** Create a Paddle transaction and return its hosted checkout URL. */
export async function createCheckoutUrl(opts: { userId: string; priceId: string }): Promise<string> {
  const res = await fetch(`${API_BASE}/transactions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
    },
    body: JSON.stringify({
      items: [{ price_id: opts.priceId, quantity: 1 }],
      custom_data: { user_id: opts.userId },
    }),
  });
  const body = (await res.json()) as { data?: { checkout?: { url?: string } }; error?: unknown };
  if (!res.ok) throw new Error(`paddle ${res.status}: ${JSON.stringify(body).slice(0, 200)}`);
  const url = body.data?.checkout?.url;
  if (!url) throw new Error("paddle returned no checkout url");
  return url;
}

export async function cancelPaddleSubscription(subscriptionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
    },
    body: JSON.stringify({ effective_from: "next_billing_period" }),
  });
  if (!res.ok) throw new Error(`paddle cancel ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
