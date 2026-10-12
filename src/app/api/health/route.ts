import { NextResponse } from "next/server";
import { db } from "@/db/sqlite";
import { aiMode } from "@/lib/ai";
import { paddleConfigured } from "@/lib/paddle";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {};
  try {
    db().prepare("SELECT 1 AS ok").get();
    checks.database = "ok";
  } catch (e) {
    checks.database = `error: ${e instanceof Error ? e.message : String(e)}`;
  }
  checks.ai = aiMode();
  checks.billing = paddleConfigured() ? "paddle" : "demo";
  const ok = checks.database === "ok";
  return NextResponse.json({ ok, checks, version: "1.0.0" }, { status: ok ? 200 : 500 });
}
