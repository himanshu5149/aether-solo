import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { listRuns } from "@/db/sqlite";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const limit = Number(new URL(req.url).searchParams.get("limit") ?? 25);
  return NextResponse.json({ runs: listRuns(user.id, Number.isFinite(limit) ? limit : 25) });
}
