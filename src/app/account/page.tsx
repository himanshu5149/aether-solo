import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getEntitlements } from "@/lib/entitlements";
import { isOwnerEmail } from "@/lib/owner";
import { Nav } from "@/components/Nav";
import { AccountActions } from "@/components/AccountActions";
import { PlanBadge } from "@/components/PlanBadge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const ent = getEntitlements(user.id, user.email);
  const owner = isOwnerEmail(user.email);

  return (
    <>
      <Nav />
      <main className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Account</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-neutral-400">
            {user.name} · {user.email} <PlanBadge plan={ent.plan} />
          </p>
        </header>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 text-sm text-neutral-400">
          <h2 className="text-sm font-medium text-neutral-300">Your rights</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Download everything we store about you as JSON, any time.</li>
            <li>Delete your account and all associated data, immediately and permanently.</li>
            <li>Read the <Link className="underline" href="/legal/privacy">privacy policy</Link> and{" "}
              <Link className="underline" href="/legal/terms">terms</Link>.</li>
          </ul>
        </section>

        <AccountActions isOwner={owner} />
      </main>
    </>
  );
}
