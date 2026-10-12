"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(body.error ?? "sign-up failed");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <input className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
        placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
        placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
        placeholder="Password (min 10 characters)" type="password" value={password}
        onChange={(e) => setPassword(e.target.value)} required />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button disabled={busy} className="w-full rounded-lg bg-white px-4 py-2 font-medium text-neutral-900 disabled:opacity-50">
        {busy ? "Creating…" : "Create account"}
      </button>
      <p className="text-sm text-neutral-400">
        Already have one? <Link className="underline" href="/sign-in">Sign in</Link>
      </p>
    </form>
  );
}
