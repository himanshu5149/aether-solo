import assert from "node:assert/strict";

const { validateDefinition } = await import("../src/lib/workflows/validate.ts");
const { executeWorkflow } = await import("../src/lib/workflows/engine.ts");
const { TEMPLATES } = await import("../src/lib/workflows/templates.ts");
const { mockProvider } = await import("../src/lib/ai.ts");

let pass = 0;
function check(name: string, fn: () => void) {
  try {
    fn(); pass++; console.log(`  ok  ${name}`);
  } catch (e) {
    console.error(`FAIL  ${name}\n      ${e instanceof Error ? e.message : String(e)}`);
    process.exitCode = 1;
  }
}

check("every shipped template validates", () => {
  for (const t of TEMPLATES) {
    const r = validateDefinition(t.definition);
    assert.equal(r.ok, true, `${t.id} should validate: ${r.ok ? "" : r.errors.join("; ")}`);
  }
});
check("all four categories are present", () => {
  const cats = new Set(TEMPLATES.map((t) => t.category));
  for (const c of ["content", "leads", "invoicing", "support"]) assert.ok(cats.has(c as never), `missing ${c}`);
});
check("a definition without a trigger first step is rejected", () => {
  const r = validateDefinition({ name: "x", category: "content", steps: [
    { kind: "ai", prompt: "p", model: "m" }, { kind: "action", type: "post", target: "t" },
  ]});
  assert.equal(r.ok, false);
});
check("a definition without an AI step is rejected", () => {
  const r = validateDefinition({ name: "x", category: "content", steps: [
    { kind: "trigger", type: "manual" }, { kind: "action", type: "post", target: "t" }, { kind: "action", type: "post", target: "t2" },
  ]});
  assert.equal(r.ok, false);
});
check("a definition not ending in an action is rejected", () => {
  const r = validateDefinition({ name: "x", category: "content", steps: [
    { kind: "trigger", type: "manual" }, { kind: "ai", prompt: "p", model: "m" }, { kind: "ai", prompt: "p", model: "m" },
  ]});
  assert.equal(r.ok, false);
});
check("two steps is below the minimum", () => {
  const r = validateDefinition({ name: "x", category: "content", steps: [
    { kind: "trigger", type: "manual" }, { kind: "action", type: "post", target: "t" },
  ]});
  assert.equal(r.ok, false);
});
check("an unknown step kind is rejected", () => {
  const r = validateDefinition({ name: "x", category: "content", steps: [
    { kind: "trigger", type: "manual" }, { kind: "ai", prompt: "p", model: "m" }, { kind: "teleport", to: "mars" },
  ]});
  assert.equal(r.ok, false);
});

const def = {
  name: "test flow",
  category: "content" as const,
  steps: [
    { kind: "trigger" as const, type: "manual" as const },
    { kind: "ai" as const, prompt: "Summarise the input.", model: "gpt-4o-mini" },
    { kind: "action" as const, type: "post" as const, target: "blog" },
  ],
};

const ok = await executeWorkflow(def, { provider: mockProvider(), input: "seed text" });
check("runs steps in order and carries output forward", () => {
  assert.equal(ok.steps.length, 3);
  assert.deepEqual(ok.steps.map((s) => s.kind), ["trigger", "ai", "action"]);
  assert.ok(ok.steps[1].output.startsWith("[MOCK AI"), "ai step should receive the payload, got: " + ok.steps[1].output.slice(0, 40));
  assert.ok(ok.steps[1].output.includes("seed text"), "ai step should see the input");
});
check("trigger step does not clobber the payload", () => assert.equal(ok.steps[0].output, "armed: manual"));
check("the run reports success with output", () => {
  assert.equal(ok.status, "succeeded");
  assert.ok(ok.output.includes("[MOCK AI"));
  assert.equal(ok.error, null);
});
check("every step records a duration", () => {
  for (const s of ok.steps) assert.ok(typeof s.durationMs === "number" && s.durationMs >= 0);
});
check("the action step records a receipt naming its target", () =>
  assert.ok(ok.steps[2].output.includes("blog")));

const failing = await executeWorkflow(def, {
  provider: async () => { throw new Error("provider exploded"); },
  input: "x",
});
check("a failing AI step marks the run failed and stops there", () => {
  assert.equal(failing.status, "failed");
  assert.equal(failing.steps.length, 2);
  assert.equal(failing.steps[1].ok, false);
  assert.equal(failing.error, "provider exploded");
  assert.equal(failing.steps[1].error, "provider exploded");
});
check("a failed run still keeps the partial step log", () => assert.equal(failing.steps[0].ok, true));

const empty = await executeWorkflow(def, { provider: async () => "", input: "x" });
check("an empty AI response is treated as a failure", () => assert.equal(empty.status, "failed"));

console.log(`\nworkflow: ${pass} passed, ${process.exitCode ? 1 : 0} failed`);
