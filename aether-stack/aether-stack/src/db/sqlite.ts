import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";

/* ------------------------------------------------------------------ *
 * Storage: a single local SQLite file via Node's built-in node:sqlite.
 * Zero external services, zero native builds. The schema is created on
 * first touch, so a fresh clone boots with no migration step.
 * ------------------------------------------------------------------ */

function resolveDbPath(): string {
  const p = process.env.APP_DB_PATH ?? ".data/app.db";
  mkdirSync(path.dirname(p), { recursive: true });
  return p;
}

let _db: DatabaseSync | null = null;

export function db(): DatabaseSync {
  if (_db) return _db;
  const inst = new DatabaseSync(resolveDbPath());
  inst.exec("PRAGMA journal_mode = WAL;");
  inst.exec("PRAGMA foreign_keys = ON;");
  migrate(inst);
  _db = inst;
  return inst;
}

/** Stable auth secret: env wins, otherwise generated once and persisted. */
export function authSecret(): string {
  if (process.env.BETTER_AUTH_SECRET) return process.env.BETTER_AUTH_SECRET;
  const p = ".data/secret";
  mkdirSync(".data", { recursive: true });
  if (existsSync(p)) return readFileSync(p, "utf8").trim();
  const s = randomBytes(32).toString("base64url");
  writeFileSync(p, s, { mode: 0o600 });
  return s;
}

function migrate(d: DatabaseSync) {
  d.exec(`
  CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS session_token_idx ON session(token);
  CREATE TABLE IF NOT EXISTS subscription (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'none',
    price_id TEXT,
    paddle_subscription_id TEXT,
    current_period_end TEXT,
    cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
    demo INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS subscription_user_idx ON subscription(user_id);
  CREATE TABLE IF NOT EXISTS usage_counter (
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    metric TEXT NOT NULL,
    period TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, metric, period)
  );
  CREATE TABLE IF NOT EXISTS workflow (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    template_id TEXT,
    category TEXT NOT NULL DEFAULT 'content',
    definition TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS workflow_user_idx ON workflow(user_id);
  CREATE TABLE IF NOT EXISTS workflow_run (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL REFERENCES workflow(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    trigger_type TEXT NOT NULL DEFAULT 'manual',
    steps TEXT NOT NULL,
    output TEXT NOT NULL DEFAULT '',
    error TEXT,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS workflow_run_user_idx ON workflow_run(user_id, created_at);
  CREATE TABLE IF NOT EXISTS remittance (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    invoice_ref TEXT NOT NULL,
    client_name TEXT NOT NULL,
    gross_minor INTEGER NOT NULL,
    currency TEXT NOT NULL,
    rail TEXT NOT NULL,
    npr_minor INTEGER,
    received_at TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS webhook_event (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    payload TEXT,
    processed_at TEXT NOT NULL
  );
  `);
}

/* ----------------------------- helpers ----------------------------- */

export const now = () => new Date().toISOString();

export type UserRow = { id: string; name: string; email: string; password_hash: string; created_at: string };

export function findUserByEmail(email: string): UserRow | null {
  return (db().prepare("SELECT * FROM user WHERE lower(email) = lower(?)").get(email) as UserRow) ?? null;
}
export function findUserById(id: string): UserRow | null {
  return (db().prepare("SELECT * FROM user WHERE id = ?").get(id) as UserRow) ?? null;
}
export function insertUser(u: UserRow) {
  db().prepare("INSERT INTO user (id,name,email,password_hash,created_at) VALUES (?,?,?,?,?)")
    .run(u.id, u.name, u.email, u.password_hash, u.created_at);
}

export function insertSession(s: { id: string; user_id: string; token: string; expires_at: string; created_at: string }) {
  db().prepare("INSERT INTO session (id,user_id,token,expires_at,created_at) VALUES (?,?,?,?,?)")
    .run(s.id, s.user_id, s.token, s.expires_at, s.created_at);
}
export function sessionByToken(token: string) {
  return db().prepare(
    `SELECT s.token, s.expires_at, u.id AS user_id, u.email, u.name
     FROM session s JOIN user u ON u.id = s.user_id WHERE s.token = ?`
  ).get(token) as { token: string; expires_at: string; user_id: string; email: string; name: string } | undefined;
}
export function deleteSession(token: string) {
  db().prepare("DELETE FROM session WHERE token = ?").run(token);
}
export function deleteUser(id: string) {
  db().prepare("DELETE FROM user WHERE id = ?").run(id);
}

