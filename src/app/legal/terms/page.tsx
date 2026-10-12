import { LEGAL } from "@/lib/legal";
import { Nav } from "@/components/Nav";

export const metadata = { title: "Terms of service — Aether" };

export default function Terms() {
  return (
    <>
      <Nav />
      <article className="prose prose-invert max-w-none space-y-4 text-sm leading-relaxed text-neutral-300">
        <h1 className="text-2xl font-semibold text-neutral-100">Terms of service</h1>
        <p className="text-neutral-500">Effective {LEGAL.effectiveDate} · Operator: {LEGAL.entity} · Governing law: {LEGAL.jurisdiction}</p>

        <h2 className="text-base font-medium text-neutral-100">1. The service</h2>
        <p>
          Aether is a software service that lets you define and run small automation workflows and manage a
          subscription. We may change or discontinue features, and will give reasonable notice of material
          changes that reduce what you paid for.
        </p>

        <h2 className="text-base font-medium text-neutral-100">2. Payments</h2>
        <p>
          Payments are processed by {LEGAL.merchantOfRecord} as merchant of record. Paddle handles the
          transaction, applicable sales tax or VAT, invoicing and buyer support for payment issues. Your
          subscription renews automatically until cancelled.
        </p>

        <h2 className="text-base font-medium text-neutral-100">3. Your account</h2>
        <p>
          You are responsible for keeping your password confidential and for activity under your account. You
          must be able to enter a binding contract to use the service. Do not use the service to break any law
          or to infringe anyone&apos;s rights.
        </p>

        <h2 className="text-base font-medium text-neutral-100">4. Your content</h2>
        <p>
          You keep ownership of the input you submit and the output produced for you. You grant us only the
          permission needed to operate the service for you.
        </p>

        <h2 className="text-base font-medium text-neutral-100">5. Availability and warranties</h2>
        <p>
          The service is provided &quot;as is&quot;. To the extent the law allows, we disclaim implied
          warranties and our total liability is limited to the fees you paid us in the twelve months before
          the claim.
        </p>

        <h2 className="text-base font-medium text-neutral-100">6. Ending the agreement</h2>
        <p>
          You may cancel at any time from your dashboard and stop using the service. We may suspend an account
          that abuses the service or breaks these terms. Refunds follow the{" "}
          <a className="underline" href="/legal/refund">refund policy</a>.
        </p>

        <h2 className="text-base font-medium text-neutral-100">7. Contact</h2>
        <p>Questions: <span className="font-mono">{LEGAL.contactEmail}</span></p>
      </article>
    </>
  );
}
