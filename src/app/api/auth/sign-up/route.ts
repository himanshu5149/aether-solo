import { NextResponse } from "next/server";
import { createUser, findUserExists, startSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const rl = rateLimit("sign-up", 20, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "too many attempts" }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as { name?: string; email?: string; password?: string };
  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "a valid email is required" }, { status: 400 });
  if (password.length < 10) return NextResponse.json({ error: "password must be at least 10 characters" }, { status: 400 });
  if (findUserExists(email)) return NextResponse.json({ error: "that email is already registered" }, { status: 409 });

  const user = createUser(name, email, password);
  const { token, expiresAt } = startSession(user.id);
  const res = NextResponse.json({ user });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return res;
}