export function getSubscription(userId: string) {
  return db().prepare(
    "SELECT plan,status,current_period_end,cancel_at_period_end,demo FROM subscription WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1"
  ).get(userId) as
    | { plan: string; status: string; current_period_end: string | null; cancel_at_period_end: number; demo: number }
    | undefined;
}
export function upsertSubscription(v: {
  userId: string; plan: string; status: string; priceId?: string | null;
  paddleId?: string | null; periodEnd?: string | null; demo?: number;
}) {
  const existing = db().prepare("SELECT id FROM subscription WHERE user_id = ?").get(v.userId) as { id: string } | undefined;
  const t = now();
  if (existing) {
    db().prepare(
      `UPDATE subscription SET plan=?,status=?,price_id=?,paddle_subscription_id=?,current_period_end=?,demo=?,updated_at=? WHERE id=?`
    ).run(v.plan, v.status, v.priceId ?? null, v.paddleId ?? null, v.periodEnd ?? null, v.demo ?? 0, t, existing.id);
  } else {
    db().prepare(
      `INSERT INTO subscription (id,user_id,plan,status,price_id,paddle_subscription_id,current_period_end,cancel_at_period_end,demo,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,0,?,?,?)`
    ).run(randomBytes(12).toString("hex"), v.userId, v.plan, v.status, v.priceId ?? null, v.paddleId ?? null, v.periodEnd ?? null, v.demo ?? 0, t, t);
  }
}
export function setCancelAtPeriodEnd(userId: string, flag: boolean) {
  db().prepare("UPDATE subscription SET cancel_at_period_end=?, updated_at=? WHERE user_id=?")
    .run(flag ? 1 : 0, now(), userId);
}

export function usageCount(userId: string, metric: string, period: string): number {
  const r = db().prepare("SELECT count FROM usage_counter WHERE user_id=? AND metric=? AND period=?")
    .get(userId, metric, period) as { count: number } | undefined;
  return r?.count ?? 0;
}
export function incrementUsage(userId: string, metric: string, period: string) {
  db().prepare(
    `INSERT INTO usage_counter (user_id,metric,period,count,updated_at) VALUES (?,?,?,1,?)
     ON CONFLICT(user_id,metric,period) DO UPDATE SET count = count + 1, updated_at = excluded.updated_at`
  ).run(userId, metric, period, now());
}

export type WorkflowRow = {
  id: string; user_id: string; name: string; template_id: string | null;
  category: string; definition: string; enabled: number; created_at: string; updated_at: string;
};
export function listWorkflows(userId: string): WorkflowRow[] {
  return db().prepare("SELECT * FROM workflow WHERE user_id=? ORDER BY updated_at DESC").all(userId) as WorkflowRow[];
}
export function getWorkflow(id: string, userId: string): WorkflowRow | undefined {
  return db().prepare("SELECT * FROM workflow WHERE id=? AND user_id=?").get(id, userId) as WorkflowRow | undefined;
}
export function insertWorkflow(w: WorkflowRow) {
  db().prepare(
    `INSERT INTO workflow (id,user_id,name,template_id,category,definition,enabled,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).run(w.id, w.user_id, w.name, w.template_id, w.category, w.definition, w.enabled, w.created_at, w.updated_at);
}
export function setWorkflowEnabled(id: string, userId: string, enabled: boolean) {
  db().prepare("UPDATE workflow SET enabled=?, updated_at=? WHERE id=? AND user_id=?")
    .run(enabled ? 1 : 0, now(), id, userId);
}

export function insertRun(r: {
  id: string; workflowId: string; userId: string; status: string; triggerType: string;
  steps: string; output: string; error: string | null; durationMs: number;
}) {
  db().prepare(
    `INSERT INTO workflow_run (id,workflow_id,user_id,status,trigger_type,steps,output,error,duration_ms,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).run(r.id, r.workflowId, r.userId, r.status, r.triggerType, r.steps, r.output, r.error, r.durationMs, now());
}
export type RunRow = {
  id: string; workflow_id: string; user_id: string; status: string; trigger_type: string;
  steps: string; output: string; error: string | null; duration_ms: number; created_at: string;
};
export function listRuns(userId: string, limit = 25): RunRow[] {
  return db()
    .prepare("SELECT * FROM workflow_run WHERE user_id=? ORDER BY created_at DESC LIMIT ?")
    .all(userId, limit) as RunRow[];
}
