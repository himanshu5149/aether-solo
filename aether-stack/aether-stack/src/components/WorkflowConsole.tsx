"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Template = { id: string; name: string; category: string; summary: string };
type Workflow = { id: string; name: string; category: string; enabled: number; template_id: string | null };
type Run = { id: string; workflow_id: string; status: string; output: string; created_at: string; duration_ms: number };

export function WorkflowConsole({
  templates, workflows, runs, runsUsed, runsLimit,
}: {
  templates: Template[]; workflows: Workflow[]; runs: Run[]; runsUsed: number; runsLimit: number | null;
}) {
  const router = useRouter();
  const [input, setInput] = useState("New inbound lead: agency in Berlin, needs a client portal, budget unclear.");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [output, setOutput] = useState("");

  async function call(url: string, body?: unknown, label = "") {
    setBusy(label || url); setMsg(""); 
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    const data = await res.json().catch(() => ({}));
    setBusy("");
    if (!res.ok) { setMsg(data.error ?? `failed (${res.status})`); return null; }
    router.refresh();
    return data;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
        <h2 className="text-sm font-medium text-neutral-300">Create from a template</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <div key={t.id} className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
              <div className="text-xs uppercase tracking-wide text-neutral-500">{t.category}</div>
              <div className="mt-1 text-sm font-medium">{t.name}</div>
              <p className="mt-1 text-xs text-neutral-400">{t.summary}</p>
              <button disabled={!!busy} onClick={() => call("/api/workflows", { templateId: t.id }, `t-${t.id}`)}
                className="mt-3 rounded-md border border-neutral-700 px-3 py-1.5 text-xs disabled:opacity-50">
                {busy === `t-${t.id}` ? "Adding…" : "Add workflow"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-300">Your workflows</h2>
          <span className="text-xs text-neutral-500">runs this month: {runsUsed}/{runsLimit === null ? "∞" : runsLimit}</span>
        </div>
        {workflows.length === 0 && <p className="mt-3 text-sm text-neutral-400">None yet — add one from a template above.</p>}
        <ul className="mt-3 space-y-3">
          {workflows.map((w) => (
            <li key={w.id} className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-sm font-medium">{w.name}</span>
                  <span className="ml-2 text-xs text-neutral-500">{w.category} · {w.enabled ? "enabled" : "paused"}</span>
                </div>
                <div className="flex gap-2">
                  <button disabled={!!busy} onClick={async () => {
                    const d = await call(`/api/workflows/${w.id}/run`, { input }, `r-${w.id}`);
                    if (d) setOutput(d.output ?? "");
                  }} className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 disabled:opacity-50">
                    {busy === `r-${w.id}` ? "Running…" : "Run"}
                  </button>
                  <button disabled={!!busy} onClick={() => call("/api/workflows/toggle", { id: w.id, enabled: !w.enabled }, `x-${w.id}`)}
                    className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs disabled:opacity-50">
                    {w.enabled ? "Pause" : "Enable"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <label className="mt-4 block text-xs uppercase tracking-wide text-neutral-500">Run input (payload passed to the first AI step)</label>
        <textarea className="mt-2 h-20 w-full rounded-lg border border-neutral-700 bg-neutral-950 p-3 text-sm"
          value={input} onChange={(e) => setInput(e.target.value)} />
        {msg && <p className="mt-3 text-sm text-amber-300">{msg}</p>}
        {output && (
          <div className="mt-3">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Last output</div>
            <pre className="mt-1 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-neutral-950 p-3 text-xs text-neutral-300">{output}</pre>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
        <h2 className="text-sm font-medium text-neutral-300">Recent runs</h2>
        {runs.length === 0 && <p className="mt-3 text-sm text-neutral-400">No runs yet.</p>}
        <ul className="mt-3 space-y-2">
          {runs.map((r) => (
            <li key={r.id} className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-xs">
              <div className="flex justify-between">
                <span className={r.status === "succeeded" ? "text-emerald-300" : "text-red-300"}>{r.status}</span>
                <span className="text-neutral-500">{new Date(r.created_at).toLocaleString()} · {r.duration_ms}ms</span>
              </div>
              <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-neutral-400">{r.output.slice(0, 600)}</pre>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
