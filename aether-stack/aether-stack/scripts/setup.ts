/**
 * Idempotent setup: create .env.local from .env.example if missing, then seed
 * the demo account and the four workflow templates. Safe to run repeatedly.
 */
import { copyFileSync, existsSync, readFileSync, rmSync } from "node:fs";
import { randomBytes } from "node:crypto";

function loadEnvLocal() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, "");
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}

if (!existsSync(".env.local")) {
  copyFileSync(".env.example", ".env.local");
  console.log("created .env.local from .env.example");
}

loadEnvLocal();

const { db, insertUser, findUserByEmail, insertWorkflow, listWorkflows, now } = await import("../src/db/sqlite.ts");
const { hashPassword } = await import("../src/lib/password.ts");
const { TEMPLATES } = await import("../src/lib/workflows/templates.ts");

const OWNER = (process.env.OWNER_EMAIL || "demo@example.com").split(",")[0].trim().toLowerCase();
const PASSWORD = process.env.DEMO_PASSWORD || "demo-password-123";

db(); // create schema

let user = findUserByEmail(OWNER);
if (!user) {
  const id = randomBytes(12).toString("hex");
  insertUser({ id, name: "Demo Owner", email: OWNER, password_hash: hashPassword(PASSWORD), created_at: now() });
  user = findUserByEmail(OWNER)!;
  console.log(`seeded demo account ${OWNER} (password: ${PASSWORD})`);
} else {
  console.log(`demo account ${OWNER} already exists`);
}

const existing = new Set(listWorkflows(user.id).map((w) => w.template_id));
for (const t of TEMPLATES) {
  if (existing.has(t.id)) continue;
  insertWorkflow({
    id: randomBytes(12).toString("hex"),
    user_id: user.id,
    name: t.definition.name,
    template_id: t.id,
    category: t.definition.category,
    definition: JSON.stringify(t.definition),
    enabled: 1,
    created_at: now(),
    updated_at: now(),
  });
  console.log(`added workflow: ${t.name}`);
}

// Remove a stale test database if one was left behind.
if (process.env.APP_DB_PATH === ".data/test.db" && existsSync(".data/test.db")) rmSync(".data/test.db");

console.log("setup complete");
