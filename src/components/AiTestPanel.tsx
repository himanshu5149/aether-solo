"use client";
import { useState } from "react";

export function AiTestPanel({ mode }: { mode: string }) {
  const [input, setInput] = useState("Built a login flow and a SQLite-backed workflow runner today.");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function run() {
    setBusy(true); setErr(""); setOut("");
    const res = await fetch("/api/ai/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(data.error ?? `failed (${res.status})`);
    setOut(data.output ?? "");
  }

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
      <h2 className="text-sm font-medium text-neutral-300">AI provider check <span className="font-mono text-neutral-500">({mode})</span></h2>
      <textarea className="mt-3 h-20 w-full rounded-lg border border-neutral-700 bg-neutral-950 p-3 text-sm"
        value={input} onChange={(e) => setInput(e.target.value)} />
      <button disabled={busy} onClick={run}
        className="mt-3 rounded-lg border border-neutral-700 px-4 py-2 text-sm disabled:opacity-50">
        {busy ? "Running…" : "Run a test prompt"}
      </button>
      {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
      {out && <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-neutral-950 p-3 text-xs text-neutral-300">{out}</pre>}
    </section>
  );
}
