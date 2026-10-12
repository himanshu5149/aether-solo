import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { db, listRuns, listWorkflows } from "@/db/sqlite";
import { getEntitlements } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const remittances = db().prepare("SELECT * FROM remittance WHERE user_id = ?").all(user.id);
  const payload = {
    exportedAt: new Date().toISOString(),
    account: { id: user.id, name: user.name, email: user.email },
    entitlements: getEntitlements(user.id, user.email),
    workflows: listWorkflows(user.id).map((w) => ({ ...w, definition: JSON.parse(w.definition) })),
    runs: listRuns(user.id, 500),
    remittances,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="aether-export-${user.id}.json"`,
    },
  });
}
