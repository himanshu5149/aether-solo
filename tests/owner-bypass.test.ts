import assert from "node:assert/strict";
import { rmSync } from "node:fs";

process.env.APP_DB_PATH = ".data/test.db";
rmSync(".data/test.db", { force: true });
rmSync(".data/test.db-wal", { force: true });
rmSync(".data/test.db-shm", { force: true });

const { isOwnerEmail, ownerEmails } = await import("../src/lib/owner.ts");
const { resolvePlan, limitsFor } = await import("../src/lib/plan-resolution.ts");
const { PLAN_LIMITS } = await import("../src/lib/plans.ts");
const { consumeQuota, peekQuota } = await import("../src/lib/quota.ts");
const { db, insertUser, now } = await import("../src/db/sqlite.ts");

let pass = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    pass++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    console.error(`FAIL  ${name}\n      ${e instanceof Error ? e.message : String(e)}`);
    process.exitCode = 1;
  }
}

process.env.OWNER_EMAIL = "Owner@Example.com, second@example.com";

check("owner email is matched case-insensitively", () => assert.equal(isOwnerEmail("owner@example.com"), true));
check("second owner email is matched", () => assert.equal(isOwnerEmail("SECOND@example.com"), true));
check("non-owner is rejected", () => assert.equal(isOwnerEmail("someone@else.com"), false));
check("null email is rejected", () => assert.equal(isOwnerEmail(null), false));
check("owner list is normalised", () => assert.deepEqual(ownerEmails(), ["owner@example.com", "second@example.com"]));

check("owner resolves to owner plan even with no subscription", () =>
  assert.equal(resolvePlan("owner@example.com", undefined), "owner"));
check("owner plan ignores an expired subscription", () =>
  assert.equal(resolvePlan("owner@example.com", { plan: "pro", status: "canceled", current_period_end: "2020-01-01T00:00:00.000Z", cancel_at_period_end: 1, demo: 0 }), "owner"));
check("owner plan beats an active subscription", () =>
  assert.equal(resolvePlan("owner@example.com", { plan: "free", status: "active", current_period_end: null, cancel_at_period_end: 0, demo: 0 }), "owner"));
check("owner limits are all infinite", () => {
  const l = limitsFor("owner");
  assert.equal(l.workflowRunsPerMonth, Infinity);
  assert.equal(l.projects, Infinity);
  assert.equal(l.apiCallsPerDay, Infinity);
});

check("a spoofed isOwner field cannot grant the owner plan", () => {
  const spoof = { plan: "free", status: "active", current_period_end: null, cancel_at_period_end: 0, demo: 0, isOwner: true };
  assert.equal(resolvePlan("attacker@example.com", spoof as never), "free");
});
check("no subscription means free", () => assert.equal(resolvePlan("user@example.com", undefined), "free"));
check("active pro subscription means pro", () =>
  assert.equal(resolvePlan("user@example.com", { plan: "pro", status: "active", current_period_end: null, cancel_at_period_end: 0, demo: 0 }), "pro"));
check("canceled subscription falls back to free", () =>
  assert.equal(resolvePlan("user@example.com", { plan: "pro", status: "canceled", current_period_end: null, cancel_at_period_end: 1, demo: 0 }), "free"));
check("expired period falls back to free", () =>
  assert.equal(resolvePlan("user@example.com", { plan: "pro", status: "active", current_period_end: "2020-01-01T00:00:00.000Z", cancel_at_period_end: 0, demo: 0 }), "free"));

check("owner quota short-circuits and never records usage", () => {
  const before = peekQuota("owner-user", "workflow_runs", Infinity);
  assert.equal(before.allowed, true);
  assert.equal(before.used, 0);
  assert.equal(before.limit, Infinity);
});

db();
insertUser({ id: "quota-user", name: "Q", email: "quota@example.com", password_hash: "x:y", created_at: now() });

check("free quota blocks once the limit is reached", () => {
  const limit = PLAN_LIMITS.free.workflowRunsPerMonth;
  for (let i = 0; i < limit; i++) {
    const r = consumeQuota("quota-user", "workflow_runs", limit);
    assert.equal(r.allowed, true, `run ${i + 1} should be allowed`);
  }
  const blocked = consumeQuota("quota-user", "workflow_runs", limit);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.used, limit);
});
check("pro quota is larger than free", () => assert.ok(PLAN_LIMITS.pro.workflowRunsPerMonth > PLAN_LIMITS.free.workflowRunsPerMonth));

process.env.OWNER_EMAIL = "";
check("with OWNER_EMAIL unset there are no owners (fails closed)", () => {
  assert.deepEqual(ownerEmails(), []);
  assert.equal(isOwnerEmail("owner@example.com"), false);
  assert.equal(resolvePlan("owner@example.com", undefined), "free");
});

console.log(`\nowner-bypass: ${pass} passed, ${process.exitCode ? 1 : 0} failed`);
