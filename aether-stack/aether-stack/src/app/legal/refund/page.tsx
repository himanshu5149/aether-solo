import { LEGAL } from "@/lib/legal";
import { Nav } from "@/components/Nav";

export const metadata = { title: "Refund policy — Aether" };

export default function Refund() {
  return (
    <>
      <Nav />
      <article className="max-w-none space-y-4 text-sm leading-relaxed text-neutral-300">
        <h1 className="text-2xl font-semibold text-neutral-100">Refund policy</h1>
        <p className="text-neutral-500">Effective {LEGAL.effectiveDate}</p>

        <p>
          If Aether is not what you expected, email <span className="font-mono">{LEGAL.contactEmail}</span>{" "}
          within {LEGAL.refundWindowDays} days of your first charge and we will refund it in full. You do not
          need to give a reason.
        </p>

        <h2 className="text-base font-medium text-neutral-100">Renewals</h2>
        <p>
          Renewal charges are refundable within {LEGAL.refundWindowDays} days of the renewal date, provided
          the account has not used more than the Free plan limits during that period.
        </p>

        <h2 className="text-base font-medium text-neutral-100">How refunds are paid</h2>
        <p>
          Refunds are issued by {LEGAL.merchantOfRecord} to the original payment method. They usually appear
          within 5–10 business days, depending on your bank.
        </p>

        <h2 className="text-base font-medium text-neutral-100">Cancelling</h2>
        <p>
          Cancelling from the dashboard stops future charges. Access continues until the end of the period you
          already paid for.
        </p>

        <h2 className="text-base font-medium text-neutral-100">Abuse</h2>
        <p>
          We may decline a refund where an account has repeatedly subscribed and refunded, or has broken the{" "}
          <a className="underline" href="/legal/terms">terms of service</a>.
        </p>
      </article>
    </>
  );
}
