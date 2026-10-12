import { LEGAL } from "@/lib/legal";
import { Nav } from "@/components/Nav";

export const metadata = { title: "Privacy policy — Aether" };

export default function Privacy() {
  return (
    <>
      <Nav />
      <article className="max-w-none space-y-4 text-sm leading-relaxed text-neutral-300">
        <h1 className="text-2xl font-semibold text-neutral-100">Privacy policy</h1>
        <p className="text-neutral-500">Effective {LEGAL.effectiveDate} · Operator: {LEGAL.entity}</p>

        <h2 className="text-base font-medium text-neutral-100">What we store</h2>
        <ul className="list-inside list-disc space-y-1">
          <li>Account details: your name, email address and a salted scrypt hash of your password (never the password itself).</li>
          <li>Session records: a random token and its expiry, so you can stay signed in.</li>
          <li>Subscription state: plan, status and period end received from {LEGAL.merchantOfRecord}.</li>
          <li>Your workflows, their run history, and any remittance records you create.</li>
          <li>Usage counters (for example, workflow runs this month) used to apply plan limits.</li>
        </ul>
        <p>
          We do not store your card details. Payment data is handled by {LEGAL.merchantOfRecord} on their
          infrastructure, not ours.
        </p>

        <h2 className="text-base font-medium text-neutral-100">Who else sees it</h2>
        <p>
          {LEGAL.merchantOfRecord} for billing and tax compliance. If you configure a third-party AI key, the
          text you submit to a workflow step is sent to that provider under their terms. With no key
          configured, workflow steps run locally and nothing leaves the server.
        </p>

        <h2 className="text-base font-medium text-neutral-100">How long we keep it</h2>
        <p>
          Until you delete your account. Deletion is immediate and cascades to sessions, subscription state,
          workflows and run history.
        </p>

        <h2 className="text-base font-medium text-neutral-100">Your rights</h2>
        <p>
          From the account page you can export everything we hold about you as JSON and delete the account
          yourself, without asking us. You can also write to{" "}
          <span className="font-mono">{LEGAL.contactEmail}</span> for any privacy request.
        </p>
      </article>
    </>
  );
}
