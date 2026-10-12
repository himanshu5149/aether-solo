import { NextResponse } from "next/server";
import { authenticate, startSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  const email = (body.email ?? "").trim().toLowerCase();
  const rl = rateLimit(`sign-in:${email}`, 10, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "too many attempts, try again shortly" }, { status: 429 });

  const user = authenticate(email, body.password ?? "");
  if (!user) return NextResponse.json({ error: "invalid email or password" }, { status: 401 });

  const { token, expiresAt } = startSession(user.id);
  const res = NextResponse.json({ user });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return res;
}
