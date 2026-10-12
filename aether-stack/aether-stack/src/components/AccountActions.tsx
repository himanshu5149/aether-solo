"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AccountActions({ isOwner }: { isOwner: boolean }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const required = isOwner ? "DELETE OWNER" : "DELETE";

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
      <h2 className="text-sm font-medium text-neutral-300">Your data</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href="/api/account/export" className="rounded-lg border border-neutral-700 px-4 py-2 text-sm">Download my data (JSON)</a>
      </div>
      <div className="mt-5 border-t border-neutral-800 pt-4">
        <p className="text-sm text-neutral-400">
          Deleting removes your account, sessions, subscription, workflows and run history. Type{" "}
          <span className="font-mono text-neutral-200">{required}</span> to confirm.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
            placeholder={required} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <button
            disabled={confirm !== required}
            onClick={async () => {
              const res = await fetch("/api/account/delete", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ confirm }),
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) return setMsg(data.error ?? "delete failed");
              router.push("/");
              router.refresh();
            }}
            className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-300 disabled:opacity-40">
            Delete account
          </button>
        </div>
        {msg && <p className="mt-2 text-sm text-red-400">{msg}</p>}
      </div>
    </section>
  );
}
