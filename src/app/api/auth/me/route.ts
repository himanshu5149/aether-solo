import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getEntitlements } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const ent = getEntitlements(user.id, user.email);
  return NextResponse.json({ user, entitlements: ent });
}
