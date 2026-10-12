import Link from "next/link";
import { Nav } from "@/components/Nav";
import { PLAN_LIMITS, PLAN_PRICE_USD } from "@/lib/plans";
import { LEGAL } from "@/lib/legal";

export const metadata = { title: "Pricing — Aether" };

function row(label: string, free: string, pro: string) {
  return (
    <tr className="border-t border-neutral-800">
      <td className="py-2 text-neutral-400">{label}</td>
      <td className="py-2 text-center font-mono">{free}</td>
      <td className="py-2 text-center font-mono">{pro}</td>
    </tr>
  );
}

export default function Pricing() {
  const f = PLAN_LIMITS.free;
  const p = PLAN_LIMITS.pro;
  return (
    <>
      <Nav />
      <main className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Pricing</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Billed by {LEGAL.merchantOfRecord}. Prices exclude any local taxes that may apply.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
            <h2 className="text-lg font-medium">Free</h2>
            <p className="mt-1 text-2xl font-semibold">${PLAN_PRICE_USD.free}<span className="text-sm text-neutral-500">/mo</span></p>
            <Link href="/sign-up" className="mt-4 inline-block rounded-lg border border-neutral-700 px-4 py-2 text-sm">Create account</Link>
          </div>
          <div className="rounded-xl border border-sky-500/40 bg-sky-500/5 p-5">
            <h2 className="text-lg font-medium">Pro</h2>
            <p className="mt-1 text-2xl font-semibold">${PLAN_PRICE_USD.pro}<span className="text-sm text-neutral-500">/mo</span></p>
            <Link href="/dashboard" className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900">Upgrade in dashboard</Link>
          </div>
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="pb-2">Limit</th><th className="pb-2 text-center">Free</th><th className="pb-2 text-center">Pro</th>
              </tr>
            </thead>
            <tbody>
              {row("Workflows", String(f.projects), String(p.projects))}
              {row("Workflow runs / month", String(f.workflowRunsPerMonth), String(p.workflowRunsPerMonth))}
              {row("API calls / day", String(f.apiCallsPerDay), String(p.apiCallsPerDay))}
              {row("Seats", String(f.seats), String(p.seats))}
              {row("Data exports / month", String(f.exportsPerMonth), String(p.exportsPerMonth))}
            </tbody>
          </table>
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 text-sm text-neutral-400">
          <h2 className="text-sm font-medium text-neutral-300">Refunds</h2>
          <p className="mt-2">
            Email <span className="font-mono">{LEGAL.contactEmail}</span> within {LEGAL.refundWindowDays} days of a
            charge for a full refund, no reason required. See{" "}
            <Link className="underline" href="/legal/refund">the refund policy</Link>.
          </p>
        </section>
      </main>
    </>
  );
}
