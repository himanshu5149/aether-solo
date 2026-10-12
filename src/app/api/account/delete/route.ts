import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroyUser, getSessionUser, SESSION_COOKIE } from "@/lib/session";
import { isOwnerEmail } from "@/lib/owner";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { confirm?: string };
  const required = isOwnerEmail(user.email) ? "DELETE OWNER" : "DELETE";
  if (body.confirm !== required) {
    return NextResponse.json({ error: `type "${required}" to confirm` }, { status: 400 });
  }

  destroyUser(user.id); // cascades to sessions, subscription, workflows, runs
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const res = NextResponse.json({ ok: true });
  if (token) res.cookies.set(SESSION_COOKIE, "", { path: "/", expires: new Date(0) });
  return res;
}
